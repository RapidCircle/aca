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
        res.redirect('/');
    } else {
        
        let jobs = db.get('jobs').value();
        res.send(jobs);        
    }
});

module.exports = router;
