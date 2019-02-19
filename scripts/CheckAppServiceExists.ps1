<#
   @file CheckAppServiceExists.ps1
   @platform Linux
   @brief Check if a given app service from Azure exists
 
   @author Hans van den Akker
   @bug No known bugs.

   @dependencies
    - Install-Module -Name Az -RequiredVersion 1.3+
#>

param(    
    [Parameter(Mandatory = $true)][string]$AppId,
    [Parameter(Mandatory = $true)][string]$AppSecret,
    [Parameter(Mandatory = $true)][string]$TenantId,
    [Parameter(Mandatory = $true)][string]$ResourceGroupName,
    [Parameter(Mandatory = $true)][string]$AppName
)

$secstr = New-Object -TypeName System.Security.SecureString
$AppSecret.ToCharArray() | ForEach-Object {$secstr.AppendChar($_)}
$credentials = new-object -typename System.Management.Automation.PSCredential -argumentlist $AppId, $secstr

Connect-AzAccount -Credential $credentials -Tenant $TenantId -ServicePrincipal | Out-Null

Get-AzWebApp -ResourceGroupName $ResourceGroupName -Name $AppName | ConvertTo-Json