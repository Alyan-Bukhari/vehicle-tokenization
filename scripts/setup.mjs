import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
export function run(command,args,cwd=root) {if(command==='npm' && process.platform==='win32')command='npm.cmd';return new Promise((ok,fail)=>{const child=spawn(command,args,{cwd,stdio:'inherit',env:process.env});child.on('error',fail);child.on('exit',code=>code===0?ok():fail(new Error(`${command} exited with ${code}`)));});}
if(Number(process.versions.node.split('.')[0])<22) throw new Error('Use Node.js 22.12 or newer.');
for(const folder of ['backend','frontend']) {
 const directory=resolve(root,'taxtron',folder);
 const env=resolve(directory,'.env');
 if(!existsSync(env)) writeFileSync(env,readFileSync(resolve(directory,'.env.example'),'utf8').replace('replace-with-a-random-secret',randomBytes(32).toString('hex')));
 await run('npm',['install','--fetch-timeout=300000'],directory);
}
mkdirSync(resolve(root,'.local'),{recursive:true});
const mongod=resolve(root,'.local/mongodb/bin/mongod');
if(!existsSync(mongod) && process.platform==='darwin') {
 const arch=process.arch==='arm64'?'arm64':'x86_64';
 const archive=resolve(root,'.local/mongodb.tgz');
 await run('curl',['-fL','--retry','3','-o',archive,`https://fastdl.mongodb.org/osx/mongodb-macos-${arch}-7.0.45.tgz`]);
 mkdirSync(resolve(root,'.local/mongodb'),{recursive:true});
 await run('tar',['-xzf',archive,'--strip-components=1','-C',resolve(root,'.local/mongodb')]);
}
console.log('Setup complete. Run npm run dev. On Linux/Windows, start MongoDB first or use docker compose up -d.');
