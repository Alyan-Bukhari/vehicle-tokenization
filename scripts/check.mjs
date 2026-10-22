import {readdirSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
let failed=false;
function visit(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){if(['node_modules','build','dist','tmp','uploads','.git','.local'].includes(entry.name))continue;const file=resolve(directory,entry.name);if(entry.isDirectory())visit(file);else if(file.endsWith('.js') && file.includes('/backend/')){if(spawnSync(process.execPath,['--check',file],{stdio:'inherit'}).status)failed=true;}}}
visit(root);
if(failed)process.exit(1);console.log('Backend JavaScript syntax checks passed.');
