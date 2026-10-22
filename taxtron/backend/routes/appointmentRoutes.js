const express = require('express');
const Appointment = require('../models/appointment');
const { authenticateUser, adminAuth } = require('../middleware/auth');
const router = express.Router();
const slots = ['09:00 AM','10:00 AM','11:00 AM','02:00 PM','03:00 PM','04:00 PM'];
const dateKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year:'numeric',month:'2-digit',day:'2-digit' }).format(date);
const start = key => new Date(`${key}T00:00:00+05:00`);

// Preserve appointment history; expired bookings become unavailable rather than disappearing.
async function expire() {
  return Appointment.updateMany({ status:'Booked', scheduledDate: { $lt:start(dateKey(new Date())) } }, { $set:{status:'Expired'} });
}
router.get('/available', async (req,res,next) => {
 try {
  await expire();
  const today = start(dateKey(new Date()));
  const bookings = await Appointment.find({status:'Booked', scheduledDate:{$gte:today}}).lean();
  const data = [];
  for(let i=1;i<=30;i++) {
   const day = new Date(today.getTime()+i*86400000);
   const date = dateKey(day);
   const booked = bookings.filter(b=>dateKey(b.scheduledDate)===date).map(b=>b.timeSlot);
   const availableTimeSlots = slots.filter(s=>!booked.includes(s));
   if(availableTimeSlots.length) data.push({date,availableTimeSlots});
  }
  res.json({success:true,data});
 } catch(error) {next(error);}
});
router.post('/book', authenticateUser, async(req,res,next)=>{
 try {
  const {date,timeSlot,inspectionId} = req.body;
  const today = start(dateKey(new Date()));
  const day = start(date);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || Number.isNaN(day.getTime()) || day<=today || day>new Date(today.getTime()+30*86400000) || !slots.includes(timeSlot) || !/^INSP-[a-zA-Z0-9-]{1,80}$/.test(inspectionId||'')) {
   return res.status(400).json({success:false,message:'Choose a valid date within the next 30 days, a time slot and an inspection ID.'});
  }
  const appointment = await Appointment.create({scheduledDate:day,status:'Booked',inspectionId,timeSlot,userId:req.user._id});
  res.json({success:true,message:'Appointment booked successfully',data:appointment});
 } catch(error) {
  if(error.code===11000) return res.status(409).json({success:false,message:'This appointment or time slot is already booked. Please select another.'});
  next(error);
 }
});
router.get('/',adminAuth,async(req,res,next)=>{
 try {
  await expire();
  const filter={};
  if(req.query.scheduledDate) {
   const day=start(req.query.scheduledDate);
   if(Number.isNaN(day.getTime())) return res.status(400).json({message:'Invalid date'});
   filter.scheduledDate={$gte:day,$lt:new Date(day.getTime()+86400000)};
  }
  res.json(await Appointment.find(filter).sort({scheduledDate:1}));
 } catch(error) {next(error);}
});
router.delete('/cleanup-expired',adminAuth,async(req,res,next)=>{
 try {const result=await expire();res.json({success:true,data:{deletedCount:0,expiredCount:result.modifiedCount}});}catch(error){next(error);}
});
module.exports=router;
