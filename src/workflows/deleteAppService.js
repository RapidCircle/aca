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
const debug = require('nodejs-msgraph-utils/utils/logger.js')('workflow:deleteAppService');
const db = require('../db.js');
const workflow = require('../workflow.js');

let states = {
    start: 'start',
    deletingAppService: '(1/1) deleting app service',
    AppServiceDeleted: '(1/1) app service deleted'
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
            
            await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processing, states.deletingAppService);

            // create a blob container for the source account in archive
            await pwsh(`../scripts/${process.platform}/DeleteAppService.ps1`, {
                AppId: process.env.appId,
                AppSecret: process.env.password,
                TenantId: process.env.tenantId,
                ResourceGroupName: resource.fields.resourceGroup,
                AppName: resource.fields.resourceName
            });
            
            return {
                step: states.deletingAppService
            };


        case states.deletingAppService:
            // check if storage account is deleted
            try {
                await pwsh(`../scripts/${process.platform}/CheckAppServiceExists.ps1`, {
                    AppId: process.env.appId,
                    AppSecret: process.env.password,
                    TenantId: process.env.tenantId,
                    ResourceGroupName: resource.fields.resourceGroup,
                    AppName: resource.fields.resourceName
                });
                
                return {
                    step: states.deletingAppService
                }
                
            }
            catch (err) {
                await graph.updateResourceStatus(accessToken, resource.fields.id, workflow.statusses.Processed, states.AppServiceDeleted);
                return {
                    step: states.AppServiceDeleted,
                    completed: true
                };
            }
    }
}