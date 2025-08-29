# 🚀 Deployment Guide: Render (Backend) + Netlify (Frontend)

## 📋 Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- Netlify account (free tier available)
- Clever Cloud MySQL database (already configured)

## 🔧 Backend Deployment on Render

### Step 1: Prepare Your Repository
1. **Push your code to GitHub** (if not already done)
2. **Ensure these files are in your backend folder:**
   - `render.yaml` ✅ (already created)
   - `package.json` ✅ (already configured)
   - `server.js` ✅ (already has health check)

### Step 2: Deploy on Render
1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `axomclash-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Set Environment Variables
In your Render service dashboard, add these environment variables:

```
NODE_ENV=production
MYSQL_ADDON_HOST=begr5npk9smo955afrh3-mysql.services.clever-cloud.com
MYSQL_ADDON_DB=begr5npk9smo955afrh3
MYSQL_ADDON_USER=u4ipbi08elhoxmsz
MYSQL_ADDON_PORT=3306
MYSQL_ADDON_PASSWORD=zC08nyi3MEVOfI3EisgE
MYSQL_ADDON_URI=mysql://u4ipbi08elhoxmsz:zC08nyi3MEVOfI3EisgE@begr5npk9smo955afrh3-mysql.services.clever-cloud.com:3306/begr5npk9smo955afrh3
CLIENT_URL=https://your-frontend-domain.netlify.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
JWT_SECRET=your-super-secure-jwt-secret-here
```

### Step 4: Deploy
1. **Click "Create Web Service"**
2. **Wait for build and deployment** (usually 2-5 minutes)
3. **Note your backend URL**: `https://your-service-name.onrender.com`

## 🌐 Frontend Deployment on Netlify

### Step 1: Prepare Frontend
1. **Update API URL** in your frontend code:
   ```bash
   cd frontend
   cp env.production.template .env.production
   # Edit .env.production and update REACT_APP_API_URL with your Render backend URL
   ```

2. **Update package.json proxy** (remove or update):
   ```json
   // Remove this line from package.json
   "proxy": "http://localhost:5000"
   ```

### Step 2: Deploy on Netlify
1. **Go to [Netlify Dashboard](https://app.netlify.com/)**
2. **Click "New site from Git"**
3. **Connect your GitHub repository**
4. **Configure build settings:**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: `18`

### Step 3: Set Environment Variables
In your Netlify site dashboard → Site settings → Environment variables:

```
REACT_APP_API_URL=https://your-backend-name.onrender.com
REACT_APP_ENV=production
```

### Step 4: Deploy
1. **Click "Deploy site"**
2. **Wait for build and deployment** (usually 2-3 minutes)
3. **Note your frontend URL**: `https://your-site-name.netlify.app`

## 🔄 Update Configuration

### Update Backend CLIENT_URL
1. **Go back to Render dashboard**
2. **Update the CLIENT_URL environment variable** with your actual Netlify frontend URL
3. **Redeploy** if needed

### Update Frontend API URL
1. **Go to Netlify dashboard**
2. **Update REACT_APP_API_URL** with your actual Render backend URL
3. **Trigger a new deployment**

## 🧪 Testing Your Deployment

### Test Backend
```bash
# Test health check
curl https://your-backend-name.onrender.com/api/health

# Test database connection
curl https://your-backend-name.onrender.com/api/users
```

### Test Frontend
1. **Visit your Netlify URL**
2. **Test all major functionality**
3. **Check browser console for errors**
4. **Verify API calls are going to Render backend**

## 🆘 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check environment variables in Render
- Verify database connection
- Check build logs for errors

#### Frontend Can't Connect to Backend
- Verify REACT_APP_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

#### Database Connection Issues
- Verify Clever Cloud credentials
- Check if database is accessible from Render's servers
- Ensure SSL settings are correct

### Debug Commands
```bash
# Check backend logs in Render dashboard
# Check frontend build logs in Netlify dashboard
# Test API endpoints with curl or Postman
```

## 📊 Monitoring

### Render
- **Logs**: Available in dashboard
- **Metrics**: Response times, error rates
- **Uptime**: Automatic health checks

### Netlify
- **Build logs**: Available in dashboard
- **Analytics**: Page views, performance
- **Forms**: If you have any forms

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Backend should only allow your Netlify domain
3. **Rate Limiting**: Already configured in backend
4. **HTTPS**: Both services provide SSL certificates
5. **JWT Secret**: Use a strong, unique secret in production

## 🎯 Next Steps

After successful deployment:
1. **Set up custom domains** (optional)
2. **Configure automatic deployments** from Git
3. **Set up monitoring and alerts**
4. **Implement CI/CD pipeline** (optional)
5. **Set up backups** for your database

## 📞 Support

- **Render**: [Documentation](https://render.com/docs)
- **Netlify**: [Documentation](https://docs.netlify.com/)
- **Clever Cloud**: [Documentation](https://www.clever-cloud.com/en/docs/)

---

**🎉 Congratulations! Your AxomClash application is now deployed on Render + Netlify!**
