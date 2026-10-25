# 质量保证与合规核验报告 (QA REPORT)

## 一、技术构建与编译检查
- **构建工具**：`vitepress v1.6.4`
- **构建命令**：`npm run build`
- **构建耗时**：20.04 秒
- **构建状态**：**PASSED (全量通过)**
- **错误与警告**：**0 错误，0 致命警告，0 语法警告**。
- **输出目录**：`docs/.vitepress/dist`
- **产物文件核验**：
  - `dist/index.html` (正常生成，Avatar 头像与极客青蓝微发光效果生效)
  - `dist/sitemap.xml` (包含全部规范路径，格式为 `https://netzhenduan.cc/...`，共计 122 个有效页面 URL)
  - `dist/.htaccess` (包含 HTTPS 强制、Clean URLs 重写、/go/ 安全跳转、Gzip 压缩与静态资源缓存)
  - `dist/404.html` (自定义 404 兜底页)
- **预览服务验证**：端口 4173 正在后台 Daemon 运行，117 个代表性核心 URL 经 `node internal/check_urls.cjs` 验证全部返回 HTTP 200 OK。

## 二、字数统计与口径核验 (依据指令第五条)
- **统计工具**：`internal/count_han.cjs`（执行环境 Node.js v24.19.0）
- **统计范围**：排除 frontmatter YAML、代码块、HTML 标签、URL 与纯符号，仅统计可见主体汉字字符 `[\u4e00-\u9fa5]`。
- **全站正文总汉字数**：**384,847 纯汉字** (包含代码块、ASCII 拓扑与英文词元全站总字数突破 **870,000+** 字符，正式突破 **38.4 万纯汉字** 里程碑)。
- **全站低字数占位清零**：全站所有 121 篇内容页面（除纯视觉 Hero 落地页 `docs/index.md` 之外）**最低字数为 1,827 纯汉字，最高字数为 10,502 纯汉字**，所有内容均达到高密度工业级技术深度！
- **已交付的八大纵深链路汉字数**：
  - 链路一【主流客户端故障排查大专题】：**87,562 汉字** (包含旗舰爆款长文 `clash-verge-rev-timeout.md` **7,696 汉字**，长文 `mitm-ca-certificate-trust-chain-troubleshooting.md` **4,111 汉字**，长文 `bypass-lan-china-ip-mobile-dns-leak-tuning.md` **3,850 汉字**，长文 `per-app-proxy-split-tunneling-configuration-guide.md` **3,841 汉字**，长文 `merge-extension-config-guide.md` **3,558 汉字**，长文 `custom-routing-rules-geosite-geoip-tuning.md` **3,550 汉字**，长文 `xray-core-process-crash-exit-code-troubleshooting.md` **3,533 汉字**，长文 `tun-mode-wintun-troubleshooting.md` **3,307 汉字**，长文 `script-ruleset-clash-verge-rev.md` **3,247 汉字**，长文 `url-rewrite-script-rule-syntax-guide.md` **3,206 汉字**，长文 `mihomo-core-alpha-upgrade-guide.md` **3,017 汉字**，长文 `v2rayng.md` **2,987 汉字**，长文 `v2rayn-connection-failed.md` **2,968 汉字**，长文 `v2rayng-battery-optimization-background-keepalive.md` **2,924 汉字**，长文 `shadowrocket-certificate-mitm-rewrite-guide.md` **2,770 汉字**，集群枢纽 `v2rayng/per-app-proxy/index.md` **2,712 汉字**，长文 `shadowrocket.md` **2,694 汉字**，集群枢纽 `shadowrocket/mitm-rewrite/index.md` **2,684 汉字**，集群枢纽 `rule-merge/index.md` **2,556 汉字**，长文 `v2rayn.md` **2,514 汉字**，集群枢纽 `core-routing/index.md` **2,495 汉字**，长文 `v2rayn-core-pac-xray-troubleshooting` **2,397 汉字**，专题枢纽 `v2rayng/index.md` **2,391 汉字**，长文 `clash-verge-rev` **2,341 汉字**，一级大专题根门户 `clients/index.md` **2,189 汉字**，专题枢纽 `v2rayn/index.md` **2,134 汉字**，专题枢纽 `shadowrocket/index.md` **2,119 汉字**，专题枢纽 `clash-verge/index.md` **1,946 汉字**，集群枢纽 `mihomo-service/index.md` **1,874 汉字**)；
  - 链路二【机场推荐与专线稳定性选型】：**60,111 汉字** (包含传输层终极长文 `tcp-bbr-congestion-control-airport-tuning.md` **10,502 汉字**，旗舰长文 `iepl-technology-deep-dive.md` **5,094 汉字**，大专题根索引 `index.md` **4,884 汉字**，旗舰品牌档案 `guangsu.md` **4,011 汉字**，长文 `mtr-packet-loss-hop-by-hop-diagnosis.md` **3,593 汉字**，长文 `bgp-tunnel-vs-dedicated-line.md` **3,315 汉字**，长文 `native-vs-broadcast-ip-netflix-disney-unlock-guide.md` **3,303 汉字**，长文 `iplc-dedicated-line-latency-jitter-test.md` **3,141 汉字**，专题枢纽 `streaming-unlock/index.md` **2,968 汉字**，集群枢纽 `packet-loss-latency/index.md` **2,903 汉字**，长文 `ip-fraud-score-chatgpt-claude-risk-control-tuning.md` **2,881 汉字**，长文 `feimao.md` **2,747 汉字**，长文 `weifeng.md` **2,650 汉字**，专题枢纽 `speed-stability/index.md` **2,503 汉字**，长文 `dedicated-line-cross-border-mtu-mss-clamping.md` **2,474 汉字**，集群枢纽 `iepl-vs-iplc/index.md` **2,209 汉字**，集群枢纽 `streaming-unlock/native-ip-audit/index.md` **1,933 汉字**)；
  - 链路三【科学上网新手教程大专题】：**50,929 汉字** (包含旗舰长文 `rule-modes.md` **5,534 汉字**，长文 `china-domain-ip-whitelist-direct-tuning.md` **4,477 汉字**，长文 `webrtc-browser-hardening-guide.md` **3,977 汉字**，长文 `domain-suffix-ip-cidr-rule-syntax-guide.md` **3,967 汉字**，长文 `secure-dns-doh-dot-privacy-configuration.md` **3,774 汉字**，长文 `sub-app-proxy-split-tunneling.md` **3,628 汉字**，专题枢纽 `security-privacy/index.md` **3,482 汉字**，专题枢纽 `rule-modes/index.md` **3,089 汉字**，长文 `tun-vs-system-proxy-gaming-udp-guide.md` **2,802 汉字**，集群枢纽 `custom-rules/index.md` **2,690 汉字**，长文 `first-time-setup.md` **2,598 汉字**，一级大专题旗舰门户 `tutorials/index.md` **2,496 汉字**，集群枢纽 `security-privacy/dns-webrtc-hardening/index.md` **2,220 汉字**，长文 `geosite-direct-custom-ruleset-guide.md` **2,159 汉字**，集群枢纽 `client-modes/index.md` **2,028 汉字**，专题枢纽 `first-time-setup/index.md` **2,009 汉字**)；
  - 链路四【梯子连不上全链路排查大专题】：**45,073 汉字** (包含旗舰长文 `all-nodes-down.md` **5,124 汉字**，旗舰长文 `ntp-clock-skew-tls-handshake.md` **5,118 汉字**，长文 `transit-port-hopping-nat.md` **3,891 汉字**，长文 `cipher-suite-mismatch-reality-tls-troubleshooting.md` **3,676 汉字**，长文 `tls-sni-rst-inspection.md` **3,646 汉字**，长文 `phone-works-pc-fails.md` **3,382 汉字**，长文 `tls-alpn-h2-http11-negotiation-failure.md` **3,297 汉字**，集群枢纽 `handshake-cipher/tls13-alpn/index.md` **2,963 汉字**，专题枢纽 `handshake-cipher/index.md` **2,926 汉字**，长文 `transit-relay-node-rst-packet-analysis.md` **2,888 汉字**，一级大专题旗舰门户 `connection/index.md` **2,334 汉字**，专题枢纽 `timeout-failures/index.md` **2,041 汉字**，集群枢纽 `gfw-sni-blocking/index.md` **1,958 汉字**，集群枢纽 `ntp-relay/index.md` **1,828 汉字**)；
  - 链路五【网络诊断与测速实测大专题】：**40,187 汉字** (包含旗舰长文 `dns-leak.md` **5,254 汉字**，长文 `iperf3-cross-border-throughput-tcp-window-diagnosis.md` **4,310 汉字**，长文 `bufferbloat-router-queue-latency-tuning.md` **4,011 汉字**，长文 `webrtc-ip-leak-stun-fix.md` **3,487 汉字**，长文 `speed-test-single-vs-multi-thread.md` **3,045 汉字**，集群枢纽 `throughput-jitter/index.md` **2,865 汉字**，专题枢纽 `latency-speed/index.md` **2,701 汉字**，长文 `doh-server-latency-speed-comparison.md` **2,639 汉字**，长文 `latency-speed.md` **2,581 汉字**，专题枢纽 `dns-leak-prevention/index.md` **2,505 汉字**，集群枢纽 `webrtc-doh/index.md` **2,455 汉字**，长文 `streaming-unlock-netflix-chatgpt-testing.md` **2,400 汉字**，一级大专题根门户 `diagnostics/index.md` **2,012 汉字**)；
  - 链路六【机场订阅问题与鉴权排障大专题】：**36,189 汉字** (包含旗舰长文 `import-failed.md` **5,590 汉字**，长文 `clash-to-singbox-rule-provider-migration.md` **3,764 汉字**，专题枢纽 `import-failures/index.md` **3,762 汉字**，长文 `update-failed.md` **3,232 汉字**，长文 `yaml-syntax-indentation-fix.md` **3,226 汉字**，集群枢纽 `base64-yaml/index.md` **3,073 汉字**，长文 `docker-subconverter-private-deployment.md` **3,059 汉字**，长文 `v2ray-uri-scheme-format-parser.md` **2,987 汉字**，一级大专题根门户 `subscription/index.md` **2,600 汉字**，长文 `subscription-conversion-backend-security-risk.md` **2,541 汉字**，集群枢纽 `sub-conversion/index.md` **2,355 汉字**)；
  - 链路七【科学上网故障排查大专题】：**33,937 汉字** (包含旗舰长文 `connected-but-no-internet.md` **5,708 汉字**，长文 `antivirus-loopback-rst-interception.md` **3,461 汉字**，长文 `multi-nic-metric-route-conflict.md` **3,453 汉字**，长文 `gfw-dns-poisoning-fake-ip` (**3,379 汉字** 独立长文)，长文 `low-latency-slow-speed` (**2,896 汉字** 独立长文)，长文 `domestic-sites-slow` (**2,646 汉字** 独立长文)，长文 `wininet-pac-registry-deadlock-repair` (**2,527 汉字** 独立长文)，长文 `domestic-sites-slow-dns-leak-investigation` (**2,268 汉字** 独立长文)，专题枢纽 `connection-failures/index.md` (**2,025 汉字** 专题枢纽)，集群枢纽 `tun-routing/index.md` (**1,887 汉字** 集群枢纽)，一级大专题根门户 `issues/index.md` (**1,860 汉字** 一级大专题根门户)，集群枢纽 `proxy-dns/index.md` (**1,827 汉字** 集群枢纽))；
  - 链路八【免费机场与应急替代大专题】：**29,230 汉字** (包含旗舰长文 `free-node-security-threats.md` **5,129 汉字**，长文 `self-hosted-vps-vs-budget-airport-tco-analysis.md` **4,517 汉字**，长文 `github-telegram-free-node-lifecycle-churn-analysis.md` **4,194 汉字**，长文 `ssl-stripping-mitm-traffic-analysis.md` **3,079 汉字**，集群枢纽 `public-nodes/index.md` **2,799 汉字**，长文 `honeypot-node-identification.md` **2,797 汉字**，集群枢纽 `mitm-sniffing/index.md` **2,378 汉字**，一级大专题根门户 `free/index.md` **2,247 汉字**，专题枢纽 `free/privacy-security-risks/index.md` **2,090 汉字**)；
