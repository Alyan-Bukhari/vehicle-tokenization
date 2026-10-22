const express = require('express');
const Inspection = require('../models/inspection');
const router = express.Router();
const User = require('../models/user');
const { requireSession, adminAuth, authenticateUser } = require('../middleware/auth');
const { verifyPayment } = require('../services/blockchain');
router.use(requireSession);
router.param('inspectionId', async (req,res,next,id) => {
 try {
 const inspection = await Inspection.findOne({inspectionId:id});
 if(!inspection) return res.status(404).json({success:false,message:'Inspection not found'});
 if(req.role !== 'admin' && String(inspection.userId)!==String(req.user._id)) return res.status(403).json({success:false,message:'This vehicle belongs to another account.'});
 req.inspection=inspection; next();
 } catch(error){next(error);}
});

// 📌 Get All Inspections (with user data populated)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const inspections = await Inspection.find(filter)
      .populate('userId', 'fullName email cnic walletAddress')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: inspections,
      count: inspections.length
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch inspections',
      error: error.message
    });
  }
});

// 📌 Check Registration Number Availability (specific route first)
router.get('/check-registration/:registrationNumber', async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    const existingInspection = await Inspection.findOne({
      registrationNumber: registrationNumber
    });

    res.status(200).json({
      success: true,
      exists: !!existingInspection,
      message: existingInspection ? 'Registration number already exists' : 'Registration number available'
    });
  } catch (error) {
    console.error('Error checking registration number:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to check registration number',
      error: error.message
    });
  }
});

// 📌 Get Inspections by Wallet Address (specific route first)
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (req.role !== 'admin' && address.toLowerCase() !== req.user.walletAddress.toLowerCase()) return res.status(403).json({success:false,message:'Access denied'});
    const user = await User.findOne({ walletAddress: new RegExp('^' + address.replace(/[^a-zA-Z0-9]/g, '') + '$','i') });
    const inspections = await Inspection.find({ userId: user?._id || null }).populate('userId', 'fullName email cnic walletAddress');

    res.status(200).json({
      success: true,
      data: inspections,
      count: inspections.length
    });
  } catch (error) {
    console.error('Error fetching inspections by wallet:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch inspections by wallet address',
      error: error.message
    });
  }
});

// 📌 Update Inspection Status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, registrationNumber, vehicleImage, vehicleImageUrl } = req.body;
    const notes = req.body.notes ?? req.body.inspectionNotes;
    const inspectedBy = req.adminId;
    if (!['Pending','Approved','Rejected'].includes(status)) return res.status(400).json({success:false,message:'Invalid inspection status'});
    if (status === 'Approved' && !registrationNumber?.trim()) return res.status(400).json({success:false,message:'Registration number is required for approval'});
    if (registrationNumber && await Inspection.exists({registrationNumber,_id:{$ne:id}})) return res.status(409).json({success:false,message:'Registration number is already in use'});

    console.log('Updating inspection status for ID:', id);
    console.log('Request body:', { status, notes, registrationNumber, vehicleImage, inspectedBy });

    const updateData = { status };
    if (notes !== undefined) updateData.inspectionNotes = notes;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (vehicleImage !== undefined) updateData.vehicleImage = vehicleImage;
    if (vehicleImageUrl !== undefined) updateData.vehicleImageUrl = vehicleImageUrl;
    if (inspectedBy !== undefined) updateData.inspectedBy = inspectedBy;
    updateData.inspectionDate = new Date();

    const updatedInspection = await Inspection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators:true }
    ).populate('userId', 'fullName email cnic walletAddress');

    if (!updatedInspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inspection status updated successfully',
      data: updatedInspection
    });
  } catch (error) {
    console.error('Error updating inspection status:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to update inspection status',
      error: error.message
    });
  }
});

// 📌 Update Payment Status
router.post('/:inspectionId/payment', authenticateUser, async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { isPaid, transactionHash, walletAddress, registrationNumber, blockchainConfirmed } = req.body;

    console.log('=== PAYMENT STATUS UPDATE ===');
    console.log('Inspection ID:', inspectionId);
    console.log('Payment data:', { isPaid, transactionHash, walletAddress, registrationNumber, blockchainConfirmed });

    const inspection = await Inspection.findOne({ inspectionId });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    if (inspection.status !== 'Approved') return res.status(400).json({success:false,message:'Vehicle inspection must be approved before payment.'});
    await verifyPayment(transactionHash, inspection, req.user.walletAddress, 'registration');
    // Update payment fields
    inspection.isPaid = true;
    inspection.transactionHash = transactionHash;
    inspection.paymentDate = new Date();
    inspection.payerWallet = req.user.walletAddress;
    inspection.updatedAt = new Date();

    // Update registration number if provided
    // The approved registration number is authoritative; payment cannot change it.

    await inspection.save();

    console.log('Payment status updated successfully for:', inspectionId);
    console.log('Updated inspection isPaid:', inspection.isPaid);
    console.log('Updated inspection transactionHash:', inspection.transactionHash);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        inspectionId: inspection.inspectionId,
        isPaid: inspection.isPaid,
        transactionHash: inspection.transactionHash,
        paymentDate: inspection.paymentDate,
        registrationNumber: inspection.registrationNumber
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
});

// 📌 Get Payment Status
router.get('/:inspectionId/payment-status', async (req, res) => {
  try {
    const { inspectionId } = req.params;

    const inspection = await Inspection.findOne({ inspectionId });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    res.status(200).json({
      success: true,
      isPaid: inspection.isPaid || false,
      transactionHash: inspection.transactionHash || '',
      paymentDate: inspection.paymentDate,
      registrationNumber: inspection.registrationNumber
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
});

// 📌 Get Inspection by ID (generic route last)
router.get('/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;

    const inspection = await Inspection.findOne({ inspectionId })
      .populate('userId', 'fullName email cnic walletAddress');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch inspection',
      error: error.message
    });
  }
});

module.exports = router;
