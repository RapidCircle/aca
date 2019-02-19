/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
 @bug No known bugs.
**/


const _ = require('lodash');
const graph = require('../graph.js');
const arm = require('../arm.js');
const pwsh = require('../pwsh.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('workflow:archiveStorageAccount');
const db = require('../db.js');
const workflow = require('../workflow.js');
const copyState = require('nodejs-msgraph-utils/lookups/copyState.js');

let states = {
    start: 'start',
    creatingContainer: '(1/3) Creating Archive container',
    containerCreated: '(1/3) Archive container created',
    CopyingblobsAndTables: '(2/3) Copying Blobs and Tables',
    blobsAndTablesCopied: '(2/3) Blobs and Tables copied',
    deletingOriginal: '(3/3) Deleting original storage account',
    originalDeleted: '(3/3) Original storage account deleted',
    completed: 'completed'
}


async function getAccessKey(resource) {
    let accessKey;
    if (resource.fields.resourceType === "Microsoft.ClassicStorage/storageAccounts") {
        let sa = db.get('classicstorageaccounts').find({ name: resource.fields.resourceName }).value();
        if (sa) accessKey = sa.key;
    }
    else if (resource.fields.resourceType === "Microsoft.Storage/storageAccounts") {
        let keys = await arm.getKeysForStorageAccount(process.env.subscriptionId, {
            resourceGroup: resource.fields.resourceGroup,
            resourceName: resource.fields.resourceName
        });
        accessKey = keys.key2
    }

    return accessKey;
}

module.exports = async function(resource, options, state = {}) {

    if (!options.accessToken) throw "No accessToken provided to handle resource updates. Skipping";
    if (!options.trigger) throw "No trigger defined for resource workflow. Skipping";
    let accessToken = options.accessToken;
    let accessKey;

    // evaluate trigger    
    if (!state.step && options.trigger === workflow.triggers.Now) {
        state.step = states.start;
    } else if (!state.step) {
        await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, `Trigger ${options.trigger} not yet supported`);
        return { completed: true };
    }

    switch (state.step) {

        /* Initial start */
        case states.start:                        
            accessKey = await getAccessKey(resource);

            if (!accessKey) {
                let err = `Skipping ${resource.fields.resourceName} because no accessKey could be resolved.`
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, err);
                debug.error(err);
                return { error: err};
            }            
            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.creatingContainer);

            try {
                // create a blob container for the source account in archive
                await pwsh(`../scripts/${process.platform}/CreateBlobContainer.ps1`, {
                    StorageAccountName: db.get('storageConfiguration.ArchiveSAName').value(),
                    StorageAccountKey: db.get('storageConfiguration.ArchiveSAKey').value(),
                    ContainerName: `osa-${resource.fields.resourceName}`
                }, {
                    continueAtRaiseConditions: [`Container 'osa-${resource.fields.resourceName}' already exists`]
                });

                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.containerCreated);
                return {
                    step: states.containerCreated
                };
            }
            catch (err) {                
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, "Error creating archive container");
                return {
                    error: err
                };            
            }
            




        case states.containerCreated:           
            accessKey = await getAccessKey(resource);

            if (!accessKey) {
                let err = `Skipping ${resource.fields.resourceName} because no accessKey could be resolved.`
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, err);
                debug.error(err);
                return {
                    error: err
                };
            }

            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.CopyingblobsAndTables);
            
            // copy the source account assets towards archive
            await pwsh(`../scripts/${process.platform}/CopyBlobsAndTables.ps1`, {
                sourceSAName: resource.fields.resourceName,
                sourceSAKey: accessKey,
                destSAName: db.get('storageConfiguration.ArchiveSAName').value(),
                destSAKey: db.get('storageConfiguration.ArchiveSAKey').value(),
                destSAContainerName: `osa-${resource.fields.resourceName}`
            })

            return { step: states.CopyingblobsAndTables };            



            /*  */
        case states.CopyingblobsAndTables: 
            accessKey = await getAccessKey(resource);

            if (!accessKey) {
                let err = `Skipping ${resource.fields.resourceName} because no accessKey could be resolved.`
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, err);
                debug.error(err);
                return { error: err };
            }

            try { 
                
                let output = await pwsh(`../scripts/${process.platform}/CheckCopyBlobStatus.ps1`, {
                    sourceSAName: resource.fields.resourceName,
                    sourceSAKey: accessKey,
                    destSAName: db.get('storageConfiguration.ArchiveSAName').value(),
                    destSAKey: db.get('storageConfiguration.ArchiveSAKey').value(),
                    destSAContainerName: `osa-${resource.fields.resourceName}`
                });

                let status = JSON.parse(output);
                let nrFiles = status.length;
                let nrPending = _.filter(status, (obj) => obj.Status === copyState.Pending);
                let nrDone = _.filter(status, (obj) => obj.Status === copyState.Success);
                let nrError = _.filter(status, (obj) => obj.Status === copyState.Failed);
                let nrAborted = _.filter(status, (obj) => obj.Status === copyState.Aborted);
                debug.verbose(`Total files: ${nrFiles}  Pending: ${nrPending.length}  Aborted: ${nrAborted.length}  Errors: ${nrError.length}  Completed: ${nrDone.length}`);

                if (nrFiles !== nrDone.length) {
                    // still processing files
                    return {
                        step: states.CopyingblobsAndTables
                    };
                } else {
                    await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.blobsAndTablesCopied);
                    return {
                        step: states.blobsAndTablesCopied
                    };
                }
            }
            catch (err) {
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, err);
                debug.verbose(err);
                return {
                    step: states.CopyingblobsAndTables,
                    error: err 
                };
            }

        



        case states.blobsAndTablesCopied:
            //await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.deletingOriginal);
            // delete the source account assets
            /*await pwsh(`../scripts/${process.platform}/DeleteStorageAccount.ps1`, {
                ResourceGroupName: resource.fields.resourceGroup,
                StorageAccountName: resource.fields.resourceName
            })*/
            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.originalDeleted);
            return { step: states.originalDeleted };




        case states.originalDeleted:
            // set archived
            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processed, states.completed);
            return { completed: true }
    }
}