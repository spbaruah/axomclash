#!/usr/bin/env node

/**
 * Cloudinary Setup Script
 * 
 * This script helps you set up Cloudinary for your AxomClash project.
 * 
 * Steps to use:
 * 1. Sign up at https://cloudinary.com (free tier available)
 * 2. Get your credentials from the dashboard
 * 3. Run this script to test the connection
 * 4. Add credentials to your .env file
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🌤️  Cloudinary Setup for AxomClash\n');

// Check if credentials are set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.log('❌ Cloudinary credentials not found in environment variables.');
  console.log('\n📝 Please add the following to your .env file:');
  console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('CLOUDINARY_API_KEY=your_api_key');
  console.log('CLOUDINARY_API_SECRET=your_api_secret');
  console.log('\n🔗 Get these from: https://cloudinary.com/console');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('✅ Cloudinary credentials found');
console.log(`📁 Cloud Name: ${cloudName}`);
console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
console.log(`🔐 API Secret: ${apiSecret.substring(0, 8)}...\n`);

// Test connection
console.log('🧪 Testing Cloudinary connection...');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Connection successful!');
    console.log('📊 Response:', result);
    console.log('\n🎉 Cloudinary is ready to use!');
    console.log('\n📁 Your uploads will be organized in these folders:');
    console.log('   - axomclash/posts');
    console.log('   - axomclash/profiles');
    console.log('   - axomclash/covers');
    console.log('   - axomclash/banners');
    console.log('   - axomclash/chat');
  })
  .catch(error => {
    console.log('❌ Connection failed!');
    console.log('🔍 Error:', error.message);
    console.log('\n💡 Please check your credentials and try again.');
    process.exit(1);
  });
