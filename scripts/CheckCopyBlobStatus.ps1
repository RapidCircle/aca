<#
   @file CheckCopyStatus.ps1
   @platform Linux
   @brief Checks Copy status of all Blobs
 
   This script eases the archiving process by traversing all blobs and tables and copying it to archive
 
   @author Hans van den Akker
   @bug No known bugs.
#>

param (
    [Parameter(Mandatory = $true)][string]$sourceSAName,
    [Parameter(Mandatory = $true)][string]$sourceSAKey,
    [Parameter(Mandatory = $true)][string]$destSAName,
    [Parameter(Mandatory = $true)][string]$destSAKey,
    [Parameter(Mandatory = $true)][string]$destSAContainerName
)

# Source Storage Account Context
$sourceContext = New-AzStorageContext -StorageAccountName $sourceSAName -StorageAccountKey $sourceSAKey

# Destination Storage Account Context
$destinationContext = New-AzStorageContext -StorageAccountName $destSAName -StorageAccountKey $destSAKey

$returnObject = New-Object System.Collections.Generic.List[System.Object]

# check all blob statusses
Get-AzStorageContainer -Context $sourceContext |
    Foreach-Object {
    $sourceContainer = $_.Name
    Get-AzStorageBlob -Container $_.Name -Context $sourceContext |
        Foreach-Object {
        
        $destBlob = "$($sourceContainer)/$($_.Name)"
        # Copy the blob        
        $status = Get-AzStorageBlobCopyState -Blob $destBlob -Container $destSAContainerName -Context $destinationContext 
        $returnObject.Add($status);
    } | Out-Null
} | Out-Null

$returnObject.ToArray() | ConvertTo-Json