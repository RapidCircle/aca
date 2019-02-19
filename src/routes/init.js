/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const express = require('express');
const _ = require('lodash');
const tokens = require('../tokens.js');
const graph = require('../graph.js');
const arm = require('../arm.js');
const router = express.Router();
const pwsh = require('../pwsh.js');
const workflow = require('../workflow.js');

/* GET */
router.get('/', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let params = {
            active: { archive: true },
            resources: []
        };

        // Get the access token
        let accessToken;
        try {
            accessToken = await tokens.getAccessToken(req);
        } catch (err) {
            req.flash('error_msg', {
                message: 'Could not get access token. Try signing out and signing in again.',
                debug: JSON.stringify(err)
            });
        }

        if (accessToken && accessToken.length > 0) {
            try {
                let statusses = [];
                for (let s in workflow.statusses) {
                    statusses.push(workflow.statusses[s]);
                }
                let actions = [];
                for (let s in workflow.actions) {
                    actions.push(workflow.actions[s]);
                }
                let triggers = [];
                for (let s in workflow.triggers) {
                    triggers.push(workflow.triggers[s]);
                }                
                // Get the resources to archive
                await graph.createAzureResourceList(accessToken, statusses, actions, triggers);
            } catch (err) {
                console.log('Error', err);

                req.flash('error_msg', {
                    message: 'Could not fetch events',
                    debug: JSON.stringify(err)
                });
            }
        }
    }
});



module.exports = router;
