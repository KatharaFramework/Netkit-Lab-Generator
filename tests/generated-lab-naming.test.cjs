const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/lab-generator/make.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

test('description creates a safe script name and matching directory', () => {
  assert.equal(context.getLabSlug('Labo IPv6 : Réseaux & routeurs !'), 'labo_ipv6_reseaux_routeurs');
  assert.equal(context.getLabScriptFilename({ description: 'Labo IPv6 : Réseaux & routeurs !' }), 'labo_ipv6_reseaux_routeurs.sh');
  const script = context.makeScript({ folders: [], file: { 'lab.conf': '' } }, { description: 'Labo IPv6 : Réseaux & routeurs !' });
  assert.match(script, /\/labo_ipv6_reseaux_routeurs/);
});

test('unsafe, empty and path-traversal descriptions have safe fallback', () => {
  for (const description of ['', '../..', '💡']) {
    assert.equal(context.getLabSlug(description), 'lab');
  }
  assert.equal(context.getLabSlug('Été    2026'), 'ete_2026');
});

test('UTF-8 author and description metadata are preserved', () => {
  const lab = { file: {} };
  context.makeLabInfo({ description: 'Réseau été', author: 'Jérôme A' }, lab);
  assert.match(lab.file['lab.conf'], /LAB_DESCRIPTION="Réseau été"/);
  assert.match(lab.file['lab.conf'], /LAB_AUTHOR="Jérôme A"/);
});

test('generator script handles apostrophes in metadata', () => {
  const script = context.makeScript({ folders: [], file: { 'lab.conf': 'LAB_AUTHOR="L\'Équipe"\n' } }, { description: 'Formation d\'été' });
  assert.match(script, /LAB_AUTHOR/);
  assert.match(script, /formation_d_ete/);
});

test('configuration and archive share the normalized description stem', () => {
  const info = { description: 'Labo IPv6 : Réseaux & routeurs !' };
  assert.equal(context.getLabConfigFilename(info), 'labo_ipv6_reseaux_routeurs.config');
  assert.equal(context.getLabZipFilename(info), 'labo_ipv6_reseaux_routeurs.zip');
});

test('export controls use the description-based filenames', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.match(html, /getLabConfigFilename\(labInfo\)/);
  assert.match(controller, /\$scope\.getLabZipFilename = getLabZipFilename/);
});

test('downloads use a native picker where supported and a fallback otherwise', () => {
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.match(controller, /showSaveFilePicker/);
  assert.match(controller, /createWritable/);
  assert.match(controller, /saveAs\(/);
  assert.match(controller, /AbortError/);
});

test('zip generation returns a Blob for the same saving flow as other exports', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.match(html, /saveGeneratedFile\(generateZip\(netkit, labInfo\), getLabZipFilename\(labInfo\)\)/);
  assert.match(controller, /\$scope\.getLabZipFilename = getLabZipFilename/);
});

test('curl block shows a clearly non-functional HTTP template with lab ZIP name', () => {
  const info = { description: 'Labo IPv6 : Réseaux' };
  const cmd = context.getLabCurlExample(info);

  assert.match(cmd, /^curl -fL /);
  assert.match(cmd, /YOUR_SERVER/);
  assert.match(cmd, /labo_ipv6_reseaux[.]zip/);

  const html = fs.readFileSync('index.html', 'utf8');
  const controller = fs.readFileSync(
    'src/lab-generator/controller.js',
    'utf8'
  );

  assert.ok(html.includes('getLabCurlExample(labInfo)'));
  assert.match(html, /not available without an HTTP server/i);
  assert.ok(
    controller.includes('$scope.getLabCurlExample = getLabCurlExample')
  );
});
