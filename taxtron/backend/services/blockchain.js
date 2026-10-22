const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545');
function registry() {
 const artifact=JSON.parse(fs.readFileSync(path.join(__dirname,'../build/contracts/VehicleRegistration.json')));
 const address=process.env.REGISTRY_ADDRESS || artifact.networks[process.env.NETWORK_ID||'5777']?.address;
 if(!address) throw Object.assign(new Error('Deploy the vehicle contracts first.'),{status:503});
 return new web3.eth.Contract(artifact.abi,address);
}
async function confirmedTransaction(hash, sender) {
 if(!/^0x[a-fA-F0-9]{64}$/.test(hash||'')) throw Object.assign(new Error('A confirmed blockchain transaction hash is required.'),{status:400});
 const contract=registry();
 const receipt=await web3.eth.getTransactionReceipt(hash);
 if(!receipt || !receipt.status || receipt.to?.toLowerCase()!==contract.options.address.toLowerCase() || receipt.from.toLowerCase()!==sender.toLowerCase()) throw Object.assign(new Error('Transaction was not confirmed for this vehicle registry and wallet.'),{status:400});
 return {contract,receipt};
}
async function verifyPayment(hash, inspection, wallet, kind) {
 const {contract,receipt}=await confirmedTransaction(hash,wallet);
 const signature=kind==='tax'?'TaxPaid(string,address,uint256,uint256)':'VehicleRegistered(string,address,string,uint256,uint256)';
 const event=receipt.logs.find(log=>log.address.toLowerCase()===contract.options.address.toLowerCase() && log.topics[0]===web3.utils.keccak256(signature) && log.topics[1]===web3.utils.keccak256(inspection.inspectionId) && ('0x'+log.topics[2].slice(-40)).toLowerCase()===wallet.toLowerCase());
 if(!event) throw Object.assign(new Error('Transaction does not contain the expected vehicle payment event.'),{status:400});
 const vehicle=await contract.methods.getVehicle(inspection.inspectionId).call();
 if(vehicle.vehicleOwner.toLowerCase()!==wallet.toLowerCase() || (kind==='tax'?!vehicle.taxPaid:!vehicle.registrationFeePaid)) throw Object.assign(new Error('Vehicle payment could not be verified on chain.'),{status:400});
 if(kind==='registration' && (vehicle.registrationNumber!==inspection.registrationNumber || vehicle.chassisNumber!==inspection.vehicleDetails.chassisNumber || vehicle.engineNumber!==inspection.vehicleDetails.engineNumber || Number(vehicle.year)!==inspection.vehicleDetails.manufacturingYear)) throw Object.assign(new Error('The on-chain registration number differs from the approved inspection.'),{status:400});
 if(kind==='registration') {
  const {vehicleType:type,engineCapacity:cc}=inspection.vehicleDetails;
  let fee=({Car:5000,Motorcycle:2000,Truck:8000,Bus:10000,Van:6000,SUV:7000,Other:1500})[type]||4000;
  if(type==='Car' && cc>2000)fee+=2000;
  else if(type==='Motorcycle' && cc>600)fee+=1000;
  else if(type==='Truck' && cc>3000)fee+=3000;
  else if(type==='Bus' && cc>6000)fee+=4000;
  else if(type==='Van' && cc>2000)fee+=1500;
  else if(type==='SUV' && cc>2500)fee+=2500;
  else if(type==='Other' && cc>300)fee+=500;
  if(BigInt(vehicle.registrationFee)<BigInt(fee)*1000000000000n)throw Object.assign(new Error('Registration fee is below the required demo fee.'),{status:400});
 }
 return vehicle;
}
async function verifyTransfer(hash, inspectionId, sender, recipient) {
 const {contract,receipt}=await confirmedTransaction(hash,sender);
 const transaction=await web3.eth.getTransaction(hash);
 const method=contract.options.jsonInterface.find(item=>item.name==='transferOwnership');
 if(transaction.input.slice(0,10)!==web3.eth.abi.encodeFunctionSignature(method)) throw Object.assign(new Error('Expected an ownership transfer transaction.'),{status:400});
 const args=web3.eth.abi.decodeParameters(method.inputs,'0x'+transaction.input.slice(10));
 const vehicle=await contract.methods.getVehicle(inspectionId).call();
 if(args[0]!==inspectionId || args[1].toLowerCase()!==recipient.toLowerCase() || vehicle.vehicleOwner.toLowerCase()!==recipient.toLowerCase()) throw Object.assign(new Error('Ownership transfer does not match the approved request.'),{status:400});
 return receipt;
}
module.exports={web3,registry,verifyPayment,verifyTransfer};
