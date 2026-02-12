# Deploy Package Builder used by Kaizen+

Write-Host "🚀 Starting Kaizen+ Build Process..." -ForegroundColor Cyan

$root = Get-Location
$deployDir = Join-Path $root "deploy"
$publicHtml = Join-Path $deployDir "public_html"

# 0. Clean previous deploy
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
    Write-Host "   Cleared previous deploy folder."
}
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
New-Item -ItemType Directory -Force -Path $publicHtml | Out-Null

# 1. Build Frontend (Web)
Write-Host "📦 Building Web Frontend..." -ForegroundColor Yellow
Set-Location "$root\web"
try {
    # Check if we need to run install
    if (-not (Test-Path "node_modules")) { npm install }
    
    # Run Build
    npm run build
    
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed." }
}
catch {
    Write-Error "Error during frontend build: $_"
    Set-Location $root
    exit
}
Set-Location $root

# Copy Output (From Root context now)
Write-Host "   Copying frontend files..."
if (Test-Path "web\out") {
    Copy-Item -Recurse -Force "web\out\*" $publicHtml
    Write-Host "   Frontend built and copied to deploy/public_html" -ForegroundColor Green
} else {
    Write-Error "web\out folder not found after build!"
    exit
}

# Create .htaccess for Routing
$htaccessContent = @(
    "<IfModule mod_rewrite.c>",
    "  RewriteEngine On",
    "  RewriteBase /",
    "  RewriteRule ^index\.html$ - [L]",
    "  RewriteCond %{REQUEST_FILENAME} !-f",
    "  RewriteCond %{REQUEST_FILENAME} !-d",
    "  RewriteRule . /index.html [L]",
    "</IfModule>"
)
$htaccessContent | Set-Content -Path "$publicHtml\.htaccess"
Write-Host "   Added .htaccess for routing."

# 2. Package Backend
Write-Host "📦 Packaging Backend..." -ForegroundColor Yellow
$backendZip = Join-Path $deployDir "backend_app.zip"

# Create temp folder for backend source
$tempBackend = Join-Path $deployDir "temp_backend"
New-Item -ItemType Directory -Force -Path $tempBackend | Out-Null

# Copy specific folders/files
Copy-Item -Recurse -Force "backend/database" $tempBackend
Copy-Item -Recurse -Force "backend/middleware" $tempBackend
Copy-Item -Recurse -Force "backend/routes" $tempBackend
Copy-Item -Recurse -Force "backend/services" $tempBackend
# Check if scripts folder exists before copying
if (Test-Path "backend/scripts") { Copy-Item -Recurse -Force "backend/scripts" $tempBackend }
Copy-Item -Force "backend/server.js" $tempBackend
Copy-Item -Force "backend/package.json" $tempBackend
if (Test-Path "backend/.env.example") { Copy-Item -Force "backend/.env.example" $tempBackend }

# Zip it
Compress-Archive -Path "$tempBackend\*" -DestinationPath $backendZip -Force
Remove-Item -Recurse -Force $tempBackend
Write-Host "   Backend zipped to $backendZip" -ForegroundColor Green

# 3. Mobile Instructions
Write-Host "📱 Mobile App Note:" -ForegroundColor Cyan
Write-Host "   Mobile apps require EAS Build service. Run 'eas build' inside the mobile folder manually."

Write-Host ""
Write-Host "✅ BUILD COMPLETE!" -ForegroundColor Green
Write-Host "   📂 Your deployment files are in the 'deploy' folder:"
Write-Host "      1. Upload content of 'deploy/public_html' to your hosting 'public_html'."
Write-Host "      2. Upload 'deploy/backend_app.zip' to your hosting, extract, and setup Node.js App."
Write-Host ""
