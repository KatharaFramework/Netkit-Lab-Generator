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
