/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const graph = require('../graph.js');
const workflow = require('../workflow.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:refreshSharePointSiteTree');
const db = require('../db.js');

module.exports = async (options) => {
    if (!options.accessToken) {
        debug.error('No accesstoken was provided for this job. Skipping.');
    } else {
        var tree = await graph.getTreeOfSites(options.accessToken);
        db.set('sharepointSites.default', tree).write();
    }
}