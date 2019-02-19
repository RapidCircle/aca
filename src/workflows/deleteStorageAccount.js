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
const debug = require('nodejs-msgraph-utils/utils/logger.js')('workflow:deleteStorageAccount');
const db = require('../db.js');
const workflow = require('../workflow.js');
const copyState = require('nodejs-msgraph-utils/lookups/copyState.js');

let states = {
    start: 'start',
    deletingStorageAccount: '(1/1) deleting storage account',
    storageAccountDeleted: '(1/1) storage account deleted'
}


module.exports = async function (resource, options, state = {}) {

    if (!options.accessToken) throw "No accessToken provided to handle resource updates. Skipping";
    if (!options.trigger) throw "No trigger defined for resource workflow. Skipping";
    let accessToken = options.accessToken;

    // evaluate trigger    
    if (!state.step && options.trigger === workflow.triggers.Now) {
        state.step = states.start;
    } else if (!state.step) {
        await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, `Trigger ${options.trigger} not yet supported`);
        return {
            completed: true
        };
    }

    switch (state.step) {

        /* Initial start */
        case states.start:
            
            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.deletingStorageAccount);

            // create a blob container for the source account in archive
            await pwsh(`../scripts/${process.platform}/DeleteStorageAccount.ps1`, {
                AppId: process.env.appId,
                AppSecret: process.env.password,
                TenantId: process.env.tenantId,
                ResourceGroupName: resource.fields.resourceGroup,
                StorageAccountName: resource.fields.resourceName
            }, {
                //continueAtRaiseConditions: [`Container 'osa-${resource.fields.resourceName}' already exists`]
            });
            
            return {
                step: states.deletingStorageAccount
            };
        


        case states.deletingStorageAccount:
            
            // check if storage account is deleted
            try {
                await pwsh(`../scripts/${process.platform}/CheckStorageAccountExists.ps1`, {
                    AppId: process.env.appId,
                    AppSecret: process.env.password,
                    TenantId: process.env.tenantId,
                    ResourceGroupName: resource.fields.resourceGroup,
                    StorageAccountName: resource.fields.resourceName
                }, {
                    continueAtRaiseConditions: [`The storage account ${resource.fields.resourceName} was not found.`]
                });
                
                return {
                    step: states.deletingStorageAccount
                }                
            }
            catch (err) {
                if (err.indexOf(`The storage account ${resource.fields.resourceName} was not found.`)!==-1) {
                    await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processed, states.storageAccountDeleted);
                    return {
                        step: states.storageAccountDeleted,
                        completed: true
                    };
                }
                else {
                    await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Error, "Error during CheckStorageAccountExists");
                    return {
                        error: err
                    };
                }
            }
    }
}