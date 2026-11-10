// Regression checks for network prefix computation in the topology preview.
// Run: node --test tests/topology-ip.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/lab-generator/make_draw_model.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const network = value => vm.runInContext('get_network_from_ip_net(' + JSON.stringify(value) + ')', context);
const suffix = (net, addr) => vm.runInContext('get_eth_ip_difference(' + JSON.stringify(net) + ',' + JSON.stringify(addr) + ')', context);

test('IPv4 /24 remains unchanged', () => {
  assert.equal(network('10.0.0.254/24'), '10.0.0.0/24');
  assert.equal(suffix('10.0.0.0/24', '10.0.0.254/24'), '254');
});
test('IPv4 /32 host route', () => assert.equal(network('192.0.2.5/32'), '192.0.2.5/32'));
test('IPv6 /64 computes network instead of NaN', () => {
  assert.equal(network('2001:db8:1::fe/64'), '2001:db8:1::/64');
  assert.equal(network('2001:db8:2::fe/64'), '2001:db8:2::/64');
});
test('IPv6 /128 and compressed address', () => {
  assert.equal(network('2001:db8::1/128'), '2001:db8::1/128');
  assert.equal(network('2001:db8::abcd/48'), '2001:db8::/48');
});
test('IPv6 interface suffix is readable', () => {
  assert.equal(suffix('2001:db8:1::/64', '2001:db8:1::fe/64'), '::fe');
});
