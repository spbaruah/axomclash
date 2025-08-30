const jwt = require('jsonwebtoken');
require('dotenv').config();

const testAdminToken = () => {
  try {
    console.log('🧪 Testing admin token verification...');
    console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    
    // Create a test admin token
    const testAdminPayload = {
      userId: 1,
      username: 'testadmin',
      email: 'admin@test.com',
      role: 'admin',
      isAdmin: true
    };
    
    console.log('📋 Test admin payload:', testAdminPayload);
    
    // Sign the token
    const testToken = jwt.sign(
      testAdminPayload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );
    
    console.log('🔐 Test token created:', testToken.substring(0, 50) + '...');
    
    // Verify the token
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'fallback_secret');
    
    console.log('🔓 Token decoded successfully:', decoded);
    console.log('✅ isAdmin field:', decoded.isAdmin);
    console.log('✅ Role field:', decoded.role);
    
    // Test the verification logic
    if (!decoded.isAdmin) {
      console.log('❌ Token verification failed: isAdmin is false');
    } else {
      console.log('✅ Token verification passed: isAdmin is true');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAdminToken();
