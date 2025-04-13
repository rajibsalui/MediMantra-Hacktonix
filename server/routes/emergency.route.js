import express from 'express';
import { sendEmergencyCall, registerAmbulance, getAllAmbulances } from '../controllers/emergency.controller.js';

const router = express.Router();

/**
 * @route   POST /api/emergency/call
 * @desc    Send emergency call to all nearby ambulances
 * @access  Public (for emergency situations)
 */
router.post('/call', sendEmergencyCall);

/**
 * @route   POST /api/emergency/ambulances/register
 * @desc    Register a new ambulance with minimal information
 * @access  Public
 */
router.post('/ambulances/register', registerAmbulance);

/**
 * @route   GET /api/emergency/ambulances
 * @desc    Get all registered ambulances
 * @access  Public
 */
router.get('/ambulances', getAllAmbulances);

export default router;
