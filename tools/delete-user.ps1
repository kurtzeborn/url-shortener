# Delete a user and all their related data from Azure Table Storage
# Removes: AllowedUsers entry, URLs, UserURLs, and UserInvites

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [string]$StorageAccount = "k61urlstorage",
    
    [switch]$Force
)

$Email = $Email.ToLower().Trim()

Write-Host "Looking up user: $Email" -ForegroundColor Cyan
Write-Host ""

# Check if user exists
$user = az storage entity show --table-name AllowedUsers --account-name $StorageAccount --auth-mode key --partition-key "user" --row-key $Email -o json 2>$null | ConvertFrom-Json

if (-not $user) {
    Write-Host "User '$Email' not found in AllowedUsers table." -ForegroundColor Red
    exit 1
}

Write-Host "Found user in AllowedUsers table." -ForegroundColor Green

# Get user's URLs from UserURLs table (partitioned by email)
$userUrls = az storage entity query --table-name UserURLs --account-name $StorageAccount --auth-mode key --filter "PartitionKey eq '$Email'" -o json 2>$null | ConvertFrom-Json
$urlCount = $userUrls.items.Count

# Get user's invites from UserInvites table (partitioned by email)
$userInvites = az storage entity query --table-name UserInvites --account-name $StorageAccount --auth-mode key --filter "PartitionKey eq '$Email'" -o json 2>$null | ConvertFrom-Json
$inviteCount = $userInvites.items.Count

Write-Host ""
Write-Host "Data to be deleted:" -ForegroundColor Yellow
Write-Host "  - 1 AllowedUsers entry"
Write-Host "  - $urlCount URL(s) from UserURLs table"
Write-Host "  - $urlCount URL(s) from URLs table"
Write-Host "  - $inviteCount invite record(s) from UserInvites table"
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to delete user '$Email' and all related data? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Deleting user data..." -ForegroundColor Cyan

# Delete URLs from both URLs and UserURLs tables
foreach ($url in $userUrls.items) {
    $shortCode = $url.RowKey
    $partitionKey = $url.PartitionKey
    
    # Delete from URLs table (PartitionKey is first 2 chars of shortcode)
    $urlPartition = $shortCode.Substring(0, 2)
    Write-Host "  Deleting URL: $shortCode"
    az storage entity delete --table-name URLs --account-name $StorageAccount --auth-mode key --partition-key $urlPartition --row-key $shortCode 2>$null | Out-Null
    
    # Delete from UserURLs table
    az storage entity delete --table-name UserURLs --account-name $StorageAccount --auth-mode key --partition-key $partitionKey --row-key $shortCode 2>$null | Out-Null
}

# Delete invite records
foreach ($invite in $userInvites.items) {
    Write-Host "  Deleting invite record: $($invite.RowKey)"
    az storage entity delete --table-name UserInvites --account-name $StorageAccount --auth-mode key --partition-key $invite.PartitionKey --row-key $invite.RowKey 2>$null | Out-Null
}

# Delete user from AllowedUsers
Write-Host "  Deleting AllowedUsers entry"
az storage entity delete --table-name AllowedUsers --account-name $StorageAccount --auth-mode key --partition-key "user" --row-key $Email 2>$null | Out-Null

Write-Host ""
Write-Host "User '$Email' and all related data deleted successfully." -ForegroundColor Green
