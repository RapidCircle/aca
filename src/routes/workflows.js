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
const db = require('../db.js');


/* GET */
router.get('/', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {
        let workflows = db.get('activeWorkflows').value();        
        res.send(workflows);
    }
});

/* GET */
router.get('/settings', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {    
        let config = db.get('workflowConfiguration').value();        
        res.send(config);
    }
});

/* GET */
router.post('/settings', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {
        if (req.body.hasOwnProperty('enabled')) db.set('workflowConfiguration', req.body.enabled).write();
        if (req.body.hasOwnProperty('interval')) db.set('workflowConfiguration', req.body.interval).write();
        if (req.body.hasOwnProperty('runas')) db.set('workflowConfiguration', req.body.runas).write();
        res.sendStatus(204);
    }
});

module.exports = router;
