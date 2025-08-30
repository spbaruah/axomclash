// Utility function to handle image URLs (both local and Cloudinary)
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's already a full URL (including Cloudinary), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path starting with /, remove the leading slash
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  
  // Get the backend URL from environment variables
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Combine backend URL with image path
  return `${backendUrl}/${cleanPath}`;
};

// Utility function to check if an image URL is valid
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.trim().length > 0;
};
