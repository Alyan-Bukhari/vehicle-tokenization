const Registry=artifacts.require('VehicleRegistration');
const Certificate=artifacts.require('VehicleNFT');
contract('Vehicle tokenization lifecycle',accounts=>{
 const [admin,owner,buyer,treasury,attacker]=accounts;
 let registry,certificate;
 const fee='5000000000000000';
 const tax='1000000000000000';
 async function rejected(promise){try{await promise;assert.fail('Expected transaction to revert');}catch(error){assert(error.message.includes('revert'),error.message);}}
 const register=(id='INSP-CONTRACT-1',number='TEST-001',chassis='CHASSIS-001')=>registry.registerVehicle(id,'Toyota','Corolla',2022,'ENGINE-001',chassis,'Car',1800,number,fee,'',{from:owner,value:fee});
 before(async()=>{
  registry=await Registry.new(treasury,{from:admin});
  certificate=await Certificate.new(admin,registry.address,{from:admin});
  await registry.setCertificateContract(certificate.address,{from:admin});
 });
 it('registers a paid vehicle and forwards its fee to treasury',async()=>{
  const balance=BigInt(await web3.eth.getBalance(treasury));
  await register();
  const vehicle=await registry.getVehicle('INSP-CONTRACT-1');
  assert.equal(vehicle.vehicleOwner,owner);assert.equal(vehicle.registrationFeePaid,true);
  assert.equal(BigInt(await web3.eth.getBalance(treasury))-balance,BigInt(fee));
 });
 it('rejects duplicate chassis, zero fees and duplicate registration numbers',async()=>{
  await rejected(register('INSP-CONTRACT-2','TEST-002','CHASSIS-001'));
  await rejected(register('INSP-CONTRACT-3','TEST-001','CHASSIS-003'));
  await rejected(registry.registerVehicle('INSP-ZERO','Toyota','Corolla',2022,'ENGINE-ZERO','CHASSIS-ZERO','Car',1800,'ZERO-001',0,'',{from:owner}));
 });
 it('restricts tax assessments to the authority',async()=>{
  await rejected(registry.setTaxAmount('INSP-CONTRACT-1',tax,{from:attacker}));
  await registry.setTaxAmount('INSP-CONTRACT-1',tax,{from:admin});
 });
 it('requires the vehicle owner and sufficient payment for tax',async()=>{
  await rejected(registry.payTax('INSP-CONTRACT-1','',{from:attacker,value:tax}));
  await rejected(registry.payTax('INSP-CONTRACT-1','',{from:owner,value:1}));
  await registry.payTax('INSP-CONTRACT-1','',{from:owner,value:tax});
  assert.equal(await registry.isTaxPaid('INSP-CONTRACT-1'),true);
  await rejected(registry.payTax('INSP-CONTRACT-1','',{from:owner,value:tax}));
 });
 it('starts a new unpaid tax assessment when the authority sets a new amount',async()=>{
  await registry.setTaxAmount('INSP-CONTRACT-1',tax,{from:admin});
  assert.equal(await registry.isTaxPaid('INSP-CONTRACT-1'),false);
 });
 it('rejects certificate minting for unregistered vehicles and other wallets',async()=>{
  await rejected(certificate.methods['mintVehicleNFT(string,address,string)']('INSP-MISSING',attacker,'data:application/json,{}',{from:attacker}));
  await rejected(certificate.methods['mintVehicleNFT(string,address,string)']('INSP-CONTRACT-1',attacker,'data:application/json,{}',{from:attacker}));
 });
 it('mints one certificate for the registered owner',async()=>{
  await certificate.methods['mintVehicleNFT(string,address,string)']('INSP-CONTRACT-1',owner,'data:application/json,{}',{from:owner});
  assert.equal(await certificate.ownerOf(1),owner);
  await rejected(certificate.methods['mintVehicleNFT(string,address,string)']('INSP-CONTRACT-1',owner,'data:application/json,{}',{from:owner}));
 });
 it('rejects independent certificate transfers',async()=>{
  await rejected(certificate.transferFrom(owner,buyer,1,{from:owner}));
 });
 it('transfers vehicle and NFT ownership atomically',async()=>{
  await registry.transferOwnership('INSP-CONTRACT-1',buyer,{from:owner});
  assert.equal((await registry.getVehicle('INSP-CONTRACT-1')).vehicleOwner,buyer);
  assert.equal(await certificate.ownerOf(1),buyer);
  assert.equal((await registry.getVehiclesByOwner(owner)).length,0);
  assert.equal((await registry.getVehiclesByOwner(buyer)).length,1);
 });
 it('rejects unauthorized and inactive-vehicle transfers',async()=>{
  await rejected(registry.transferOwnership('INSP-CONTRACT-1',attacker,{from:owner}));
  await registry.deactivateVehicle('INSP-CONTRACT-1',{from:admin});
  await rejected(registry.transferOwnership('INSP-CONTRACT-1',attacker,{from:buyer}));
 });
});
