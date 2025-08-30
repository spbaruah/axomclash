const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engines for different types of uploads
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'],
      transformation: [
        { quality: 'auto:good' }, // Optimize quality
        { fetch_format: 'auto' }  // Auto-format based on browser support
      ]
    }
  });
};

// Storage configurations for different upload types
const storageConfigs = {
  posts: createStorage('axomclash/posts'),
  profiles: createStorage('axomclash/profiles'),
  covers: createStorage('axomclash/covers'),
  banners: createStorage('axomclash/banners'),
  chat: createStorage('axomclash/chat')
};

// Helper function to get storage by type
const getStorage = (type) => {
  return storageConfigs[type] || storageConfigs.posts;
};

// Helper function to delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return;
    
    // Extract public ID from URL if full URL is provided
    let cloudinaryPublicId = publicId;
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        cloudinaryPublicId = urlParts[uploadIndex + 2].split('.')[0];
      }
    }
    
    const result = await cloudinary.uploader.destroy(cloudinaryPublicId);
    console.log('File deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return null;
  }
};

// Helper function to get optimized URL
const getOptimizedUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  const { width, height, quality = 'auto:good', format = 'auto' } = options;
  let optimizedUrl = url;
  
  // Add transformation parameters
  if (width || height) {
    const transform = [];
    if (width) transform.push(`w_${width}`);
    if (height) transform.push(`h_${height}`);
    if (quality) transform.push(`q_${quality}`);
    if (format) transform.push(`f_${format}`);
    
    optimizedUrl = url.replace('/upload/', `/upload/${transform.join(',')}/`);
  }
  
  return optimizedUrl;
};

module.exports = {
  cloudinary,
  getStorage,
  deleteFile,
  getOptimizedUrl,
  storageConfigs
};
