import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { cloudinary } from '../config/cloudinary.config.js';

// Get the directory name using ES module syntax
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subfolder = req.body.subfolder || 'general';
    const folderPath = path.join(uploadsDir, subfolder);
    
    // Create subfolder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: uuid + original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Allow only certain file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

// Configure multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: fileFilter
});

/**
 * Upload a file to Cloudinary
 * @param {Object} file - File object with path, originalname and mimetype
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Promise<Object>} - The uploaded file info
 */
export const uploadFile = async (file, folder = 'medimantra') => {
  try {
    // For files that are already on disk (like our generated PDFs)
    if (file.path) {
      // Use upload_stream for better error handling
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `medimantra/${folder}`,
            resource_type: 'auto', // Important: Handle PDFs correctly
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            return resolve({
              url: result.secure_url,
              public_id: result.public_id,
              asset_id: result.asset_id
            });
          }
        );

        // Create read stream and pipe to upload stream
        fs.createReadStream(file.path).pipe(uploadStream);
      });
    } 
    // For buffer-based files (from multer memory storage)
    else if (file.buffer) {
      // Use upload with buffer
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: `medimantra/${folder}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          public_id: file.originalname.split('.')[0]
        }
      );
      
      return {
        url: result.secure_url,
        public_id: result.public_id,
        asset_id: result.asset_id
      };
    }
    
    throw new Error('Invalid file format for upload');
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {String} publicId - The public_id of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (publicId) => {
  try {
    if (!publicId) return false;
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

export default { upload, uploadFile, deleteFile };
