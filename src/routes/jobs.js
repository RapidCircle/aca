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
const pc = require('prettycron');

/* GET */
router.get('/', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {
        
        let jobs = db.get('jobs').value();
        jobs = _.map(jobs, (job)=> Object.assign({ runsAt: pc.toString(job.schedule) }, job));
        res.send(jobs);
    }
});

/* GET */
router.post('/:jobId', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {
        let { jobId } = req.params;
        if (req.body.hasOwnProperty('enabled')) db.get('jobs').find({id:jobId}).assign( {enabled: req.body.enabled}).write();
        if (req.body.hasOwnProperty('schedule')) db.get('jobs').find({id:jobId}).assign( {schedule: req.body.schedule}).write();        
        res.sendStatus(204);
    }
});

module.exports = router;
