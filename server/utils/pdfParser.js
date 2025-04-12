import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom PDF parser that safely uses pdf-parse library
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted text from the PDF
 */
export const parsePDF = async (pdfBuffer) => {
  try {
    // Only import pdf-parse when needed to avoid test file loading
    const pdfParse = await import('pdf-parse').then(module => module.default);
    
    // Parse the PDF buffer
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return ''; // Return empty string on error
  }
};

export default { parsePDF };
