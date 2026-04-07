/*!
  Clash Verge / Mihomo balanced Sub-Store override
  Target: merged subscription -> full mihomo config

  Visible policy groups:
  - Proxy
  - Smart
  - Apple
  - AI
  - Telegram
  - Google
  - Streaming
  - Microsoft

  Optional script arguments:
  - ipv6=true|false      default: true
*/

const TEST_URL = "https://cp.cloudflare.com/generate_204";
const ICON_BASE = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color";
const CUSTOM_RULES = [
  // Add your own rules here. These rules are evaluated before the built-in rules.
  // Examples:
  // "DOMAIN-SUFFIX,example.com,AI",
  // "DOMAIN,api.example.com,Proxy",
  // "DOMAIN-SUFFIX,internal.example.com,DIRECT",
  "DOMAIN,meridian.diom.qzz.io,DIRECT",
  "DOMAIN,emby.diom.qzz.io,DIRECT",
  "DOMAIN,embermux.cc.cd,DIRECT",
  "DOMAIN-SUFFIX,micu.hk,DIRECT",
];

function parseBool(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function buildArgs() {
  const rawArgs = typeof $arguments !== "undefined" ? $arguments : {};
  return {
    ipv6Enabled: parseBool(rawArgs.ipv6, true),
  };
}

const { ipv6Enabled } = buildArgs();

const GROUP = {
  PROXY: "Proxy",
  SMART: "Smart",
  SMART_AUTO: "Smart Auto",
  APPLE: "Apple",
  AI: "AI",
  TELEGRAM: "Telegram",
  GOOGLE: "Google",
  STREAMING: "Streaming",
  MICROSOFT: "Microsoft",
};

const RULE_PROVIDERS = {
  Claude: {
    type: "http",
    behavior: "classical",
    url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.yaml",
    interval: 86400,
    proxy: GROUP.PROXY,
  },
  Gemini: {
    type: "http",
    behavior: "classical",
    url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Gemini/Gemini.yaml",
    interval: 86400,
    proxy: GROUP.PROXY,
  },
  OpenAI: {
    type: "http",
    behavior: "classical",
    url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml",
    interval: 86400,
    proxy: GROUP.PROXY,
  },
  GitHub: {
    type: "http",
    behavior: "classical",
    url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/GitHub/GitHub.yaml",
    interval: 86400,
    proxy: GROUP.PROXY,
  },
};

function buildVisibleGroup(groupName, proxies, icon) {
  return {
    name: groupName,
    type: "select",
    "include-all": true,
    proxies: unique(proxies),
    icon,
  };
}

function buildProxyGroups() {
  const baseCandidates = [GROUP.PROXY, "DIRECT"];

  return [
    buildVisibleGroup(GROUP.PROXY, [GROUP.SMART, "DIRECT"], `${ICON_BASE}/Proxy.png`),
    buildVisibleGroup(
      GROUP.SMART,
      [GROUP.SMART_AUTO, "DIRECT"],
      `${ICON_BASE}/Auto.png`
    ),
    buildVisibleGroup(GROUP.APPLE, baseCandidates, `${ICON_BASE}/Apple.png`),
    buildVisibleGroup(GROUP.AI, baseCandidates, `${ICON_BASE}/AI.png`),
    buildVisibleGroup(GROUP.TELEGRAM, baseCandidates, `${ICON_BASE}/Telegram.png`),
    buildVisibleGroup(GROUP.GOOGLE, baseCandidates, `${ICON_BASE}/Google_Search.png`),
    buildVisibleGroup(GROUP.STREAMING, baseCandidates, `${ICON_BASE}/YouTube.png`),
    buildVisibleGroup(GROUP.MICROSOFT, baseCandidates, `${ICON_BASE}/Microsoft.png`),
    {
      name: GROUP.SMART_AUTO,
      type: "url-test",
      "include-all": true,
      url: TEST_URL,
      interval: 180,
      tolerance: 30,
      lazy: true,
      hidden: true,
      icon: `${ICON_BASE}/Global.png`,
    },
  ];
}

function buildRules() {
  const builtInRules = [
    "AND,((NETWORK,UDP),(DST-PORT,443)),REJECT",
    "DOMAIN-SUFFIX,claude.ai,AI",
    "DOMAIN-SUFFIX,claude.com,AI",
    "DOMAIN-SUFFIX,claudeusercontent.com,AI",
    "DOMAIN-SUFFIX,anthropic.com,AI",
    "DOMAIN,cdn.usefathom.com,AI",
    "DOMAIN,alkalimakersuite-pa.clients6.google.com,AI",
    "DOMAIN-SUFFIX,gemini.google.com,AI",
    "DOMAIN-SUFFIX,ai.google.dev,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "DOMAIN-SUFFIX,makersuite.google.com,AI",
    "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,AI",
    "DOMAIN,api.openai.com,AI",
    "DOMAIN,platform.openai.com,AI",
    "DOMAIN-SUFFIX,openai.com,AI",
    "DOMAIN-SUFFIX,chatgpt.com,AI",
    "DOMAIN-SUFFIX,ai.com,AI",
    "DOMAIN-SUFFIX,oaistatic.com,AI",
    "DOMAIN-SUFFIX,oaiusercontent.com,AI",
    "RULE-SET,Claude,AI",
    "RULE-SET,Gemini,AI",
    "RULE-SET,OpenAI,AI",
    "RULE-SET,GitHub,Proxy",
    "GEOSITE,GITHUB,Proxy",
    "DOMAIN,services.googleapis.cn,Google",
    "GEOSITE,CATEGORY-AI-!CN,AI",
    "GEOSITE,TELEGRAM,Telegram",
    "GEOSITE,YOUTUBE,Streaming",
    "GEOSITE,NETFLIX,Streaming",
    "GEOSITE,DISNEY,Streaming",
    "GEOSITE,PRIMEVIDEO,Streaming",
    "GEOSITE,HBO,Streaming",
    "GEOSITE,BAHAMUT,Streaming",
    "GEOSITE,SPOTIFY,Streaming",
    "GEOSITE,APPLE@CN,DIRECT",
    "GEOSITE,APPLE,Apple",
    "GEOSITE,ONEDRIVE,Microsoft",
    "GEOSITE,MICROSOFT@CN,DIRECT",
    "GEOSITE,MICROSOFT,Microsoft",
    "GEOSITE,GOOGLE,Google",
    "GEOSITE,PRIVATE,DIRECT",
    "GEOSITE,CN,DIRECT",
    "GEOSITE,GFW,Proxy",
    "GEOSITE,GEOLOCATION-!CN,Proxy",
    "GEOIP,TELEGRAM,Telegram,no-resolve",
    "GEOIP,NETFLIX,Streaming,no-resolve",
    "GEOIP,PRIVATE,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT,no-resolve",
    "MATCH,Proxy",
  ];

  return [...CUSTOM_RULES, ...builtInRules];
}

function buildDnsConfig() {
  return {
    enable: true,
    ipv6: ipv6Enabled,
    "use-hosts": true,
    "use-system-hosts": true,
    "respect-rules": true,
    listen: "0.0.0.0:1053",
    "enhanced-mode": "fake-ip",
    "prefer-h3": false,
    "cache-algorithm": "arc",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": [
      "*.lan",
      "*.local",
      "localhost.ptlogin2.qq.com",
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      "+.market.xiaomi.com",
      "+.miwifi.com",
      "+.push.apple.com",
      "Mijia Cloud",
    ],
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    nameserver: [
      "https://dns.google/dns-query",
      "https://cloudflare-dns.com/dns-query",
    ],
    "nameserver-policy": {
      "geosite:private": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
      "geosite:cn": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
    },
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
    ],
    "direct-nameserver": [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
    ],
    "direct-nameserver-follow-policy": true,
  };
}

