const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

async function cleanNextCache() {
  console.log('Cleaning Next.js cache...');
  
  const nextCacheDir = path.join(__dirname, '.next');
  
  try {
    if (fs.existsSync(nextCacheDir)) {
      await rimraf(nextCacheDir);
      console.log('Successfully removed .next directory');
    } else {
      console.log('.next directory does not exist, nothing to clean');
    }
  } catch (err) {
    console.error('Error cleaning Next.js cache:', err);
  }
}

cleanNextCache();
