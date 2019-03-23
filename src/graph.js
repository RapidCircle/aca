/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const graph = require('@microsoft/microsoft-graph-client');
const _ = require('lodash');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('apis:graph');

module.exports = {
  getUserDetails: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api('/me').get();    
    return user;
  },

  getUserPhoto: async function (accessToken) {
    const client = getAuthenticatedClient(accessToken);
    const user = await client.api('/me/photos/48x48/$value').responseType(graph.ResponseType.STREAM).get();
    return user;
  },

  getEvents: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
      .api('/me/events')
      .select('subject,organizer,start,end')
      .orderby('createdDateTime DESC')
      .get();

    return events;
  },

  getTreeOfSites: async function(accessToken) {

    let tree = {
      id: '',
      name: '',
      sites: []
    }
    const client = getAuthenticatedClient(accessToken);

    const getSubtree = async function(node, siteId) {      
      const response = await client.api(`/sites/${siteId}`).get();
      const children = await client.api(`/sites/${siteId}/sites`).get();
      if (!node.id) node.id = response.id;
      if (!node.name) node.name = response.name;

      if (children.value.length > 0) {
        node.sites = [];
        for (let n=0;n<children.value.length;n++) {
          let newNode = { id: children.value[n].id, name: children.value[n].displayName };
          node.sites.push(await getSubtree(newNode, children.value[n].id));          
        }        
      }

      return node;
    }
    
    const root = await getSubtree(tree, 'root');

    return root;
  },  

  getSiteInfo: async function(accessToken, relativeUrl) {
    const client = getAuthenticatedClient(accessToken);
    const response = await client.api(`/sites/${relativeUrl}`).get();
    return response;
  },


  
  getResourcesMarkedWithStatus: async function(accessToken, status) {
    return new Promise(async (resolve, reject) => {
      const client = getAuthenticatedClient(accessToken);
      await client
        .api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items?expand=fields&filter=fields/Status eq '${status}'`)
        .get(async (err, res) => {
          if (err) { reject(err); }
          else {
            resolve(res);
          }
        });
    });
  },

  updateResourceStatus: async function(accessToken, resourceId, status, step = '') {    
    return new Promise(async (resolve, reject)=> {
      const client = getAuthenticatedClient(accessToken);
      await client
        .api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items/${resourceId}/fields`)
        .patch({Status: status, Step: step}, (err, res) => {
          if (err) { reject(err); }
          else {
            resolve(res);
          }
        });      
    });
  },

  updateResource: async function (accessToken, resourceId, fields) {    
    const client = getAuthenticatedClient(accessToken);
    return await client
      .api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items/${resourceId}/fields`)
      .patch(fields);
  },

  /* References:
     - https://docs.microsoft.com/en-us/graph/api/list-create?view=graph-rest-1.0
     - https://docs.microsoft.com/en-us/graph/api/resources/columndefinition?view=graph-rest-1.0
     - https://docs.microsoft.com/en-us/graph/api/resources/textcolumn?view=graph-rest-1.0
     - https://docs.microsoft.com/en-us/graph/api/resources/choicecolumn?view=graph-rest-1.0
    */
  createAzureResourceList: async function(accessToken, name, siteId, statusses, actions, triggers) {
    return new Promise(async (resolve, reject) => {
      const client = getAuthenticatedClient(accessToken);
      await client
        .api(`/sites/${siteId}/lists`)
        .post({
          "displayName": name,
          "columns": [
            { "name": "resourceId", "text": {} },
            { "name": "resourceName", "text": {} },
            { "name": "resourceGroup", "text": {} },
            { "name": "resourceType", "text": {} },
            { "name": "resourceLocation", "text": {} },
            { "name": "usageQuantity", "number": {} },
            { "name": "usageTotal", "number": {} },
            { "name": "metricType", "text": {} },
            { "name": "metricUnit", "text": {} },
            { "name": "metricTotal", "number": {} },
            { "name": "ownedBy", "personOrGroup": {} },
            { "name": "usageDescription", "text": { "allowMultipleLines": true, "linesForEditing": 6, "maxLength": 300, "textType": "plain"} },
            { "name": "Status", "choice": { "allowTextEntry": false, "choices": statusses, "displayAs": "dropDownMenu"} },            
            { "name": "Step", "text": {} },
            { "name": "Action", "choice": { "allowTextEntry": false, "choices": actions, "displayAs": "dropDownMenu" } },
            { "name": "Trigger", "choice": { "allowTextEntry": false, "choices": triggers, "displayAs": "dropDownMenu" } }
          ],
          "list": {
            "template": "genericList"
          }
        }, (err, res) => {
          if (err) { reject(err); }
          else {
            resolve(res);
          }
        });
    });
  },

  getAllAzureResources: async function (accessToken) {
    const client = getAuthenticatedClient(accessToken);
    return await client.api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items?expand=fields`).get();
  },

  getAzureResourceById: async function(accessToken, resourceId) {
    const client = getAuthenticatedClient(accessToken);
    return await client.api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items?filter=fields/resourceId eq '${escape(resourceId)}'&expand=fields`).get();
  },

  getAzureResourceBy: async function (accessToken, field, value) {
    const client = getAuthenticatedClient(accessToken);
    return await client.api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items?filter=fields/${field} eq '${escape(value)}'&expand=fields`).get();
  },

  deleteAzureResource: async function (accessToken, resourceId) {
    const client = getAuthenticatedClient(accessToken);
    let result = await client.api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items/${resourceId}`).delete();
    return result;
  },


  UpdateAzureResourceList: async function(accessToken, resources) {
    const client = getAuthenticatedClient(accessToken);
    let simplified = _.map(resources, (r) => { return {
                                              'Title': r.name,
                                              resourceId: r.id,
                                              resourceName: r.name,
                                              resourceGroup: r.resourceGroup,
                                              resourceType: r.type,
                                              resourceLocation: r.location,
                                              metricType: r.metricType,
                                              metricUnit: r.metricUnit,
                                              metricTotal: r.metricTotal,
                                              usageQuantity: r.quantity,
                                              usageTotal: r.subtotal } });

    for (let i=0;i<simplified.length;i++) {

      let exists = await client.api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items?filter=fields/resourceId eq '${escape(simplified[i].resourceId)}'&expand=fields`).get();

      try 
      {
        if (exists.value.length===0) {
          debug.info(`Creating resource ${simplified[i].resourceId}`);
          await client
            .api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items`)
            .post({
              fields: simplified[i]
            });
        }
        else {

          let isChanged = !_.isEqualWith(exists.value[0].fields, simplified[i], (o1, o2) => {
            return o1.resourceType === o2.resourceType &&
                   o1.resourceLocation === o2.resourceLocation &&
                   o1.usageQuantity === o2.usageQuantity &&
                   o1.usageTotal === o2.usageTotal &&
                   o1.metricType === o2.metricType &&
                   o1.metricUnit === o2.metricUnit &&
                   o1.metricTotal === o2.metricTotal
          });

          if (isChanged) {
            debug.verbose(`Updating resource ${simplified[i].resourceId}`);
            await client
              .api(`/sites/${process.env.graphSiteId}/lists/${process.env.graphListId}/items/${exists.value[0].id}/fields`)
              .patch(simplified[i]);
          }
          else {
            debug.verbose(`Skipping resource ${simplified[i].resourceId}. No changes`);
          }
        }
      }      
      catch (err) {
        debug.error(`Error during creation/update of resource id: ${simplified[i].resourceId}`);
      }
    }
  }
};

function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    debugLogging: process.env.GraphDebug==='on',
    // Use the provided access token to authenticate
    // requests
    authProvider: (done) => {
      done(null, accessToken);
    }
  });

  return client;
}
