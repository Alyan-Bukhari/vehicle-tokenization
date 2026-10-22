import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'https://vehicle-tokenization-alyans-projects-96f48c85.vercel.app');
async function get(path, json = true) {
  const response = await fetch(new URL(path, base), {redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}. A redirect to Vercel sign-in means the address is protected; attach it as a project production domain.`);
  if (!json) return response.text();
  assert.match(response.headers.get('content-type') || '', /application\/json/, `${path}: expected API JSON, not a login or frontend page.`);
  return response.json();
}

try {
  const health = await get('/api/health');
  assert.equal(health.success, true);
  assert.equal(health.database?.status, 'connected');
  console.log('Public API and MongoDB ping: passed');
  const makes = await get('/api/vehicle-database/makes');
  assert.equal(makes.success, true);
  assert.ok(Array.isArray(makes.data) && makes.data.length > 0);
  console.log('MongoDB catalogue read: passed');
  const wallet = await get('/api/users/check-wallet/0x0000000000000000000000000000000000000001');
  assert.equal(wallet.success, true);
  const appointments = await get('/api/appointments/available');
  assert.equal(appointments.success, true);
  assert.ok(Array.isArray(appointments.data));
  console.log('Wallet lookup and appointment availability: passed');
  for (const path of ['/', '/login', '/admin/login']) assert.match(await get(path,false), /<div id="root">/);
  console.log('Homepage and sign-in deep links: passed');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
