const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = () => fs.readFileSync('.github/workflows/publish-image.yml', 'utf8');

test('GHCR pipeline runs on master, version tags, and pull requests', () => {
  const yml = workflow();
  assert.match(yml, /pull_request:/);
  assert.match(yml, /branches:\s*\[master\]/);
  assert.match(yml, /v\*\.\*\.\*/);
  assert.match(yml, /workflow_dispatch:/);
});

test('tests must pass before the Docker build; PRs cannot publish', () => {
  const yml = workflow();
  assert.match(yml, /node --test tests\/\*\.test\.cjs/);
  assert.match(yml, /needs: test/);
  assert.match(yml, /push: \$\{\{ github\.event_name != 'pull_request' \}\}/);
  assert.match(yml, /if: github\.event_name != 'pull_request'/);
});

test('GHCR credentials use the scoped GITHUB_TOKEN', () => {
  const yml = workflow();
  assert.match(yml, /packages: write/);
  assert.match(yml, /contents: read/);
  assert.match(yml, /registry: ghcr\.io/);
  assert.match(yml, /secrets\.GITHUB_TOKEN/);
  assert.doesNotMatch(yml, /personal_access_token|DOCKER_PASSWORD/);
});

test('image identifiers are lower-case and carry latest, SHA and semver tags', () => {
  const yml = workflow();
  assert.match(yml, /GITHUB_REPOSITORY,,/);
  assert.match(yml, /type=raw,value=latest/);
  assert.match(yml, /type=sha/);
  assert.match(yml, /type=semver,pattern=/);
  assert.match(yml, /org\.opencontainers\.image\.source/);
});

test('prebuilt-image Compose deployment needs no local build', () => {
  const yml = fs.readFileSync('compose.ghcr.yaml', 'utf8');
  assert.match(yml, /ghcr\.io\/jadjay\/netkit-lab-generator:latest/);
  assert.match(yml, /8080:8080/);
  assert.doesNotMatch(yml, /\bbuild:/);
  assert.doesNotMatch(yml, /privileged:/);
});
