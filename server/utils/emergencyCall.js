import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Langchain OpenAI model
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0.2,
});

// Create a prompt template for emergency message generation
const emergencyPromptTemplate = PromptTemplate.fromTemplate(`
You are an emergency medical dispatcher. Generate a concise emergency message for an ambulance driver.
Include the following information:
- Patient location: {patientLatitude}, {patientLongitude}
- Patient phone: {patientPhone}
- Distance from ambulance: {distance} km

The message should be brief, clear, and actionable. Do not include any unnecessary information.
`);

// Create a chain for generating emergency messages
const emergencyMessageChain = emergencyPromptTemplate
  .pipe(model)
  .pipe(new StringOutputParser());

/**
 * Generate an emergency message using Langchain
 * @param {Object} data - Emergency data
 * @param {number} data.patientLatitude - Patient latitude
 * @param {number} data.patientLongitude - Patient longitude
 * @param {string} data.patientPhone - Patient phone number
 * @param {number} data.distance - Distance from ambulance in km
 * @returns {Promise<string>} - Generated emergency message
 */
export const generateEmergencyMessage = async (data) => {
  try {
    const message = await emergencyMessageChain.invoke(data);
    return message;
  } catch (error) {
    console.error('Error generating emergency message:', error);
    return 'EMERGENCY: Patient needs immediate assistance. Please respond ASAP.';
  }
};

/**
 * Make an emergency call using Twilio
 * @param {string} to - Recipient phone number
 * @param {string} from - Sender phone number
 * @param {string} message - Call message
 * @returns {Promise<Object>} - Twilio call response
 */
export const makeEmergencyCall = async (to, from, message) => {
  try {
    // Format phone numbers to ensure they have the correct format for Twilio
    const formattedTo = formatPhoneNumber(to);
    const formattedFrom = process.env.TWILIO_PHONE_NUMBER || from;

    // Make the call using Twilio
    const call = await twilioClient.calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      to: formattedTo,
      from: formattedFrom
    });

    console.log(`Emergency call initiated to ${to} with SID: ${call.sid}`);
    return call;
  } catch (error) {
    console.error('Error making emergency call:', error);
    throw error;
  }
};

/**
 * Send an emergency SMS using Twilio
 * @param {string} to - Recipient phone number
 * @param {string} from - Sender phone number
 * @param {string} message - SMS message
 * @returns {Promise<Object>} - Twilio SMS response
 */
export const sendEmergencySMS = async (to, from, message) => {
  try {
    // Format phone numbers to ensure they have the correct format for Twilio
    const formattedTo = formatPhoneNumber(to);
    const formattedFrom = process.env.TWILIO_PHONE_NUMBER || from;

    // Send the SMS using Twilio
    const sms = await twilioClient.messages.create({
      body: message,
      to: formattedTo,
      from: formattedFrom
    });

    console.log(`Emergency SMS sent to ${to} with SID: ${sms.sid}`);
    return sms;
  } catch (error) {
    console.error('Error sending emergency SMS:', error);
    throw error;
  }
};

/**
 * Format phone number to ensure it has the correct format for Twilio
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If the number doesn't start with +, add it
  if (!phoneNumber.startsWith('+')) {
    // Assume it's an Indian number if it starts with 0 or doesn't have a country code
    if (digitsOnly.startsWith('0')) {
      return `+91${digitsOnly.substring(1)}`;
    } else if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    } else {
      return `+${digitsOnly}`;
    }
  }

  return phoneNumber;
}

export default {
  generateEmergencyMessage,
  makeEmergencyCall,
  sendEmergencySMS
};
