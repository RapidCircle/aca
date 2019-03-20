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
                // Get the resources to archive
                let allResources = await graph.getAllAzureResources(accessToken);
                res.send(allResources);
            } catch (err) {
                console.log('Error', err);
                
            }
        }
    }
});



module.exports = router;
