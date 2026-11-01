/*!
  Clash Verge / Mihomo smart auto Sub-Store override
  Target: merged subscription -> full mihomo config

  Visible policy groups:
  - Proxy
  - Apple
  - AI
  - Telegram
  - Google
  - Streaming
  - Microsoft
  - Emby
  - Gaming
  - Bilibili

  Optional script arguments:
  - ipv6=true|false      default: false
  - tun=true|false       default: false
*/

// gstatic generate_204: 204 响应更快更小，且更贴近"这个节点能不能出网"的判断
const TEST_URL = "http://www.gstatic.com/generate_204";
const ICON_BASE = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color";
const CUSTOM_RULES = [
  // Send Cloudflare Tunnel transport directly, without an upstream proxy.
  "DOMAIN-SUFFIX,argotunnel.com,DIRECT",
  // Add your own rules here. These rules are evaluated before the built-in rules.
  // Examples:
  // "DOMAIN-SUFFIX,example.com,AI",
  // "DOMAIN,api.example.com,Proxy",
  // "DOMAIN-SUFFIX,internal.example.com,DIRECT",
    "DOMAIN-SUFFIX,chapanda.sbs,Emby",
    "DOMAIN-SUFFIX,yuntv.de,DIRECT",
    "DOMAIN-SUFFIX,micu.hk,DIRECT",
    "DOMAIN-SUFFIX,er8mm.mobaiemby.site,Emby",
    "DOMAIN-SUFFIX,lightting.net,Emby",
    "DOMAIN-SUFFIX,emby.diom.qzz.io,DIRECT",
    "DOMAIN-SUFFIX,777870.xyz,DIRECT",
    "DOMAIN-SUFFIX,420128.xyz,DIRECT",
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
    ipv6Enabled: parseBool(rawArgs.ipv6, false),
    tunEnabled: parseBool(rawArgs.tun, false),
  };
}

const { ipv6Enabled, tunEnabled } = buildArgs();

const GROUP = {
  PROXY: "Proxy",
  AUTO: "Auto",
  SMART_AUTO: "Smart Auto",
  APPLE: "Apple",
  AI: "AI",
  TELEGRAM: "Telegram",
  GOOGLE: "Google",
  STREAMING: "Streaming",
  MICROSOFT: "Microsoft",
  EMBY: "Emby",
  GAMING: "Gaming",
  BILIBILI: "Bilibili",
};

const RULE_PROVIDER_BASE =
  "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash";

function buildClassicalRuleProvider(name) {
  return {
    type: "http",
    behavior: "classical",
    format: "yaml",
    url: `${RULE_PROVIDER_BASE}/${name}/${name}_No_Resolve.yaml`,
    interval: 86400,
  };
}

