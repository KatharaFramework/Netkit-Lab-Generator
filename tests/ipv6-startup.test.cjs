const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/lab-generator/make.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

function startup(machine) {
  const lab = { file: { [machine.name + '.startup']: '' } };
  context.makeStaticRouting([machine], lab);
  return lab.file[machine.name + '.startup'];
}
function machine(name, type, addresses, gateways = [], free = '') {
  return {
    name, type,
    interfaces: { if: addresses.map(([ip, number, domain]) => ({ ip, eth: { number, domain } })), free },
    gateways: { gw: gateways }
  };
}

test('IPv4 startup output is unchanged', () => {
  const result = startup(machine('pc1', 'terminal', [['10.0.0.1/24', 0, 'A']],
    [{ route: '', gw: '10.0.0.254', if: 0 }], 'ip -br a s'));
  assert.equal(result,
    'ip address add 10.0.0.1/24 dev eth0\n' +
    'ip route add 0.0.0.0/0 via 10.0.0.254 dev eth0\n' +
    '\nip -br a s\n');
});

test('IPv6 hosts generate address and default route', () => {
  const result = startup(machine('pc6', 'terminal', [['2001:db8:1::1/64', 0, 'A']],
    [{ route: '', gw: '2001:db8:1::fe', if: 0 }]));
  assert.match(result, /ip -6 address add 2001:db8:1::1\/64 dev eth0/);
  assert.match(result, /ip -6 route add ::\/0 via 2001:db8:1::fe dev eth0/);
  assert.doesNotMatch(result, /0\.0\.0\.0\/0/);
});

test('IPv6 router generates its static route without writing sysctl in startup', () => {
  const result = startup(machine('r1', 'router',
    [['2001:db8:1::fe/64', 0, 'A'], ['2001:db8:2::fe/64', 1, 'B']],
    [{ route: '2001:db8:3::/64', gw: '2001:db8:2::1', if: 1 }]));
  assert.doesNotMatch(result, /sysctl.*forwarding/);
  assert.match(result, /ip -6 route add 2001:db8:3::\/64 via 2001:db8:2::1 dev eth1/);
});

test('dual stack addresses and routes do not change IPv4 defaults', () => {
  const result = startup(machine('r2', 'router',
    [['10.0.0.254/24', 0, 'A'], ['2001:db8:1::fe/64', 1, 'B']],
    [{ route: '', gw: '10.0.0.1', if: 0 }, { route: '', gw: '2001:db8:1::1', if: 1 }]));
  assert.match(result, /ip address add 10\.0\.0\.254\/24 dev eth0/);
  assert.match(result, /ip -6 address add 2001:db8:1::fe\/64 dev eth1/);
  assert.match(result, /ip route add 0\.0\.0\.0\/0 via 10\.0\.0\.1 dev eth0/);
  assert.match(result, /ip -6 route add ::\/0 via 2001:db8:1::1 dev eth1/);
});

test('IPv4-only router has no IPv6 forwarding side effect', () => {
  const result = startup(machine('r4', 'router', [['10.0.0.254/24', 0, 'A']]));
  assert.doesNotMatch(result, /ipv6.*forwarding/);
});
