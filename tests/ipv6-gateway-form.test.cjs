const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('src/lab-generator/ip_validation.js','utf8'), context);
const address = value => vm.runInContext('validateIpAddress(' + JSON.stringify(value) + ')', context);

test('gateway field validates IPv4 and IPv6 literals', () => {
  for (const value of ['', '10.0.0.254', '2001:db8:1::fe', 'fe80::1']) {
    assert.equal(address(value), true, value);
  }
  for (const value of ['10.0.0.500', '2001:db8:::1', '2001:db8::1/64', 'invalid']) {
    assert.equal(address(value), false, value);
  }
});
test('route and gateway fields use the dual-family validators', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /oninput="this\.setCustomValidity\(validateIpAddress\(this\.value\)/);
  assert.match(html, /placeholder="0\.0\.0\.0\/0 or 2001:db8::\/64"/);
});
