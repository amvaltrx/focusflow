@echo off
color 0b
echo ========================================================
echo       FocusFlow NETLIFY DEPLOYMENT BUILDER
echo ========================================================
echo.

echo [1/4] Cleaning old builds...
if exist NETLIFY_DEPLOY rd /s /q NETLIFY_DEPLOY
mkdir NETLIFY_DEPLOY

echo [2/4] Building Frontend...
cd frontend
call npm run build
cd ..

echo [3/4] Copying files to deployment folder...
xcopy /E /I frontend\dist NETLIFY_DEPLOY
mkdir NETLIFY_DEPLOY\functions
copy backend\netlify-api.js NETLIFY_DEPLOY\functions\api.js
copy backend\server.js NETLIFY_DEPLOY\functions\server.js
xcopy /E /I backend\src NETLIFY_DEPLOY\functions\src

echo [4/4] Setting up Function Dependencies...
echo { "dependencies": { "serverless-http": "^2.7.0", "express": "^4.17.1", "mongoose": "^6.0.0", "bcryptjs": "^2.4.3", "jsonwebtoken": "^8.5.1", "cors": "^2.8.5" } } > NETLIFY_DEPLOY\functions\package.json

echo [5/4] Creating Redirects for API...
echo /api/*  /.netlify/functions/api  200 > NETLIFY_DEPLOY\_redirects

echo.
echo ========================================================
echo SUCCESS! Your deployment folder is ready.
echo.
echo STEP 1: Drag the 'NETLIFY_DEPLOY' folder to Netlify.
echo STEP 2: Add MONGODB_URI to Netlify Environment Variables.
echo ========================================================
pause
