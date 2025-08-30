#!/usr/bin/env node

/**
 * 🌤️ Cloudinary Setup Script for AxomClash
 * 
 * This script will help you:
 * 1. Check if Cloudinary credentials are set
 * 2. Test the connection to Cloudinary
 * 3. Verify storage configuration
 * 4. Test a sample upload
 */

require('dotenv').config();
const { cloudinary, getStorage } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const setupCloudinary = async () => {
  console.log('🚀 Setting up Cloudinary for AxomClash...\n');

  // Step 1: Check Environment Variables
  console.log('📋 Step 1: Checking Environment Variables');
  console.log('=====================================');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.log('❌ Cloudinary credentials are missing!');
    console.log('');
    console.log('🔑 You need to set these environment variables:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_API_KEY=your_api_key');
    console.log('   CLOUDINARY_API_SECRET=your_api_secret');
    console.log('');
    console.log('📝 How to get them:');
    console.log('   1. Go to https://cloudinary.com');
    console.log('   2. Sign up for a free account');
    console.log('   3. Go to Dashboard');
    console.log('   4. Copy your Cloud Name, API Key, and API Secret');
    console.log('');
    console.log('💡 For local development, create a .env file in the backend folder');
    console.log('💡 For production, set these in your Render environment variables');
    console.log('');
    console.log('📚 See CLOUDINARY_SETUP.md for detailed instructions');
    return false;
  }
  
  console.log('✅ Cloudinary credentials found:');
  console.log(`   Cloud Name: ${cloudName}`);
  console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`   API Secret: ${apiSecret.substring(0, 8)}...`);
  console.log('');

  // Step 2: Test Cloudinary Connection
  console.log('🔌 Step 2: Testing Cloudinary Connection');
  console.log('=====================================');
  
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log(`   Response: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log('❌ Failed to connect to Cloudinary:');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. Check if your credentials are correct');
    console.log('   2. Verify your Cloudinary account is active');
    console.log('   3. Check your internet connection');
    return false;
  }
  console.log('');

  // Step 3: Test Storage Configuration
  console.log('📁 Step 3: Testing Storage Configuration');
  console.log('=====================================');
  
  const storageTypes = ['posts', 'profiles', 'covers', 'banners', 'chat'];
  let storageOk = true;
  
  for (const type of storageTypes) {
    try {
      const storage = getStorage(type);
      if (storage && typeof storage === 'object') {
        console.log(`✅ ${type} storage: OK`);
      } else {
        console.log(`❌ ${type} storage: Invalid`);
        storageOk = false;
      }
    } catch (error) {
      console.log(`❌ ${type} storage: FAILED - ${error.message}`);
      storageOk = false;
    }
  }
  
  if (!storageOk) {
    console.log('');
    console.log('❌ Some storage types failed to initialize');
    return false;
  }
  console.log('');

  // Step 4: Test Sample Upload
  console.log('📤 Step 4: Testing Sample Upload');
  console.log('=====================================');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a minimal PNG file for testing
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR chunk type
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT chunk type
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND chunk type
      0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngHeader);
    
    console.log('📝 Created test image for upload test');
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      folder: 'axomclash/test',
      public_id: 'setup-test'
    });
    
    console.log('✅ Test upload successful!');
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}`);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test file');
    
    // Delete test upload from Cloudinary
    await cloudinary.uploader.destroy('axomclash/test/setup-test');
    console.log('🗑️ Cleaned up test upload from Cloudinary');
    
  } catch (error) {
    console.log('❌ Test upload failed:');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('🔍 This might indicate:');
    console.log('   1. Upload permissions issue');
    console.log('   2. Network connectivity problem');
    console.log('   3. Cloudinary account restrictions');
    return false;
  }
  
  console.log('');
  console.log('🎉 Cloudinary setup completed successfully!');
  console.log('');
  console.log('✅ Your photo uploads should now work for:');
  console.log('   - Profile pictures');
  console.log('   - Cover photos');
  console.log('   - Post images and videos');
  console.log('   - Banner images');
  console.log('   - Chat media files');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Test photo uploads in your app');
  console.log('   2. Deploy to production with these credentials');
  console.log('   3. Update your frontend to use the new image URLs');
  
  return true;
};

// Run the setup
if (require.main === module) {
  setupCloudinary()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Setup failed with error:', error);
      process.exit(1);
    });
}

module.exports = setupCloudinary;
