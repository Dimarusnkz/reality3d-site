# Reality3D Remote Deployment Script
$server = "10.20.0.40"
$user = "r3d"
$pass = "2212"
$remote_path = "/var/www/reality3d"

Write-Host "Starting remote deployment to $server..." -ForegroundColor Cyan

# Step 1: Push changes to Git (optional, but recommended)
Write-Host "Checking for local changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Local changes detected. Committing and pushing..." -ForegroundColor Yellow
    git add .
    git commit -m "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
} else {
    Write-Host "No local changes to push." -ForegroundColor Green
}

# Step 2: Run deploy script on server
Write-Host "Running deploy_server.sh on remote server..." -ForegroundColor Yellow
plink -batch -pw $pass "$user@$server" "cd $remote_path && ./deploy_server.sh"

Write-Host "Deployment finished!" -ForegroundColor Green
