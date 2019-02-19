/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

// TODO: this job isn't tested yet. BE EXTREMELY carefull adjusting this job, since it aggressivly destroys
//       resource groups and all resources in it. For now. This job is not active.


const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:cleanupEmptyResourceGroups');

module.exports = async (options) => {
    let groups = await arm.getResourceGroups(process.env.subscriptionId);
    let resources = await arm.getResources(process.env.subscriptionId);
    let empties = [];
    for (let g = 0; g < groups.length; g++) {
        let searchResult = _.find(resources, (r) => r.resourceGroup === groups[g].name && groups[g].name.indexOf("Cluster") === -1 );
        if (!searchResult) empties.push(groups[g]);
    }

    for (let e=0; e< empties.length; e++) {
        await arm.deleteResourceGroup(empties[e].name);
        debug.info(`Deleted resourceGroup ${empties[e].name} because it was empty.`);
    }
}