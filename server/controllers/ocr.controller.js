import mongoose from 'mongoose';
import { processPrescriptionOCR } from '../utils/ocrProcessor.js';
import { uploadFile } from '../utils/fileUpload.js';

/**
 * @desc    Process prescription using OCR and save to medical records
 * @route   POST /api/patients/medical-records/process-prescription
 * @access  Private (Patient only)
 */
export const processPrescription = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(` hereeeeeeeeeeeeeeee ${req.file}`);
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file found in request:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Please upload a prescription document'
      });
    }

    console.log('Processing file:', req.file.originalname, 'Size:', req.file.size, 'Type:', req.file.mimetype);

    // Get patient
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findOne({ user: userId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Process the prescription using OCR with OpenAI
    let extractedData;
    try {
      extractedData = await processPrescriptionOCR(req.file);
      console.log('OCR processing successful with OpenAI:', extractedData);
    } catch (ocrError) {
      console.error('OpenAI OCR processing failed:', ocrError);

      // Fallback to basic data
      extractedData = {
        doctorName: "null",
        patientName: patient.firstName + " " + patient.lastName,
        date: new Date().toISOString().split('T')[0],
        medications: [
          {
            name: "null",
            dosage: "null",
            frequency: "null",
            duration: "null",
          }
        ],
        diagnosis: "null",
        instructions: "null",
        followUp: "null"
      };
    }

    // Upload document to Cloudinary or local storage
    let uploadedFile;
    try {
      uploadedFile = await uploadFile(req.file, 'patients/prescriptions');
      console.log('File uploaded successfully:', uploadedFile);
    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);

      // Create a fallback URL for development
      const fileName = req.file.filename || `${Date.now()}-${req.file.originalname}`;
      const fallbackUrl = `http://localhost:5000/uploads/prescriptions/${fileName}`;

      uploadedFile = {
        url: fallbackUrl,
        public_id: fileName
      };
    }

    console.log('Uploaded file details:');
    // Create medical document 
    const validDocumentDate = extractedData.date && !isNaN(new Date(extractedData.date).valueOf())
  ? new Date(extractedData.date)
  : new Date();


    const MedicalDocument = mongoose.model('MedicalDocument');
    const medicalDocument = new MedicalDocument({
      patient: patient._id,
      title: `Prescription from ${extractedData.doctorName || 'Unknown Doctor'}`,
      category: 'prescription',
      description: extractedData.diagnosis ? `Diagnosis: ${extractedData.diagnosis}` : '',
      documentDate: validDocumentDate,
      fileUrl: uploadedFile.url,
      fileId: uploadedFile.public_id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      uploadDate: new Date()
    });
    console.log('Medical document created:', medicalDocument);
    // Save medical document
    await medicalDocument.save();
    console.log('Medical document saved successfully:', medicalDocument);
    // Create prescription record if medications are found
    if (extractedData.medications && extractedData.medications.length > 0) {
      try {
        const Prescription = mongoose.model('Prescription');

        // Find a doctor to associate with the prescription
        const Doctor = mongoose.model('Doctor');
        const defaultDoctor = await Doctor.findOne({});

        if (!defaultDoctor) {
          console.warn('No doctor found in the system to associate with the prescription');
          throw new Error('No doctor found to associate with the prescription');
        }

        // Create a new prescription
        const prescription = new Prescription({
          doctor: extractedData.doctorName || "null", // Set the doctor field which is required
          patient: patient._id,
          medications: extractedData.medications.map(med => ({
            name: med.name || 'Unknown Medication',
            dosage: med.dosage || 'Unknown dosage', // Provide a default dosage
            frequency: med.frequency || 'Unknown frequency', // Provide a default frequency
            duration: med.duration || 'Unknown duration', // Provide a default duration
            instructions: med.instructions || 'No instructions provided', // Provide a default instruction
          })),
          diagnosis: extractedData.diagnosis || '',
          notes: extractedData.instructions || '',
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month
          fileUrl: uploadedFile.url,
          fileId: uploadedFile.public_id,
          status: 'active'
        });
        console.log('Prescription created:', prescription);

        await prescription.save();
        console.log('Prescription saved successfully:', prescription);
      } catch (prescriptionError) {
        console.error('Error creating prescription record:', prescriptionError);
        // Log detailed error information for debugging
        if (prescriptionError.name === 'ValidationError') {
          console.error('Validation errors:', prescriptionError.errors);

          // Check for specific validation errors
          if (prescriptionError.errors.doctor) {
            console.error('Doctor validation error:', prescriptionError.errors.doctor.message);
          }

          // Check for medication frequency errors
          Object.keys(prescriptionError.errors).forEach(key => {
            if (key.includes('medications') && key.includes('frequency')) {
              console.error(`Medication frequency error at ${key}:`, prescriptionError.errors[key].message);
            }
          });
        }

        // Continue even if prescription creation fails
      }
    }

    res.status(201).json({
      success: true,
      data: {
        medicalDocument,
        extractedData
      },
      message: 'Prescription processed and saved successfully using OpenAI'
    });
  } catch (error) {
    console.error('Error processing prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing prescription',
      error: error.message
    });
  }
};

export default { processPrescription };
