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
  assert.match(html, /Custom labs generated in the browser are not uploaded to the server/i);
  assert.ok(
    controller.includes('$scope.getLabCurlExample = getLabCurlExample')
  );
});

test('curl example uses the current HTTP origin, including nonstandard ports', () => {
  const info = { description: 'Basic IPv4 Configurations, Ping, Traceroute, and ARP' };
  const expected = 'basic_ipv4_configurations_ping_traceroute_and_arp.zip';
  context.window = { location: { protocol: 'http:', origin: 'http://localhost:8080' } };
  try {
    const local = context.getLabCurlExample(info);
    assert.match(local, /http:\/\/localhost:8080\/labs\//);
    assert.ok(local.includes(expected));
    assert.doesNotMatch(local, /YOUR_SERVER/);
    context.window.location = { protocol: 'https:', origin: 'https://lab.example.org' };
    assert.match(context.getLabCurlExample(info), /https:\/\/lab[.]example[.]org\/labs\//);
  } finally {
    delete context.window;
  }
});

test('generated shell does not delete an existing laboratory or itself', () => {
  const script = context.makeScript(
    {
      folders: ['router1'],
      file: { 'lab.conf': 'LAB_AUTHOR="Jérôme A"\n' }
    },
    { description: 'Formation IPv6' }
  );

  assert.doesNotMatch(script, /rm -rf/);
  assert.doesNotMatch(script, /rm.*\$0/);

  assert.match(
    script,
    /if \[ -e "\$target_dir" \] \|\| \[ -L "\$target_dir" \]/
  );

  assert.match(script, /exit 1/);
});

test('configuration importer reads UTF-8 and removes only an optional BOM', () => {
  const controller = fs.readFileSync('src/lab-generator/controller.js', 'utf8');
  assert.ok(controller.includes('fileReader.readAsText(filePath, "UTF-8")'));
  assert.doesNotMatch(controller, /readAsBinaryString/);
  assert.ok(controller.includes('replace(/^\\uFEFF/, "")'));
  assert.ok(!controller.includes('substring(e.target.result.indexOf('));
});

test('UTF-8 lab export with BOM is valid after removing the BOM', () => {
  const original = [{ labInfo: { author: 'Jérôme A', description: 'Réseau IPv6' }, netkit: [] }];
  const exported = '\uFEFF' + JSON.stringify(original);
  const parsed = JSON.parse(exported.replace(/^\uFEFF/, ''));
  assert.equal(parsed[0].labInfo.author, 'Jérôme A');
  assert.equal(parsed[0].labInfo.description, 'Réseau IPv6');
});
