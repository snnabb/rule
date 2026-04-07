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

function parseBool(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
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
  const baseCandidates = [GROUP.SMART, "DIRECT"];

  return [
    buildVisibleGroup(GROUP.PROXY, baseCandidates, `${ICON_BASE}/Proxy.png`),
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
  return [
    "DOMAIN-SUFFIX,gemini.google.com,AI",
    "DOMAIN-SUFFIX,ai.google.dev,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,AI",
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
    "GEOSITE,GITHUB,Proxy",
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
    sniff: {
      HTTP: {
        ports: [80, "8080-8880"],
        "override-destination": true,
      },
      TLS: {
        ports: [443, 8443],
      },
      QUIC: {
        ports: [443, 8443],
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
