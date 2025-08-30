# Netlify Deployment Guide for CampusClash Frontend

## Prerequisites
- A Netlify account (free at [netlify.com](https://netlify.com))
- Your backend API deployed and accessible via HTTPS
- Git repository with your frontend code

## Step 1: Prepare Your Environment Variables

1. **Update the production environment file:**
   - Edit `env.production` in your frontend directory
   - Replace `https://your-backend-domain.com` with your actual backend URL
   - Make sure your backend supports HTTPS

2. **Important:** Your backend must be accessible via HTTPS for production

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended for first deployment)

1. **Go to [netlify.com](https://netlify.com) and sign in**

2. **Click "New site from Git"**

3. **Choose your Git provider (GitHub, GitLab, Bitbucket)**

4. **Select your repository**

5. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Node version:** `18` (or your preferred version)

6. **Click "Deploy site"**

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Navigate to your frontend directory:**
   ```bash
   cd frontend
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables in Netlify

1. **Go to your site dashboard in Netlify**

2. **Navigate to Site settings > Environment variables**

3. **Add the following environment variables:**
   ```
   REACT_APP_API_URL=https://your-backend-domain.com
   REACT_APP_SOCKET_URL=https://your-backend-domain.com
   REACT_APP_APP_NAME=CampusClash
   REACT_APP_APP_VERSION=1.0.0
   REACT_APP_ENABLE_CHAT=true
   REACT_APP_ENABLE_GAMES=true
   ```

4. **Replace `https://your-backend-domain.com` with your actual backend URL**

## Step 4: Configure Custom Domain (Optional)

1. **Go to Site settings > Domain management**

2. **Click "Add custom domain"**

3. **Follow the DNS configuration instructions**

## Step 5: Test Your Deployment

1. **Visit your Netlify URL**
2. **Test all major functionality:**
   - User registration/login
   - API calls to your backend
   - Socket connections
   - File uploads
   - All app features

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Check for syntax errors in your code

2. **API calls fail:**
   - Verify your backend URL is correct
   - Ensure CORS is configured on your backend
   - Check that your backend supports HTTPS

3. **Socket connections fail:**
   - Verify WebSocket URL is correct
   - Ensure your backend supports WSS (secure WebSockets)

4. **Environment variables not working:**
   - Rebuild and redeploy after adding environment variables
   - Check variable names (must start with `REACT_APP_`)

### Environment Variable Debugging:

Add this to your App.js temporarily to debug:
```javascript
console.log('API URL:', process.env.REACT_APP_API_URL);
console.log('Socket URL:', process.env.REACT_APP_SOCKET_URL);
```

## Continuous Deployment

Once deployed, Netlify will automatically redeploy when you push to your main branch.

## Security Notes

- Never commit sensitive information like API keys
- Use environment variables for all configuration
- Ensure your backend has proper CORS settings
- Consider implementing rate limiting on your backend

## Support

If you encounter issues:
1. Check Netlify's build logs
2. Verify your environment variables
3. Test your backend API endpoints
4. Check browser console for errors
