export function registrationPayment(inspection) {
  const details = inspection?.vehicleDetails;
  const required = [inspection?.inspectionId, details?.make, details?.model, details?.engineNumber, details?.chassisNumber, details?.vehicleType, inspection?.registrationNumber];
  if (!details || required.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('The approved inspection is missing required registration details.');
  }
  if (inspection.status !== 'Approved') throw new Error('The inspection must be approved before payment.');
  const year = Number(details.manufacturingYear);
  const capacity = Number(details.engineCapacity);
  const fee = Number(details.totalFee);
  if (!Number.isSafeInteger(year) || year < 1900 || !Number.isSafeInteger(capacity) || capacity < 0 || !Number.isSafeInteger(fee) || fee <= 0) {
    throw new Error('The approved inspection has an invalid year, engine capacity or registration fee.');
  }
  const value = (BigInt(fee) * 1000000000000n).toString();
  return {value,args:[inspection.inspectionId,details.make,details.model,String(year),details.engineNumber,details.chassisNumber,details.vehicleType,String(capacity),inspection.registrationNumber,value,'']};
}

export async function sendRegistrationPayment({web3,account,inspection,contractAddress,abi,chainId,onTransactionHash}) {
  const owner = inspection?.userId?.walletAddress;
  if (!web3.utils.isAddress(account)) throw new Error('Connect a valid MetaMask account.');
  if (!owner || owner.toLowerCase() !== account.toLowerCase()) throw new Error(`Switch MetaMask to the registered owner wallet: ${owner || 'sign in again to load your owner account'}.`);
  if (Number(await web3.eth.getChainId()) !== chainId) throw new Error('The wallet is on the wrong network. Switch to the configured test network and retry.');
  if (!web3.utils.isAddress(contractAddress) || await web3.eth.getCode(contractAddress) === '0x') throw new Error('The registration contract is unavailable on the selected network.');
  const {value,args} = registrationPayment(inspection);
  const contract = new web3.eth.Contract(abi,contractAddress);
  const method = contract.methods.registerVehicle(...args);
  const estimate = await method.estimateGas({from:account,value});
  const gas = web3.utils.toHex((BigInt(estimate)*120n+99n)/100n);
  const transaction = method.send({from:account,value,gas});
  if (onTransactionHash) transaction.on('transactionHash',onTransactionHash);
  return transaction;
}
