const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/lab-generator/ip_validation.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const valid = value => vm.runInContext('validateIpNet(' + JSON.stringify(value) + ')', context);

test('form loads IPv4/IPv6 validator and checks on input', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /src\/lab-generator\/ip_validation\.js/);
  assert.match(html, /oninput="this\.setCustomValidity\(validateIpNet\(this\.value\)/);
});

test('existing IPv4 CIDR values remain valid', () => {
  for (const value of ['', '0.0.0.0/0', '10.0.0.1/24', '192.0.2.1/32']) {
    assert.equal(valid(value), true, value);
  }
});

test('IPv6 compressed, expanded and boundary prefixes are valid', () => {
  for (const value of ['2001:db8:1::1/64', '2001:db8:1::2/64', '::1/128', '::/0',
    '2001:0db8:0001:0000:0000:0000:0000:0001/64', 'fe80::1/10']) {
    assert.equal(valid(value), true, value);
  }
});

test('invalid IPv4 and IPv6 formats are rejected', () => {
  for (const value of ['10.0.0.1/33', '300.0.0.1/24', '2001:db8::1/129',
    '2001:db8::1/-1', '2001:db8:::1/64', '2001:db8:1/64', 'gggg::1/64',
    '1:2:3:4:5:6:7:8:9/64', '1.2.3.4', '::1']) {
    assert.equal(valid(value), false, value);
  }
});
