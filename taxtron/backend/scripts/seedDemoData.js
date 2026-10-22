require('dotenv').config();
const mongoose=require('mongoose');
const User=require('../models/user');
const Inspection=require('../models/inspection');
const {web3,registry}=require('../services/blockchain');
const fs=require('fs');
const path=require('path');
(async()=>{
 try {
  await mongoose.connect(process.env.MONGO_URI);
  const accounts=await web3.eth.getAccounts();
  const password='VehicleDemo123!';
  const specs=[{email:'owner@vehicle.local',fullName:'Demo Owner',cnic:'35202-0000001-1',walletAddress:accounts[1]},{email:'buyer@vehicle.local',fullName:'Demo Buyer',cnic:'35202-0000002-2',walletAddress:accounts[2]}];
  const users=[];
  for(const spec of specs){let user=await User.findOne({email:spec.email});if(!user)user=await User.create({...spec,password,fatherName:'Demo Parent',phoneNumber:'03001234567',isVerified:true});if(user.walletAddress.toLowerCase()!==spec.walletAddress.toLowerCase()) {if(await Inspection.exists({userId:user._id,isPaid:true}))throw new Error('Demo wallet differs from the saved chain. Restore the original local chain before seeding.');user.walletAddress=spec.walletAddress;await user.save();}users.push(user);}
  const id='INSP-DEMO-001';
  let inspection=await Inspection.findOne({inspectionId:id});
  if(!inspection)inspection=await Inspection.create({inspectionId:id,userId:users[0]._id,status:'Approved',registrationNumber:'VT-DEMO-001',inspectionNotes:'Local demonstration vehicle',vehicleDetails:{engineNumber:'DEMO-ENGINE-001',chassisNumber:'DEMO-CHASSIS-001',make:'Toyota',model:'Corolla',manufacturingYear:2022,registrationYear:new Date().getFullYear(),vehicleType:'Car',fuelType:'Petrol',engineCapacity:1800,color:'Silver'}});
  const contract=registry();
  async function send(method,from,value='0'){const gas=await method.estimateGas({from,value});return method.send({from,value,gas:Math.ceil(Number(gas)*1.2)});}
  let vehicle;try{vehicle=await contract.methods.getVehicle(id).call();}catch{}
  if(!vehicle){const tx=await send(contract.methods.registerVehicle(id,'Toyota','Corolla',2022,'DEMO-ENGINE-001','DEMO-CHASSIS-001','Car',1800,'VT-DEMO-001','5000000000000000',''),accounts[1],'5000000000000000');inspection.isPaid=true;inspection.transactionHash=tx.transactionHash;inspection.paymentDate=new Date();inspection.payerWallet=accounts[1];await inspection.save();}
  if(BigInt(await contract.methods.getTaxAmount(id).call())===0n)await send(contract.methods.setTaxAmount(id,'1000000000000000'),accounts[0]);
  inspection.taxAmount=1000;await inspection.save();
  const artifact=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../build/contracts/VehicleNFT.json')));
  const nft=new web3.eth.Contract(artifact.abi,artifact.networks['5777'].address);
  if(!await nft.methods.nftExistsForInspection(id).call())await send(nft.methods['mintVehicleNFT(string,address,string,string,string,string,string,string)'](id,accounts[1],'data:application/json;base64,'+Buffer.from(JSON.stringify({name:'Demo Toyota Corolla',description:'Local vehicle ownership certificate'})).toString('base64'),'Toyota','Corolla','2022','Car','VT-DEMO-001'),accounts[1]);
  console.log(`Demo ready. Owner: owner@vehicle.local | Buyer: buyer@vehicle.local | Password: ${password}`);
  console.log('Owner wallet:',accounts[1],'| Authority wallet:',accounts[0]);
 }catch(error){console.error(error);process.exitCode=1;}finally{await mongoose.disconnect();}
})();
