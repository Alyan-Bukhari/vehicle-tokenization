import fs from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'taxtron/backend/package.json'));
const {Web3}=require('web3');
const env=JSON.parse(fs.readFileSync(resolve(root,'.local/cloud/production-env.json')));
const wallet=JSON.parse(fs.readFileSync(resolve(root,'.local/cloud/sepolia-deployer.json')));
const web3=new Web3(env.BLOCKCHAIN_RPC_URL);
if(Number(await web3.eth.getChainId())!==11155111)throw new Error('Refusing to deploy outside Ethereum Sepolia.');
const account=web3.eth.accounts.wallet.add(wallet.privateKey);
const balance=await web3.eth.getBalance(wallet.address);
if(balance===0n){console.log('Waiting for free Sepolia test ETH in',wallet.address);process.exitCode=2;}
else {
 const file=resolve(root,'.local/cloud/sepolia-deployment.json');
 const saved=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
 const artifact=name=>JSON.parse(fs.readFileSync(resolve(root,'taxtron/backend/build/contracts',name+'.json')));
 async function deploy(name,args){
  const definition=artifact(name);
  if(saved[name] && await web3.eth.getCode(saved[name])!=='0x')return new web3.eth.Contract(definition.abi,saved[name]);
  const method=new web3.eth.Contract(definition.abi).deploy({data:definition.bytecode,arguments:args});
  const gas=await method.estimateGas({from:wallet.address});
  console.log('Deploying',name,'to Sepolia; estimated gas',gas.toString());
  const contract=await method.send({from:wallet.address,gas:Math.ceil(Number(gas)*1.15)});
  saved[name]=contract.options.address;fs.writeFileSync(file,JSON.stringify(saved,null,2),{mode:0o600});
  console.log(name,contract.options.address);return contract;
 }
 const registry=await deploy('VehicleRegistration',[wallet.address]);
 const nft=await deploy('VehicleNFT',[wallet.address,registry.options.address]);
 if((await registry.methods.certificateContract().call()).toLowerCase()!==nft.options.address.toLowerCase()) {
  const method=registry.methods.setCertificateContract(nft.options.address);
  await method.send({from:wallet.address,gas:Math.ceil(Number(await method.estimateGas({from:wallet.address}))*1.15)});
 }
 Object.assign(env,{REGISTRY_ADDRESS:registry.options.address,VITE_REGISTRY_ADDRESS:registry.options.address,VITE_NFT_ADDRESS:nft.options.address});
 fs.writeFileSync(resolve(root,'.local/cloud/production-env.json'),JSON.stringify(env),{mode:0o600});
 console.log('Sepolia contracts are linked. Deployment wallet:',wallet.address);
}
