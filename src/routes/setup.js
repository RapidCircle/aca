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
router.get('/sharepoint', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let config = db.get('storageConfiguration');
        // get sharepoint sites

       return {
           graphSiteId: config.graphSiteId,
           graphListId: config.graphListId,
           sites: []
       }
    }
});

/* GET */
router.get('/sites', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let config = db.get('storageConfiguration');
        // get sharepoint sites

        return {
            sites: []
        }
    }
});

/* GET */
router.get('/lists', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let config = db.get('storageConfiguration');
        // get sharepoint sites

        return {
            lists: []
        }
    }
});


router.post('/sharepoint', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.send(401);
    } else {
        let newConfig = req.body;
        db.set('storageConfiguration.graphSiteId', newConfig.graphSiteId).write();
        db.set('storageConfiguration.graphSiteId', newConfig.graphListId).write();        
    }
});

/* GET */
router.get('/archive', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let config = db.get('storageConfiguration').value();
        let archiveConfig = {
            ArchiveGroup: config.ArchiveGroup,
            ArchiveSAName: config.ArchiveSAName,
            ArchiveSAKey: config.ArchiveSAKey
        }
        
        res.send(archiveConfig);
    }
});

router.post('/archive', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.send(401);
    } else {
        let newConfig = req.body;
        let result = await arm.createGroup(process.env.subscriptionId, newConfig.resourceGroup || 'ACA', {
            location: newConfig.resourceLocation || 'WestEurope',
            tags: {
                purpose: 'archive',
                'created-by': 'aca'
            }
        });

        if (!result.properties.provisioningState==='Succeeded') {
            throw new Error('Could not create ResourceGroup for archive.');
        }

        try {
            let ac = await arm.createStorageAccount(process.env.subscriptionId, result.name, 'acarchive2', { 
                accessTier: 'Cool', 
                location: 'WestEurope', 
                kind: 'BlobStorage', 
                sku: { name: 'Standard_LRS'} });
            
            let keys = await arm.getKeysForStorageAccount(process.env.subscriptionId, {resourceGroup: result.name, resourceName: 'acarchive2'});
            
            db.set('storageConfiguration.ArchiveGroup', result.name).write();
            db.set('storageConfiguration.ArchiveSAName', ac.name).write();
            db.set('storageConfiguration.ArchiveSAKey', keys[0].key).write();
        }
        catch (err) {
            throw new Error(err);
        }

        res.send({
            ArchiveGroup: result.name,
            ArchiveSAName: ac.name
        });
    }
});



module.exports = router;
