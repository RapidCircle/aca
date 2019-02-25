/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const dbFile = path.resolve(__dirname, process.env.WEBSITES_ENABLE_APP_SERVICE_STORAGE? '/home/db.json' : '../data/db.json');
const db = low(new FileSync(dbFile));

db.defaults({
    classicstorageaccounts: [],
    users: {},
    jobs: [{
            "id": "cleanupEmptyResourceGroups",
            "enabled": false,
            "description": "Cleanup empty resource groups.",
            "interval": 3600000,
            "code": "../jobs/cleanupEmptyResourceGroups.js",
            "options": {
                "runAsUserId": "<ENTER_YOUR_USER_ID>"
            }
        },
        {
            "id": "updateAzureResourceList",
            "enabled": false,
            "description": "Update the resource list with the latest Azure metrical data.",
            "interval": 3600000,
            "code": "../jobs/updateAzureResourceList.js",
            "options": {
                "runAsUserId": "<ENTER_YOUR_USER_ID>"
            }
        },
        {
            "id": "startWorkflows",
            "enabled": false,
            "description": "Kickstart workflows for resources that meet the criteria.",
            "interval": 60000,
            "code": "../jobs/startWorkflows.js",
            "options": {
                "runAsUserId": "<ENTER_YOUR_USER_ID>"
            }
        }
    ],
    workflowConfiguration: {
        "enabled": false,
        "interval": 15000
    },
    storageConfiguration: {
        "graphSiteId": "",
        "graphListId": "",
        "ArchiveGroup": "",
        "ArchiveSAName": "",
        "ArchiveSAKey": ""
    },
    activeWorkflows: {}
}).write();

module.exports = db;
