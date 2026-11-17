'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const directory = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const artifacts = process.argv[3] ? path.resolve(process.argv[3]) :
  fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'clash-override-test-'));
fs.mkdirSync(artifacts, { recursive: true });
let passed = 0;

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function base() {
  return { proxies: [{ name: 'Sample HK', type: 'socks5', server: '127.0.0.1', port: 9901 }] };
}
function run(name, test) {
  try { test(); passed++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

for (const platform of ['desktop', 'fnos']) {
  const filename = path.join(directory, `clash-${platform}-override.js`);
  const { main } = require(filename);
  const prefix = `${platform}: `;
  run(prefix + 'script host does not need module or $arguments', () => {
    const context = vm.createContext({ input: clone(base()) });
    vm.runInContext(fs.readFileSync(filename, 'utf8') + '\noutput = main(input);', context, { timeout: 3000 });
    assert.equal(context.output.mode, 'rule');
  });
  run(prefix + 'source not mutated; repeated application stable', () => {
    const input = base();
    input['proxy-groups'] = [{ name: 'Old Proxy', type: 'select', proxies: ['Sample HK'] }];
    input.dns = { 'fake-ip-filter': ['+.custom.internal'], 'nameserver-policy': { '+.corp.example': ['10.0.0.53'] } };
    const before = clone(input);
    deepFreeze(input);
    const result = main(input);
    assert.deepEqual(input, before);
    assert.deepEqual(main(result), result);
    assert.deepEqual(main(base()), main(base()));
  });
  run(prefix + 'ports, access control, TUN, routing and hosts retained', () => {
    const input = Object.assign(base(), {
      'mixed-port': 17890, 'redir-port': 17892, 'tproxy-port': 17893,
      'socks-port': 17891, port: 17880,
      'allow-lan': true, 'bind-address': '192.0.2.10',
      authentication: ['local-only:test-fixture'],
      'lan-allowed-ips': ['192.0.2.0/24'],
      'external-controller': '127.0.0.1:19090', secret: 'test-fixture-only',
      'interface-name': 'eth0', 'routing-mark': 6666,
      'find-process-mode': 'off',
      tun: { enable: true, stack: 'system', 'auto-route': false, 'dns-hijack': ['any:53'] },
      listeners: [{ name: 'nikki-in', type: 'mixed', listen: '192.0.2.10', port: 17894, proxy: 'DIRECT' }],
      hosts: { 'nas.home.arpa': '192.0.2.10' },
      'sub-rules': { existing: ['MATCH,DIRECT'] },
      'geox-url': { geosite: 'https://example.invalid/custom.dat' },
      'geodata-mode': true,
      dns: { listen: '0.0.0.0:15353', 'enhanced-mode': 'redir-host', 'listen-routing-mark': 7 },
    });
    const result = main(deepFreeze(input));
    for (const key of Object.keys(input)) {
      if (['proxies', 'dns'].includes(key)) continue;
      assert.deepEqual(result[key], input[key], key);
    }
    assert.equal(result.dns.listen, input.dns.listen);
    assert.equal(result.dns['listen-routing-mark'], 7);
    assert.equal(result.dns['enhanced-mode'], 'redir-host');
  });
  run(prefix + 'profile defaults do not overwrite unrelated state', () => {
    const result = main({ ...base(), profile: { 'store-selected': false, custom: 'keep' } });
    assert.deepEqual(result.profile, { 'store-selected': true, 'store-fake-ip': true, custom: 'keep' });
  });
  run(prefix + 'platform defaults do not invent fnOS listeners', () => {
    const result = main(base());
    if (platform === 'desktop') {
      assert.equal(result['mixed-port'], 7890);
      assert.equal(result['allow-lan'], false);
      assert.equal(result.tun.enable, false);
    } else {
      for (const key of ['mixed-port', 'redir-port', 'tproxy-port', 'allow-lan', 'bind-address', 'tun', 'external-controller']) {
        assert.equal(Object.hasOwn(result, key), false, key);
      }
    }
    assert.equal(result['proxy-groups'].find(g => g.name === 'OVR Auto').interval, platform === 'desktop' ? 120 : 300);
  });
  run(prefix + 'DNS upstream separation and fallback removal', () => {
    const input = { ...base(), dns: { fallback: ['8.8.8.8'], 'fallback-filter': { geoip: true }, 'fallback-lazy-query': true } };
    const dns = main(input).dns;
    assert(dns.nameserver.every(url => url.endsWith('#OVR Proxy')));
    assert(dns['proxy-server-nameserver'].every(url => url.endsWith('#DIRECT')));
    assert(dns['direct-nameserver'].every(url => url.endsWith('#DIRECT')));
    assert.equal(dns['direct-nameserver-follow-policy'], true);
    for (const key of ['fallback', 'fallback-filter', 'fallback-lazy-query']) assert(!Object.hasOwn(dns, key));
  });
  run(prefix + 'LAN policy preservation, private fallback and ordering', () => {
    const policy = main({ ...base(), dns: {
      'nameserver-policy': {
        'geosite:cn': ['old-cn'],
        '+.lan': ['10.0.0.53'],
        '+.nas.home.arpa': ['10.0.0.54'],
        'rule-set:custom-private': ['10.0.0.55'],
      },
    }}).dns['nameserver-policy'];
    assert.deepEqual(policy['+.lan'], ['10.0.0.53']);
    assert.deepEqual(policy['+.nas.home.arpa'], ['10.0.0.54']);
    assert.deepEqual(policy['+.local'], ['rcode://success']);
    const keys = Object.keys(policy);
    assert(keys.indexOf('+.micu.hk') < keys.indexOf('geosite:cn'));
    assert(keys.indexOf('+.lan') < keys.indexOf('geosite:cn'));
    assert(keys.indexOf('+.nas.home.arpa') < keys.indexOf('geosite:private'));
    assert(policy['geosite:cn'].every(url => url.endsWith('#DIRECT')));
  });
  run(prefix + 'blacklist extends without duplicates; other filter modes unchanged', () => {
    const black = main({ ...base(), dns: { 'fake-ip-filter': ['+.lan', '+.custom'] } }).dns;
    assert(black['fake-ip-filter'].includes('+.custom'));
    assert.equal(black['fake-ip-filter'].filter(x => x === '+.lan').length, 1);
    for (const mode of ['whitelist', 'rule']) {
      const filter = mode === 'rule' ? ['MATCH,fake-ip'] : ['+.example.com'];
      const result = main({ ...base(), dns: { 'fake-ip-filter-mode': mode, 'fake-ip-filter': filter } }).dns;
      assert.deepEqual(result['fake-ip-filter'], filter);
      assert.equal(result['fake-ip-filter-mode'], mode);
    }
  });
  run(prefix + 'IPv6, real DNS mode, fake range and custom node policy preserved', () => {
    const input = { ...base(), ipv6: true, dns: {
      ipv6: false, 'fake-ip-range': '198.19.0.1/16',
      'fake-ip-range6': 'fd12:3456::1/64',
      'proxy-server-nameserver-policy': { '+.node.example': ['10.0.0.53'] },
      'default-nameserver': ['223.6.6.6'],
    }};
    const result = main(input);
    assert.equal(result.ipv6, true);
    assert.equal(result.dns.ipv6, false);
    for (const key of ['fake-ip-range', 'fake-ip-range6', 'proxy-server-nameserver-policy', 'default-nameserver']) {
      assert.deepEqual(result.dns[key], input.dns[key]);
    }
  });
  run(prefix + 'exact domains and combined DNS policies cannot shadow managed rules', () => {
    const result = main({ ...base(), dns: { 'nameserver-policy': {
      'micu.hk': ['8.8.8.8'], '*.777870.xyz': ['8.8.4.4'],
      'geosite:cn,geolocation-!cn': ['https://old.example/dns-query'],
      'rule-set:local-a,local-b': ['10.0.0.53'],
    }}});
    const policy = result.dns['nameserver-policy'];
    assert(!Object.hasOwn(policy, 'micu.hk'));
    assert(!Object.hasOwn(policy, '*.777870.xyz'));
    assert(!Object.hasOwn(policy, 'geosite:cn,geolocation-!cn'));
    assert.deepEqual(policy['+.micu.hk'], ['https://dns.alidns.com/dns-query#DIRECT']);
    assert(policy['geosite:cn'].every(url => url.endsWith('#DIRECT')));
    assert.deepEqual(policy['geosite:geolocation-!cn'], ['https://old.example/dns-query']);
    assert.deepEqual(policy['rule-set:local-a'], ['10.0.0.53']);
    assert.deepEqual(main(result), result);
  });
  run(prefix + 'explicit empty IPv4 fake pool preserved', () => {
    const result = main({ ...base(), ipv6: true, dns: { 'fake-ip-range': '', 'fake-ip-range6': 'fd12:3456::1/64' } });
    assert.equal(result.dns['fake-ip-range'], '');
  });
  run(prefix + 'Copilot, AI and media precede broad services', () => {
    const rules = main(base()).rules;
    assert(rules.indexOf('DOMAIN-SUFFIX,githubcopilot.com,OVR AI') < rules.indexOf('RULE-SET,OVR-GitHub,OVR Proxy'));
    assert(rules.indexOf('DOMAIN,copilot-proxy.githubusercontent.com,OVR AI') < rules.indexOf('RULE-SET,OVR-GitHub,OVR Proxy'));
    assert(rules.indexOf('RULE-SET,OVR-AI-Global,OVR AI') < rules.indexOf('RULE-SET,OVR-GitHub,OVR Proxy'));
    assert(rules.indexOf('RULE-SET,OVR-YouTube,OVR Streaming') < rules.indexOf('GEOSITE,GOOGLE,OVR Google'));
    assert.equal(rules.at(-1), 'MATCH,OVR Proxy');
    assert(rules.includes('DOMAIN-SUFFIX,micu.hk,DIRECT'));
  });
  run(prefix + 'old valid dialer chains and provider download references survive', () => {
    const input = {
      proxies: [
        { name: 'Relay', type: 'socks5', server: '127.0.0.1', port: 9901 },
        { name: 'Chained', type: 'socks5', server: '127.0.0.1', port: 9902, 'dialer-proxy': 'Old Proxy' },
      ],
      'proxy-groups': [
        { name: 'Old Proxy', type: 'select', proxies: ['Relay'] },
        { name: 'Downloads', type: 'select', use: ['remote'] },
        { name: 'OVR Custom', type: 'select', proxies: ['DIRECT'] },
      ],
      'proxy-providers': { remote: { type: 'http', url: 'https://example.invalid/nodes', proxy: 'Downloads' } },
      'rule-providers': { old: { type: 'inline', behavior: 'classical', payload: ['DOMAIN,old.example'], proxy: 'Old Proxy' } },
    };
    const result = main(deepFreeze(input));
    assert.deepEqual(result['proxy-providers'], input['proxy-providers']);
    assert.deepEqual(result['rule-providers'].old, input['rule-providers'].old);
    assert.equal(result['proxy-groups'].find(g => g.name === 'OVR Custom').hidden, true);
    assert.equal(result.proxies[1]['dialer-proxy'], 'Old Proxy');
    assert.equal(result['proxy-groups'].find(g => g.name === 'Old Proxy').proxies[0], 'Relay');
    assert.deepEqual(main(result), result);
  });
  run(prefix + 'provider-only config supported; empty input rejected', () => {
    assert(main({ 'proxy-providers': { sub: { type: 'file', path: './nodes.yaml' } } }));
    assert.throws(() => main({}), /没有节点/);
    assert.throws(() => main(null), /配置对象/);
  });
  run(prefix + 'explicit GLOBAL selector remains compatible', () => {
    const input = { ...base(), 'proxy-groups': [{ name: 'GLOBAL', type: 'select', proxies: ['Sample HK', 'DIRECT'] }] };
    const result = main(input);
    assert.equal(result['proxy-groups'].find(g => g.name === 'GLOBAL').hidden, true);
    assert.deepEqual(main(result), result);
    assert.throws(() => main({ ...base(), 'proxy-groups': [input['proxy-groups'][0], input['proxy-groups'][0]] }), /重复/);
  });
  run(prefix + 'namespace collisions rejected', () => {
    assert.throws(() => main({ proxies: [{ ...base().proxies[0], name: 'OVR Proxy' }] }), /冲突/);
    assert.throws(() => main({ ...base(), 'proxy-groups': [{ name: 'OVR Proxy', type: 'select', proxies: ['DIRECT'] }] }), /占用/);
    assert.throws(() => main({ ...base(), 'rule-providers': { 'OVR-GitHub': { type: 'inline' } } }), /占用/);
  });
  run(prefix + 'known missing references and group-node cycles rejected', () => {
    assert.throws(() => main({ ...base(), 'proxy-groups': [{ name: 'Bad', type: 'select', proxies: ['Missing'] }] }), /不存在/);
    assert.throws(() => main({ ...base(), 'proxy-groups': [{ name: 'Bad', type: 'select', use: ['missing'] }] }), /不存在/);
    assert.throws(() => main({
      proxies: [{ ...base().proxies[0], 'dialer-proxy': 'Loop' }],
      'proxy-groups': [{ name: 'Loop', type: 'select', proxies: ['Sample HK'] }],
    }), /成环/);
    assert.throws(() => main({ proxies: [{ ...base().proxies[0], 'dialer-proxy': 'OVR Proxy' }] }), /成环/);
  });
  run(prefix + 'generated rule and DNS policy references exist', () => {
    const output = main(base());
    const groups = new Set(output['proxy-groups'].map(g => g.name));
    const rulesets = new Set(Object.keys(output['rule-providers']));
    for (const rule of output.rules) {
      const parts = rule.split(',');
      if (parts[0] === 'RULE-SET') assert(rulesets.has(parts[1]), rule);
      const target = parts[parts.length - (parts.at(-1) === 'no-resolve' ? 2 : 1)];
      assert(target === 'DIRECT' || groups.has(target), rule);
    }
    for (const server of output.dns.nameserver) assert(groups.has(server.split('#')[1]));
    assert(output['proxy-groups'].every(g => !Object.hasOwn(g, 'fast-open-check')));
  });
  fs.writeFileSync(path.join(artifacts, `${platform}.json`), JSON.stringify(main(base()), null, 2));
}
console.log(`PASS: ${passed} behavior checks across both overrides.`);
