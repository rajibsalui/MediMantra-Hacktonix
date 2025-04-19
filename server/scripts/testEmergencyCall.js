import dotenv from 'dotenv';
import { generateEmergencyMessage, makeEmergencyCall, sendEmergencySMS } from '../utils/emergencyCall.js';

// Load environment variables
dotenv.config();

// Test function
async function testEmergencyCall() {
  try {
    console.log('Testing emergency call functionality...');
    
    // Test message generation
    console.log('\n1. Testing emergency message generation:');
    const message = await generateEmergencyMessage({
      patientLatitude: 28.6139,
      patientLongitude: 77.2090,
      patientPhone: '+919876543210',
      distance: 2.5
    });
    console.log('Generated message:', message);
    
    // Test SMS sending (uncomment to test with real numbers)
    /*
    console.log('\n2. Testing emergency SMS:');
    const testPhone = '+919876543210'; // Replace with a real test phone number
    const sms = await sendEmergencySMS(
      testPhone,
      process.env.TWILIO_PHONE_NUMBER,
      message
    );
    console.log('SMS sent:', sms.sid);
    
    // Test call (uncomment to test with real numbers)
    console.log('\n3. Testing emergency call:');
    const call = await makeEmergencyCall(
      testPhone,
      process.env.TWILIO_PHONE_NUMBER,
      message
    );
    console.log('Call initiated:', call.sid);
    */
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testEmergencyCall();
