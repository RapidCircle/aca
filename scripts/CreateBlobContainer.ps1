<#
   @file CreateBlobContainer.ps1
   @platform Linux
   @brief Create a blob container at a given location
 
   @author Hans van den Akker
   @bug No known bugs.

   @dependencies
    - Install-Module -Name Az -RequiredVersion 5+
#>

param(
    [Parameter(Mandatory = $true)][string]$StorageAccountName,
    [Parameter(Mandatory = $true)][string]$StorageAccountKey,
    [Parameter(Mandatory = $true)][string]$ContainerName
)

# Destination Storage Account Context
$archiveContext = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $StorageAccountKey

New-AzStorageContainer -Context $archiveContext -Name $ContainerName