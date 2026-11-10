const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('src/lab-generator/make.js', 'utf8'), context);

function generatedLab(enabled) {
  const machine = {
    name: 'router1',
    type: 'router',
    routingSoftware: 'frr',
    routing: {
      rip: { en: enabled, network: [], route: [], free: '' },
      ospf: { en: false, network: [], if: [], free: '' },
      bgp: { en: false, network: [], remote: [], free: '' },
      frr: { free: '' }
    }
  };
  const lab = { folders: ['router1'], file: { 'router1.startup': '' } };
  context.makeRouterFrr(machine, lab);
  return lab;
}

test('FRR directory exists even without dynamic routing protocols', () => {
  const lab = generatedLab(false);
  assert.equal(lab.folders.includes('router1/etc/frr'), true);
  assert.equal(typeof lab.file['router1/etc/frr/frr.conf'], 'string');
  assert.equal(typeof lab.file['router1/etc/frr/vtysh.conf'], 'string');
  assert.match(context.makeScript(lab), /mkdir -p router1\/etc\/frr/);
});

test('FRR directory is not duplicated when a protocol is enabled', () => {
  const lab = generatedLab(true);
  assert.equal(lab.folders.filter(path => path === 'router1/etc/frr').length, 1);
  assert.equal(lab.file['router1/etc/frr/daemons'], 'zebra=yes\nripd=yes\n');
});
