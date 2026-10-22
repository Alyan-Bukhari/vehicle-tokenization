import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,createWriteStream} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const backend=resolve(root,'taxtron/backend');
const require=createRequire(resolve(backend,'package.json'));
const envFile=resolve(backend,'.env');
if(!existsSync(envFile)) writeFileSync(envFile,readFileSync(resolve(backend,'.env.example'),'utf8').replace('replace-with-a-random-secret',randomBytes(32).toString('hex')));
require('dotenv').config({path:envFile});
const children=[];
mkdirSync(resolve(root,'.local/logs'),{recursive:true});
function start(name,command,args,cwd=root) {
 const log=createWriteStream(resolve(root,`.local/logs/${name}.log`),{flags:'a'});
 const child=spawn(command,args,{cwd,env:process.env,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(log);child.stderr.pipe(log);children.push(child);
 child.on('error',error=>{console.error(`${name}: ${error.message}`);stop(1);});
 child.on('exit',code=>{if(!stopping){console.error(`${name} stopped (${code}). Check .local/logs/${name}.log`);stop(1);}});
 console.log(`Started ${name}`);
 return child;
}
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;process.exitCode=code;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),500).unref();}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function rpc(method,params=[]) {
 const response=await fetch(process.env.BLOCKCHAIN_RPC_URL||'http://127.0.0.1:7545',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(2000)});
 const data=await response.json();if(data.error)throw new Error(data.error.message);return data.result;
}
async function waitFor(check,name){for(let i=0;i<60;i++){try{if(await check())return;}catch{}await delay(500);}throw new Error(`${name} did not become ready. Check .local/logs.`);}
async function run(script,args=[],cwd=backend){return new Promise((ok,fail)=>{const child=spawn(process.execPath,[script,...args],{cwd,stdio:'inherit',env:process.env});child.on('error',fail);child.on('exit',code=>code===0?ok():fail(new Error(`${script} failed (${code})`)));});}
try {
 const mongoose=require('mongoose');
 async function mongoReady(){try{await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:500});return true;}finally{await mongoose.disconnect();}}
 let mongoUp=false;try{mongoUp=await mongoReady();}catch{}
 if(!mongoUp){
  const binary=existsSync(resolve(root,'.local/mongodb/bin/mongod'))?resolve(root,'.local/mongodb/bin/mongod'):'mongod';
  mkdirSync(resolve(root,'.local/mongodb-data'),{recursive:true});
  start('mongodb',binary,['--dbpath',resolve(root,'.local/mongodb-data'),'--bind_ip','127.0.0.1','--port','27017']);
  await waitFor(mongoReady,'MongoDB');
 }
 const mnemonicFile=resolve(root,'.local/ganache-mnemonic');
 const seedFile=resolve(root,'.local/ganache-seed');
 if(!existsSync(mnemonicFile) && !existsSync(seedFile))writeFileSync(seedFile,randomBytes(32).toString('hex'),{mode:0o600});
 const walletArgs=existsSync(mnemonicFile)?['--wallet.mnemonic',readFileSync(mnemonicFile,'utf8').trim()]:['--wallet.seed',readFileSync(seedFile,'utf8').trim()];
 let chainUp=false;try{chainUp=await rpc('eth_chainId')==='0x539';}catch{}
 if(!chainUp) start('ganache',process.execPath,[resolve(root,'node_modules/ganache/dist/node/cli.js'),'--server.host','127.0.0.1','--server.port','7545','--chain.chainId','1337','--chain.networkId','5777','--database.dbPath',resolve(root,'.local/ganache'),...walletArgs,'--wallet.totalAccounts','10','--wallet.defaultBalance','100','--logging.quiet']);
 await waitFor(()=>rpc('eth_chainId'),'Ganache');
 let deployed=false;
 try{const a=JSON.parse(readFileSync(resolve(backend,'build/contracts/VehicleRegistration.json')));deployed=(await rpc('eth_getCode',[a.networks['5777'].address,'latest']))!=='0x';}catch{}
 if(!deployed) await run(resolve(root,'scripts/deploy.mjs'),[],root);
 else await run(resolve(backend,'scripts/wireFrontend.js'));
 await run(resolve(backend,'scripts/createAdmin.js'));
 await run(resolve(backend,'scripts/populateVehicleDatabase.js'));
 start('backend',process.execPath,[resolve(backend,'server.js')],backend);
 await waitFor(async()=>{const response=await fetch(`http://127.0.0.1:${process.env.PORT||5001}/api/health`);return response.ok;},'API');
 start('frontend',process.execPath,[resolve(root,'taxtron/frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5173','--strictPort'],resolve(root,'taxtron/frontend'));
 await waitFor(async()=>{const response=await fetch('http://127.0.0.1:5173');return response.ok;},'Frontend');
 console.log('\nVehicle Tokenization: http://127.0.0.1:5173\nAdmin: http://127.0.0.1:5173/admin/login\nLogs: .local/logs/\nPress Ctrl+C to stop services started by this command.');
}catch(error){console.error(error.message);stop(1);}