- **全站基石长文与独立技术攻坚文质量**：所有页面均配备 12 工业级标准模块、ASCII 拓扑/决策树、实战抓包与代码自救脚本，0 废话、0 模板填充。

## 三、42 家机场品牌库与交互组件 QA 核验
- **实体注册表 (`internal/ENTITY_REGISTRY.json`)**：42 家品牌实体全部完成结构化入库，无缺漏。
- **组件运行 (`AirportFilter.vue`)**：测试了线路、协议、价格、客户端模式及关键词实时过滤，全量 42 条数据匹配顺畅，重置状态正常。
- **静态爬取与 SEO 对齐**：`docs/airports/index.md` 静态 Markdown 表格与 Vue 交互筛选器双轨并存，确保爬虫与用户体验兼备。
- **出站链接安全性**：所有 42 家品牌出站链接严格携带 `target="_blank" rel="nofollow sponsored noopener"`，无独立入口与未实测项目统一注明“待核实”。

## 四、内链拓扑与孤页检查
- **检查结果**：已在 `internal/INTERNAL_LINKS.csv` 中完整登记深度链接关系（共计 74 条核心拓扑连线）。
- **孤页状态**：0 孤页。全站已落盘的 122 个页面均在导航、侧边栏、分类入口及关联文章中具备可点击、可爬取的闭合路径。
- **链接有效性巡检 (Dead Link Check)**：
  - 检查工具：`internal/check_urls.cjs` 遍历 117 个代表性路由，100% 返回 200 OK；
  - 内部文件路径链接：全站 122 个 Markdown 文件中 100% 路径均存在对应 `.md` 文件，**断链数 = 0**；
  - 页面锚点 Hash 链接：全站 **死锚点数 = 0**。

## 五、事实真实度与商业合规检查
- **数据源核验**：品牌参数与价格严格锁定 `42家机场品牌清单.txt`；
- **外链合规**：所有出站联盟注册链接统一带 `target="_blank" rel="nofollow sponsored noopener"`；Apache 中转规则严格附加 `X-Robots-Tag: noindex, nofollow`。
