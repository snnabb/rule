/*!
  飞牛版 Clash / Mihomo 覆写。入口：main(config)。
  飞牛运行代理，OpenWrt Nikki 转发；保留飞牛现有监听、入站及路由。
  使用原有策略组名称；仅保留有引用兼容需要的旧 OVR 隐藏组。
*/

const OPTIONS = {
  platform: "fnos",
  // null：沿用原配置；原配置没有 IPv6 设置时默认关闭。
  ipv6: null,
  // 留空：保留原有内网 DNS 策略；没有时返回空答案，不猜网关。
  // 有内网域名时，填写能直接回答内网查询的 DNS，例如 ["192.168.1.1"]。
  // 该 DNS 不能把相同查询原样转回本 Mihomo。
  lanDns: [],
  healthCheckInterval: 300,
};

const TEST_URL = "https://www.gstatic.com/generate_204";
const ICON_BASE = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color";
const GROUP = {
  PROXY: "Proxy",
  AUTO: "Smart Auto",
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

// 旧版 OVR 名称只用于迁移已有引用，不再作为可见服务组。
const LEGACY_GROUP = {
  "OVR Proxy": GROUP.PROXY,
  "OVR Auto": GROUP.AUTO,
  "OVR Apple": GROUP.APPLE,
  "OVR AI": GROUP.AI,
  "OVR Telegram": GROUP.TELEGRAM,
  "OVR Google": GROUP.GOOGLE,
  "OVR Streaming": GROUP.STREAMING,
  "OVR Microsoft": GROUP.MICROSOFT,
  "OVR Emby": GROUP.EMBY,
  "OVR Gaming": GROUP.GAMING,
  "OVR Bilibili": GROUP.BILIBILI,
};

// 自定义站点保持原来的出口意图；这些例外优先于通用服务规则。
const CUSTOM_RULES = [
  "DOMAIN-SUFFIX,argotunnel.com,DIRECT",
  `DOMAIN-SUFFIX,chapanda.sbs,${GROUP.EMBY}`,
  "DOMAIN-SUFFIX,yuntv.de,DIRECT",
  "DOMAIN-SUFFIX,micu.hk,DIRECT",
  `DOMAIN-SUFFIX,er8mm.mobaiemby.site,${GROUP.EMBY}`,
  `DOMAIN-SUFFIX,lightting.net,${GROUP.EMBY}`,
  "DOMAIN-SUFFIX,emby.diom.qzz.io,DIRECT",
  "DOMAIN-SUFFIX,777870.xyz,DIRECT",
  "DOMAIN-SUFFIX,420128.xyz,DIRECT",
];

const DOMESTIC_DNS = [
  "https://dns.alidns.com/dns-query#DIRECT",
  "https://doh.pub/dns-query#DIRECT",
];
const FOREIGN_DNS = [
  `https://dns.google/dns-query#${GROUP.PROXY}`,
  `https://cloudflare-dns.com/dns-query#${GROUP.PROXY}`,
];
const LOCAL_DOMAINS = ["+.lan", "+.local", "+.home.arpa", "geosite:private"];
const REAL_IP_DOMAINS = [
  "+.lan", "+.local", "+.home.arpa", "geosite:private", "+.argotunnel.com",
  "+.msftconnecttest.com", "+.msftncsi.com",
  "connectivitycheck.gstatic.com", "connectivitycheck.platform.hicloud.com",
  "time.*.com", "time.*.net", "time.*.apple.com",
  "ntp.*.com", "ntp.*.net", "*.pool.ntp.org",
  "stun.*.*", "+.stun.playstation.net", "+.srv.nintendo.net",
  "+.xboxlive.com", "xbox.*.microsoft.com",
  "+.battlenet.com.cn", "+.battlenet.com", "+.blzstatic.cn", "+.battle.net",
  "+.push.apple.com", "+.market.xiaomi.com", "+.miwifi.com",
  "localhost.ptlogin2.qq.com", "Mijia Cloud",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function ruleProviderName(name) {
  return `OVR-${name}`;
}

function buildRuleProviders() {
  const result = {};
  const add = (name, url) => {
    result[ruleProviderName(name)] = {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: `./rule-providers/ovr-${name.toLowerCase()}.yaml`,
      url,
      interval: 86400,
    };
  };
  const aiBase = "https://cdn.jsdelivr.net/gh/VPSDance/ai-proxy-rules@main/rules/clash";
  add("AI-CN", `${aiBase}/cn.yaml`);
  add("AI-Global", `${aiBase}/global.yaml`);
  const base = "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash";
  [
    "GitHub", "Telegram", "YouTube", "Netflix", "Disney", "PrimeVideo",
    "HBO", "Bahamut", "Spotify", "TikTok", "BiliBili", "Emby",
    "Steam", "Epic", "PlayStation", "Xbox", "Nintendo",
  ].forEach((name) => add(name, `${base}/${name}/${name}_No_Resolve.yaml`));
  return result;
}

function buildProxyGroups() {
  const select = (name, proxies, icon) => ({
    name,
    type: "select",
    "include-all": true,
    proxies,
    icon: `${ICON_BASE}/${icon}.png`,
  });
  const service = (name, icon, followProxy = false) =>
    select(name, followProxy ? [GROUP.PROXY, "DIRECT"] : ["DIRECT", GROUP.PROXY], icon);
  return [
    select(GROUP.PROXY, [GROUP.AUTO, "DIRECT"], "Proxy"),
    service(GROUP.AI, "AI", true),
    service(GROUP.TELEGRAM, "Telegram", true),
    service(GROUP.GOOGLE, "Google_Search", true),
    service(GROUP.STREAMING, "YouTube", true),
    service(GROUP.EMBY, "Emby"),
    service(GROUP.GAMING, "Game"),
    service(GROUP.APPLE, "Apple"),
    service(GROUP.MICROSOFT, "Microsoft"),
    select(GROUP.BILIBILI, ["DIRECT", GROUP.PROXY], "bilibili"),
    {
      name: GROUP.AUTO,
      type: "url-test",
      "include-all": true,
      url: TEST_URL,
      interval: OPTIONS.healthCheckInterval,
      // 业务连接失败可触发额外检查；不是定时测速失败次数或切换时限。
      "max-failed-times": 2,
      lazy: true,
      tolerance: 50,
      timeout: 5000,
      "expected-status": "204",
      hidden: true,
      icon: `${ICON_BASE}/Global.png`,
    },
  ];
}

function buildRules() {
  const set = (name, target) => `RULE-SET,${ruleProviderName(name)},${target}`;
  return [
    ...CUSTOM_RULES,
    "GEOSITE,PRIVATE,DIRECT",
    "GEOIP,PRIVATE,DIRECT,no-resolve",
    // Copilot 必须先于宽泛的 GitHub / githubusercontent 规则。
    `DOMAIN-SUFFIX,githubcopilot.com,${GROUP.AI}`,
    `DOMAIN,copilot-proxy.githubusercontent.com,${GROUP.AI}`,
    ...[
      "claude.ai", "claude.com", "claudeusercontent.com", "anthropic.com",
      "gemini.google.com", "ai.google.dev", "generativelanguage.googleapis.com",
      "makersuite.google.com", "proactivebackend-pa.googleapis.com",
      "openai.com", "chatgpt.com", "ai.com", "oaistatic.com", "oaiusercontent.com",
    ].map((domain) => `DOMAIN-SUFFIX,${domain},${GROUP.AI}`),
    set("AI-CN", "DIRECT"),
    set("AI-Global", GROUP.AI),
    `GEOSITE,CATEGORY-AI-!CN,${GROUP.AI}`,
    set("GitHub", GROUP.PROXY),
    `DOMAIN,services.googleapis.cn,${GROUP.GOOGLE}`,
    set("Telegram", GROUP.TELEGRAM),
    ...["Steam", "Epic", "PlayStation", "Xbox", "Nintendo"]
      .map((name) => set(name, GROUP.GAMING)),
    // 专用流媒体规则位于 Google 等厂商通用规则之前。
    ...["YouTube", "Netflix", "Disney", "PrimeVideo", "HBO", "Bahamut", "Spotify", "TikTok"]
      .map((name) => set(name, GROUP.STREAMING)),
    set("BiliBili", GROUP.BILIBILI),
    set("Emby", GROUP.EMBY),
    "GEOSITE,APPLE@CN,DIRECT",
    `GEOSITE,APPLE,${GROUP.APPLE}`,
    "GEOSITE,MICROSOFT@CN,DIRECT",
    `GEOSITE,ONEDRIVE,${GROUP.MICROSOFT}`,
    `GEOSITE,MICROSOFT,${GROUP.MICROSOFT}`,
    `GEOSITE,GOOGLE,${GROUP.GOOGLE}`,
    // 国内域名明确优先；保留 no-resolve，避免 IP 兜底强制额外解析。
    "GEOSITE,CN,DIRECT",
    `GEOSITE,GEOLOCATION-!CN,${GROUP.PROXY}`,
    "GEOIP,CN,DIRECT,no-resolve",
    `MATCH,${GROUP.PROXY}`,
  ];
}

function buildDnsConfig(source, ipv6) {
  const old = isObject(source) ? source : {};
  const rawPolicy = isObject(old["nameserver-policy"]) ? old["nameserver-policy"] : {};
  const oldPolicy = {};
  // 合法的组合键先拆开，才能只替换 cn 而保留同键内其他分类。
  Object.keys(rawPolicy).forEach((key) => {
    const setPrefix = key.match(/^(geosite|rule-set):/i);
    const prefix = setPrefix ? setPrefix[0] : "";
    const parts = (prefix ? key.slice(prefix.length) : key).split(",");
    parts.forEach((part) => { oldPolicy[prefix + part.trim()] = rawPolicy[key]; });
  });
  // 保留自定义策略；把脚本管理的精确例外放在宽泛 geosite 规则前。
  const policy = {};
  const managedDomains = ["micu.hk", "777870.xyz", "420128.xyz"];
  const managed = new Set([
    ...managedDomains.flatMap((domain) => [domain, `+.${domain}`, `*.${domain}`, `.${domain}`]),
    ...LOCAL_DOMAINS, "geosite:cn",
  ]);
  const oldLocalPolicy = (domain) => {
    const key = Object.keys(oldPolicy).find((name) => name.toLowerCase() === domain);
    return key === undefined ? undefined : oldPolicy[key];
  };
  policy["+.micu.hk"] = [DOMESTIC_DNS[0]];
  policy["+.777870.xyz"] = DOMESTIC_DNS.slice();
  policy["+.420128.xyz"] = DOMESTIC_DNS.slice();
  // 精确域名 / 通配域名先保留，避免私有域的兜底遮蔽原有具体策略。
  const isSetPolicy = (key) => /^(geosite|rule-set):/i.test(key);
  Object.keys(oldPolicy).filter((key) => !managed.has(key.toLowerCase()) && !isSetPolicy(key))
    .forEach((key) => { policy[key] = oldPolicy[key]; });
  LOCAL_DOMAINS.forEach((domain) => {
    const previous = oldLocalPolicy(domain);
    policy[domain] = OPTIONS.lanDns.length > 0 ? OPTIONS.lanDns.slice() :
      (previous === undefined ? ["rcode://success"] : previous);
  });
  Object.keys(oldPolicy).filter((key) => !managed.has(key.toLowerCase()) && isSetPolicy(key))
    .forEach((key) => { policy[key] = oldPolicy[key]; });
  policy["geosite:cn"] = DOMESTIC_DNS.slice();

  const result = Object.assign({}, old, {
    enable: true,
    ipv6: typeof OPTIONS.ipv6 === "boolean" ? ipv6 :
      (typeof old.ipv6 === "boolean" ? old.ipv6 : ipv6),
    listen: old.listen === undefined ? "127.0.0.1:1053" : old.listen,
    "enhanced-mode": old["enhanced-mode"] || "fake-ip",
    "use-hosts": old["use-hosts"] === undefined ? true : old["use-hosts"],
    "use-system-hosts": old["use-system-hosts"] === undefined ? true : old["use-system-hosts"],
    "respect-rules": true,
    "prefer-h3": false,
    "cache-algorithm": old["cache-algorithm"] || "arc",
    // 引导服务器域名及代理节点的解析不依赖代理先建立连接。
    "default-nameserver": Array.isArray(old["default-nameserver"]) && old["default-nameserver"].length
      ? old["default-nameserver"].slice() : ["223.5.5.5", "1.12.12.12"],
    nameserver: FOREIGN_DNS.slice(),
    "nameserver-policy": policy,
    "proxy-server-nameserver": DOMESTIC_DNS.slice(),
    "direct-nameserver": DOMESTIC_DNS.slice(),
    "direct-nameserver-follow-policy": true,
  });
  // 不继承旧的混合 fallback，以免改变新解析分工。
  delete result.fallback;
  delete result["fallback-filter"];
  delete result["fallback-lazy-query"];

  if (result["enhanced-mode"] === "fake-ip") {
    result["fake-ip-range"] = old["fake-ip-range"] === undefined ? "198.18.0.1/16" : old["fake-ip-range"];
    const mode = old["fake-ip-filter-mode"] || "blacklist";
    result["fake-ip-filter-mode"] = mode;
    const previous = Array.isArray(old["fake-ip-filter"]) ? old["fake-ip-filter"] : [];
    // whitelist / rule 有不同语义，不能把黑名单直接拼进去。
    result["fake-ip-filter"] = mode === "blacklist"
      ? unique([...previous, ...REAL_IP_DOMAINS]) : previous.slice();
  }
  return result;
}

function buildSnifferConfig(source) {
  const defaults = {
    enable: true,
    "override-destination": false,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    sniff: {
      HTTP: { ports: [80, "8080-8880"] },
      TLS: { ports: [443, 8443] },
      QUIC: { ports: [443, 8443] },
    },
    "skip-domain": ["Mijia Cloud", "+.push.apple.com"],
  };
  // 已运行配置的 sniff 端口与目标覆写行为保持原样。
  return Object.assign(defaults, isObject(source) ? source : {});
}

function mergeGroups(sourceGroups, generated, nodes) {
  const names = new Set(generated.map((group) => group.name));
  const old = Array.isArray(sourceGroups) ? sourceGroups : [];
  const seen = new Set();
  old.forEach((group) => {
    if (seen.has(group.name)) throw new Error(`策略组名称重复：${group.name}`);
    seen.add(group.name);
  });
  const aliases = old.filter((group) => Object.prototype.hasOwnProperty.call(LEGACY_GROUP, group.name))
    .map((group) => ({
      name: group.name,
      type: "select",
      proxies: [LEGACY_GROUP[group.name]],
      hidden: true,
    }));
  nodes.forEach((node) => {
    if (names.has(node.name) || aliases.some((group) => group.name === node.name)) {
      throw new Error(`节点名称与覆写组冲突：${node.name}`);
    }
  });
  // 同名服务组由覆写接管；旧 OVR 引用通过单向隐藏别名迁移。
  return [...generated, ...aliases, ...old.filter((group) => !names.has(group.name) &&
    !Object.prototype.hasOwnProperty.call(LEGACY_GROUP, group.name))
    .map((group) => Object.assign({}, group, { hidden: true }))];
}

function mergeRuleProviders(source) {
  const old = isObject(source) ? source : {};
  const generated = buildRuleProviders();
  Object.keys(generated).forEach((name) => {
    if (!Object.prototype.hasOwnProperty.call(old, name)) return;
    const value = old[name];
    if (!isObject(value) || ["type", "behavior", "format", "url"]
      .some((key) => value[key] !== generated[name][key])) {
      throw new Error(`原规则集占用了覆写名称，请先重命名：${name}`);
    }
  });
  return Object.assign({}, old, generated);
}

function validateReferences(config) {
  const builtins = new Set(["DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE", "GLOBAL"]);
  const nodes = config.proxies || [];
  const groups = config["proxy-groups"];
  // GLOBAL 可以由配置显式定义；只有其他内建策略名不可复用。
  const names = new Set([...builtins].filter((name) => name !== "GLOBAL"));
  [...nodes, ...groups].forEach((item) => {
    if (typeof item.name !== "string" || !item.name) throw new Error("节点或策略组缺少名称");
    if (names.has(item.name)) throw new Error(`节点或策略组名称重复：${item.name}`);
    names.add(item.name);
  });
  names.add("GLOBAL");
  const providers = config["proxy-providers"] || {};
  // provider 文件中的节点名称在脚本阶段未知，由内核校验其引用。
  const canContainUnknownNodes = Object.keys(providers).length > 0;
  const check = (target, owner) => {
    if (target && !names.has(target) && !canContainUnknownNodes) {
      throw new Error(`${owner} 引用了不存在的策略：${target}`);
    }
  };
  groups.forEach((group) => {
    (group.proxies || []).forEach((target) => check(target, group.name));
    (group.use || []).forEach((provider) => {
      if (!Object.prototype.hasOwnProperty.call(providers, provider)) {
        throw new Error(`${group.name} 引用了不存在的节点提供者：${provider}`);
      }
    });
  });
  nodes.forEach((node) => check(node["dialer-proxy"], node.name));
  Object.keys(providers).forEach((name) => {
    check(providers[name].proxy, `proxy-provider ${name}`);
    check((providers[name].override || {})["dialer-proxy"], `proxy-provider ${name} override`);
  });
  Object.keys(config["rule-providers"]).forEach((name) =>
    check(config["rule-providers"][name].proxy, `rule-provider ${name}`));
  (config.listeners || []).forEach((listener) => check(listener.proxy, `listener ${listener.name}`));

  // 检查明确列出的组成员与 dialer 链；不把订阅下载出口当成转发边。
  const edges = new Map();
  nodes.forEach((node) => edges.set(node.name, node["dialer-proxy"] ? [node["dialer-proxy"]] : []));
  groups.forEach((group) => edges.set(group.name, group.proxies || []));
  // 新生成的 include-all 组会包含所有内联节点及 provider 节点。
  const providerEdges = Object.keys(providers)
    .filter((name) => (providers[name].override || {})["dialer-proxy"])
    .map((name) => {
      const key = { provider: name };
      edges.set(key, [providers[name].override["dialer-proxy"]]);
      return key;
    });
  Object.values(GROUP).forEach((name) => {
    edges.set(name, unique([...(edges.get(name) || []), ...nodes.map((node) => node.name), ...providerEdges]));
  });
  const finished = new Set();
  const active = [];
  const visit = (name) => {
    if (active.includes(name)) {
      const path = [...active, name].map((item) => typeof item === "string" ? item : `provider:${item.provider}`);
      throw new Error(`策略引用成环：${path.join(" -> ")}`);
    }
    if (finished.has(name) || !edges.has(name)) return;
    active.push(name);
    edges.get(name).forEach(visit);
    active.pop();
    finished.add(name);
  };
  edges.forEach((_, name) => visit(name));
}

function main(config) {
  if (!isObject(config)) throw new Error("覆写需要一份包含节点或 proxy-providers 的配置对象");
  const nodes = Array.isArray(config.proxies) ? config.proxies : [];
  const providers = isObject(config["proxy-providers"]) ? config["proxy-providers"] : {};
  if (!nodes.length && !Object.keys(providers).length) {
    throw new Error("源配置没有节点或 proxy-providers；此文件不是独立订阅");
  }
  const ipv6 = typeof OPTIONS.ipv6 === "boolean" ? OPTIONS.ipv6 :
    (typeof config.ipv6 === "boolean" ? config.ipv6 : false);
  const result = Object.assign({}, config, {
    mode: "rule",
    ipv6,
    "tcp-concurrent": true,
    "unified-delay": true,
    profile: Object.assign({}, config.profile, {
      "store-selected": true,
      "store-fake-ip": true,
    }),
    "proxy-groups": mergeGroups(config["proxy-groups"], buildProxyGroups(), nodes),
    "rule-providers": mergeRuleProviders(config["rule-providers"]),
    rules: buildRules(),
    dns: buildDnsConfig(config.dns, ipv6),
    sniffer: buildSnifferConfig(config.sniffer),
  });
  // 飞牛版不创建或修改代理监听、TUN、控制接口、认证及路由字段。
  if (OPTIONS.platform === "desktop") {
    if (result["mixed-port"] === undefined) result["mixed-port"] = 7890;
    if (result["allow-lan"] === undefined) result["allow-lan"] = false;
    if (result["find-process-mode"] === undefined) result["find-process-mode"] = "strict";
    // 不强制开关 TUN；缺省为关闭，已有设置全部沿用。
    if (result.tun === undefined) result.tun = { enable: false };
  }
  validateReferences(result);
  return result;
}

if (typeof module !== "undefined") module.exports = { main };
