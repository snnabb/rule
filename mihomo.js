const PROXY_NAME_EXCLUDE_PATTERN = /(拒绝|直连|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|建议|特别|访问|支持|教程|关注|更新|作者|加入|超时|收藏|福利|好友|失联|选择|剩余|公益|发布|通路|登录|禁止|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|⚠️|@|https?:\/\/|\.com\b|com\/|\b(?:USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|traffic)\b)/i;

const EMOJI_FLAG_PATTERN = /^((?:\uD83C[\uDDE6-\uDDFF]){2})\s*/;
const DIGITS_PATTERN = /\d+/g;
const SORT_PAD_WIDTH = 16;
const SORT_KEY_SEPARATOR = " ";

const GH_PROXY_PREFIX = "https://v6.gh-proxy.org/https://raw.githubusercontent.com/";
const GEOSITE_BASE_URL = GH_PROXY_PREFIX + "MetaCubeX/meta-rules-dat/meta/geo/geosite/";
const GEOIP_BASE_URL = GH_PROXY_PREFIX + "MetaCubeX/meta-rules-dat/meta/geo/geoip/";
const DUSTINWIN_BASE_URL = GH_PROXY_PREFIX + "DustinWin/ruleset_geodata/mihomo-ruleset/";
const MIHOMO_SCRIPT_BASE_URL = GH_PROXY_PREFIX + "funianshengsheng/MihomoScript/main/rule/";
const ICON_BASE_URL = GH_PROXY_PREFIX + "funianshengsheng/mihomo-icon/main/icon/";

const ICON_URLS = {
  select: ICON_BASE_URL + "01.png",
  all: ICON_BASE_URL + "02.png",
  other: ICON_BASE_URL + "05.png",
  hongKong: ICON_BASE_URL + "06.png",
  taiwan: ICON_BASE_URL + "07.png",
  japan: ICON_BASE_URL + "13.png",
  korea: ICON_BASE_URL + "14.png",
  singapore: ICON_BASE_URL + "16.png",
  unitedStates: ICON_BASE_URL + "18.png",
  europe: ICON_BASE_URL + "19.png",
  global: ICON_BASE_URL + "11.png",
};

const DNS_DEFAULT_SERVERS = ["223.5.5.5", "119.29.29.29"];

const DNS_CN_SERVERS = [
  "https://dns.alidns.com/dns-query#DIRECT",
  "https://doh.pub/dns-query#DIRECT",
];

const DNS_GLOBAL_SERVERS = [
  "https://dns.cloudflare.com/dns-query#节点选择",
  "https://dns.google/dns-query#节点选择&ecs=8.8.8.8/24&ecs-override=true",
  "https://dns.quad9.net/dns-query#节点选择&ecs=9.9.9.9/24&ecs-override=true",
];

function defineRegion(name, icon, regionPattern) {
  return {
    name: name,
    icon: icon,
    regionPattern: regionPattern,
    filterSource: "(?i)" + regionPattern.source,
  };
}

