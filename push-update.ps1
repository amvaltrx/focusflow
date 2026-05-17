# push-update.ps1 - Automated 1-Click Update Script for FocusFlow
# Run this inside Android Studio terminal or PowerShell!

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING AUTO UPDATE PROCESS FOR FOCUSFLOW" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Load Current Version from package.json
$packagePath = "frontend/package.json"
$packageContent = Get-Content -Raw -Path $packagePath | ConvertFrom-Json
$currentVersion = $packageContent.version

Write-Host "📦 Current Version: $currentVersion" -ForegroundColor Yellow

# Calculate auto-incremented version
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2] + 1
$autoVersion = "$major.$minor.$patch"

# Auto-increment default
$newVersion = $autoVersion
Write-Host "💡 Auto-incremented Version will be: $newVersion" -ForegroundColor Green

# 2. Write new version to package.json
$packageContent.version = $newVersion
$jsonString = ConvertTo-Json -InputObject $packageContent -Depth 100
[System.IO.File]::WriteAllText((Resolve-Path $packagePath), $jsonString)

Write-Host "✅ Bumped version to $newVersion in package.json!" -ForegroundColor Green

# 3. Clean up any leftover nesting APK files to keep it light (~10MB)
Write-Host "🧹 Cleaning cached build directories..." -ForegroundColor Cyan
Remove-Item "frontend/public/focusflow.apk" -ErrorAction SilentlyContinue -Force
Remove-Item "frontend/dist/focusflow.apk" -ErrorAction SilentlyContinue -Force
Remove-Item "frontend/android/app/src/main/assets/public/focusflow.apk" -ErrorAction SilentlyContinue -Force

# 4. Build fresh PWA static assets
Write-Host "⚡ Building PWA Web Assets..." -ForegroundColor Cyan
cd frontend
npm run build
cd ..

# 5. Sync Capacitor Android project
Write-Host "⚡ Syncing Capacitor Web Shell..." -ForegroundColor Cyan
cd frontend
npx cap sync android
cd ..

# 6. Run clean local Gradle compilation
Write-Host "🛠️ Compiling fresh Android APK (v$newVersion)..." -ForegroundColor Cyan
cd frontend/android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat clean
.\gradlew.bat assembleDebug
cd ../..

# 7. Copy newly compiled clean APK to static public folder
$apkSource = "frontend/android/app/build/outputs/apk/debug/app-debug.apk"
$apkDest = "frontend/public/focusflow.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    $sizeMb = [Math]::Round((Get-Item $apkDest).Length / 1MB, 2)
    Write-Host "✅ Copied optimized clean APK to public folder ($sizeMb MB)!" -ForegroundColor Green
} else {
    Write-Host "❌ Error: APK compilation failed! Source APK not found." -ForegroundColor Red
    exit 1
}

# 8. Re-build final assets & sync with compiled static APK included
Write-Host "⚡ Building final PWA distribution package..." -ForegroundColor Cyan
cd frontend
npm run build
npx cap sync android
cd ..

# 9. Commit & Push to GitHub in one clean sweep!
Write-Host "🐙 Pushing version $newVersion live to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "chore: release version v$newVersion"
git push

Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 FOCUSFLOW v$newVersion IS LIVE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
