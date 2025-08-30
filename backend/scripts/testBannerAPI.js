const axios = require('axios');

// Test banner API endpoints
const testBannerAPI = async () => {
  const baseURL = 'https://axomclash.onrender.com';
  
  console.log('🧪 Testing Banner API endpoints...\n');
  
  try {
    // Test health check
    console.log('1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/banners/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test public banners endpoint
    console.log('\n2. Testing public banners endpoint...');
    const bannersResponse = await axios.get(`${baseURL}/api/banners`);
    console.log('✅ Public banners endpoint working:', {
      count: bannersResponse.data.banners?.length || 0,
      status: bannersResponse.status
    });
    
    // Test admin banners endpoint (without token - should fail)
    console.log('\n3. Testing admin banners endpoint (without token)...');
    try {
      await axios.get(`${baseURL}/api/banners/admin`);
      console.log('❌ Admin endpoint should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Admin endpoint correctly rejected unauthorized request');
      } else {
        console.log('⚠️ Admin endpoint failed with unexpected status:', error.response?.status);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
};

// Run the test
testBannerAPI();
