const multer = require('multer');
const { getStorage } = require('../config/cloudinary');
require('dotenv').config();

const testMulterUpload = () => {
  try {
    console.log('🧪 Testing Multer upload configuration...');
    
    // Test the exact configuration used in banners.js
    console.log('\n🧪 Testing banner upload configuration...');
    
    try {
      const upload = multer({
        storage: getStorage('banners'),
        limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
        },
        fileFilter: function (req, file, cb) {
          // Allow only image files
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed!'), false);
          }
        }
      });
      
      console.log('✅ Multer upload configuration created successfully');
      console.log('📁 Upload type:', typeof upload);
      console.log('📁 Upload constructor:', upload.constructor.name);
      
      // Check if it has the expected methods
      if (upload.single) {
        console.log('✅ Upload has single() method');
      } else {
        console.log('❌ Upload missing single() method');
      }
      
      if (upload.array) {
        console.log('✅ Upload has array() method');
      } else {
        console.log('❌ Upload missing array() method');
      }
      
      if (upload.fields) {
        console.log('✅ Upload has fields() method');
      } else {
        console.log('❌ Upload missing fields() method');
      }
      
      // Test the single middleware
      const singleUpload = upload.single('image');
      console.log('✅ Single upload middleware created');
      console.log('📁 Single middleware type:', typeof singleUpload);
      
    } catch (uploadError) {
      console.error('❌ Error creating upload configuration:', uploadError);
    }
    
    // Test file filter function
    console.log('\n🧪 Testing file filter function...');
    
    const testFileFilter = function (req, file, cb) {
      // Allow only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    };
    
    // Test with different file types
    const testFiles = [
      { mimetype: 'image/jpeg', originalname: 'test.jpg' },
      { mimetype: 'image/png', originalname: 'test.png' },
      { mimetype: 'text/plain', originalname: 'test.txt' },
      { mimetype: 'application/pdf', originalname: 'test.pdf' }
    ];
    
    testFiles.forEach((file, index) => {
      try {
        testFileFilter({}, file, (error, accepted) => {
          if (error) {
            console.log(`✅ File ${index + 1} (${file.originalname}): REJECTED - ${error.message}`);
          } else {
            console.log(`✅ File ${index + 1} (${file.originalname}): ACCEPTED`);
          }
        });
      } catch (error) {
        console.error(`❌ File ${index + 1} test failed:`, error);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testMulterUpload();
