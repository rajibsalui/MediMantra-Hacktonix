import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import openAIConfig from '../config/openai.config.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process a PDF file using OpenAI Vision for OCR
 * @param {Object} file - The file object from multer
 * @returns {Promise<Object>} - Extracted data from the prescription
 */
export const processPrescriptionOCR = async (file) => {
  try {
    if (!openAIConfig.client) {
      throw new Error('OpenAI client is not configured');
    }

    // Read the file buffer
    let fileBuffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('Invalid file object');
    }

    // Extract text from PDF if it's a PDF file
    let textContent = '';
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer);
      textContent = pdfData.text;
    }

    // Convert the file to base64 for the vision model
    const base64Image = fileBuffer.toString('base64');
    
    // Prepare the prompt
    const prompt = `
    You are a medical assistant tasked with extracting information from a prescription or medical document.
    Extract the following information in JSON format:
    {
      "doctorName": "Name of the doctor",
      "patientName": "Name of the patient",
      "date": "Date of prescription",
      "medications": [
        {
          "name": "Medication name",
          "dosage": "Dosage information",
          "frequency": "How often to take",
          "duration": "How long to take"
        }
      ],
      "diagnosis": "Any diagnosis mentioned",
      "instructions": "Any special instructions",
      "followUp": "Any follow-up information"
    }
    
    If any field is not found, use null for that field. Ensure the JSON is properly formatted.
    `;

    // Generate content with the image using OpenAI's vision model
    const response = await openAIConfig.client.chat.completions.create({
      model: openAIConfig.models.default,
      messages: [
        { 
          role: "system", 
          content: "You are a medical document processing assistant." 
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: {
                url: `data:${file.mimetype};base64,${base64Image}`,
                detail: "high"
              }
            },
            textContent ? { 
              type: "text", 
              text: `Additional text extracted from the document: ${textContent}` 
            } : null
          ].filter(Boolean)
        }
      ],
      max_tokens: openAIConfig.defaultParams.max_tokens,
      temperature: openAIConfig.defaultParams.temperature,
    });

    console.log('Response from OpenAI:', response);
    const responseText = response.choices[0].message.content;
    console.log('Response text:', responseText);
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from the response');
    }
    
    // Parse the JSON
    const extractedData = JSON.parse(jsonMatch[0]);
    
    return extractedData;
  } catch (error) {
    console.error('Error processing prescription OCR:', error);
    throw error;
  }
};

export default { processPrescriptionOCR };
