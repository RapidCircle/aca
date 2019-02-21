# Introduction 
ACA aggregates Azure Resources, Consumption and Metric usage data. This data can be used to report on Azure consumption for cost-reduction purposes. Additionally it contains automation scripts triggered by a Resource status in the SharePoint list to unburden the consultants work.

# License
The digital artifacts in this solution are SSPL licensed (see LICENSE.md). SSPL is fairly new and not officially recognized as an "Open Source" type license (yet). SSPL was developed by MongoDB, Inc which switched to SSPL because of
the more consumption based nature of software these days (thank you Cloud).

# Prerequisites
* Visual Studio Code or other editor (e.g. Atom)
* Powershell Az module 1.3 or higher (based on PS Core)
* Node.JS v10+
* Docker
* Docker Compose

# Getting Started (fresh install)
1. ```git clone https://github.com/RapidCircle/aca.git```
2. ```npm install``` (install depedencies in the automation project)
3. ```npm run start``` (run the automation project)   OR   Press F5 in VS Code (debugger mode)
4. browse: http://localhost:3000
5. click login (use your RapidCircle.com account)
6. Browse: ```http://localhost:3000/setup``` (This will setup all the basics for rclaimer to be functional. (e.g. creation of SharePoint list)
7. Browse: ```http://localhost:3000/jobs``` (this will show the active recurring jobs and it's status)
8. Browse: ```http://localhost:3000/workflows``` (this will show the active workflows for resources with 'Marked ....' status)
9. Browse ```http://localhost:3000/archive``` (Will start the archiving workflow for 'Marked for archiving' status)

# Environment Variables
Here is a list of variables that need to be set to ensure this solution operates as intended:

You will need to setup a Service Principal for delegated access towards Azure AD (identify user, and trim security) and SharePoint (storing enriched Azure data)

| Variable | Provisioned at |
| --- | --- |
| OAUTH_APP_ID | configure @ http://aca_url/setup/consent |
| OAUTH_APP_PASSWORD |configure @ http://aca_url/setup/consent |
| OAUTH_SCOPES | 'profile offline_access user.read sites.manage.all' |
| OAUTH_REDIRECT_URI | configure @ http://aca_url/setup/firsttime |
| OAUTH_AUTHORITY | https://login.microsoftonline.com/common | 
| OAUTH_ID_METADATA | /v2.0/.well-known/openid-configuration | 
| OAUTH_AUTHORIZE_ENDPOINT  | /oauth2/v2.0/authorize | 
| OAUTH_TOKEN_ENDPOINT | /oauth2/v2.0/token |
| RBAC_APP_ID | configure @ http://aca_url/setup/rbac |
| RBAC_APP_PASSWORD | configure @ http://aca_url/setup/rbac |
| tenantId | configure @ http://aca_url/setup/subscription |
| subscriptionId | configure @ http://aca_url/setup/subscription |
| graphSiteId | configure @ http://aca_url/setup/storage |
| graphListId  | configure @ http://aca_url/setup/storage |
| azureDomain | RapidCircle.com |
| archiveGroup | configure @ http://aca_url/setup/archive |
| archiveAccount | configure @ http://aca_url/setup/archive |
| archiveAccountKey | configure @ http://aca_url/setup/archive |
| DEBUG | info:* warning:* error:* verbose:* |
| GraphDebug | off |

You will need to setup a Service Principal for automation with role based authorization already baked in. This can be done by using the Azure CLI like:
```az ad sp create-for-rbac```


# Deployment
ACA has been prepared to run as a Docker image, which makes it easy to be used in the Azure Docker Container Apps model.

# Assets
1. Resource list with flattend consumption data and metric data
2. sharepoint list with views on resource situation
3. Workflow engine running on an Interval, processing newly created workflows. 

# Azure Cleansing Progress
1. Removed empty Resource groups
2. Removed unused VHDs
3. Removed OLD blobs (2013 and older)

# Todos
1. [ ] resolving the chosen/correct SharePoint site to deploy the SharePoint list
2. [ ] Storing AppIds and secret in Azure Keyvault using Client Certificates
3. [x] Port NeDB to LowDB to prevent Flush to disk errors. NeDB is used for session handling  
4. [x] job:cleanupEmptyResourceGroups
5. [ ] Make azure market place installable
6. [ ] workflow: implement Archive VM function 
7. [ ] job: auto power down VMs (marked with 'Daily shutdown' status)
8. [ ] ensure normal stdout is not logged to stderr in pm2

# Bugs
[ ] AccessToken expires during sync of resources due to long running operation. 

# Notes
* The workflow engine only processes marked Azure resources. When a resource is marked and picked up for workflow processing, the workflow engine refreshes (if needed) the accessToken towards MS Graph by using the oauthToken (refresh) of the original user marking the item for workflow processing.

# Docker
To make things even easier and more scalable Rclaimer has been dockerized. The challenge we take is using Linux Alpine as a root image with Powershell / .NET Core installed. The more minimal, the more stable our solution will be. Powershell and Alpine Linux have been a wish of the community dating back to 2016. Here are some threads:
* https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-core-on-linux?view=powershell-6
* https://github.com/PowerShell/PowerShell/issues/1926
* https://github.com/dotnet/coreclr/issues/917
* https://github.com/PowerShell/PowerShell/issues/4605
* https://hub.docker.com/_/microsoft-powershell
* https://github.com/PowerShell/PowerShell-Docker