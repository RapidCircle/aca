/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const graph = require('../graph.js');
const arm = require('../arm.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:updateAzureResourceList');

module.exports = async (options) => {
    if (!options.accessToken) {
        debug.error('No accesstoken was provided for this job. Skipping.');
    }
    else {        
        let resources = await arm.getResources(process.env.subscriptionId);
        debug.info(`${resources.length} resources found in Azure`);
        resources = await arm.addUsage(process.env.subscriptionId, { resources: resources });
        debug.info(`Added usage/consumption for resources`);
        resources = await arm.addMetrics(process.env.subscriptionId, { resources: resources });
        debug.info(`Added metrics for resources`);

        if (options.accessToken && options.accessToken.length > 0) {
            try {
                debug.info(`Storing resources with enriched metadata`);
                // Get the events
                await graph.UpdateAzureResourceList(options.accessToken, resources);
                debug.info(`Job completed`);

            } catch (err) {
                debug.error(err);                    
            }
        }
    }
}