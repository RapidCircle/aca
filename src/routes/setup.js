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
    } 
    else {
        var accessToken;
        try {
            accessToken = await tokens.getAccessToken(req);
            if (!accessToken || accessToken.length===0) {
                throw new Error('Invalid accesstoken to show SharePoint sites.');
            }            
        } 
        catch (err) {
            next(err);
        }
        
        try {        
            let tree = db.get('sharepointSites.default').value();
            let current = db.get('storageConfiguration').value();

            let root = await graph.getSiteInfo(accessToken, 'root');
            let domainParts = root.siteCollection.hostname.split('.');
            let email = req.user.profile.email.split('.').join('_').split('@').join('_');

            let mysite = `${domainParts[0]}-my.${domainParts[1]}.${domainParts[2]}:/personal/${email}`;
            let site = await graph.getSiteInfo(accessToken, mysite);
            
            res.send({
                current: {
                    graphSiteId: current.graphSiteId,
                    graphListId: current.graphListId
                },
                tree,
                mysite: {
                    id: site.id,
                    name: site.displayName
                },
                test: {
                    id: 'rapidcircle1com.sharepoint.com,96359743-8101-4ce1-a9c2-0a71d14b023f,d040c63f-ae36-450c-8e57-ef7496f6a434',
                    name: 'testhans'
                }
            });
       }
       catch (err) {
           next(err);
       }
    }
});





router.post('/sharepoint', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.send(401);
    } else {

        var accessToken;
        try {
            accessToken = await tokens.getAccessToken(req);
            if (!accessToken || accessToken.length === 0) {
                throw new Error('Invalid accesstoken to show SharePoint sites.');
            }
        } catch (err) {
            next(err);
        }

        
        try {
            let chosenSite = req.body.siteId;

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
            let listData = await graph.createAzureResourceList(accessToken, 'ACA', chosenSite, statusses, actions, triggers);
            
            db.set('storageConfiguration.graphSiteId', chosenSite).write();
            db.set('storageConfiguration.graphListId', listData.id).write();
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }        

        
    }
});

/* GET */
router.get('/archive', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.redirect('/');
    } else {
        let config = db.get('storageConfiguration').value();
        
        res.send({
            ArchiveGroup: config.ArchiveGroup,
            ArchiveSAName: config.ArchiveSAName
        });
    }
});


router.post('/archive', async function (req, res, next) {

    if (!req.isAuthenticated()) {
        // Redirect unauthenticated requests to home page
        res.sendStatus(401);
    } else {
        let resourceGroup = req.body.ResourceGroup || 'ACA';
        let resourceName = req.body.ResourceName || 'acarchive2948';
        let resourceLocation = req.body.ResourceLocation || 'WestEurope';

        try {
            let result = await arm.createGroup(process.env.subscriptionId, resourceGroup, {
                location: resourceLocation,
                tags: {
                    purpose: 'archive',
                    'created-by': 'aca'
                }
            });

            if (!result.properties.provisioningState==='Succeeded') {
                throw new Error('Could not create ResourceGroup for archive.');
            }
        }
        catch (err) {            
            return next(err);
        }
        

        try {
            await arm.createStorageAccount(process.env.subscriptionId, resourceGroup, resourceName, { 
                accessTier: 'Cool', 
                location: resourceLocation || 'WestEurope',
                kind: 'BlobStorage', 
                sku: { name: 'Standard_LRS'} 
            });
            
            let kc = await arm.getKeysForStorageAccount(process.env.subscriptionId, {resourceGroup: resourceGroup, resourceName: resourceName });
            
            db.set('storageConfiguration.ArchiveGroup', resourceGroup).write();
            db.set('storageConfiguration.ArchiveSAName', resourceName).write();
            db.set('storageConfiguration.ArchiveSAKey', kc.keys[0].value).write();
        }
        catch (err) {
            return next(err);
        }

        res.send({
            ArchiveGroup: resourceGroup,
            ArchiveSAName: resourceName
        });
    }
});

module.exports = router;
