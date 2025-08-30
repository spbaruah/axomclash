const express = require('express');
const app = express();
const bannerRoutes = require('../routes/banners');

// Test middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// Register banner routes
app.use('/api/banners', bannerRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log('✅ Banner routes registered at /api/banners');
  console.log('📋 Available endpoints:');
  console.log('  - GET /api/banners/health');
  console.log('  - GET /api/banners/');
  console.log('  - GET /api/banners/admin');
  console.log('  - POST /api/banners/');
  console.log('  - PUT /api/banners/:id');
  console.log('  - DELETE /api/banners/:id');
  console.log('  - PATCH /api/banners/:id/toggle');
  console.log('  - POST /api/banners/reorder');
  console.log('\n🌐 Test with: curl http://localhost:3001/api/banners/health');
});