function buildSnifferConfig() {
  return {
    enable: true,
    "override-destination": true,
    sniff: {
      HTTP: {
        ports: [80, "8080-8880"],
        "override-destination": true,
      },
      TLS: {
        ports: [443, 8443],
        "override-destination": true,
      },
      QUIC: {
        ports: [443, 8443],
        "override-destination": true,
      },
    },
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "skip-domain": ["Mijia Cloud", "+.push.apple.com"],
  };
}

function buildTunConfig() {
  return {
    enable: true,
    stack: "mixed",
    "dns-hijack": ["any:53", "tcp://any:53"],
    "auto-route": true,
    "auto-redirect": true,
    "auto-detect-interface": true,
  };
}

function buildBaseConfig() {
  return {
    mode: "rule",
    "mixed-port": 7890,
    "allow-lan": true,
    ipv6: ipv6Enabled,
    "tcp-concurrent": true,
    "unified-delay": true,
    "find-process-mode": "strict",
    profile: {
      "store-selected": true,
      "store-fake-ip": true,
    },
    "rule-providers": RULE_PROVIDERS,
    sniffer: buildSnifferConfig(),
    tun: buildTunConfig(),
    dns: buildDnsConfig(),
    "proxy-groups": buildProxyGroups(),
    rules: buildRules(),
  };
}

// eslint-disable-next-line no-unused-vars
function main(config) {
  const baseConfig = buildBaseConfig();
  return Object.assign({}, baseConfig, {
    proxies: Array.isArray(config && config.proxies) ? config.proxies : [],
  });
}

if (typeof module !== "undefined") {
  module.exports = { main };
}
