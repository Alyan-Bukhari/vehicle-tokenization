const express = require('express');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('../models/user');
const Inspection = require('../models/inspection');
const VehicleDatabase = require('../models/vehicleDatabase');

// 📌 Create Admin (Temporary endpoint for setup)
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin account already exists' });
    }

    // Create new admin
    const admin = new Admin({
      email,
      password
    });

    await admin.save();
    res.json({ message: 'Admin account created successfully', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, adminId: admin._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Admin Profile
router.get('/profile', adminAuth, async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({ message: 'Admin profile endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Update Admin Profile
router.put('/profile', adminAuth, async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({ message: 'Admin profile update endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Get Admin Dashboard Stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({
      message: 'Admin dashboard stats endpoint',
      stats: {
        totalInspections: 0,
        pendingInspections: 0,
        approvedInspections: 0,
        rejectedInspections: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Bulk Import Vehicles from CSV
router.post('/bulk-import', adminAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file provided'
      });
    }

    const csvFile = req.files.csvFile;
    const results = [];
    const errors = [];
    let successCount = 0;
    let failureCount = 0;

    // Read CSV file - handle express-fileupload format
    let csvData;
    if (csvFile.tempFilePath) {
      // Handle express-fileupload temporary file
      csvData = fs.readFileSync(csvFile.tempFilePath, 'utf8');
    } else if (csvFile.buffer) {
      // Handle Buffer format (multer with memory storage)
      csvData = csvFile.buffer.toString('utf8');
    } else if (csvFile.data) {
      // Handle data property if it exists
      csvData = csvFile.data.toString('utf8');
    } else {
      // Fallback: try to read as string
      csvData = csvFile.toString();
    }

    // Remove BOM if present (common in UTF-8 files)
    csvData = csvData.replace(/^\uFEFF/, '');

    const parsedRows = [];
    let headers = [];
    await new Promise((resolve,reject) => {
      require('stream').Readable.from([csvData]).pipe(csv({mapHeaders:({header})=>header.trim(),mapValues:({value})=>value.trim(),strict:true}))
        .on('headers',value=>{headers=value;})
        .on('data',row=>parsedRows.push(row))
        .on('end',resolve).on('error',reject);
    });
    if (!parsedRows.length) return res.status(400).json({success:false,message:'CSV must include headers and at least one data row.'});
    if (parsedRows.length>1000) return res.status(400).json({success:false,message:'Import at most 1,000 vehicles per file.'});

    // Validate required headers
    const requiredHeaders = [
      'fullName', 'cnic', 'email', 'walletAddress',
      'engineNumber', 'chassisNumber', 'make', 'model',
      'variant', 'year', 'engineCapacity', 'fuelType',
      'transmission', 'color', 'bodyType', 'seatingCapacity',
      'registrationNumber'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required CSV headers: ${missingHeaders.join(', ')}`
      });
    }

    // Parse quoted CSV fields correctly, including names containing commas.
    for (let i = 0; i < parsedRows.length; i++) {
      try {
        const rowData = parsedRows[i];
        // Validate row data
        const validation = validateRowData(rowData, i + 2);
        if (!validation.valid) {
          errors.push({
            row: i + 2,
            message: validation.message
          });
          failureCount++;
          continue;
        }

        // Process the row
        const result = await processVehicleRow(rowData);
        if (result.success) {
          successCount++;
        } else {
          errors.push({
            row: i + 2,
            message: result.message
          });
          failureCount++;
        }

      } catch (error) {
        errors.push({
          row: i + 2,
          message: `Processing error: ${error.message}`
        });
        failureCount++;
      }
    }

    // Clean up temporary file if it exists
    if (csvFile.tempFilePath) {
      try {
        fs.unlinkSync(csvFile.tempFilePath);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary file:', cleanupError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk import completed',
      totalProcessed: successCount + failureCount,
      successCount,
      failureCount,
      errors: errors.slice(0, 10) // Limit errors to prevent response being too large
    });

  } catch (error) {
    // Clean up temporary file on error too
    if (csvFile && csvFile.tempFilePath) {
      try {
        fs.unlinkSync(csvFile.tempFilePath);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary file on error:', cleanupError.message);
      }
    }
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk import',
      error: error.message
    });
  }
});

// Helper function to validate row data
function validateRowData(rowData, rowNumber) {
  // Check required fields
  const requiredFields = [
    'fullName', 'cnic', 'email', 'walletAddress',
    'engineNumber', 'chassisNumber', 'make', 'model',
    'year', 'engineCapacity', 'fuelType', 'color', 'bodyType'
  ];

  for (const field of requiredFields) {
    if (!rowData[field] || rowData[field].trim() === '') {
      return {
        valid: false,
        message: `Missing required field: ${field}`
      };
    }
  }

  // Validate CNIC format
  if (!/^\d{5}-\d{7}-\d$/.test(rowData.cnic)) {
    return {
      valid: false,
      message: 'Invalid CNIC format. Must be 12345-6789012-3'
    };
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email)) {
    return {
      valid: false,
      message: 'Invalid email format'
    };
  }
  // Validate phone number (if provided)
  if (rowData.phoneNumber && rowData.phoneNumber.trim()) {
    if (!/^(\+92|0)?[0-9]{10}$/.test(rowData.phoneNumber.trim())) {
      return {
        valid: false,
        message: `Invalid phone number format. Must be Pakistani format like +923001234567 or 03001234567. Got: ${rowData.phoneNumber}`
      };
    }
  } else {
    // Set default phone number if empty
    rowData.phoneNumber = '+920000000000';
  }

  // Validate wallet address (exact 42 characters for Ethereum addresses)
  const cleanWalletAddress = rowData.walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanWalletAddress)) {
    return {
      valid: false,
      message: `Invalid wallet address format. Must be exactly 42 characters (0x + 40 hex chars). Got: "${cleanWalletAddress}" (length: ${cleanWalletAddress.length})`
    };
  }

  // Validate year
  const year = parseInt(rowData.year);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return {
      valid: false,
      message: 'Invalid year'
    };
  }

  // Validate engine capacity
  const engineCapacity = parseInt(rowData.engineCapacity);
  if (isNaN(engineCapacity) || engineCapacity <= 0) {
    return {
      valid: false,
      message: 'Invalid engine capacity'
    };
  }

  return { valid: true };
}

// Helper function to process a single vehicle row
async function processVehicleRow(rowData) {
  try {
    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { cnic: rowData.cnic },
        { walletAddress: rowData.walletAddress }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        cnic: rowData.cnic,
        fullName: rowData.fullName,
        email: rowData.email,
        walletAddress: rowData.walletAddress,
        password: require('crypto').randomBytes(32).toString('hex'), // Imported records cannot share a default password.
        phoneNumber: rowData.phoneNumber, // Use validated phone number
        fatherName: rowData.fatherName || 'Not provided',
        isVerified: true, // Auto-verify for bulk import
        verificationMethod: 'Manual', // Use valid enum value from User model
        verifiedAt: new Date()
      });

      await user.save();
    }

    // Check if vehicle already exists
    const existingVehicle = await Inspection.findOne({
      $or: [
        { 'vehicleDetails.engineNumber': rowData.engineNumber },
        { 'vehicleDetails.chassisNumber': rowData.chassisNumber }
      ]
    });

    if (existingVehicle) {
      return {
        success: false,
        message: `Vehicle with engine number ${rowData.engineNumber} or chassis number ${rowData.chassisNumber} already exists`
      };
    }

    // Generate unique inspection ID
    const inspectionId = `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create inspection record (skip appointment process for bulk import)
    const inspection = new Inspection({
      inspectionId,
      userId: user._id,
      vehicleDetails: {
        engineNumber: rowData.engineNumber,
        chassisNumber: rowData.chassisNumber,
        make: rowData.make,
        model: rowData.model,
        variant: rowData.variant,
        manufacturingYear: parseInt(rowData.year),
        registrationYear: parseInt(rowData.year),
        vehicleType: mapBodyTypeToVehicleType(rowData.bodyType),
        fuelType: rowData.fuelType,
        engineCapacity: parseInt(rowData.engineCapacity),
        color: rowData.color
      },
      status: 'Approved', // Auto-approve for bulk import
      registrationNumber: rowData.registrationNumber,
      inspectionNotes: 'Bulk imported vehicle',
      isPaid: false, // Imported records still require registration on chain.
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await inspection.save();

    // The owner completes on-chain registration through the payment page.

    return {
      success: true,
      message: `Vehicle ${rowData.make} ${rowData.model} imported successfully`,
      inspectionId: inspection.inspectionId
    };

  } catch (error) {
    return {
      success: false,
      message: `Database error: ${error.message}`
    };
  }
}

// Helper function to map body type to vehicle type
function mapBodyTypeToVehicleType(bodyType) {
  const mapping = {
    'Sedan': 'Car',
    'Hatchback': 'Car',
    'SUV': 'SUV',
    'Motorcycle': 'Motorcycle',
    'Truck': 'Truck',
    'Bus': 'Bus',
    'Van': 'Van',
    'Pickup': 'Truck',
    'Other': 'Other'
  };

  return mapping[bodyType] || 'Other';
}

module.exports = router;
