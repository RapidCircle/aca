<#
   @file CopyBlobAndTables.ps1
   @platform Linux
   @brief Copies all Blobs and Tables to RCArchive
 
   This script eases the archiving process by traversing all blobs and tables and copying it to archive
 
   @author Hans van den Akker
   @bug No known bugs.
#>

param (
    [Parameter(Mandatory=$true)][string]$sourceSAName,
    [Parameter(Mandatory=$true)][string]$sourceSAKey,
    [Parameter(Mandatory=$true)][string]$destSAName,
    [Parameter(Mandatory=$true)][string]$destSAKey,
    [Parameter(Mandatory=$true)][string]$destSAContainerName
 )

# Source Storage Account Context
$sourceContext = New-AzStorageContext -StorageAccountName $sourceSAName -StorageAccountKey $sourceSAKey

# Destination Storage Account Context
$destinationContext = New-AzStorageContext -StorageAccountName $destSAName -StorageAccountKey $destSAKey



# copy all blobs
Get-AzStorageContainer -Context $sourceContext |
Foreach-Object {
    $sourceContainer = $_.Name
    Get-AzStorageBlob -Container $_.Name -Context $sourceContext |
    Foreach-Object {
        
        $destBlob = "$($sourceContainer)/$($_.Name)"
        # Copy the blob
        Start-AzStorageBlobCopy -DestContainer $destSAContainerName -DestContext $destinationContext -SrcBlob $_.Name -DestBlob $destBlob -Context $sourceContext -SrcContainer $sourceContainer -ConcurrentTaskCount 1
    }

}

# copy all tables to json files
<#Get-AzStorageTable -Context $sourceContext |
Foreach-Object {
    $storageTable = Get-AzStorageTable -Name $_.Name -Context $sourceContext
    $file = ".\data\tmp\$($_.Name).json"
    $blob = "tables/" + $_.Name + ".json"
    if ($_.Name.StartsWith("WADMetrics") -or $_.Name.StartsWith("Metrics") -or $_.Name.StartsWith("z20")) {
        Write-Host "Skipping table $($_.Name)"
        return
    }
    else {
        Write-Host "Reading table $($_.Name)"
    }
    $outItems = New-Object System.Collections.Generic.List[System.Object]
    Get-AzStorageTableRowAll -Table $storageTable | Foreach-Object { $outItems.Add($_) }
    Write-Host "All records retrieved"
    $outItems | ConvertTo-Json | Out-File $file
    Write-Host "Saved to disk"
    Set-AzStorageBlobContent -Context $destinationContext -Container $destSAContainerName -File $file -Blob $blob
    Write-Host "Stored in Archive"
}#>