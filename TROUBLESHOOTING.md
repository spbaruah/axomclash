# AxomClash Troubleshooting Guide

## Common Issues and Solutions

### 1. Banner API 500 Error

**Problem**: The `/api/banners` endpoint returns a 500 Internal Server Error.

**Possible Causes**:
- Database connection issues
- Missing Cloudinary configuration
- Database table doesn't exist
- Environment variables not set

**Solutions**:

#### Check Database Connection
```bash
# Test the health check endpoint
curl https://axomclash.onrender.com/api/banners/health
```

#### Verify Environment Variables
Ensure these are set in your Render environment:
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your-super-secure-jwt-secret-here
```

#### Check Database Table
Ensure the `banners` table exists:
```sql
CREATE TABLE IF NOT EXISTS banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Manifest Icon Error

**Problem**: Browser shows "Resource size is not correct - typo in the Manifest?"

**Solution**: The manifest.json has been updated to use correct icon sizes. The logo files are:
- `logo.png` (83x83)
- `logo2.png` (54x54)

### 3. API Base URL Mismatch

**Problem**: Frontend uses `https://axomclash.onrender.com` but manifest points to `https://axomclash.netlify.app`

**Solution**: This has been fixed. The frontend correctly uses the Render backend URL.

### 4. Testing the API

Run the test script to verify endpoints:
```bash
cd backend
node scripts/testBannerAPI.js
```

### 5. Debugging Steps

1. **Check Backend Logs**: Look for error messages in Render logs
2. **Test Health Endpoint**: Use `/api/banners/health` to check database connection
3. **Verify Environment**: Ensure all required environment variables are set
4. **Check Database**: Verify the database connection and table structure
5. **Test Locally**: Try running the backend locally to isolate issues

### 6. Environment Variables Checklist

**Backend (Render)**:
- [ ] `MYSQL_ADDON_HOST`
- [ ] `MYSQL_ADDON_DB`
- [ ] `MYSQL_ADDON_USER`
- [ ] `MYSQL_ADDON_PASSWORD`
- [ ] `JWT_SECRET`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `CLIENT_URL`

**Frontend (Netlify)**:
- [ ] `REACT_APP_API_URL`
- [ ] `REACT_APP_SOCKET_URL`

### 7. Common Error Messages

- **"Database connection failed"**: Check database credentials and connection
- **"Admin access required"**: Verify JWT token and admin status
- **"Image file is required"**: Ensure image upload is working
- **"Failed to fetch banners"**: Check database query and table structure

### 8. Getting Help

If issues persist:
1. Check the backend logs in Render dashboard
2. Test the health endpoint: `/api/banners/health`
3. Verify all environment variables are set correctly
4. Ensure the database table exists and has the correct structure
