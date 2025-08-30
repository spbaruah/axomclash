const axios = require('axios');

const baseURL = 'https://axomclash.onrender.com';

const verifyDeployment = async () => {
  console.log('🔍 Verifying AxomClash Backend Deployment...\n');
  
  const endpoints = [
    { path: '/api/health', name: 'Main Health Check', expectedStatus: 200 },
    { path: '/api/banners/health', name: 'Banner Health Check', expectedStatus: 200 },
    { path: '/api/banners', name: 'Public Banners', expectedStatus: 200 },
    { path: '/api/banners/admin', name: 'Admin Banners (no auth)', expectedStatus: 401 },
    { path: '/api/users', name: 'Users Endpoint', expectedStatus: 200 },
    { path: '/api/posts', name: 'Posts Endpoint', expectedStatus: 200 }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(`${baseURL}${endpoint.path}`);
      
      if (response.status === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.name}: ${response.status} (Expected: ${endpoint.expectedStatus})`);
      } else {
        console.log(`⚠️  ${endpoint.name}: ${response.status} (Expected: ${endpoint.expectedStatus})`);
      }
      
      // Show response data for health checks
      if (endpoint.path.includes('health')) {
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === endpoint.expectedStatus) {
          console.log(`✅ ${endpoint.name}: ${error.response.status} (Expected: ${endpoint.expectedStatus})`);
        } else if (error.response.status === 404) {
          console.log(`❌ ${endpoint.name}: 404 Not Found - Route not registered!`);
        } else {
          console.log(`⚠️  ${endpoint.name}: ${error.response.status} (Expected: ${endpoint.expectedStatus})`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('📋 Summary:');
  console.log('- If you see 404 errors, the routes are not deployed');
  console.log('- If you see 500 errors, there are runtime issues');
  console.log('- If you see 401 errors for admin routes, authentication is working');
  console.log('\n🚀 Next Steps:');
  console.log('1. Check Render dashboard for deployment status');
  console.log('2. Force redeploy if routes are missing');
  console.log('3. Verify environment variables are set');
  console.log('4. Check Render logs for startup errors');
};

// Run verification
verifyDeployment().catch(console.error);