const REGION_DEFINITIONS = [
  defineRegion("香港节点", ICON_URLS.hongKong, /(香港|深港|沪港|🇭🇰|\bHK\b|\bHKG\b|Hong\s?Kong|Hongkong|HKBN|HKT|PCCW|WTT|CMHK|HGC|Hutchison|Three\s?HK|3HK|Netvigator|iCable)/i),
  defineRegion("台湾节点", ICON_URLS.taiwan, /(台湾|福台|台灣|台北|新北|桃园|桃園|台中|台南|高雄|🇹🇼|\bTW\b|\bTWN\b|\bTPE\b|\bTSA\b|\bKHH\b|Taiwan|Taipei|New\s?Taipei|Taoyuan|Taichung|Tainan|Kaohsiung|中华电信|中華電信|\bCHT\b|Chunghwa|HiNet|Hinet|Seednet)/i),
  defineRegion("日本节点", ICON_URLS.japan, /(日本|沪日|东京|東京|大阪|🇯🇵|\bJP\b|\bJPN\b|Japan|Tokyo|Osaka|\bNRT\b|\bHND\b|\bKIX\b|\bCTS\b|\bFUK\b|\bNGO\b|SoftBank|KDDI|\bIIJ\b|IIJmio|Rakuten|楽天|Biglobe)/i),
  defineRegion("韩国节点", ICON_URLS.korea, /(韩国|韓國|🇰🇷|首尔|首爾|\bKR\b|\bKOR\b|Korea|Seoul|\bICN\b)/i),
  defineRegion("新加坡节点", ICON_URLS.singapore, /(新加坡|狮城|獅城|🇸🇬|\bSG\b|\bSGP\b|Singapore|\bSIN\b|\bXSP\b)/i),
  defineRegion("美国节点", ICON_URLS.unitedStates, /(美国|美國|洛杉矶|洛杉磯|纽约|紐約|西雅图|西雅圖|圣何塞|聖何塞|旧金山|舊金山|芝加哥|达拉斯|達拉斯|硅谷|矽谷|夏威夷|新泽西|新澤西|马纳萨斯|馬納薩斯|🇺🇸|\bUS\b|\bUSA\b|United\s?States|America|Los\s?Angeles|\bLA\b|New\s?York|\bNYC\b|Seattle|San\s?Jose|San\s?Francisco|\bSFO\b|Chicago|Dallas|Silicon\s?Valley|Hawaii|Hawaiian|New\s?Jersey|\bNJ\b|Manassas|\bSJC\b|\bJFK\b|\bEWR\b|\bBOS\b|\bLAX\b|\bORD\b|\bATL\b|\bDFW\b|\bDAL\b|\bMIA\b|\bSEA\b|\bIAD\b|\bLAS\b|\bPHX\b|\bDEN\b|\bHOU\b|AT&T|\bATT\b|Verizon|T-?Mobile|Frontier|Comcast|Xfinity|Charter|Spectrum|\bCox\b)/i),
  defineRegion("欧洲节点", ICON_URLS.europe, /(奥地利|奧地利|京德|比利时|比利時|保加利亚|保加利亞|克罗地亚|克羅地亞|塞浦路斯|捷克|丹麦|丹麥|爱沙尼亚|愛沙尼亞|芬兰|芬蘭|法国|法國|德国|德國|希腊|希臘|匈牙利|爱尔兰|愛爾蘭|意大利|義大利|拉脱维亚|拉脫維亞|立陶宛|卢森堡|盧森堡|荷兰|荷蘭|波兰|波蘭|葡萄牙|罗马尼亚|羅馬尼亞|斯洛伐克|斯洛文尼亚|斯洛文尼亞|西班牙|瑞典|英国|英國|瑞士|欧洲|歐洲|🇦🇹|🇧🇪|🇧🇬|🇭🇷|🇨🇾|🇨🇿|🇩🇰|🇪🇪|🇫🇮|🇫🇷|🇩🇪|🇬🇷|🇭🇺|🇮🇪|🇮🇹|🇱🇻|🇱🇹|🇱🇺|🇳🇱|🇵🇱|🇵🇹|🇷🇴|🇸🇰|🇸🇮|🇪🇸|🇸🇪|🇬🇧|🇨🇭|\bEU\b|Europe|\bCDG\b|\bFRA\b|\bAMS\b|\bMAD\b|\bBCN\b|\bFCO\b|\bMUC\b|\bBRU\b|\bLHR\b|\bLGW\b|\bMAN\b|\bVIE\b|\bZRH\b|\bARN\b|\bCPH\b|\bWAW\b|\bPRG\b|\bHEL\b|\bDUB\b)/i),
];

