import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const backend=resolve(import.meta.dirname,'../taxtron/backend');
const result=spawnSync(process.execPath,['scripts/seedDemoData.js'],{cwd:backend,stdio:'inherit'});
process.exit(result.status||0);
