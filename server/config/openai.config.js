import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import OpenAI from "openai";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env file from various possible locations
const envPaths = [
  resolve(__dirname, '../../../.env'),  // server root
  resolve(__dirname, '../../../../.env'), // project root
  resolve(__dirname, '../.env'),  // src folder
  resolve(__dirname, '../../.env')  // server/src folder
];

let envLoaded = false;
for (const path of envPaths) {
  if (fs.existsSync(path)) {
    console.log(`Loading .env from ${path}`);
    dotenv.config({ path });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn("No .env file found in expected locations. Make sure to provide API keys directly.");
}

// Check if API key exists in environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OpenAI API key is missing! Check your .env file or set it directly in the code.");
  console.error("Create a .env file in the project root with: OPENAI_API_KEY=your_key_here");
}

// Initialize OpenAI client
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Default configuration
const openAIConfig = {
  client: openai,
  models: {
    default: "gpt-4o",
    text: "gpt-4-turbo"
  },
  defaultParams: {
    temperature: 0.2,
    max_tokens: 1024
  }
};

export default openAIConfig; 