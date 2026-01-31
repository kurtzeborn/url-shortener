# Query user statistics from Azure Table Storage
# Shows all users and the count of URLs they've shortened

param(
    [string]$StorageAccount = "k61urlstorage"
)

Write-Host "Fetching user statistics from $StorageAccount..." -ForegroundColor Cyan
Write-Host ""

# Get all allowed users
$users = az storage entity query --table-name AllowedUsers --account-name $StorageAccount --auth-mode key --query "items[].RowKey" -o json 2>$null | ConvertFrom-Json

# Get all URL owners
$urlOwners = az storage entity query --table-name Urls --account-name $StorageAccount --auth-mode key --query "items[].Owner" -o json 2>$null | ConvertFrom-Json

# Count URLs per owner
$urlCounts = @{}
foreach ($owner in $urlOwners) {
    if ($urlCounts.ContainsKey($owner)) {
        $urlCounts[$owner]++
    } else {
        $urlCounts[$owner] = 1
    }
}

# Build results
$results = @()
foreach ($user in $users | Sort-Object) {
    $count = if ($urlCounts.ContainsKey($user)) { $urlCounts[$user] } else { 0 }
    $results += [PSCustomObject]@{
        Email = $user
        URLs = $count
    }
}

# Output as table
$results | Format-Table -AutoSize

# Summary
$totalUsers = $users.Count
$activeUsers = ($results | Where-Object { $_.URLs -gt 0 }).Count
$totalUrls = ($urlOwners | Measure-Object).Count

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Total users: $totalUsers"
Write-Host "  Active users (created URLs): $activeUsers"
Write-Host "  Total URLs: $totalUrls"
