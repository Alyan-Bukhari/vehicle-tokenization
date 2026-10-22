const express=require('express');
const fs=require('fs');
const path=require('path');
const {randomUUID}=require('crypto');
const {adminAuth}=require('../middleware/auth');
const router=express.Router();
const directory=path.resolve(__dirname,'../uploads');
fs.mkdirSync(directory,{recursive:true});
router.use('/files',express.static(directory,{dotfiles:'deny',setHeaders:res=>res.setHeader('X-Content-Type-Options','nosniff')}));
router.post('/image',adminAuth,async(req,res,next)=>{
 try {
  const file=req.files?.file;
  if(!file || Array.isArray(file) || file.size>5*1024*1024) return res.status(400).json({success:false,message:'Choose one image under 5 MB.'});
  const data=file.tempFilePath?fs.readFileSync(file.tempFilePath):file.data;
  let extension;
  if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension='png';
  else if(data[0]===255 && data[1]===216 && data[2]===255) extension='jpg';
  else if(data.toString('ascii',0,4)==='RIFF' && data.toString('ascii',8,12)==='WEBP') extension='webp';
  if(!extension) return res.status(400).json({success:false,message:'Use a PNG, JPEG or WebP image.'});
  const name=`${randomUUID()}.${extension}`;
  await file.mv(path.join(directory,name));
  res.status(201).json({success:true,url:`/api/media/files/${name}`});
 }catch(error){next(error);}
});
module.exports=router;
