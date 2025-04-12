import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Utility function to check Cloudinary configuration
 * @returns {Object} Configuration status
 */
export const checkCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  const isConfigured = cloudName && apiKey && apiSecret;
  
  return {
    isConfigured,
    cloudName: cloudName ? 'Set' : 'Not Set',
    apiKey: apiKey ? 'Set' : 'Not Set',
    apiSecret: apiSecret ? 'Set' : 'Not Set',
    config: cloudinary.config()
  };
};

/**
 * Test Cloudinary connection by uploading a test image
 * @returns {Promise<Object>} Test result
 */
export const testCloudinaryConnection = async () => {
  try {
    const config = checkCloudinaryConfig();
    
    if (!config.isConfigured) {
      return {
        success: false,
        message: 'Cloudinary is not properly configured',
        config
      };
    }
    
    // Create a simple test image (1x1 pixel transparent PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    
    // Try to upload
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'medimantra/test',
      public_id: `test-${Date.now()}`
    });
    
    return {
      success: true,
      message: 'Cloudinary connection successful',
      result: {
        url: result.secure_url,
        public_id: result.public_id
      },
      config
    };
  } catch (error) {
    return {
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message,
      stack: error.stack
    };
  }
};

export default { checkCloudinaryConfig, testCloudinaryConnection };
