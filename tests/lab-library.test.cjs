const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/lab-generator/lab_library.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

test('library rejects invalid lab snapshots', () => {
  assert.throws(() => context.createLabSnapshot({}, []), /description/i);
  assert.throws(() => context.createLabSnapshot({ description: 'Example' }, {}), /machines/i);
});

test('library stores isolated snapshots and preserves accented metadata', () => {
  const info = { description: 'Réseau école', author: 'Jérôme A' };
  const machines = [{ name: 'pc1' }];
  const snapshot = context.createLabSnapshot(info, machines);
  info.author = 'Modified';
  machines[0].name = 'changed';
  assert.equal(snapshot.labInfo.author, 'Jérôme A');
  assert.equal(snapshot.netkit[0].name, 'pc1');
  assert.equal(snapshot.name, 'Réseau école');
});

test('library UI exposes save, load and delete controls', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.match(html, /saveLabToLibrary\(\)/);
  assert.match(html, /loadLabFromLibrary\(lab\.id\)/);
  assert.match(html, /deleteLabFromLibrary\(lab\.id\)/);
  assert.match(controller, /LabLibrary\.save/);
  assert.match(controller, /LabLibrary\.list/);
  assert.match(controller, /LabLibrary\.get/);
  assert.match(controller, /LabLibrary\.remove/);
});
