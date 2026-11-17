# Clash 双端覆写

适用场景：电脑外出时开本地代理；在家关闭本地代理，由飞牛上的 Clash / Mihomo 代理，OpenWrt Nikki 转发。

## 文件和入口

| 文件 | 使用位置 | 自动组检查间隔 |
| --- | --- | --- |
| `clash-desktop-override.js` | 电脑的脚本覆写入口 | 120 秒，空闲可暂停 |
| `clash-fnos-override.js` | 生成飞牛 Clash 配置的脚本覆写入口 | 300 秒，空闲可暂停 |

两份都是独立 JavaScript，入口为 `main(config)`，不需要 `$arguments`，也不依赖另一个脚本。需要输入已有节点或 `proxy-providers`，不能当作完整订阅单独使用。目标为现代 Mihomo 内核，不保证旧 Clash / Premium 支持所有字段。

在 Clash Verge Rev 中，将对应文件内容放入配置使用的**脚本覆写**入口，并替换旧的这份自动覆写脚本，不要让新旧两份依次运行。普通 YAML 合并入口不能执行 JS。

已核对的家庭环境使用飞牛上的原生 Mihomo 系统服务，Nikki 通过 SOCKS5 上游转发到飞牛。**Mihomo 核心本身不执行 JS，Nikki 的普通 YAML 覆写入口也不等于 JS 入口。** 飞牛版需放入支持 `main(config)` 的配置预处理器，再将生成的完整配置交给飞牛 Clash。当前飞牛面板接受 YAML/JSON 完整配置；本目录附带 `apply-override.cjs`，可在有 Node.js 的电脑上将现有完整配置的 JSON 形式转换成最终 JSON。不要将源订阅、密钥或完整配置上传在线转换网站。

当前飞牛面板的自动订阅更新只导入节点、策略组、规则及相关 provider，保留飞牛本地 DNS 和网络入口。因此，**只更换订阅中的覆写脚本不会同步本次 DNS 优化**：首次需要在可信本地环境对当前完整配置应用覆写，再通过面板的完整配置入口校验并导入。后续自动更新也应使用新的分流输出，避免重新导入旧规则。Nikki 继续使用原有的 NAS 转发配置，不要把飞牛完整版直接导入 Nikki。

飞牛版的执行位置应在需要保留的网络配置已经可用的阶段，或确保管理器在其后重新注入网络字段。若源数据只有节点，覆写无法凭空恢复端口、监听器或转发信息。

本地 JSON 转换工具的调用方式（需要 Node.js）：

```bash
node apply-override.cjs clash-fnos-override.js source.json fnos-final.json
```

`source.json` 应是你已有的完整配置，不是本工具提供的样例。工具拒绝覆盖已有输出文件；输出包含原节点信息，应和原配置同样妥善保存。通常支持脚本覆写的客户端无需使用这个工具。

## 已做的调整

- 国内 DNS、海外默认 DNS、代理节点 DNS 分开。AliDNS / DNSPod 明确 `#DIRECT`；Google / Cloudflare 默认通过 `#Proxy`。移除旧的 `fallback`、`fallback-filter`、`fallback-lazy-query`，避免残留的混合上游改变分工。
- DIRECT 连接使用国内 DNS，同时遵循 `nameserver-policy`。保留已有自定义域名 DNS 与节点域名 DNS policy；重设 `micu.hk`、`777870.xyz`、`420128.xyz` 和 `geosite:cn`。保留的自定义 policy 优先于新的宽泛 CN 规则；其中若原来指定海外 DNS，会继续生效。
- Copilot 显式规则、AI 规则在宽泛 GitHub 规则之前；YouTube 等专用流媒体规则在 Google 通用规则之前。保留原来的自定义站点出口及 Apple/Microsoft 国内直连意图。
- 可见策略组恢复原名 `Proxy`、`AI`、`Telegram`、`Google`、`Streaming` 等。同名服务组由覆写重新生成；其他自定义组保留并隐藏，原有引用仍指向原名称。旧版已存在的 `OVR` 服务组改为指向对应原名的隐藏别名，兼容残留的 provider、DNS 或监听器引用；新配置不主动创建这些旧名称。若节点的 `dialer-proxy` 指回包含它自身的服务组，校验会报成环，需要单独使用不含该节点的链式代理组。
- 服务组默认：**AI、Telegram、Google、Streaming → Proxy**；**Apple、Microsoft、Emby、Gaming、Bilibili → DIRECT**。仍可手动改成 Proxy 或具体节点。主 `Proxy` 默认 `Smart Auto`；GitHub、海外规则及最终兜底继续使用 Proxy。
- 自动组是 `url-test`，不是按应用解锁效果选节点的 Smart 算法。采用 HTTPS 204 探测、50ms 容差；AI 和 Streaming 可手动选择已验证可用的节点，没有猜测你的节点地区或解锁能力。规则集内部保留 `OVR-` 前缀以避免重名，不影响面板中的服务组名。
- 移除未确认生效的 `fast-open-check`，修正 `max-failed-times` 注释。该参数不代表两次定时测速失败，也不能推算最坏切换时间。

## 网络字段如何处理

两份脚本都保留原来的节点、节点提供者、hosts、子规则、数据库来源、认证、控制接口、绑定接口、路由标记和监听器。原来的**主 `rules` 列表会替换**，不会自动混入旧订阅的分流；需要的自定义站点请维护在脚本顶部 `CUSTOM_RULES` 中。

