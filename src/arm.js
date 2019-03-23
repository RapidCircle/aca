const msRestAzure = require("ms-rest-azure");
const ConsumptionManagementClient = require("azure-arm-consumption");
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
const MonitorManagementClient = require('azure-arm-monitor');
const StorageManagementClient = require('azure-arm-storage');
const _ = require('lodash');
const supportedMetrics = require('nodejs-msgraph-utils/lookups/supportedMetrics.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('apis:arm');

async function loginWithServicePrincipalSecret() {
    return new Promise((resolve, reject) => {
        msRestAzure.loginWithServicePrincipalSecret(
            process.env.RBAC_APP_ID,
            process.env.RBAC_APP_PASSWORD,
            process.env.tenantId,
            async (err, credentials) => {
                if (err) reject(err);
                else {
                    resolve(credentials);
                }
            });
    });
}


module.exports = {

    /* https://docs.microsoft.com/en-us/rest/api/storagerp/storageaccounts/listkeys */
    getKeysForStorageAccount: async function (subscriptionId, properties) {
        let credentials = await loginWithServicePrincipalSecret();
        const client = new StorageManagementClient(credentials, subscriptionId);

        let keys = await client.storageAccounts.listKeys(properties.resourceGroup,
            properties.resourceName);
        return keys;
    },

    createGroup: async function (subscriptionId, groupName, groupOptions) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new ResourceManagementClient(credentials, subscriptionId);
        
        try {
            return await resClient.resourceGroups.createOrUpdate(groupName, groupOptions);
            console.log(result);
        }
        catch (err) {
            console.log(err);
        }        
    },

    createStorageAccount: async function(subscriptionId, groupName, accountName, accountOptions) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new StorageManagementClient(credentials, subscriptionId);

        try {
            let alreadyExists = await resClient.storageAccounts.checkNameAvailabilityWithHttpOperationResponse(accountName);
            if (alreadyExists.body.nameAvailable) {
                return await resClient.storageAccounts.createWithHttpOperationResponse(groupName, accountName, accountOptions);
            }
            else {
                throw new Error(alreadyExists.body.message);
            }
        }
        catch (err) {
            console.log('Error', err);
        }  
    },

    getResources: async function (subscriptionId) {
        let credentials = await loginWithServicePrincipalSecret();
        const resClient = new ResourceManagementClient(credentials, subscriptionId);
        let resources = await resClient.resources.list();

        resources = _.map(resources, (o) => {
            // dirty: choose 4th occurence of split id.
            let parts = o.id.split('/');

            let r = {
                id: o.id,
                name: o.name,
                resourceGroup: parts !== null ? parts[4] : '',
                type: o.type,
                location: o.location,
                type: o.type,
                quantity: 0,
                subtotal: 0,
                metricType: 'none',
                metricUnit: 'none',
                metricTotal: 0
            }

            return r;

        })

        return resources;
    },

    addUsage: async function (subscriptionId, properties) {
        credentials = await loginWithServicePrincipalSecret();
        const client = new ConsumptionManagementClient(credentials, subscriptionId);
        let x = await client.usageDetails.list();

        for (let u = 0; u < x.length; u++) {
            for (let r = 0; r < properties.resources.length; r++) {
                if (x[u].instanceName === properties.resources[r].name) {
                    properties.resources[r].quantity += x[u].usageQuantity;
                    properties.resources[r].subtotal += x[u].pretaxCost;
                }
            }
        }

        return properties.resources;
    },

    addMetrics: async function (subscriptionId, properties) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new MonitorManagementClient(credentials, subscriptionId);

        for (let r = 0; r < properties.resources.length; r++) {

            // if a supported metric, process the metric information
            if (_.find(supportedMetrics, (metricType) => metricType === properties.resources[r].type)) {
                try {
                    let metrics = await resClient.metrics.list(properties.resources[r].id);

                    if (metrics.value[0].timeseries.length > 0) {
                        for (let prop in metrics.value[0].timeseries[0].data[0]) {
                            if (prop !== 'timeStamp') {
                                properties.resources[r].metricUnit = prop;
                            }
                        }

                        let highest = _.maxBy(metrics.value[0].timeseries[0].data, (d) => d[properties.resources[r].metricUnit]);
                        properties.resources[r].metricType = metrics.value[0].name.value;
                        properties.resources[r].metricTotal = properties.resources[r].metricUnit !== 'none' ? highest[properties.resources[r].metricUnit] : 0;
                    }
                }
                catch (e) {
                    debug.error(`Error reading metrics for resource ${properties.resources[r].name}`);
                }
            }
        }

        return properties.resources;
    },

    getResourceGroups: async function (subscriptionId) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new ResourceManagementClient(credentials, subscriptionId);
        let groups = await resClient.resourceGroups.list();
        return groups;
    },

    deleteResourceGroup: async function (subscriptionId, resourceGroupName) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new ResourceManagementClient(credentials, subscriptionId);
        let result = await resClient.resourceGroups.deleteMethod(resourceGroupName);
        return result;
    },

    getMetricsForResource: async function (subscriptionId, resource) {
        credentials = await loginWithServicePrincipalSecret();
        const resClient = new MonitorManagementClient(credentials, subscriptionId);
        let metrics = await resClient.metrics.list(resource.id);
        return metrics;
    }

}