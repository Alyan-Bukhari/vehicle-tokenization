import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const backend=resolve(root,'taxtron/backend');
for(const [script,args] of [[resolve(root,'node_modules/truffle/build/cli.bundled.js'),['migrate','--reset','--network','development']], [resolve(backend,'scripts/wireFrontend.js'),[]]]) {
 const result=spawnSync(process.execPath,[script,...args],{cwd:backend,stdio:'inherit',env:process.env});
 if(result.status!==0) process.exit(result.status||1);
}
