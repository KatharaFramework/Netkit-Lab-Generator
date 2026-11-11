const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('src/lab-generator/models/model.js', 'utf8') + '\n' +
  fs.readFileSync('src/lab-generator/kathara_catalog.js', 'utf8'), ctx);

test('three examples reference actual Kathara-Labs paths', () => {
  const entries = ctx.KatharaCatalog.list();
  assert.equal(entries.length, 3);
  assert.equal(new Set(entries.map(l => l.id)).size, 3);
  for (const entry of entries) {
    assert.match(entry.source, /^https:\/\/github[.]com\/KatharaFramework\/Kathara-Labs\/tree\/main\/main-labs\/basic-topics\//);
    assert.match(entry.description, /.+/);
    assert.ok(entry.limitations.length > 0);
  }
});

test('basic IPv4 example imports five machines, interfaces and routes', () => {
  const lab = ctx.KatharaCatalog.load('basic-ipv4');
  assert.equal(lab.netkit.length, 5);
  const r1 = lab.netkit.find(m => m.name === 'r1');
  assert.equal(r1.interfaces.if[0].eth.domain, 'A');
  assert.equal(r1.interfaces.if[0].ip, '195.11.14.1/24');
  assert.equal(r1.gateways.gw[0].route, '200.1.1.0/24');
  assert.equal(r1.gateways.gw[0].gw, '100.0.0.10');
  const pc1 = lab.netkit.find(m => m.name === 'pc1');
  assert.equal(pc1.gateways.gw[0].gw, '195.11.14.1');
});

test('static-routing example does not activate commented-out route commands', () => {
  const lab = ctx.KatharaCatalog.load('static-routing');
  assert.equal(lab.netkit.length, 4);
  assert.ok(lab.netkit.every(m => m.gateways.gw.every(g => !g.gw)));
});

test('two-computers example preserves the single collision domain', () => {
  const lab = ctx.KatharaCatalog.load('two-computers');
  assert.equal(lab.netkit.length, 2);
  assert.deepEqual(Array.from(lab.netkit, m => m.interfaces.if[0].eth.domain), ['A', 'A']);
});

test('loading an example returns an isolated editable copy', () => {
  const lab = ctx.KatharaCatalog.load('basic-ipv4');
  lab.netkit[0].name = 'changed';
  assert.notEqual(ctx.KatharaCatalog.load('basic-ipv4').netkit[0].name, 'changed');
  assert.throws(() => ctx.KatharaCatalog.load('unlisted-id'), /Unknown/);
});

test('Kathara catalog appears as a table with Load actions', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.match(html, /<table[^>]*id="kathara-labs-catalog"/);
  assert.match(html, /loadKatharaExample\(example[.]id\)/);
  assert.match(controller, /KatharaCatalog[.]list\(\)/);
  assert.match(controller, /KatharaCatalog[.]load\(id\)/);
});
