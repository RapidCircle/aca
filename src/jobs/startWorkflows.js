/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const graph = require('../graph.js');
const workflow = require('../workflow.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:startWorkflows');

module.exports = async (options) => {
    if (!options.accessToken) {
        debug.error('No accesstoken was provided for this job. Skipping.');
    }
    else {
        // Get the resources to archive
        let resources = await graph.getResourcesMarkedWithStatus(options.accessToken, workflow.statusses.MarkedForProcessing);

        for (let r = 0; r < resources.value.length; r++) {

            try {
                // create a workflow when we can start. criteria by workflow
                if (workflow.canStart(resources.value[r])) {
                    debug.info(`Starting workflow for resource ${resources.value[r].fields.resourceName}`);
                    await workflow.start(resources.value[r]);
                }
            }
            catch (err) {
                debug.error(`Error while processing ${resources.value[r].fields.resourceName} with message ${err}`);
            }
        }            
    }
}