电脑版仅在源配置缺失时补 `mixed-port: 7890`、`allow-lan: false`、`find-process-mode: strict` 和 `tun.enable: false`。已有 TUN 配置原样保留，实际开关继续由桌面客户端管理；本脚本不会主动开启 TUN，也不保证客户端 GUI 后续不覆盖这些字段。

飞牛版不新建、不修改 `mixed-port` / `redir-port` / `tproxy-port` / `allow-lan` / `bind-address` / `tun` / `listeners` 等网络入口字段，Nikki 现有的转发目的地址和端口继续使用原值。脚本不配置 OpenWrt 防火墙、策略路由或 Nikki 转发本身。

DNS 原有 `listen`、`enhanced-mode`、Fake-IP 网段和已有 IPv6 设置保留；没有 DNS 监听设置时补 `127.0.0.1:1053`，没有解析模式时补 `fake-ip`。**127.0.0.1 只能被飞牛本机访问**，不是可供 OpenWrt 直接查询的 DNS 地址。如果 Nikki 直接向飞牛查询 DNS，源配置中必须已有正确的 LAN 监听地址、端口和对应网络放行。本覆写不猜飞牛 IP，也不自动将端口开放到所有接口。

IPv6 沿用源配置；缺失时默认关闭。可以在顶部 `OPTIONS.ipv6` 明确设为 `true` 或 `false`。保留飞牛现有的真实 DNS / Fake-IP 模式，以免改变 Nikki 与飞牛之间的工作方式。

已有 sniffer 设置保留。没有时启用 HTTP/TLS/QUIC 域名嗅探，默认 `override-destination: false`，避免仅为了分流而强行改变原目标。

## 内网 DNS 必须知道的行为

1. 已有明确的内网 `nameserver-policy` 会保留，包括原有的 `+.lan: system`。如果它指向的系统 DNS 又把同一查询转回 Mihomo，仍会形成环路，覆写无法从文件判断实际网络。
2. 没有内网解析器信息时，新增 `.lan`、`.local`、`.home.arpa`、`geosite:private` 的 `rcode://success` 空答案兜底，避免猜网关或将这些未知内网名字送到公共 DNS。这**不提供内网域名解析**。通过 IP 访问内网设备及原有 hosts 不受此策略影响。
3. 使用内网域名时，优先让 dnsmasq 在转给飞牛之前回答本地域；或者在对应脚本的 `OPTIONS.lanDns` 中填写能独立回答内网查询的服务器。不能填写会把相同查询转回本 Mihomo 的地址。不知道地址时不必为了填写而猜一个网关。
4. 原有 `fake-ip-filter-mode: blacklist` 会追加内网和常见兼容域名。原有 `whitelist` / `rule` 模式原样保留，不能把黑名单直接拼入；这些模式下，最初的 DNS 应答仍可能是 Fake-IP，需检查原有过滤规则。
5. `.local` 主要涉及 mDNS，DNS policy 不会自动实现跨子网设备发现。

## 第一次使用

1. 保留当前可用的原配置副本，替换生成配置所用的旧覆写脚本。
2. 查看管理器的最终生效配置，确认飞牛端口、DNS 监听、入站和 TUN 状态仍符合原有链路。
3. 服务组没有保存选择时使用上表默认值；主 `Proxy` 默认 `Smart Auto`。`store-selected: true` 会优先恢复历史手动选择，因此更新后若 Apple / Microsoft / Emby / Gaming / Bilibili 仍显示 Proxy，在面板将这五组切到 DIRECT 一次即可，无需删除整个缓存。旧 OVR 兼容别名只含一个新组目标，不继续控制独立出口。
4. 测试一个国内站点、一个海外站点、Copilot/AI、Emby，以及你实际使用的内网地址或域名。若内网域名不工作，检查上一节的本地 DNS 分工。

DNS 默认通过 `Proxy` 是路径选择，不是无条件的“禁止直连”保证：用户将该组选择为 DIRECT，解析连接也会直连；节点提供者还未加载或所有节点不可用时也不承诺自动恢复。保留的节点专用 policy、bootstrap 解析器及原组依赖仍需符合实际网络。

## 验证范围

已完成 44 项双脚本行为检查：无输入对象修改、重复覆写稳定、网络字段保留、旧策略依赖保留、DNS 分工、Fake-IP 不同过滤模式及显式空网段、精确与组合 DNS policy、规则优先级、显式 GLOBAL 组兼容、同名冲突和已知显式引用循环检查。远程 provider 中的实际节点内容不在脚本静态检查范围。

两份脚本各自生成的样例完整配置通过官方 **Mihomo v1.19.34（Windows amd64）`-t` 配置校验**。另使用实际飞牛配置作为输入，在设备现用的 **Mihomo v1.19.31（Linux amd64）** 上通过候选配置 `-t` 校验；检查了认证、节点、监听、TUN、接口及内网 DNS 的保留情况。候选临时文件已删除，运行配置保持不变，没有重启或重载服务。

现有的 Nikki → 飞牛代理链路使用现有认证访问 HTTPS 连通性地址，返回 204；这验证原有转发可用，不代表新配置已上线，也不代表所有节点、UDP、AI/流媒体解锁和每个 DNS 上游均已测试。数据库沿用原配置或内核默认，需要其中包含 PRIVATE、CN、APPLE@CN、CATEGORY-AI-!CN 等分类。
