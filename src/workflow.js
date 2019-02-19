/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const _ = require('lodash');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('workflow:registrar');
const db = require('./db.js');
const uuid = require('uuid/v5');
const tokens = require('./tokens.js');
const resourceHandlers = [];

var oauth2Context;

const statusses = {
    None: 'None',
    Active: 'Active',
    Inactive: 'Inactive',
    MarkedForProcessing: 'Marked for processing',
    Processing: 'Processing',
    Processed: 'Processed',
    Error: 'Error'
};

const actions = {
    None: 'None',
    Archive: 'Archive',
    Delete: 'Delete',
    RetainFor: 'Retain for',
    StopStart: 'Stop/Start'
};

const triggers = {
    None: 'None',
    Now: 'Now',
    AfterCreation90Days: 'After creation (90 days)',
    Daytime: 'Daytime',
    InactiveFor90Days: 'Inactive (90 days)'
};

module.exports = {

    setAuthContext(oauth2) {
        oauth2Context = oauth2;
    },

    use: function (action, resourceType, resourceHandler) {
        resourceHandlers.push({ action: action, type: resourceType, handler: resourceHandler });
        debug.info(`Registered new ${action} handler for type ${resourceType}`);
    },

    canStart: function(resource) {
        let workflowId = uuid(resource.fields.resourceId, uuid.URL);

        return (!db.has(`activeWorkflows.${workflowId}`).value() &&
            !(resource.fields.Status==='' || resource.fields.Status === statusses.None) &&
            !(resource.fields.Action==='' || resource.fields.Action === actions.None) &&
            !(resource.fields.Trigger==='' || resource.fields.Trigger === triggers.None));
    },

    start: async function(resource, options = {}) {
        let workflowId = uuid(resource.fields.resourceId, uuid.URL);
        options.trigger = resource.fields.Trigger;
        options.action = resource.fields.Action;
        db.set(`activeWorkflows.${workflowId}`, {            
            resource: resource,
            options: options
        }).write();
    },    

    execute: async function(resource, options = {}, state) {

        if (!oauth2Context) {
            debug.error(`No oauth2 context is set for this application. Aborting workflow execution for resource ${resource.fields.resourceName}`);
            return;
        }

        let workflowId = uuid(resource.fields.resourceId, uuid.URL);
        db.set(`activeWorkflows.${workflowId}.state.locked`, true).write();
        let workflowConfiguration = db.get(`workflowConfiguration`).value();
        // get the user that changed the resource state so we can obtain a fresh accessToken
        let user = db.get(`users.${workflowConfiguration.runAsUserId}`).value();
        if (!user) {
            debug.error(`Skipping workflow execution for resource '${resource.fields.resourceName}'. The user could not be found in order to obtain an accessToken.`);
        }
        else {
            let registration = _.find(resourceHandlers, (handler) => handler.action === options.action && handler.type === resource.fields.resourceType);
            debug.info(`Registration found for resource ${resource.fields.resourceName}`);

            if (registration && registration.handler) {
                user.oauthToken = oauth2Context.accessToken.create(user.oauthToken.token);
                options.accessToken = await tokens.getAccessToken({ user: user });
                debug.info(`Executing handler for ${resource.fields.resourceName}`);
                let result = await registration.handler(resource, options, state);
                db.set(`activeWorkflows.${workflowId}.state.locked`, false).write();
                return result;
            }
            else {
                throw "No registration for resourceType found."
            } 
        }
    },

    setState: function(resource, state) {
        db.set(`activeWorkflows.${resource.fields.resourceId}`, state).write();
    },

    getState: function(resource) {
        return db.get(`activeWorkflows.${resource.fields.resourceId}`, state).value();
    },

    statusses: statusses,

    triggers: triggers,

    actions: actions
}