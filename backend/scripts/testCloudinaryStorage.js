const { getStorage } = require('../config/cloudinary');
require('dotenv').config();

const testCloudinaryStorage = () => {
  try {
    console.log('🧪 Testing Cloudinary storage configuration...');
    console.log('🔑 Cloudinary credentials:');
    console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
    console.log('  - API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
    console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');
    
    // Test getting storage
    console.log('\n🧪 Testing getStorage function...');
    
    try {
      const bannerStorage = getStorage('banners');
      console.log('✅ Banner storage created successfully');
      console.log('📁 Storage type:', typeof bannerStorage);
      console.log('📁 Storage constructor:', bannerStorage.constructor.name);
      
      // Test if it's a valid CloudinaryStorage instance
      if (bannerStorage && typeof bannerStorage === 'object') {
        console.log('✅ Storage object is valid');
        
        // Check if it has the expected methods
        if (bannerStorage._handleFile) {
          console.log('✅ Storage has _handleFile method');
        } else {
          console.log('❌ Storage missing _handleFile method');
        }
        
        if (bannerStorage._removeFile) {
          console.log('✅ Storage has _removeFile method');
        } else {
          console.log('❌ Storage missing _removeFile method');
        }
        
      } else {
        console.log('❌ Storage object is invalid');
      }
      
    } catch (storageError) {
      console.error('❌ Error creating banner storage:', storageError);
    }
    
    // Test all storage types
    console.log('\n🧪 Testing all storage types...');
    const storageTypes = ['posts', 'profiles', 'covers', 'banners', 'chat'];
    
    storageTypes.forEach(type => {
      try {
        const storage = getStorage(type);
        console.log(`✅ ${type} storage: OK`);
      } catch (error) {
        console.error(`❌ ${type} storage: FAILED -`, error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testCloudinaryStorage();
