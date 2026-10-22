const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['Free', 'Booked', 'Expired', 'Completed', 'Cancelled'], default: 'Free' },
  inspectionId: { type: String, unique: true, required: true },
  timeSlot: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  createdAt: { type: Date, default: Date.now }
});

appointmentSchema.index({ scheduledDate:1, timeSlot:1 }, { unique:true, partialFilterExpression:{status:'Booked'} });

module.exports = mongoose.model('Appointment', appointmentSchema);
