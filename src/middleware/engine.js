/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const db = require('../db.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('workflow:engine');
const workflow = require('../workflow.js');
const _ = require('lodash');

var engine;

module.exports = {

    start(oauth2) {
        let configuration = db.get('workflowConfiguration').value();
        if (!configuration.enabled) {
            debug.warning('Workflow engine is disabled. Skipping workflow processing.');
            return;
        }

        // reset all workflows to unlocked so we can pickup processing again
        let workflows = db.get('activeWorkflows').value();
        for (let workflow in workflows) {
            db.set(`activeWorkflows.${workflow}.state.locked`, false).write();
        }
        
        workflow.setAuthContext(oauth2);

        engine = setInterval(async () => {
            let runningWorkflows = db.get('activeWorkflows').value();
            
            for (let wid in runningWorkflows) {                
                let activeWorkflow = runningWorkflows[wid];

                
                if (activeWorkflow.state && activeWorkflow.state.completed) {
                    db.unset(`activeWorkflows.${wid}`).write();
                    debug.info(`Removed workflow ${wid} for resource ${activeWorkflow.resource.fields.resourceName}, because completed`);
                }
                else if (activeWorkflow.state && activeWorkflow.state.locked) {
                    debug.verbose(`Skipping workflow ${wid} for resource ${activeWorkflow.resource.fields.resourceName}, because locked`);
                }
                else if (activeWorkflow.state && activeWorkflow.state.error) {
                    db.unset(`activeWorkflows.${wid}`).write();
                    debug.verbose(`Broken workflow ${wid} for resource ${activeWorkflow.resource.fields.resourceName}, because error`);
                }
                else {
                    debug.info(`Running workflow ${wid} for resource ${activeWorkflow.resource.fields.resourceName}, because active`);
                    let result = await workflow.execute(activeWorkflow.resource,
                        activeWorkflow.options,
                        activeWorkflow.state);
                    
                        // TODO: dont fully overwrite state, we will lose the locked status e.g.
                    let newState = _.merge(db.get(`activeWorkflows.${wid}.state`).value(), result);
                    db.set(`activeWorkflows.${wid}.state`, newState).write();
                }
            }

        }, configuration.interval || 60000);
    },

    stop() {
        clearInterval(engine);        
    }
}
