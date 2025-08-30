# 🌤️ Cloudinary Setup Guide for AxomClash

## Why Cloudinary?

Your photos and videos are not showing because:
1. **Local Storage Issue**: Files are stored locally in `uploads/` folder
2. **Cloud Deployment**: Render wipes local storage on each deployment
3. **URL Mismatch**: Frontend can't access local files on cloud server

Cloudinary solves this by providing:
- ✅ **Cloud Storage**: Files stored in the cloud, not locally
- ✅ **CDN**: Fast loading from global servers
- ✅ **Image Optimization**: Automatic compression and format conversion
- ✅ **Persistence**: Files survive server restarts and deployments

## 🚀 Quick Setup

### 1. Sign Up for Cloudinary
- Go to [https://cloudinary.com](https://cloudinary.com)
- Click "Sign Up For Free"
- Create account (free tier includes 25GB storage)

### 2. Get Your Credentials
- Go to [Dashboard](https://cloudinary.com/console)
- Copy your:
  - **Cloud Name**
  - **API Key**
  - **API Secret**

### 3. Update Environment Variables
Add to your `backend/.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Test Connection
```bash
cd backend
node scripts/setupCloudinary.js
```

## 🔧 What I've Updated

### Backend Changes
- ✅ **Cloudinary Config**: `backend/config/cloudinary.js`
- ✅ **Posts Route**: Now uploads to Cloudinary
- ✅ **Auth Route**: Profile/cover photos use Cloudinary
- ✅ **Banners Route**: Banner images use Cloudinary
- ✅ **Chat Route**: Media files use Cloudinary

### Frontend Changes
- ✅ **Image Utils**: Handles both local and Cloudinary URLs
- ✅ **URL Processing**: Automatically detects Cloudinary URLs

## 📁 File Organization

Your files will be organized in Cloudinary like this:
```
axomclash/
├── posts/          # Post images and videos
├── profiles/       # Profile pictures
├── covers/         # Cover photos
├── banners/        # Banner images
└── chat/           # Chat media files
```

## 🧪 Testing

### Test File Upload
1. Start your backend server
2. Try uploading a photo in a post
3. Check the database - you should see Cloudinary URLs
4. Images should now display properly

### Test Profile Picture
1. Go to profile settings
2. Upload a new profile picture
3. It should appear immediately

## 🔍 Troubleshooting

### Images Still Not Showing?
1. **Check Console**: Look for errors in browser console
2. **Check Network Tab**: See if image requests are failing
3. **Verify Credentials**: Run the setup script again
4. **Check Database**: Ensure URLs are Cloudinary URLs

### Common Issues
- **CORS Errors**: Make sure your backend CORS is configured
- **Invalid URLs**: Check if database has correct Cloudinary URLs
- **File Size**: Ensure files are under 10MB limit

## 💰 Pricing

**Free Tier Includes:**
- 25GB storage
- 25GB bandwidth/month
- 25,000 transformations/month
- Perfect for development and small apps

**Paid Plans Start At:**
- $89/month for 225GB storage
- $224/month for 500GB storage

## 🚀 Deployment

### Render (Backend)
1. Add Cloudinary environment variables in Render dashboard
2. Deploy - files will now be stored in Cloudinary

### Netlify (Frontend)
1. No changes needed - frontend automatically handles Cloudinary URLs
2. Images will load from Cloudinary CDN

## 📚 Additional Features

### Image Optimization
Cloudinary automatically:
- Compresses images
- Converts to optimal formats (WebP for modern browsers)
- Resizes images for different devices

### Video Support
- MP4, WebM, OGG, AVI, MOV, WMV
- Automatic format conversion
- Streaming optimization

### Security
- Signed URLs for private content
- Watermarking capabilities
- Access control

## 🆘 Need Help?

1. **Check Cloudinary Dashboard**: Monitor usage and errors
2. **Review Logs**: Check backend console for upload errors
3. **Test Script**: Run `node scripts/setupCloudinary.js`
4. **Documentation**: [Cloudinary Docs](https://cloudinary.com/documentation)

## 🎯 Next Steps

1. ✅ **Set up Cloudinary account**
2. ✅ **Add credentials to .env**
3. ✅ **Test connection with setup script**
4. ✅ **Test file uploads**
5. ✅ **Deploy to production**

Your images and videos should now work perfectly! 🎉
