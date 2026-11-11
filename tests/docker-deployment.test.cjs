const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Docker builds a static non-root web image without Electron', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  assert.match(dockerfile, /FROM nginxinc\/nginx-unprivileged:[^\s]+/);
  assert.match(dockerfile, /COPY index[.]html/);
  assert.match(dockerfile, /COPY src\//);
  assert.doesNotMatch(dockerfile, /npm (install|ci)|electron-forge|docker[.]sock/);
  assert.match(dockerfile, /EXPOSE 8080/);
});

test('Nginx serves actual files and does not cache application HTML', () => {
  const config = fs.readFileSync('docker/nginx.conf', 'utf8');
  assert.match(config, /listen 8080/);
  assert.match(config, /try_files \$uri \$uri\/ =404/);
  assert.match(config, /index index[.]html/);
  assert.match(config, /Cache-Control.*no-cache/);
});

test('Compose publishes only the static web service', () => {
  const compose = fs.readFileSync('compose.yaml', 'utf8');
  assert.match(compose, /8080:8080/);
  assert.doesNotMatch(compose, /privileged: true|docker[.]sock/);
});

test('Docker context excludes runtime and development metadata', () => {
  const ignore = fs.readFileSync('.dockerignore', 'utf8');
  assert.match(ignore, /node_modules/);
  assert.match(ignore, /[.]git/);
  assert.match(ignore, /tests/);
});

test('Docker image publishes three pinned native Kathará example ZIPs', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  assert.match(dockerfile, /COPY --from=lab-archives \/labs\/ \/usr\/share\/nginx\/html\/labs\//);
  assert.match(dockerfile, /KatharaFramework\/Kathara-Labs/);
  assert.match(dockerfile, /[0-9a-f]{40}/);
  for (const name of [
    'a_simple_example_two_computers_on_a_single_lan',
    'basic_ipv4_configurations_ping_traceroute_and_arp',
    'a_simple_example_showing_how_to_configure_static_routes'
  ]) {
    assert.ok(dockerfile.includes(name + '.zip'), name + ' missing');
  }
});

test('Nginx serves native example ZIPs with correct content type and no fallback', () => {
  const config = fs.readFileSync('docker/nginx.conf', 'utf8');
  assert.match(config, /location \/labs\//);
  assert.match(config, /application\/zip/);
  assert.match(config, /try_files \$uri =404/);
});