const COMMON_DNS_PATTERN = /(?:223\.5\.5\.5|223\.6\.6\.6|119\.29\.29\.29|114\.114\.114\.114|180\.76\.76\.76|1\.12\.12\.12|120\.53\.53\.53|8\.8\.8\.8|8\.8\.4\.4|1\.1\.1\.1|1\.0\.0\.1|9\.9\.9\.9|94\.140\.14\.14|94\.140\.15\.15|127\.0\.0\.1|alidns|doh\.pub|dot\.pub|dnspod|dns\.baidu|dns\.google|cloudflare|quad9|opendns|adguard|system)/i;

const POLICY_DNS_MAP = {
  DIRECT: DNS_CN_SERVERS,
  "节点选择": DNS_GLOBAL_SERVERS,
};

const OTHER_NODES_EXCLUDE_FILTER = "(?i)" + REGION_DEFINITIONS.map(function (region) { return region.regionPattern.source; }).join("|");

const RULE_DEFINITIONS = [
  { name: "private_domain", behavior: "domain", policy: "DIRECT", dns: "system", url: GEOSITE_BASE_URL + "private.mrs", bundle: "geo/geosite/private.mrs" },
  { name: "private_ip", behavior: "ipcidr", policy: "DIRECT", noResolve: true, url: GEOIP_BASE_URL + "private.mrs", bundle: "geo/geoip/private.mrs" },
  { raw: "AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((RULE-SET,cn_ip))),(NOT,((RULE-SET,cn_domain)))),REJECT" },
  { name: "webrtc", behavior: "domain", policy: "REJECT", url: MIHOMO_SCRIPT_BASE_URL + "WebRTC-Domain.mrs" },
  { raw: "OR,((DST-PORT,19302),(DST-PORT,3478),(DST-PORT,5349),(DST-PORT,5350),(DST-PORT,10000)),REJECT" },
  { name: "DownloadApps", behavior: "domain", policy: "节点选择", url: GH_PROXY_PREFIX + "echs-top/proxy/main/mrs/domain/download.mrs" },
  { name: "speedtest_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "ookla-speedtest.mrs", bundle: "geo/geosite/ookla-speedtest.mrs" },
  { name: "captcha", behavior: "domain", policy: "节点选择", url: MIHOMO_SCRIPT_BASE_URL + "Captcha.mrs" },
  { raw: "DOMAIN-SUFFIX,gamemale.com,节点选择" },
  { name: "ai", behavior: "domain", policy: "节点选择", url: DUSTINWIN_BASE_URL + "ai.mrs", bundle: "geo/geosite/category-ai-!cn.mrs" },
  { name: "github_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "github.mrs", bundle: "geo/geosite/github.mrs" },
  { name: "youtube_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "youtube.mrs", bundle: "geo/geosite/youtube.mrs" },
  { name: "googlefcm", behavior: "domain", policy: "DIRECT", url: GEOSITE_BASE_URL + "googlefcm.mrs", bundle: "geo/geosite/googlefcm.mrs" },
  { name: "google_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "google.mrs", bundle: "geo/geosite/google.mrs" },
  { name: "google_ip", behavior: "ipcidr", policy: "节点选择", noResolve: true, url: GEOIP_BASE_URL + "google.mrs", bundle: "geo/geoip/google.mrs" },
  { name: "onedrive_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "onedrive.mrs", bundle: "geo/geosite/onedrive.mrs" },
  { name: "microsoft_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "microsoft.mrs", bundle: "geo/geosite/microsoft.mrs" },
  { name: "appletv_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "apple-tvplus.mrs", bundle: "geo/geosite/apple-tvplus.mrs" },
  { name: "apple_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "apple.mrs", bundle: "geo/geosite/apple.mrs" },
  { name: "telegram_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "telegram.mrs", bundle: "geo/geosite/telegram.mrs" },
  { name: "telegram_ip", behavior: "ipcidr", policy: "节点选择", noResolve: true, url: GEOIP_BASE_URL + "telegram.mrs", bundle: "geo/geoip/telegram.mrs" },
  { name: "tiktok_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "tiktok.mrs", bundle: "geo/geosite/tiktok.mrs" },
  { name: "twitter_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "twitter.mrs", bundle: "geo/geosite/twitter.mrs" },
  { name: "twitter_ip", behavior: "ipcidr", policy: "节点选择", noResolve: true, url: GEOIP_BASE_URL + "twitter.mrs", bundle: "geo/geoip/twitter.mrs" },
  { name: "instagram_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "instagram.mrs", bundle: "geo/geosite/instagram.mrs" },
  { name: "netflix_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "netflix.mrs", bundle: "geo/geosite/netflix.mrs" },
  { name: "netflix_ip", behavior: "ipcidr", policy: "节点选择", noResolve: true, url: GEOIP_BASE_URL + "netflix.mrs", bundle: "geo/geoip/netflix.mrs" },
  { name: "disney_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "disney.mrs", bundle: "geo/geosite/disney.mrs" },
  { name: "spotify_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "spotify.mrs", bundle: "geo/geosite/spotify.mrs" },
  { name: "paypal_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "paypal.mrs", bundle: "geo/geosite/paypal.mrs" },
  { name: "cloudflare_domain", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "cloudflare.mrs", bundle: "geo/geosite/cloudflare.mrs" },
  { name: "geolocation-!cn", behavior: "domain", policy: "节点选择", url: GEOSITE_BASE_URL + "geolocation-!cn.mrs", bundle: "geo/geosite/geolocation-!cn.mrs" },
  { name: "gfw", behavior: "domain", policy: "节点选择", url: DUSTINWIN_BASE_URL + "gfw.mrs", bundle: "geo/geosite/gfw.mrs" },
  { name: "add_direct_domain", behavior: "domain", policy: "DIRECT", url: GH_PROXY_PREFIX + "Seven1echo/Yaml/refs/heads/main/rules/Seven1_Direct_Domain.mrs", bundle: "geo/geosite/cn.mrs" },
  { name: "cn_additional_domain", behavior: "domain", policy: "DIRECT", url: "https://static-file-global.353355.xyz/rules/cn-additional-list.mrs", bundle: "geo/geosite/cn.mrs" },
  { name: "geolocation_cn", behavior: "domain", policy: "DIRECT", url: GEOSITE_BASE_URL + "geolocation-cn.mrs", bundle: "geo/geosite/geolocation-cn.mrs" },
  { name: "cn_domain", behavior: "domain", policy: "DIRECT", url: GEOSITE_BASE_URL + "cn.mrs", bundle: "geo/geosite/cn.mrs" },
  { name: "cn_ip", behavior: "ipcidr", policy: "DIRECT", noResolve: true, url: GEOIP_BASE_URL + "cn.mrs", bundle: "geo/geoip/cn.mrs" },
  { name: "fakeip_filter", behavior: "domain", policy: null, url: DUSTINWIN_BASE_URL + "fakeip-filter.mrs", bundle: "geo/geosite/private.mrs" },
  { raw: "MATCH,节点选择" },
];

const BASE_CONFIG = {
  "mixed-port": 7894,
  mode: "rule",
  "allow-lan": true,
  "bind-address": "*",
  "tcp-concurrent": true,
  "inbound-tfo": true,
  "unified-delay": true,
  "log-level": "silent",
  ipv6: false,
  "find-process-mode": "strict",
  "etag-support": true,
  "keep-alive-idle": 600,
  "keep-alive-interval": 60,
  "external-controller": "127.0.0.1:9090",
  "external-ui-name": "zashboard",
  "external-ui": "ui",
  "external-ui-url": "https://github.com/Zephyruso/zashboard/releases/latest/download/dist-no-fonts.zip",
  secret: "",
  profile: { "store-selected": true, "store-fake-ip": true },
  ntp: { enable: true, server: "ntp.aliyun.com", port: 123, interval: 60, "write-to-system": false },
  experimental: { "quic-go-disable-gso": true, "quic-go-disable-ecn": true, "dialer-ip4p-convert": false },
  tun: {
    enable: true,
    stack: "gvisor",
    mtu: 1480,
    "dns-hijack": ["any:53", "tcp://any:53"],
    "auto-detect-interface": true,
    "auto-route": true,
    "auto-redirect": true,
    "strict-route": true,
    "route-exclude-address": ["192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12", "224.0.0.0/4"],
    "disable-icmp-forwarding": true,
    "endpoint-independent-nat": true,
    "udp-timeout": 60,
    gso: true,
    "gso-max-size": 65536,
  },
  sniffer: {
    enable: true,
    "override-destination": true,
    "parse-pure-ip": true,
    "force-dns-mapping": true,
    sniff: {
      QUIC: { ports: [443, 8443] },
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, "8080-8880"] },
    },
    "force-domain": [
      "+.googlevideo.com", "+.youtube.com", "+.ytimg.com", "+.googlecdn.com",
      "+.netflix.com", "+.nflxvideo.net",
      "+.cloudfront.net", "+.cloudflare.net", "+.fastly.net",
      "+.akamaized.net", "+.akamai.net",
      "+.telegram.org", "+.t.me", "+.tdesktop.com",
      "+.cdn-telegram.org", "+.telegram-cdn.org", "+.cdn.telegram.org",
      "+.tiktokcdn.com", "+.tiktokv.com",
      "+.amazonaws.com", "+.media.dssott.com",
    ],
    "skip-domain": [
      "localhost", "+.lan", "+.local", "+.arpa", "+.invalid", "+.test",
      "+.push.apple.com", "+.apple.com", "+.icloud.com",
      "dlg.io.mi.com", "+.mi.com", "+.xiaomi.com", "+.market.xiaomi.com",
      "+.wechat.com", "+.qq.com", "+.qpic.cn", "+.wechatapp.com",
      "+.oray.com", "+.sunlogin.net",
      "+.pvp.net", "+.riotgames.com",
      "cloudflare-ech.com", "+.openai.*",
    ],
    "skip-src-address": ["127.0.0.0/8", "::1/128"],
    "skip-dst-address": ["rule-set:private_ip", "rule-set:cn_ip", "rule-set:telegram_ip"],
  },
  hosts: {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.cloudflare.com": ["1.1.1.1", "1.0.0.1"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "services.googleapis.cn": ["services.googleapis.com"],
    "google.cn": ["google.com"],
    "cn.bing.com": ["global.bing.com"],
    "+.mcdn.bilivideo.com": ["0.0.0.0"],
    "+.mcdn.bilivideo.cn": ["0.0.0.0"],
    "+.edge.mountaintoys.cn": ["0.0.0.0"],
    "t.me": ["telegram.me"],
  },
};

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toNaturalSortKey(text) {
  return text.replace(DIGITS_PATTERN, function (digits) { return digits.padStart(SORT_PAD_WIDTH, "0"); });
}

function getRegionIndex(proxyName) {
  let matchedIndex = -1;
  let matchedPosition = -1;
  for (let regionIndex = 0; regionIndex < REGION_DEFINITIONS.length; regionIndex++) {
    const position = proxyName.search(REGION_DEFINITIONS[regionIndex].regionPattern);
    if (position === 0) return regionIndex;
    if (position > matchedPosition) {
      matchedPosition = position;
      matchedIndex = regionIndex;
    }
  }
  return matchedIndex;
}

function processProxies(rawProxies) {
  const seenNames = new Set();
  const sortEntries = [];

  for (const proxy of rawProxies) {
    const name = proxy && typeof proxy.name === "string" ? proxy.name.trim() : "";
    if (!name || seenNames.has(name) || PROXY_NAME_EXCLUDE_PATTERN.test(name)) continue;
    seenNames.add(name);
    if (proxy.name !== name) proxy.name = name;
    const flagMatch = EMOJI_FLAG_PATTERN.exec(name);
    const flag = flagMatch ? flagMatch[1] : "";
    const baseName = flagMatch ? name.slice(flagMatch[0].length) : name;
    sortEntries.push({
      proxy: proxy,
      name: name,
      sortKey: flag + SORT_KEY_SEPARATOR + toNaturalSortKey(baseName),
      regionIndex: getRegionIndex(name),
    });
  }

  sortEntries.sort(function (first, second) {
    if (first.sortKey === second.sortKey) return 0;
    return first.sortKey < second.sortKey ? -1 : 1;
  });

  const regionBuckets = REGION_DEFINITIONS.map(function () { return []; });
  const otherBucket = [];
  const proxies = [];
  const names = [];

  for (const entry of sortEntries) {
    proxies.push(entry.proxy);
    names.push(entry.name);
    if (entry.regionIndex >= 0) {
      regionBuckets[entry.regionIndex].push(entry.name);
    } else {
      otherBucket.push(entry.name);
    }
  }

  return { proxies: proxies, names: names, regionBuckets: regionBuckets, otherBucket: otherBucket };
}

function buildRuleProvider(definition) {
  const provider = {
    type: "http",
    format: "mrs",
    behavior: definition.behavior,
    interval: 86400,
    url: definition.url,
    path: "./ruleset/" + definition.name + ".mrs",
  };
  if (definition.bundle) provider["path-in-bundle"] = definition.bundle;
  return provider;
}

function buildRuleArtifacts() {
  const providers = {};
  const rules = [];
  const nameserverPolicy = { "+.arpa": "system" };

  for (const definition of RULE_DEFINITIONS) {
    if (definition.raw != null) {
      rules.push(definition.raw);
      continue;
    }

    const name = definition.name;
    const behavior = definition.behavior;
    const policy = definition.policy;

    providers[name] = buildRuleProvider(definition);

    if (policy) {
      rules.push(definition.noResolve ? "RULE-SET," + name + "," + policy + ",no-resolve" : "RULE-SET," + name + "," + policy);
    }

    if (behavior === "domain") {
      const nameserver = definition.dns !== undefined ? definition.dns : policy && POLICY_DNS_MAP[policy];
      if (nameserver) nameserverPolicy["rule-set:" + name] = nameserver;
    }
  }

  return {
    providers: providers,
    rules: rules,
    nameserverPolicy: nameserverPolicy,
    fakeIpFilter: ["rule-set:private_domain", "rule-set:fakeip_filter", "rule-set:cn_domain"],
  };
}

const RULE_ARTIFACTS = buildRuleArtifacts();

function buildSelectGroup(name, icon, proxies, providerNames, filter, excludeFilter) {
  const group = { name: name, type: "select", icon: icon };
  if (proxies && proxies.length) group.proxies = proxies;
  if (providerNames && providerNames.length) {
    group.use = providerNames;
    if (filter) group.filter = filter;
    if (excludeFilter) group["exclude-filter"] = excludeFilter;
  }
  return group;
}

function buildProxyGroups(proxyData, providerNames) {
  const names = proxyData.names;
  const regionBuckets = proxyData.regionBuckets;
  const otherBucket = proxyData.otherBucket;
  const hasProviders = providerNames.length > 0;
  const mainChoices = ["全部节点"];
  const regionGroups = [];

  for (let regionIndex = 0; regionIndex < REGION_DEFINITIONS.length; regionIndex++) {
    const region = REGION_DEFINITIONS[regionIndex];
    if (!regionBuckets[regionIndex].length && !hasProviders) continue;
    mainChoices.push(region.name);
    regionGroups.push(buildSelectGroup(region.name, region.icon, regionBuckets[regionIndex], providerNames, region.filterSource));
  }

  const hasOtherNodes = otherBucket.length > 0 || hasProviders;
  if (hasOtherNodes) mainChoices.push("其他节点");

  const groups = [
    { name: "节点选择", type: "select", icon: ICON_URLS.select, proxies: mainChoices },
    buildSelectGroup("全部节点", ICON_URLS.all, names, providerNames),
  ].concat(regionGroups);

  if (hasOtherNodes) {
    groups.push(buildSelectGroup("其他节点", ICON_URLS.other, otherBucket, providerNames, undefined, OTHER_NODES_EXCLUDE_FILTER));
  }

  const globalChoices = groups.map(function (group) { return group.name; });
  return [{ name: "GLOBAL", type: "select", icon: ICON_URLS.global, proxies: globalChoices }].concat(groups);
}

function buildDnsConfig(nameserverPolicy, fakeIpFilter, extraProxyServerNameserver) {
  const proxyServerNameserver = extraProxyServerNameserver && extraProxyServerNameserver.length
    ? DNS_CN_SERVERS.concat(extraProxyServerNameserver)
    : DNS_CN_SERVERS;

  return {
    enable: true,
    listen: "0.0.0.0:7874",
    ipv6: false,
    "prefer-h3": false,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-ttl": 1,
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": fakeIpFilter,
    "respect-rules": true,
    "use-hosts": true,
    "use-system-hosts": true,
    "cache-algorithm": "arc",
    "cache-max-size": 2048,
    "default-nameserver": DNS_DEFAULT_SERVERS,
    "proxy-server-nameserver": proxyServerNameserver,
    "direct-nameserver": DNS_DEFAULT_SERVERS,
    "direct-nameserver-follow-policy": true,
    nameserver: DNS_GLOBAL_SERVERS,
    "nameserver-policy": nameserverPolicy,
  };
}

function buildHosts(originalHosts, proxies) {
  const proxyDomains = new Set();
  for (const proxy of proxies) {
    if (typeof proxy.server === "string") proxyDomains.add(proxy.server.toLowerCase());
  }

  const hosts = Object.assign({}, BASE_CONFIG.hosts);
  for (const host of Object.keys(originalHosts)) {
    if (proxyDomains.has(host.toLowerCase())) hosts[host] = originalHosts[host];
  }
  return hosts;
}

function main(config) {
  const input = isPlainObject(config) ? config : {};
  const rawProxies = Array.isArray(input.proxies) ? input.proxies : [];
  const proxyProviders = input["proxy-providers"];
  const providerNames = isPlainObject(proxyProviders) ? Object.keys(proxyProviders) : [];

  const originalDns = isPlainObject(input.dns) ? input.dns : {};
  const originalProxyServerNameserver = Array.isArray(originalDns["proxy-server-nameserver"])
    ? originalDns["proxy-server-nameserver"].filter(function (server) { return !COMMON_DNS_PATTERN.test(String(server)); })
    : [];

  const originalHosts = isPlainObject(input.hosts) ? input.hosts : {};

  delete input["global-client-fingerprint"];
  delete input["sub-rules"];

  const proxyData = processProxies(rawProxies);
  if (!proxyData.proxies.length && !providerNames.length) {
    throw new Error("覆写失败：订阅中没有可用节点（可能已全部被名称排除规则过滤），请检查订阅内容");
  }

  Object.assign(input, BASE_CONFIG, {
    proxies: proxyData.proxies,
    "proxy-groups": buildProxyGroups(proxyData, providerNames),
    rules: RULE_ARTIFACTS.rules,
    "rule-providers": RULE_ARTIFACTS.providers,
    hosts: buildHosts(originalHosts, proxyData.proxies),
    dns: buildDnsConfig(RULE_ARTIFACTS.nameserverPolicy, RULE_ARTIFACTS.fakeIpFilter, originalProxyServerNameserver),
  });

  return input;
}