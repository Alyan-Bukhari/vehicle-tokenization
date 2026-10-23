const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {createRequire}=require('node:module');
const backend=path.resolve(__dirname,'../taxtron/backend');
const requireBackend=createRequire(path.join(backend,'package.json'));
const mongoose=requireBackend('mongoose');
const Admin=requireBackend('./models/Admin');
const {Web3}=requireBackend('web3');
const root=path.resolve(__dirname,'..');
const base='http://127.0.0.1:5099/api';
const dbName=`vehicle_tokenization_test_${Date.now()}`;
let server,adminToken,userToken,otherToken,inspectionId,inspectionObjectId,bookingDate;
let chain,accounts;
const wallet='0x1111111111111111111111111111111111111111';
const user={cnic:'35202-1234567-8',fullName:'Test Owner',fatherName:'Test Parent',phoneNumber:'03001234567',email:'owner@example.test',walletAddress:wallet,password:'testpass123'};
const vehicle={engineNumber:'TEST-ENG',chassisNumber:'TEST-CHASSIS',make:'Toyota',model:'Corolla',manufacturingYear:2022,registrationYear:2026,vehicleType:'Car',fuelType:'Petrol',engineCapacity:1800,color:'Silver'};
async function request(route,method='GET',body,token){const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json()};}
before(async()=>{
 await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`);
 await new Admin({email:'admin',password:'testpass123'}).save();
 server=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,PORT:'5099',JWT_SECRET:'automated-test-secret',MONGO_URI:`mongodb://127.0.0.1:27017/${dbName}`},stdio:['ignore','ignore','pipe']});
 let errors='';server.stderr.on('data',d=>errors+=d);
 for(let i=0;i<80;i++){try{if((await request('/health')).status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}
 throw new Error('Test API failed to start: '+errors);
});
after(async()=>{server?.kill();if(mongoose.connection.name===dbName)await mongoose.connection.dropDatabase();await mongoose.disconnect();});
test('admin sessions cannot be created anonymously and protected data requires authentication',async()=>{
 assert.equal((await request('/admin/create','POST',{email:'rogue',password:'testpass123'})).status,401);
 assert.equal((await request('/inspections')).status,401);
 const login=await request('/admin/login','POST',{email:'admin',password:'testpass123'});
 assert.equal(login.status,200);adminToken=login.body.token;
});
test('registration validates input and creates a user with hashed credentials',async()=>{
 assert.equal((await request('/users/register','POST',{...user,cnic:'invalid'})).status,400);
 const result=await request('/users/register','POST',user);
 assert.equal(result.status,201);userToken=result.body.data.token;
 const duplicate=await request('/users/register','POST',user);assert.equal(duplicate.status,400);
 const login=await request('/users/login','POST',{email:'OWNER@EXAMPLE.TEST',password:user.password});assert.equal(login.status,200);
 const stored=await requireBackend('./models/user').findOne({email:user.email});assert.notEqual(stored.password,user.password);
});
test('user sessions cannot perform admin operations',async()=>{
 assert.equal((await request('/inspections','GET',undefined,userToken)).status,403);
 assert.equal((await request('/vehicles/admin/test/set-tax-amount','POST',{taxAmount:1000},userToken)).status,403);
 assert.equal((await request('/users/verify/123','PUT',{},userToken)).status,403);
});
test('appointment booking validates dates and rejects competing reservations',async()=>{
 const available=await request('/appointments/available');assert.equal(available.status,200);
 bookingDate=available.body.data[0].date;
 inspectionId=`INSP-TEST-${Date.now()}`;
 for(const timeSlot of ['10:30 AM','9:00 AM']) {
  assert.equal((await request('/appointments/book','POST',{date:bookingDate,timeSlot,inspectionId},userToken)).status,400);
 }
 assert.ok(available.body.data[0].availableTimeSlots.includes('09:00 AM'));
 assert.equal((await request('/appointments/book','POST',{date:'2000-01-01',timeSlot:'09:00 AM',inspectionId},userToken)).status,400);
 const booking={date:bookingDate,timeSlot:'09:00 AM',inspectionId};
 const results=await Promise.all([request('/appointments/book','POST',booking,userToken),request('/appointments/book','POST',{...booking,inspectionId:inspectionId+'-2'},userToken)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const winner=results.find(r=>r.status===200);inspectionId=winner.body.data.inspectionId;
});
test('vehicle submission reuses its appointment ID and admin notes survive approval',async()=>{
 const result=await request('/vehicles/inspection-request','POST',{vehicleDetails:vehicle,appointmentDetails:{appointmentId:inspectionId,date:bookingDate,time:'09:00 AM'}},userToken);
 assert.equal(result.status,201,JSON.stringify(result.body));assert.equal(result.body.data.inspectionId,inspectionId);
 const all=await request('/inspections','GET',undefined,adminToken);
 const inspection=all.body.data.find(i=>i.inspectionId===inspectionId);assert.ok(inspection);inspectionObjectId=inspection._id;
 const approved=await request(`/inspections/${inspectionObjectId}/status`,'PUT',{status:'Approved',registrationNumber:'TEST-001',inspectionNotes:'Roadworthy'},adminToken);
 assert.equal(approved.status,200);assert.equal(approved.body.data.inspectionNotes,'Roadworthy');
 const owned=await request('/vehicles/my-vehicles','GET',undefined,userToken);assert.equal(owned.body.data.length,1);
 const walletResult=await request(`/inspections/wallet/${wallet}`,'GET',undefined,userToken);assert.equal(walletResult.body.count,1);
});
test('another owner cannot read inspection records or record payments',async()=>{
 const result=await request('/users/register','POST',{...user,email:'other@example.test',cnic:'35202-1234567-9',walletAddress:'0x2222222222222222222222222222222222222222'});
 otherToken=result.body.data.token;
 assert.equal((await request(`/inspections/${inspectionId}`,'GET',undefined,otherToken)).status,403);
 assert.equal((await request(`/inspections/${inspectionId}/payment`,'POST',{transactionHash:'fake'},otherToken)).status,403);
 const forged=await request(`/inspections/${inspectionId}/payment`,'POST',{transactionHash:'fake',isPaid:true},userToken);assert.equal(forged.status,400);
 const resultAfter=await request(`/inspections/${inspectionId}/payment-status`,'GET',undefined,userToken);assert.equal(resultAfter.body.isPaid,false);
});
test('admin image uploads work without external API keys',async()=>{
 const form=new FormData();form.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4foAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'vehicle.png');
 const response=await fetch(base+'/media/image',{method:'POST',headers:{Authorization:`Bearer ${adminToken}`},body:form});
 assert.equal(response.status,201);const data=await response.json();assert.equal((await fetch('http://127.0.0.1:5099'+data.url)).status,200);
 if(process.env.MEDIA_STORAGE==='mongodb')assert.ok(await requireBackend('./models/media').exists({name:path.basename(data.url)}));
 else {const fs=require('node:fs');fs.unlinkSync(path.join(backend,'uploads',path.basename(data.url)));}
});

test('quoted CSV import preserves fields and leaves payment pending',async()=>{
 const headers=['fullName','cnic','email','walletAddress','engineNumber','chassisNumber','make','model','variant','year','engineCapacity','fuelType','transmission','color','bodyType','seatingCapacity','registrationNumber','phoneNumber'];
 const row=['"Owner, Test"',user.cnic,user.email,user.walletAddress,'CSV-ENGINE','CSV-CHASSIS','Toyota','Corolla','GLI','2022','1800','Petrol','Manual','White','Sedan','5','CSV-001',user.phoneNumber];
 const form=new FormData();form.append('csvFile',new Blob([headers.join(',')+'\n'+row.join(',')],{type:'text/csv'}),'vehicles.csv');
 const response=await fetch(base+'/admin/bulk-import',{method:'POST',headers:{Authorization:`Bearer ${adminToken}`},body:form});
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.successCount,1,JSON.stringify(data));
 const imported=await requireBackend('./models/inspection').findOne({'vehicleDetails.chassisNumber':'CSV-CHASSIS'});assert.equal(imported.isPaid,false);
});

test('on-chain registration, tax, NFT and approved ownership transfer synchronize with the API',{skip:process.env.RUN_CHAIN_TESTS!=='1'},async()=>{
 chain=new Web3('http://127.0.0.1:7545');accounts=await chain.eth.getAccounts();
 const snapshot=await chain.currentProvider.request({method:'evm_snapshot',params:[]});
 try {
  const artifact=require(path.join(backend,'build/contracts/VehicleRegistration.json'));
  const nftArtifact=require(path.join(backend,'build/contracts/VehicleNFT.json'));
  const registry=new chain.eth.Contract(artifact.abi,artifact.networks['5777'].address);
  const nft=new chain.eth.Contract(nftArtifact.abi,nftArtifact.networks['5777'].address);
  const sender={...user,email:'chain-owner@example.test',cnic:'35202-1111111-1',walletAddress:accounts[2]};
  const recipient={...user,email:'chain-buyer@example.test',cnic:'35202-2222222-2',walletAddress:accounts[3]};
  const ownerResult=await request('/users/register','POST',sender);assert.equal(ownerResult.status,201,JSON.stringify(ownerResult.body));const token=ownerResult.body.data.token;
  const buyerResult=await request('/users/register','POST',recipient);assert.equal(buyerResult.status,201);const buyerToken=buyerResult.body.data.token;
  const id=`INSP-CHAIN-${Date.now()}`;
  const registration='CHAIN-'+Date.now();
  const details={...vehicle,engineNumber:id+'E',chassisNumber:id+'C'};
  const booking=await request('/appointments/book','POST',{date:bookingDate,timeSlot:'11:00 AM',inspectionId:id},token);assert.equal(booking.status,200,JSON.stringify(booking.body));
  const submitted=await request('/vehicles/register','POST',{vehicleDetails:details,appointmentDetails:{date:bookingDate,time:'11:00 AM',appointmentId:id}},token);assert.equal(submitted.status,201,JSON.stringify(submitted.body));
  const record=await requireBackend('./models/inspection').findOne({inspectionId:id});
  assert.equal((await request(`/inspections/${record._id}/status`,'PUT',{status:'Approved',registrationNumber:registration},adminToken)).status,200);
  async function send(method,from,value='0'){const gas=await method.estimateGas({from,value});return method.send({from,value,gas:Math.ceil(Number(gas)*1.2)});}
  const fee='5000000000000000';
  const payment=await send(registry.methods.registerVehicle(id,'Toyota','Corolla',2022,details.engineNumber,details.chassisNumber,'Car',1800,registration,fee,''),accounts[2],fee);
  const receiptView=await request(`/blockchain/transactions/${payment.transactionHash}`);assert.equal(receiptView.status,200);assert.equal(receiptView.body.data.status,'Confirmed');
  const recorded=await request(`/inspections/${id}/payment`,'POST',{transactionHash:payment.transactionHash,isPaid:true,registrationNumber:registration},token);assert.equal(recorded.status,200,JSON.stringify(recorded.body));assert.equal(recorded.body.data.isPaid,true);
  await send(registry.methods.setTaxAmount(id,'1000000000000000'),accounts[0]);
  const assessed=await request(`/vehicles/admin/${id}/set-tax-amount`,'POST',{taxAmount:1000},adminToken);assert.equal(assessed.status,200,JSON.stringify(assessed.body));
  const taxPaid=await send(registry.methods.payTax(id,''),accounts[2],'1000000000000000');
  const taxRecorded=await request(`/vehicles/${id}/pay-tax`,'POST',{transactionHash:taxPaid.transactionHash,taxAmount:1000},token);assert.equal(taxRecorded.status,200,JSON.stringify(taxRecorded.body));
  await send(nft.methods['mintVehicleNFT(string,address,string)'](id,accounts[2],'data:application/json,{}'),accounts[2]);
  const tokenId=await nft.methods.getTokenIdByInspection(id).call();assert.equal((await nft.methods.ownerOf(tokenId).call()).toLowerCase(),accounts[2].toLowerCase());
  const initiated=await request('/ownership-transfer/initiate','POST',{vehicleId:id,recipientCnic:recipient.cnic},token);assert.equal(initiated.status,200,JSON.stringify(initiated.body));
  const transferId=initiated.body.transferId;
  assert.equal((await request(`/ownership-transfer/admin/approve/${transferId}`,'POST',{adminNotes:'Verified'},adminToken)).status,200);
  const fake=await request(`/ownership-transfer/complete/${transferId}`,'POST',{blockchainTxHash:'fake'},token);assert.equal(fake.status,400);
  const transferTx=await send(registry.methods.transferOwnership(id,accounts[3]),accounts[2]);
  const completed=await request(`/ownership-transfer/complete/${transferId}`,'POST',{blockchainTxHash:transferTx.transactionHash},token);assert.equal(completed.status,200,JSON.stringify(completed.body));
  assert.equal((await nft.methods.ownerOf(tokenId).call()).toLowerCase(),accounts[3].toLowerCase());
  assert.equal((await request(`/inspections/${id}`,'GET',undefined,token)).status,403);
  assert.equal((await request(`/inspections/${id}`,'GET',undefined,buyerToken)).status,200);
 }finally{await chain.currentProvider.request({method:'evm_revert',params:[snapshot]});}
});
