import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  vehicleType: {
    type: String,
    enum: ['basic', 'advanced', 'patient-transport', 'neonatal', 'air'],
    default: 'basic'
  },
  // Simple latitude and longitude fields
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  // Basic driver information
  driverName: {
    type: String,
    required: true
  },
  driverContact: {
    type: String,
    required: true
  },
  // Simple address field
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

export default Ambulance;
