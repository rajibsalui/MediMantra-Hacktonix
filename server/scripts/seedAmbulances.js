import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ambulance from '../models/ambulance.model.js';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log(chalk.green('✓ Connected to MongoDB')))
  .catch(err => {
    console.error(chalk.red('✗ MongoDB connection error:'), err);
    process.exit(1);
  });

// Sample ambulance data with locations around a central point
// You would replace these coordinates with actual locations in your area
const seedAmbulances = async () => {
  try {
    // Ensure the 2dsphere index is created
    console.log(chalk.blue('Creating 2dsphere index for geospatial queries...'));
    await Ambulance.collection.createIndex({ "location": "2dsphere" });
    console.log(chalk.green('✓ 2dsphere index created successfully'));

    // Delete existing ambulances
    await Ambulance.deleteMany({});
    console.log(chalk.yellow('✓ Cleared existing ambulance data'));

    // Central coordinates (example: Delhi, India)
    // You should replace these with coordinates relevant to your application
    const centralLat = 28.6139;
    const centralLng = 77.2090;

    // Create ambulances at varying distances from the central point
    const ambulances = [
      {
        name: 'City Emergency Services',
        contactNumber: '8240980946',
        vehicleNumber: 'DL01AB1234',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng + 0.01, centralLat + 0.01] // ~1.5km away
        },
        latitude: centralLat + 0.01,
        longitude: centralLng + 0.01,
        address: {
          street: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        driver: {
          name: 'Rajesh Kumar',
          contactNumber: '9876543211',
          licenseNumber: 'DL-1234567890123'
        },
        emergencyEquipment: ['Defibrillator', 'Oxygen', 'First Aid Kit']
      },
      {
        name: 'Rapid Response Ambulance',
        contactNumber: '9876543212',
        vehicleNumber: 'DL02CD5678',
        vehicleType: 'basic',
        location: {
          type: 'Point',
          coordinates: [centralLng - 0.02, centralLat - 0.01] // ~2.5km away
        },
        latitude: centralLat - 0.01,
        longitude: centralLng - 0.02,
        address: {
          street: '456 Park Avenue',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110002',
          country: 'India'
        },
        driver: {
          name: 'Sunil Verma',
          contactNumber: '9876543213',
          licenseNumber: 'DL-0987654321098'
        },
        emergencyEquipment: ['First Aid Kit', 'Stretcher']
      },
      {
        name: 'Life Saver Ambulance',
        contactNumber: '9876543214',
        vehicleNumber: 'DL03EF9012',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng + 0.03, centralLat - 0.02] // ~3.8km away
        },
        latitude: centralLat - 0.02,
        longitude: centralLng + 0.03,
        address: {
          street: '789 Hospital Road',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110003',
          country: 'India'
        },
        driver: {
          name: 'Amit Singh',
          contactNumber: '9876543215',
          licenseNumber: 'DL-5678901234567'
        },
        emergencyEquipment: ['Defibrillator', 'Oxygen', 'Ventilator', 'First Aid Kit']
      },
      {
        name: 'Quick Medical Response',
        contactNumber: '9876543216',
        vehicleNumber: 'DL04GH3456',
        vehicleType: 'patient-transport',
        location: {
          type: 'Point',
          coordinates: [centralLng - 0.03, centralLat + 0.03] // ~4.2km away
        },
        latitude: centralLat + 0.03,
        longitude: centralLng - 0.03,
        address: {
          street: '101 Medical Center',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110004',
          country: 'India'
        },
        driver: {
          name: 'Priya Sharma',
          contactNumber: '9876543217',
          licenseNumber: 'DL-2345678901234'
        },
        emergencyEquipment: ['Wheelchair', 'Stretcher', 'First Aid Kit']
      },
      {
        name: 'Hospital Ambulance Service',
        contactNumber: '9876543218',
        vehicleNumber: 'DL05IJ7890',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng + 0.04, centralLat + 0.04] // ~5.7km away
        },
        latitude: centralLat + 0.04,
        longitude: centralLng + 0.04,
        address: {
          street: '202 Health Avenue',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110005',
          country: 'India'
        },
        driver: {
          name: 'Vikram Patel',
          contactNumber: '9876543219',
          licenseNumber: 'DL-3456789012345'
        },
        emergencyEquipment: ['Defibrillator', 'Oxygen', 'ECG Monitor', 'First Aid Kit']
      },
      {
        name: 'Emergency Medical Transport',
        contactNumber: '9876543220',
        vehicleNumber: 'DL06KL1234',
        vehicleType: 'basic',
        location: {
          type: 'Point',
          coordinates: [centralLng - 0.01, centralLat - 0.04] // ~4.3km away
        },
        latitude: centralLat - 0.04,
        longitude: centralLng - 0.01,
        address: {
          street: '303 Emergency Lane',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110006',
          country: 'India'
        },
        driver: {
          name: 'Rahul Gupta',
          contactNumber: '9876543221',
          licenseNumber: 'DL-4567890123456'
        },
        emergencyEquipment: ['First Aid Kit', 'Stretcher', 'Oxygen']
      },
      {
        name: 'Critical Care Ambulance',
        contactNumber: '9876543222',
        vehicleNumber: 'DL07MN5678',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng + 0.02, centralLat - 0.03] // ~3.6km away
        },
        latitude: centralLat - 0.03,
        longitude: centralLng + 0.02,
        address: {
          street: '404 Critical Care Road',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110007',
          country: 'India'
        },
        driver: {
          name: 'Neha Kapoor',
          contactNumber: '9876543223',
          licenseNumber: 'DL-5678901234567'
        },
        emergencyEquipment: ['Defibrillator', 'Ventilator', 'ECG Monitor', 'Oxygen', 'First Aid Kit']
      },
      {
        name: 'Trauma Response Unit',
        contactNumber: '9876543224',
        vehicleNumber: 'DL08OP9012',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng - 0.02, centralLat + 0.02] // ~2.8km away
        },
        latitude: centralLat + 0.02,
        longitude: centralLng - 0.02,
        address: {
          street: '505 Trauma Center',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110008',
          country: 'India'
        },
        driver: {
          name: 'Sanjay Mehta',
          contactNumber: '9876543225',
          licenseNumber: 'DL-6789012345678'
        },
        emergencyEquipment: ['Trauma Kit', 'Defibrillator', 'Oxygen', 'First Aid Kit']
      },
      {
        name: 'Cardiac Care Ambulance',
        contactNumber: '9876543226',
        vehicleNumber: 'DL09QR3456',
        vehicleType: 'advanced',
        location: {
          type: 'Point',
          coordinates: [centralLng + 0.01, centralLat - 0.01] // ~1.4km away
        },
        latitude: centralLat - 0.01,
        longitude: centralLng + 0.01,
        address: {
          street: '606 Heart Center',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110009',
          country: 'India'
        },
        driver: {
          name: 'Anita Joshi',
          contactNumber: '9876543227',
          licenseNumber: 'DL-7890123456789'
        },
        emergencyEquipment: ['Defibrillator', 'ECG Monitor', 'Oxygen', 'First Aid Kit']
      },
      {
        name: 'Pediatric Emergency Transport',
        contactNumber: '9876543228',
        vehicleNumber: 'DL10ST7890',
        vehicleType: 'neonatal',
        location: {
          type: 'Point',
          coordinates: [centralLng - 0.01, centralLat + 0.01] // ~1.4km away
        },
        latitude: centralLat + 0.01,
        longitude: centralLng - 0.01,
        address: {
          street: '707 Children\'s Hospital',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110010',
          country: 'India'
        },
        driver: {
          name: 'Deepak Malhotra',
          contactNumber: '9876543229',
          licenseNumber: 'DL-8901234567890'
        },
        emergencyEquipment: ['Neonatal Incubator', 'Pediatric Equipment', 'Oxygen', 'First Aid Kit']
      }
    ];

    // Insert ambulances into the database
    await Ambulance.insertMany(ambulances);
    console.log(chalk.green(`✓ Successfully seeded ${ambulances.length} ambulances`));

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log(chalk.green('✓ Disconnected from MongoDB'));

    console.log(chalk.blue.bold('✓ Ambulance seeding completed successfully!'));
  } catch (error) {
    console.error(chalk.red('✗ Error seeding ambulances:'), error);
    process.exit(1);
  }
};

// Run the seed function
seedAmbulances();
