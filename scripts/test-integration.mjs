import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--test','tests/api.test.cjs'],{stdio:'inherit',env:{...process.env,RUN_CHAIN_TESTS:'1'}});
process.exit(result.status||0);
