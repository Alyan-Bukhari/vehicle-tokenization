import {test, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../taxtron/frontend/src/utils/session.js',import.meta.url),'utf8');
const {hasSession,storedUser,expireSession} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const values = new Map();
globalThis.localStorage = {getItem:key=>values.get(key)||null,removeItem:key=>values.delete(key)};
globalThis.window = new EventTarget();
const token = exp => `header.${Buffer.from(JSON.stringify({exp})).toString('base64url')}.signature`;
beforeEach(()=>values.clear());

test('missing, malformed and expired sessions cannot open protected pages',()=>{
  for (const value of ['', 'invalid', token(Math.floor(Date.now()/1000)-1)]) {
    values.set('userToken',value);
    assert.equal(hasSession(),false);
  }
});
test('admin and owner sessions are independent',()=>{
  values.set('userToken',token(Math.floor(Date.now()/1000)+60));
  assert.equal(hasSession(),true);
  assert.equal(hasSession('admin'),false);
});
test('corrupt stored profiles do not crash route rendering',()=>{
  values.set('userData','{broken');
  assert.equal(storedUser(),null);
});
test('server-rejected sessions clear only the affected account and notify routing',()=>{
  values.set('adminToken','admin'); values.set('userToken','owner'); values.set('userData','{}');
  let role;
  window.addEventListener('session-expired',event=>{role=event.detail.role;},{once:true});
  expireSession('user');
  assert.equal(localStorage.getItem('userToken'),null);
  assert.equal(storedUser(),null);
  assert.equal(localStorage.getItem('adminToken'),'admin');
  assert.equal(role,'user');
});
