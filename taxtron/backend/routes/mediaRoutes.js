const express=require('express');
const fs=require('fs');
const path=require('path');
const {randomUUID}=require('crypto');
const {adminAuth}=require('../middleware/auth');
const router=express.Router();
const cloud=Boolean(process.env.VERCEL || process.env.MEDIA_STORAGE==='mongodb');
const Media=require('../models/media');
const directory=path.resolve(__dirname,'../uploads');
if(!cloud)fs.mkdirSync(directory,{recursive:true});
router.get('/files/:name',async(req,res,next)=>{
 if(!cloud)return next();
 try {
  const file=await Media.findOne({name:req.params.name});
  if(!file)return res.status(404).json({success:false,message:'Image not found'});
  res.set({'Content-Type':file.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=86400'}).send(file.data);
 }catch(error){next(error);}
});
if(!cloud)router.use('/files',express.static(directory,{dotfiles:'deny',setHeaders:res=>res.setHeader('X-Content-Type-Options','nosniff')}));
router.post('/image',adminAuth,async(req,res,next)=>{
 try {
  const file=req.files?.file;
  if(!file || Array.isArray(file) || file.size>4*1024*1024) return res.status(400).json({success:false,message:'Choose one image under 4 MB.'});
  const data=file.tempFilePath?fs.readFileSync(file.tempFilePath):file.data;
  let extension;
  if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension='png';
  else if(data[0]===255 && data[1]===216 && data[2]===255) extension='jpg';
  else if(data.toString('ascii',0,4)==='RIFF' && data.toString('ascii',8,12)==='WEBP') extension='webp';
  if(!extension) return res.status(400).json({success:false,message:'Use a PNG, JPEG or WebP image.'});
  const name=`${randomUUID()}.${extension}`;
  if(cloud){await Media.create({name,contentType:{png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[extension],data});if(file.tempFilePath)fs.unlinkSync(file.tempFilePath);}
  else await file.mv(path.join(directory,name));
  res.status(201).json({success:true,url:`/api/media/files/${name}`});
 }catch(error){next(error);}
});
module.exports=router;
