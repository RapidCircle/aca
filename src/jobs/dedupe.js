/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const graph = require('../graph.js');
const arm = require('../arm.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:dedupe');

module.exports = async (options) => {
    if (!options.accessToken) {
        debug.error('No accesstoken was provided for this job. Skipping.');
    }
    else {        

        let resources = await arm.getResources(process.env.subscriptionId, { from: new Date('2018-12-01T00:00:00.000Z'), to: new Date('2019-01-08T00:00:00.000Z') });
        debug.info(`${resources.length} resources found in Azure`);

        if (options.accessToken && options.accessToken.length > 0) {
            try {
                debug.info(`Storing resources with enriched metadata`);                    

                for (let r=0;r<resources.length;r++) {
                    try {
                        let found = await graph.getAzureResourceId(options.accessToken, resources[r].id);
                        if (found.value.length>1) {                            
                            debug.info(`Dupe found for ${resources[r].id}`);

                            let left = found.value.length;
                            for (let f=0;f<found.value.length;f++) {
                                if (left>1)
                                    // ********* <TODO> add your criteria for deletion
                                    //!found.value[f].fields.ownedBy &&
                                    //(!found.value[f].fields.Status || found.value[f].fields.Status === 'None') &&
                                    //(!found.value[f].fields.Action || found.value[f].fields.Action === 'None')) 
                                    // ********* </TODO>
                                    { // 804  (processed: 17) 
                                    debug.info(`Deleting`);
                                    //debug.info(found.value[f].fields);
                                    await graph.deleteAzureResource(options.accessToken, found.value[f].id);
                                    left--;
                                }
                                else {                                        
                                    debug.info(`Skipping`);
                                    //debug.info(found.value[f].fields);
                                }
                            }
                        }
                        else {
                            //debug.info(`No dupes for ${resources[r].id}`);
                        }
                    }
                    catch (err) {
                        debug.error(`Error processing item with id: ${resources[r].id}`);
                    }
                }
                debug.info('done!');
            } catch (err) {
                debug.error(err);
                req.flash('error_msg', {
                    message: 'Could not fetch events',
                    debug: JSON.stringify(err)
                });
            }
        }
    }
}