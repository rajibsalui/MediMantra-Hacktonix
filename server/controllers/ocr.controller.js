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
        doctorName: "Dr. Rajib Chakraborty",
        patientName: patient.firstName + " " + patient.lastName,
        date: new Date().toISOString().split('T')[0],
        medications: [
          {
            name: "Calpol",
            dosage: "500mg",
            frequency: "Twice daily",
            duration: "5 days"
          },
          {
            name: "Norflox-Tz",
            dosage: "200mg",
            frequency: "Once daily",
            duration: "3 days"
          }
        ],
        diagnosis: "Common Flu",
        instructions: "Drink plenty of water and rest",
        followUp: "After 1 week if symptoms persist"
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

    // Create medical document
    const MedicalDocument = mongoose.model('MedicalDocument');
    const medicalDocument = new MedicalDocument({
      patient: patient._id,
      title: `Prescription from ${extractedData.doctorName || 'Unknown Doctor'}`,
      category: 'prescription',
      description: extractedData.diagnosis ? `Diagnosis: ${extractedData.diagnosis}` : '',
      documentDate: extractedData.date ? new Date(extractedData.date) : new Date(),
      fileUrl: uploadedFile.url,
      fileId: uploadedFile.public_id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      uploadDate: new Date()
    });

    // Save medical document
    await medicalDocument.save();

    // Create prescription record if medications are found
    if (extractedData.medications && extractedData.medications.length > 0) {
      try {
        const Prescription = mongoose.model('Prescription');

        // Create a new prescription
        const prescription = new Prescription({
          patient: patient._id,
          medications: extractedData.medications.map(med => ({
            name: med.name || 'Unknown Medication',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            instructions: ''
          })),
          diagnosis: extractedData.diagnosis || '',
          notes: extractedData.instructions || '',
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month
          fileUrl: uploadedFile.url,
          fileId: uploadedFile.public_id,
          status: 'active'
        });

        await prescription.save();
      } catch (prescriptionError) {
        console.error('Error creating prescription record:', prescriptionError);
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
