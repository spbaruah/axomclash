const axios = require('axios');

// Check if banners table exists on deployed backend
const checkDeployedBannersTable = async () => {
  const baseURL = 'https://axomclash.onrender.com';
  
  console.log('🔍 Checking banners table on deployed backend...\n');
  
  try {
    // Test the health check endpoint first
    console.log('1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/banners/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test the test endpoint to check table structure
    console.log('\n2. Testing banner creation test endpoint...');
    try {
      // We need an admin token for this, but let's see what error we get
      const testResponse = await axios.post(`${baseURL}/api/banners/test`, {}, {
        headers: {
          'Authorization': 'Bearer invalid-token-for-testing'
        }
      });
      console.log('✅ Test endpoint working:', testResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Test endpoint working (correctly rejected invalid token)');
        console.log('   This means the route is properly registered');
      } else if (error.response?.status === 500) {
        console.log('⚠️ Test endpoint returned 500 error');
        console.log('   Error details:', error.response.data);
        
        // Check if it's a table issue
        if (error.response.data?.error?.includes('table') || 
            error.response.data?.details?.includes('table')) {
          console.log('\n❌ Banners table issue detected!');
          console.log('   The table either doesn\'t exist or has wrong structure');
        }
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test public banners endpoint
    console.log('\n3. Testing public banners endpoint...');
    const bannersResponse = await axios.get(`${baseURL}/api/banners`);
    console.log('✅ Public banners endpoint working:', {
      count: bannersResponse.data.banners?.length || 0,
      status: bannersResponse.status
    });
    
    console.log('\n🎉 Table check completed!');
    
  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
};

// Run the check
checkDeployedBannersTable();
