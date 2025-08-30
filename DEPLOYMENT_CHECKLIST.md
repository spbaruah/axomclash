# AxomClash Deployment Checklist

## Current Issue: Banner Routes Not Working (404 Error)

The banner API endpoints are returning 404 "Route not found" errors on the deployed backend, which means the routes are not being properly registered.

## Immediate Actions Required

### 1. Check Render Deployment Status
- [ ] Verify the latest code has been deployed to Render
- [ ] Check Render build logs for any errors
- [ ] Ensure the deployment completed successfully

### 2. Verify Environment Variables on Render
Make sure these are set in your Render environment:
```bash
# Database
MYSQL_ADDON_HOST=begr5npk9smo955afrh3-mysql.services.clever-cloud.com
MYSQL_ADDON_DB=begr5npk9smo955afrh3
MYSQL_ADDON_USER=u4ipbi08elhoxmsz
MYSQL_ADDON_PASSWORD=zC08nyi3MEVOfI3EisgE
MYSQL_ADDON_PORT=3306

# JWT
JWT_SECRET=your-actual-jwt-secret

# Cloudinary (REQUIRED for banner functionality)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Client URL
CLIENT_URL=https://axomclash.netlify.app
```

### 3. Force Redeploy Backend
If the routes are still not working:
1. Go to your Render dashboard
2. Find the AxomClash backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete
5. Check the logs for any errors

### 4. Test Banner Routes After Deployment
```bash
# Test health endpoint
curl https://axomclash.onrender.com/api/banners/health

# Test public banners endpoint
curl https://axomclash.onrender.com/api/banners

# Test admin endpoint (should return 401)
curl https://axomclash.onrender.com/api/banners/admin
```

## Code Verification

### Banner Routes File
- [ ] `backend/routes/banners.js` exists and has no syntax errors
- [ ] All endpoints are properly defined
- [ ] Health check endpoint `/health` is working

### Server Configuration
- [ ] `backend/server.js` imports banner routes correctly
- [ ] Routes are registered at `/api/banners`
- [ ] No middleware conflicts

### Database
- [ ] `banners` table exists in Clever Cloud database
- [ ] Database connection is working
- [ ] Environment variables are correct

## Troubleshooting Steps

### Step 1: Check Render Logs
1. Go to Render dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Look for any error messages during startup
5. Check if banner routes are being registered

### Step 2: Verify Route Registration
Look for this log message in Render logs:
```
🔧 Registering banner routes at /api/banners
```

### Step 3: Test Database Connection
The health endpoint should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-XX..."
}
```

### Step 4: Check for Missing Dependencies
Ensure these packages are in `package.json`:
- `multer`
- `multer-storage-cloudinary`
- `cloudinary`

## Expected Behavior

After successful deployment:
1. ✅ `/api/banners/health` returns database status
2. ✅ `/api/banners` returns list of banners (or empty array)
3. ✅ `/api/banners/admin` returns 401 (unauthorized) without token
4. ✅ Frontend banner management works without 500 errors

## If Issues Persist

1. **Check Render Build Logs**: Look for compilation errors
2. **Verify Git Repository**: Ensure latest code is pushed
3. **Test Locally**: Run `node scripts/testLocalBannerRoutes.js`
4. **Check Dependencies**: Ensure all npm packages are installed
5. **Database Connection**: Verify Clever Cloud database is accessible

## Contact Information

If you continue to have issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Ensure the latest code has been deployed
4. Test the health endpoint to isolate the issue
