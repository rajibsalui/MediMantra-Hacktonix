import { testCloudinaryConnection, checkCloudinaryConfig } from '../utils/checkCloudinaryConfig.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function
const main = async () => {
  console.log('Checking Cloudinary configuration...');
  
  // Check configuration
  const configStatus = checkCloudinaryConfig();
  console.log('Configuration status:', configStatus);
  
  if (!configStatus.isConfigured) {
    console.error('❌ Cloudinary is not properly configured. Please check your environment variables.');
    process.exit(1);
  }
  
  console.log('Testing Cloudinary connection...');
  
  // Test connection
  const testResult = await testCloudinaryConnection();
  
  if (testResult.success) {
    console.log('✅ Cloudinary connection successful!');
    console.log('Test image uploaded to:', testResult.result.url);
  } else {
    console.error('❌ Cloudinary connection failed:', testResult.message);
    console.error('Error details:', testResult.error);
  }
};

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
