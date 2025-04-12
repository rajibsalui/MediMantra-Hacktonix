import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Check if Cloudinary environment variables are set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('⚠️ Cloudinary configuration is incomplete. Please check your environment variables.');
  console.error({
    CLOUDINARY_CLOUD_NAME: cloudName ? 'Set' : 'Not Set',
    CLOUDINARY_API_KEY: apiKey ? 'Set' : 'Not Set',
    CLOUDINARY_API_SECRET: apiSecret ? 'Set' : 'Not Set'
  });
}

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  console.log('Cloudinary configured successfully with cloud name:', cloudName);
} catch (error) {
  console.error('Failed to configure Cloudinary:', error);
}

// Create storage engine for multer
let storage;
try {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'medimantra',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      resource_type: 'auto', // Important: explicitly set to 'auto' to handle PDFs
    },
  });
} catch (error) {
  console.error('Failed to create Cloudinary storage:', error);
  // Fallback to memory storage or other handling can be added here
}

export { cloudinary, storage };