const RULE_PROVIDERS = {
  GitHub: buildClassicalRuleProvider("GitHub"),
  Telegram: buildClassicalRuleProvider("Telegram"),
  YouTube: buildClassicalRuleProvider("YouTube"),
  Netflix: buildClassicalRuleProvider("Netflix"),
  Disney: buildClassicalRuleProvider("Disney"),
  PrimeVideo: buildClassicalRuleProvider("PrimeVideo"),
  HBO: buildClassicalRuleProvider("HBO"),
  Bahamut: buildClassicalRuleProvider("Bahamut"),
  Spotify: buildClassicalRuleProvider("Spotify"),
  TikTok: buildClassicalRuleProvider("TikTok"),
  BiliBili: buildClassicalRuleProvider("BiliBili"),
  Emby: buildClassicalRuleProvider("Emby"),
  Steam: buildClassicalRuleProvider("Steam"),
  Epic: buildClassicalRuleProvider("Epic"),
  PlayStation: buildClassicalRuleProvider("PlayStation"),
  Xbox: buildClassicalRuleProvider("Xbox"),
  Nintendo: buildClassicalRuleProvider("Nintendo"),
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
    buildVisibleGroup(
      GROUP.PROXY,
      [GROUP.AUTO, "DIRECT"],
      `${ICON_BASE}/Proxy.png`
    ),
    buildVisibleGroup(GROUP.TELEGRAM, baseCandidates, `${ICON_BASE}/Telegram.png`),
    buildVisibleGroup(GROUP.AI, baseCandidates, `${ICON_BASE}/AI.png`),
    buildVisibleGroup(GROUP.GOOGLE, baseCandidates, `${ICON_BASE}/Google_Search.png`),
    buildVisibleGroup(GROUP.GAMING, baseCandidates, `${ICON_BASE}/Game.png`),
    buildVisibleGroup(GROUP.STREAMING, baseCandidates, `${ICON_BASE}/YouTube.png`),
    buildVisibleGroup(GROUP.BILIBILI, ["DIRECT", GROUP.PROXY], `${ICON_BASE}/bilibili.png`),
    buildVisibleGroup(GROUP.APPLE, baseCandidates, `${ICON_BASE}/Apple.png`),
    buildVisibleGroup(GROUP.MICROSOFT, baseCandidates, `${ICON_BASE}/Microsoft.png`),
    buildVisibleGroup(GROUP.EMBY, baseCandidates, `${ICON_BASE}/Emby.png`),
    {
      name: GROUP.SMART_AUTO,
      type: "url-test",
      "include-all": true,
      url: TEST_URL,
      // 健康检查节奏：interval × max-failed-times 就是最坏情况下的切换延迟
      interval: 120,          // 2 分钟一轮（原 300 × 3 次 = 最坏 15 分钟才切）
      "max-failed-times": 2,  // 连续 2 次失败即淘汰，单次抖动不至于误杀
      lazy: false,            // 关键：空闲时也照常探测，否则没流量就不测、挂了也不知道
      tolerance: 50,          // 新节点快 50ms 以上才切换，避免来回抖
      timeout: 3000,
      "expected-status": 204,
      "fast-open-check": false,
      hidden: true,
      icon: `${ICON_BASE}/Global.png`,
    },
    {
      // 整组级降级：Smart Auto 全部节点都不可用时自动落到 DIRECT，
      // 而不是死守一个已经死掉的节点（长断线大多卡在这一层）
      name: GROUP.AUTO,
      type: "fallback",
      proxies: [GROUP.SMART_AUTO, "DIRECT"],
      url: TEST_URL,
      interval: 60,
      "max-failed-times": 1,
      lazy: false,
      timeout: 3000,
      "expected-status": 204,
      "fast-open-check": false,
      icon: `${ICON_BASE}/Global.png`,
    },
  ];
}

