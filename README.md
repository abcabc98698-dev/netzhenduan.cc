<div align="center">

# ⚡ 网络诊断实验室 (NetZhenDuan.cc)

**专注于全球跨境广域网通信、BGP Anycast / IEPL 专线可观测性、TLS 1.3 / QUIC 协议级排障与高可用基础设施客观评测系统**

[![VitePress](https://img.shields.io/badge/VitePress-1.6.4-38bdf8?style=for-the-badge&logo=vitepress)](https://vitepress.dev/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5.12-42b883?style=for-the-badge&logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![SEO Health](https://img.shields.io/badge/SEO_Health-98.8%2F100-emerald?style=for-the-badge&logo=google)](https://netzhenduan.cc/)
[![Pages](https://img.shields.io/badge/Total_Pages-127_Docs-indigo?style=for-the-badge)](https://netzhenduan.cc/)
[![Content Scale](https://img.shields.io/badge/Pure_Han_Chars-397K+-f59e0b?style=for-the-badge)](https://netzhenduan.cc/)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-rose?style=for-the-badge)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

<p align="center">
  <a href="https://netzhenduan.cc/"><b>🌐 访问官方在线实验室</b></a> •
  <a href="https://netzhenduan.cc/diagnostics/"><b>🛠️ 在线网络探针</b></a> •
  <a href="https://netzhenduan.cc/issues/"><b>📖 故障排查知识库</b></a> •
  <a href="https://netzhenduan.cc/airports/"><b>📊 42家专线横评</b></a> •
  <a href="https://netzhenduan.cc/about"><b>👥 关于我们与方法论</b></a>
</p>

</div>

---

## 📌 项目概述 (Overview)

随着现代跨国广域网基础设施与多云互联架构的演进，普通技术从业者与终端用户在访问跨境公网资源时，长期面临**“连不上不知其因、速度慢不知何解”**的黑盒困境。传统单维度的 `ping` 报文无法揭示内核级 TCP 重传、TLS 1.3 密码套件协商失败、ALPN 协议降级、BGP Anycast 路由漂移、WinINET PAC 注册表死锁以及晚高峰动态 QoS 限流等深层次网络工程缺陷。

**网络诊断实验室（NetZhenDuan.cc）** 运用严格的计算机网络工程科学方法、RFC 国际互联网标准与全栈可观测性技术，构建了一个具备**四层深度拓扑（一级大专题 → 二级专题 → 三级内容集群 → 集群独立长文）**的端到端网络故障诊断与基础设施技术审计知识库。

全站已沉淀 **127 篇正式页面**，纯正文汉字量突破 **39.7 万字**（包含代码与工程拓扑突破 **90 万字元**），100% 杜绝泛泛而谈的薄内容与模板化占位。

```
+-----------------------------------------------------------------------------------------+
|                               网络诊断实验室 全链路可观测性矩阵架构                             |
+-----------------------------------------------------------------------------------------+
|  [终端接入层]  Windows / macOS / Linux / iOS / Android 客户端运行态抓包与内核排错           |
|                                         |                                               |
|  [协议协商层]  DNS 污染判定 / TLS 1.3 密码套件协商 / ALPN (h2/http1.1) 协议降级分析         |
|                                         |                                               |
|  [传输中继层]  BGP 路由穿透 / Anycast 漂移探测 / 跨境 IEPL/IPLC 专线晚高峰抖动压测          |
|                                         |                                               |
|  [目标落地层]  原生住宅 IP 真实属性审计 / ASN 归属 / MaxMind & IPinfo 风险评分 (Fraud Score) |
+-----------------------------------------------------------------------------------------+
```

---

## 🌟 核心特性 (Key Features)

### 1. 12 项工业级网络与服务质检指标
平台依据 RFC 2581（TCP 拥塞控制）、RFC 3393（IPDV 延迟抖动）与 RFC 7301（ALPN 严格协商），建立了一套完整的质量判定基准：
- **三网晚高峰（20:00 - 23:00）吞吐量压测**（多线程 iperf3 与 HTTP/3 QUIC 饱和度测试）
- **TCP 丢包率与重传率分析**（Fast Retransmit 与 RTO 统计）
- **往返时延（RTT）P50 中位数与 P95 分位数**（Bufferbloat 队列延迟探测）
- **RFC 3393 纳秒级延迟抖动（Jitter）计算**
- **BGP AS 路径跳数与穿透率审计**
- **跨境物理专线真实性验证**（二层 IEPL/IPLC vs 公网中转伪专线）
- **原生住宅 IP 与广播机房 IP 属性深度审计**
- **IP 欺诈度评分（Fraud Score / Risk Score）信誉风控模型**
- **全球主流流媒体（Netflix/Disney+）与顶级 AI（ChatGPT/Claude）真实解锁率**
- **TLS 1.3 密码套件握手成功率与 ALPN 协商健壮性**
- **抗 GFW 主动探测与协议伪装特征逆向审计**（VLESS-Reality / TUIC v5 / Hysteria 2）
- **客户端长时间运行系统资源内耗监视**（72 小时内存泄漏与 Wintun 虚拟网卡死锁监视）

### 2. 浏览器端本地安全网络探针
- **纯前端端侧本地计算**：探针基于 WebRTC API、STUN 与 WebAssembly 驱动，所有连通性探测与数据统计均在用户浏览器端本地完成。
- **零日志、零敏感数据外发**：绝对不向后端服务器收集、记录或转存用户的订阅链接、节点密钥或任何隐私流量。

### 3. 极速 SSG 静态预渲染与顶级 SEO 基础设施
- **构建效率**：基于 VitePress 现代构建管线，127 篇万字长文 20 秒极速全量编译。
- **SEO 综合评分 98.8 / 100**：
  - 127 篇页面 100% 覆盖 Schema.org JSON-LD 结构化数据（`WebSite`、`Organization`、`BreadcrumbList`、`TechArticle`、`CollectionPage`）；
  - Sitemap 100% 自动注入 `<lastmod>`、`<changefreq>` 与 `<priority>`，精准剔除 404；
  - 内部链接点击深度 $\le 3$，0 孤立页面，0 死链；
  - 全站商业推广外链 100% 严格标记 `rel="nofollow sponsored noopener"`，合规透明。

---

## 📚 八大技术专题导航 (Pillars & Hubs)

| 专题栏目 | 路由入口 | 专题定位与核心内容 | 典型深度长文 |
|---|---|---|---|
| **科学上网故障排查** | [`/issues/`](https://netzhenduan.cc/issues/) | 连接成功打不开网页、DNS污染劫持、Fake-IP崩溃排查 | [《连接成功打不开网页深度排障》](https://netzhenduan.cc/issues/connected-but-no-internet) (5,708字) |
| **梯子连不上全链路排查** | [`/connection/`](https://netzhenduan.cc/connection/) | 节点全红超时、GFW RST阻断、NTP时钟偏差、TLS 1.3握手 | [《梯子突然全部连不上全面排查》](https://netzhenduan.cc/connection/all-nodes-down) (5,124字) |
| **客户端手册与进阶** | [`/clients/`](https://netzhenduan.cc/clients/) | Clash Verge Rev、Mihomo内核、v2rayN/v2rayNG、Shadowrocket | [《节点超时 12 大模块深度排障》](https://netzhenduan.cc/clients/clash-verge-rev-timeout) (7,696字) |
| **机场推荐与专线选型** | [`/airports/`](https://netzhenduan.cc/airports/) | 42家专线机场晚高峰大横表、IEPL专线拓扑、原生IP审计 | [《TCP BBR 拥塞控制算法机场调优》](https://netzhenduan.cc/airports/speed-stability/packet-loss-latency/tcp-bbr-congestion-control-airport-tuning) (10,502字) |
| **网络诊断与在线探针** | [`/diagnostics/`](https://netzhenduan.cc/diagnostics/) | 实时连通性探针、DNS泄漏检测、Bufferbloat路由器队列调优 | [《DNS 泄漏全链路检测与防护》](https://netzhenduan.cc/diagnostics/dns-leak) (5,254字) |
| **机场订阅与鉴权排障** | [`/subscription/`](https://netzhenduan.cc/subscription/) | Base64解码错误、YAML语法缩进、Subconverter私有化部署 | [《订阅链接导入失败深度排查》](https://netzhenduan.cc/subscription/import-failed) (5,590字) |
| **使用教程与分流指南** | [`/tutorials/`](https://netzhenduan.cc/tutorials/) | 客户端分流模式选择、TUN虚拟网卡配置、WebRTC防泄漏 | [《分流规则模式全面解析》](https://netzhenduan.cc/tutorials/rule-modes) (5,534字) |
| **免费机场与风险防范** | [`/free/`](https://netzhenduan.cc/free/) | 免费节点安全陷阱、蜜罐嗅探识别、公开节点半衰期数学模型 | [《免费节点安全风险与黑产陷阱》](https://netzhenduan.cc/free/privacy-security-risks/free-node-security-threats) (5,129字) |

---

## 🛠️ 本地开发与构建指南 (Quick Start)

### 环境依赖
- **Node.js**: `>= 18.0.0` (推荐 Node.js LTS v20 或 v24)
- **包管理器**: `npm` / `pnpm` / `yarn`

### 1. 克隆代码仓库
```bash
git clone https://github.com/abcabc98698-dev/netzhenduan.cc.git
cd netzhenduan.cc
```

### 2. 安装项目依赖
```bash
npm install
```

### 3. 启动本地开发服务器
```bash
npm run dev
```
启动后访问本地开发调试地址：`http://localhost:5173/`。

### 4. 生产静态构建
```bash
npm run build
```
静态产物将输出至 `docs/.vitepress/dist/`，包含全部优化后的 HTML 页面、Sitemap、Robots 与客户端 Bundle。

### 5. 本地预览生产构建产物
```bash
npm run preview
```
预览服务将运行于 `http://localhost:4173/`。

### 6. 执行全自动化技术 SEO 审计脚本
项目中包含完备的自研质量巡检工具链：
```bash
# 验证全站汉字字数与薄内容统计
node internal/count_han.cjs

# 执行全量 SEO 静态扫描 (Canonical, Schema, 死链, 外链标记, 元数据重复性)
node internal/audit_scan.cjs

# 验证全站 URL 页面点击深度拓扑
node internal/click_depth.cjs

# 对本地构建服务器执行全量 HTTP 200 OK 连通性测试
node internal/check_all_urls.cjs
```

---

## 📂 项目目录结构 (Directory Structure)

```text
netzhenduan.cc/
├── docs/                       # 核心文档与静态资产根目录
│   ├── .vitepress/             # VitePress 核心配置文件与构建产出
│   │   ├── config.mts          # 主配置文件 (SEO Head / Schema / 路由 / Sitemap)
│   │   └── dist/               # 生产构建输出目录
│   ├── public/                 # 静态资源 (robots.txt, .htaccess, avatar.jpg 等)
│   ├── issues/                 # 科学上网故障排查大专题
│   ├── connection/             # 梯子连不上全链路排查大专题
│   ├── clients/                # 客户端手册大专题 (Clash / v2ray / Shadowrocket)
│   ├── airports/               # 机场推荐与 42 家专线横评大专题
│   ├── diagnostics/            # 网络诊断工具与在线探针大专题
│   ├── subscription/           # 机场订阅问题与鉴权排错大专题
│   ├── tutorials/              # 使用教程与分流指南大专题
│   ├── free/                   # 免费机场与应急替代大专题
│   ├── about.md                # 《关于我们》独立信任承载页
│   ├── methodology.md          # 《评测方法论与质检标准》独立承载页
│   ├── disclosure.md           # 《商业推广与联盟佣金披露声明》
│   ├── privacy.md              # 《隐私政策与数据安全准则》
│   ├── terms.md                # 《服务条款与用户使用协议》
│   ├── 404.md                  # 404 错误页
│   └── index.md                # 实验室首页视觉落地页
├── internal/                   # 自研质量审计、爬虫与 SEO 验证脚本库
│   ├── audit_scan.cjs          # 综合技术 SEO 扫描器
│   ├── check_all_urls.cjs      # 全量 HTTP 状态码自动化检测工具
│   ├── click_depth.cjs         # 页面点击深度与孤立页面图论分析器
│   ├── count_han.cjs           # 纯汉字字数统计工具
│   └── verify_schemas.cjs      # Schema.org JSON-LD 结构化数据解析器
├── package.json                # 项目依赖与运行脚本
├── seo-health-report.md        # 预防性 SEO 健康检查与审计报告
└── README.md                   # 项目自述文件
```

---

## ⚖️ 知识共享许可与法律责任声明 (License & Legal)

1. **知识共享许可**：本仓库中所有的原创文字、排障拓扑图、流程图及配置范式，均遵循 **[知识共享 署名-非商业性使用-相同方式共享 4.0 国际许可协议 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)**。
2. **免责与合规声明**：
   - 本项目所载的所有技术文章与在线探针工具，仅供网络管理员、软件工程师及高校科研人员进行计算机网络协议调试、跨国学术研发链路优化及网络性能可观测性学术研究。
   - 严禁将本项目的技术内容用于任何侵入他人系统、破坏网络安全或违反当地法律法规的活动。
3. **商业透明度**：本站严格遵循 FTC 联盟营销披露指南与搜索引擎规范，全站所有商业返利外链 100% 显式标注 `rel="nofollow sponsored noopener"`，评测坚持以真实数据为唯一准绳，严守中立性六大红线。

---

<div align="center">
  <b>⚡ 网络诊断实验室 · 用数据打破跨境网络黑盒</b><br>
  <sub>Copyright © 2024-2026 <a href="https://netzhenduan.cc/">netzhenduan.cc</a>. All Rights Reserved.</sub>
</div>
