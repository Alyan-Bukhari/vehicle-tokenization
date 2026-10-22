const fs = require('fs');
const path = require('path');
const frontend = path.resolve(__dirname, '../../frontend/src');
const artifact = name => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/contracts', name + '.json')));
const registry = artifact('VehicleRegistration');
const networkId = process.env.NETWORK_ID || '5777';
const address = name => {
  const deployment = artifact(name).networks[networkId];
  if (!deployment) throw new Error(`${name} is not deployed on network ${networkId}`);
  return deployment.address;
};
const registrationAddress = address('VehicleRegistration');
const nftAddress = address('VehicleNFT');
const treasury = process.env.TREASURY_ADDRESS;
fs.writeFileSync(path.join(frontend, 'contractConfig.js'), `export default {address: import.meta.env.VITE_REGISTRY_ADDRESS || "${registrationAddress}", abi: ${JSON.stringify(registry.abi,null,2)}};\nexport const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS || "${nftAddress}";\n`);
fs.writeFileSync(path.resolve(__dirname,'../config/registryABI.json'),JSON.stringify(registry.abi,null,2)+'\n');
fs.writeFileSync(path.join(frontend, 'contracts/contractABI.json'), JSON.stringify({abi:registry.abi},null,2));
fs.writeFileSync(path.join(frontend, 'contracts/VehicleNFT.json'), JSON.stringify({abi:artifact('VehicleNFT').abi,address:nftAddress},null,2));
for (const filename of ['TaxPayment.jsx','Fee.jsx','AdminTaxManagement.jsx','NftPage.jsx']) {
 const file = path.join(frontend,'components',filename);
 let source = fs.readFileSync(file,'utf8');
 source = source.replace(/(const (?:CONTRACT_ADDRESS|VEHICLE_REGISTRY_ADDRESS)\s*=\s*)"0x[a-fA-F0-9]{40}"/g, `$1"${registrationAddress}"`);
 source = source.replace(/(const VEHICLE_NFT_ADDRESS\s*=\s*)"0x[a-fA-F0-9]{40}"/g, `$1"${nftAddress}"`);
 if (treasury) source = source.replace(/(const TREASURY_ADDRESS\s*=\s*)"0x[a-fA-F0-9]{40}"/g, `$1"${treasury}"`);
 fs.writeFileSync(file,source);
}
console.log('Frontend wired to network',networkId,'registry:',registrationAddress,'NFT:',nftAddress);
