import express from 'express';
import { generateEmergencyMessage, sendEmergencySMS } from '../utils/emergencyCall.js';

const router = express.Router();

/**
 * @route   GET /api/test/emergency-message
 * @desc    Test emergency message generation
 * @access  Public (for testing only)
 */
router.get('/emergency-message', async (req, res) => {
  try {
    const message = await generateEmergencyMessage({
      patientLatitude: 28.6139,
      patientLongitude: 77.2090,
      patientPhone: '+919876543210',
      distance: 2.5
    });

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error testing emergency message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/test/emergency-sms
 * @desc    Test emergency SMS
 * @access  Public (for testing only)
 */
router.post('/emergency-sms', async (req, res) => {
  try {
    const { to, from, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'To phone number and message are required'
      });
    }

    const sms = await sendEmergencySMS(
      to,
      from || process.env.TWILIO_PHONE_NUMBER,
      message
    );

    res.status(200).json({
      success: true,
      sid: sms.sid,
      status: sms.status
    });
  } catch (error) {
    console.error('Error testing emergency SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