function buildRules() {
  const builtInRules = [
    "GEOSITE,PRIVATE,DIRECT",
    "GEOIP,PRIVATE,DIRECT,no-resolve",
    "DOMAIN-SUFFIX,claude.ai,AI",
    "DOMAIN-SUFFIX,claude.com,AI",
    "DOMAIN-SUFFIX,claudeusercontent.com,AI",
    "DOMAIN-SUFFIX,anthropic.com,AI",
    "DOMAIN-SUFFIX,gemini.google.com,AI",
    "DOMAIN-SUFFIX,ai.google.dev,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "DOMAIN-SUFFIX,makersuite.google.com,AI",
    "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,AI",
    "DOMAIN-SUFFIX,openai.com,AI",
    "DOMAIN-SUFFIX,chatgpt.com,AI",
    "DOMAIN-SUFFIX,ai.com,AI",
    "DOMAIN-SUFFIX,oaistatic.com,AI",
    "DOMAIN-SUFFIX,oaiusercontent.com,AI",
    "RULE-SET,GitHub,Proxy",
    "DOMAIN,services.googleapis.cn,Google",
    "GEOSITE,CATEGORY-AI-!CN,AI",
    "RULE-SET,Telegram,Telegram",
    "RULE-SET,Steam,Gaming",
    "RULE-SET,Epic,Gaming",
    "RULE-SET,PlayStation,Gaming",
    "RULE-SET,Xbox,Gaming",
    "RULE-SET,Nintendo,Gaming",
    "RULE-SET,YouTube,Streaming",
    "RULE-SET,Netflix,Streaming",
    "RULE-SET,Disney,Streaming",
    "RULE-SET,PrimeVideo,Streaming",
    "RULE-SET,HBO,Streaming",
    "RULE-SET,Bahamut,Streaming",
    "RULE-SET,Spotify,Streaming",
    "RULE-SET,TikTok,Streaming",
    "RULE-SET,BiliBili,Bilibili",
    "RULE-SET,Emby,Emby",
    "GEOSITE,APPLE@CN,DIRECT",
    "GEOSITE,APPLE,Apple",
    "GEOSITE,MICROSOFT@CN,DIRECT",
    "GEOSITE,ONEDRIVE,Microsoft",
    "GEOSITE,MICROSOFT,Microsoft",
    "GEOSITE,GOOGLE,Google",
    "GEOSITE,GEOLOCATION-!CN,Proxy",
    "GEOSITE,CN,DIRECT",
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
    listen: "127.0.0.1:1053",
    "enhanced-mode": "fake-ip",
    "prefer-h3": false,
    "cache-algorithm": "arc",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": [
      // —— 本地/内网 ——
      "*.lan",
      "*.local",
      "+.argotunnel.com",
      // —— 连通性探测（Windows/Android 网络图标、Captive Portal）——
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      "connectivitycheck.gstatic.com",
      "connectivitycheck.platform.hicloud.com",
      // —— 时间同步：拿 fake IP 会导致证书校验失败 ——
      "time.*.com",
      "time.*.net",
      "time.*.apple.com",
      "ntp.*.com",
      "ntp.*.net",
      "*.pool.ntp.org",
      // —— STUN / NAT 类型检测：联机游戏、语音通话必需 ——
      "stun.*.*",
      "+.stun.playstation.net",
      "+.srv.nintendo.net",
      "+.xboxlive.com",
      "xbox.*.microsoft.com",
      "+.battlenet.com.cn",
      "+.battlenet.com",
      "+.blzstatic.cn",
      "+.battle.net",
      // —— 厂商推送/局域网发现 ——
      "+.push.apple.com",
      "+.market.xiaomi.com",
      "+.miwifi.com",
      "localhost.ptlogin2.qq.com",
      "Mijia Cloud",
    ],
    "default-nameserver": [
      "223.5.5.5",
      "1.12.12.12",
    ],
    nameserver: [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
      "https://dns.google/dns-query",
    ],
    "nameserver-policy": {
      "+.micu.hk": ["https://dns.alidns.com/dns-query"],
      "+.lan": ["system"],
      
  "+.777870.xyz": ["https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"],
  "+.420128.xyz": ["https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"],
      
      "geosite:cn": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
    },
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
    ],
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
    enable: tunEnabled,
    stack: "mixed",
    "dns-hijack": ["any:53", "tcp://any:53"],
    "auto-route": true,
    "auto-detect-interface": true,
    "strict-route": true,
  };
}

function buildBaseConfig() {
  return {
    mode: "rule",
    "mixed-port": 7890,
    "allow-lan": false,
    ipv6: ipv6Enabled,
    "tcp-concurrent": true,
    "unified-delay": true,
    "find-process-mode": "off",
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
  const proxies = Array.isArray(config && config.proxies)
    ? config.proxies
    : [];
  const proxyProviders =
    config &&
    config["proxy-providers"] &&
    typeof config["proxy-providers"] === "object" &&
    !Array.isArray(config["proxy-providers"])
      ? config["proxy-providers"]
      : {};

  if (proxies.length === 0 && Object.keys(proxyProviders).length === 0) {
    throw new Error("No proxies or proxy-providers found in source config");
  }

  // Full takeover mode: preserve both inline proxies and proxy providers.
  return Object.assign({}, baseConfig, {
    proxies,
    "proxy-providers": proxyProviders,
  });
}

if (typeof module !== "undefined") {
  module.exports = { main };
}
