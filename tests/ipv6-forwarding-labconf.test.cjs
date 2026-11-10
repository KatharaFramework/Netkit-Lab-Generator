const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('src/lab-generator/make.js', 'utf8'), context);

function generate(type, addresses) {
  const machine = {
    name: 'r1', type, routingSoftware: 'frr',
    interfaces: { if: addresses.map(([ip, number]) => ({ ip, eth: { number, domain: String(number) } })), free: '' },
    gateways: { gw: [] }
  };
  const lab = { file: { 'lab.conf': '', 'r1.startup': '' } };
  context.makeLabConfFile([machine], lab);
  context.makeStaticRouting([machine], lab);
  return lab.file;
}

test('IPv6 router forwarding is configured at container creation in lab.conf', () => {
  const files = generate('router', [['2001:db8:1::fe/64', 0], ['2001:db8:2::fe/64', 1]]);
  assert.match(files['lab.conf'], /r1\[sysctl\]="net\.ipv6\.conf\.all\.forwarding=1"/);
  assert.doesNotMatch(files['r1.startup'], /sysctl.*forwarding/);
  assert.match(files['r1.startup'], /ip -6 address add 2001:db8:1::fe\/64 dev eth0/);
});

test('IPv4-only routers do not receive IPv6 forwarding settings', () => {
  const files = generate('router', [['192.0.2.254/24', 0]]);
  assert.doesNotMatch(files['lab.conf'], /ipv6\.conf\.all\.forwarding/);
  assert.doesNotMatch(files['r1.startup'], /ipv6\.conf\.all\.forwarding/);
});

test('IPv6 terminal is not given router forwarding', () => {
  const files = generate('terminal', [['2001:db8:1::1/64', 0]]);
  assert.doesNotMatch(files['lab.conf'], /ipv6\.conf\.all\.forwarding/);
});
