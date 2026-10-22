require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db');
const route = require('./routes/routes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const vehicleDatabaseRoutes = require('./routes/vehicleDatabaseRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ownershipTransferRoutes = require('./routes/ownershipTransferRoutes');

// Load environment variables
dotenv.config();

// Set default values if not provided
if (!process.env.MONGO_URI && !process.env.VERCEL) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/taxtron';
}
if (!process.env.PORT) {
  process.env.PORT = 5000;
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Run npm run setup to generate your local configuration.');
}

const app = express();

// Middleware
app.use(cors());
app.use('/api', async (req,res,next) => {
  try {
    if (!process.env.MONGO_URI) return res.status(503).json({success:false,message:'The hosted database is not configured.'});
    await connectDB();
    next();
  } catch(error) {
    res.status(503).json({success:false,message:'The database is temporarily unavailable. Please try again.'});
  }
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, limits:{fileSize:4*1024*1024}, abortOnLimit:true, tempFileDir:process.env.VERCEL ? require('os').tmpdir() : require('path').join(__dirname,'tmp') }));
app.use('/api/media',require('./routes/mediaRoutes'));
app.use('/api/blockchain',require('./routes/blockchainRoutes'));

// Routes
console.log('Loading routes...');
try {
  app.use('/api/users', userRoutes);
  console.log('✓ User routes loaded');
} catch (error) {
  console.error('Error loading user routes:', error);
}

try {
  app.use('/api/vehicles', vehicleRoutes);
  console.log('✓ Vehicle routes loaded');
} catch (error) {
  console.error('Error loading vehicle routes:', error);
}

try {
  app.use('/api/vehicle-database', vehicleDatabaseRoutes);
  console.log('✓ Vehicle database routes loaded');
} catch (error) {
  console.error('Error loading vehicle database routes:', error);
}

try {
  app.use('/api/appointments', appointmentRoutes);
  console.log('✓ Appointment routes loaded');
} catch (error) {
  console.error('Error loading appointment routes:', error);
}

try {
  app.use('/api/inspections', inspectionRoutes);
  console.log('✓ Inspection routes loaded');
} catch (error) {
  console.error('Error loading inspection routes:', error);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✓ Admin routes loaded');
} catch (error) {
  console.error('Error loading admin routes:', error);
}

try {
  app.use('/api/ownership-transfer', ownershipTransferRoutes);
  console.log('✓ Ownership transfer routes loaded');
} catch (error) {
  console.error('Error loading ownership transfer routes:', error);
}

try {
  app.use('/api', route);
  console.log('✓ General routes loaded');
} catch (error) {
  console.error('Error loading general routes:', error);
}

console.log('All routes loaded successfully!');




// Handle errors
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  res.status(status).json({ success:false, message:status===500?'The request could not be completed. Please try again.':err.message });
});

module.exports = app;

if (require.main === module && !process.env.VERCEL) {
  connectDB().then(() => {
    const port = process.env.PORT || 5001;
    app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Server running on port ${port}`));
  }).catch(error => {
    console.error('Database connection failed:', error.message);
    process.exitCode = 1;
  });
}
