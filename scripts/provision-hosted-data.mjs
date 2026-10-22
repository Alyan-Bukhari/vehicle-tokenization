import fs from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const env=JSON.parse(fs.readFileSync(resolve(root,'.local/cloud/production-env.json')));
if(!env.MONGO_URI?.startsWith('mongodb+srv://'))throw new Error('Hosted MongoDB configuration is required.');
for(const script of ['scripts/createAdmin.js','scripts/populateVehicleDatabase.js']) {
 const result=spawnSync(process.execPath,[script],{cwd:resolve(root,'taxtron/backend'),env:{...process.env,...env},stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
