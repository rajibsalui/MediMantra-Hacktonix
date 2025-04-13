import Ambulance from '../models/ambulance.model.js';

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - First point with lat and lng properties
 * @param {Object} point2 - Second point with lat and lng properties
 * @returns {Number} - Distance in kilometers
 */
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2)); // Return distance in km with 2 decimal places
}

function toRad(value) {
  return value * Math.PI / 180;
}

/**
 * Register a new ambulance with minimal information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerAmbulance = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      vehicleNumber,
      vehicleType,
      latitude,
      longitude,
      driverName,
      driverContact,
      address,
      city
    } = req.body;

    // Validate required fields
    if (!name || !contactNumber || !vehicleNumber || !latitude || !longitude || !driverName || !driverContact) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please provide all required information.'
      });
    }

    // Check if ambulance with this vehicle number already exists
    const existingAmbulance = await Ambulance.findOne({ vehicleNumber });
    if (existingAmbulance) {
      return res.status(400).json({
        success: false,
        message: 'An ambulance with this vehicle number already exists'
      });
    }

    // Create new ambulance with minimal information
    const newAmbulance = new Ambulance({
      name,
      contactNumber,
      vehicleNumber,
      vehicleType: vehicleType || 'basic',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      driverName,
      driverContact,
      address: address || '',
      city: city || '',
      registrationDate: new Date()
    });

    // Save the ambulance to the database
    await newAmbulance.save();

    return res.status(201).json({
      success: true,
      message: 'Ambulance registered successfully',
      data: newAmbulance
    });
  } catch (error) {
    console.error('Error registering ambulance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send emergency call to all nearby ambulances
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendEmergencyCall = async (req, res) => {
  try {
    const { latitude, longitude, patientPhone } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Patient location (latitude and longitude) is required'
      });
    }

    // Get all ambulances
    const allAmbulances = await Ambulance.find({});

    if (allAmbulances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ambulances registered in the system'
      });
    }

    // Calculate distance for each ambulance and filter those within 5km
    const patientLocation = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

    const nearbyAmbulances = allAmbulances
      .map(ambulance => {
        const ambulanceLocation = { lat: ambulance.latitude, lng: ambulance.longitude };
        const distance = calculateDistance(patientLocation, ambulanceLocation);
        return { ...ambulance.toObject(), distance };
      })
      .filter(ambulance => ambulance.distance <= 5) // 5km radius
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 10); // Limit to 10 ambulances

    // For demo purposes, if no ambulances are within 5km, just return all ambulances
    if (nearbyAmbulances.length === 0) {
      const allWithDistance = allAmbulances.map(ambulance => {
        const ambulanceLocation = { lat: ambulance.latitude, lng: ambulance.longitude };
        const distance = calculateDistance(patientLocation, ambulanceLocation);
        return { ...ambulance.toObject(), distance };
      }).sort((a, b) => a.distance - b.distance);

      return res.status(200).json({
        success: true,
        message: 'No ambulances within 5km. Showing all available ambulances.',
        count: allWithDistance.length,
        ambulances: allWithDistance,
        callInitiated: false
      });
    }

    // Generate call links for each ambulance
    const ambulancesWithCallLinks = nearbyAmbulances.map(ambulance => {
      // Create a tel: link that can be used to initiate a call
      const callLink = `tel:${ambulance.driverContact}`;

      // If patient phone is provided, we can indicate that a call is being initiated
      const callStatus = patientPhone ? 'Call initiated' : 'Call link available';

      return {
        ...ambulance,
        callLink,
        callStatus
      };
    });

    // Return the ambulances that would be called
    return res.status(200).json({
      success: true,
      message: 'Emergency call sent to nearby ambulances',
      count: ambulancesWithCallLinks.length,
      ambulances: ambulancesWithCallLinks,
      callInitiated: true
    });
  } catch (error) {
    console.error('Error sending emergency call:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all registered ambulances
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({});

    return res.status(200).json({
      success: true,
      count: ambulances.length,
      data: ambulances
    });
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export default {
  registerAmbulance,
  sendEmergencyCall,
  getAllAmbulances
};
