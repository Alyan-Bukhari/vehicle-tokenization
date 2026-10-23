import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(new URL('../taxtron/backend/package.json',import.meta.url));
const {Web3} = require('web3');
const source = readFileSync(new URL('../taxtron/frontend/src/utils/registrationPayment.js',import.meta.url),'utf8');
const {registrationPayment,sendRegistrationPayment} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const owner = '0x1111111111111111111111111111111111111111';
const inspection = {inspectionId:'INSP-PAYMENT',status:'Approved',registrationNumber:'QA-001',userId:{walletAddress:owner},vehicleDetails:{make:'QA',model:'Test',manufacturingYear:2026,engineNumber:'QE',chassisNumber:'QC',vehicleType:'SUV',engineCapacity:2000,totalFee:7000}};

test('registration value uses exact demo wei and encodes every ABI argument',()=>{
  const payment=registrationPayment(inspection);
  assert.equal(payment.value,'7000000000000000');
  assert.equal(payment.args.length,11);
  assert.equal(payment.args[9],payment.value);
  assert.ok(payment.args.every(value=>typeof value==='string'));
});
test('incomplete and unapproved inspections are rejected before any wallet request',()=>{
  assert.throws(()=>registrationPayment({...inspection,registrationNumber:''}),/missing required/);
  assert.throws(()=>registrationPayment({...inspection,status:'Pending'}),/approved/);
  assert.throws(()=>registrationPayment({...inspection,vehicleDetails:{...inspection.vehicleDetails,totalFee:NaN}}),/invalid/);
});
test('wrong owner and wrong chain cannot reach a payment transaction',async()=>{
  const web3={utils:new Web3().utils,eth:{getChainId:async()=>1n}};
  await assert.rejects(sendRegistrationPayment({web3,account:'0x2222222222222222222222222222222222222222',inspection}),/registered owner/);
  await assert.rejects(sendRegistrationPayment({web3,account:owner,inspection,chainId:11155111}),/wrong network/);
});
