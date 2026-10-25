---
title: 科学上网新手使用教程与分流指南大专题
description: 零基础科学上网全平台入门指引。覆盖 Windows、macOS、Android、iOS 客户端从零安装、订阅导入、分流模式选择与避坑技巧。
---

# 科学上网新手使用教程与分流指南大专题

对于刚刚接触科学上网、跨境办公或学术科研的初学者而言，面对客户端界面中密密麻麻的专业术语——如 **TUN 虚拟网卡**、**Fake-IP**、**规则分流（Rule）**、**节点超时（Timeout）** 与 **PAC 脚本**，往往会产生极大的挫败感。许多新手常常因为一个微小的设置疏漏（例如错误地开启了全局模式导致访问国内微信、淘宝卡死，或者把 Base64 订阅链接当成 Clash 配置文件导入），便误以为自己的电脑中毒、系统崩溃，或者盲目认定服务商跑路。

本一级大专题专为**零基础新手读者**量身定制，彻底抛弃晦涩空泛的黑话堆砌与无依据的操作罗列，秉承**“告别玄学尝试、理清网络底层、一劳永逸稳定上网”**的工程化指引原则，为您构建从客户端选型、订阅拉取、分流模式配置到跨设备灾备的标准化全流程指引。

---

## 模块一：核心认知：代理软件到底是什么？

要掌握科学上网，首先必须破除一个常见误区：**代理客户端不是传统意义上的“网游加速器”**。网游加速器通常仅对特定的游戏进程端口进行转发，而现代科学上网客户端（如 Clash Verge Rev、v2rayN、Shadowrocket）本质上是一个**运行在本机的高性能虚拟网关与智能路由状态机**。

```
+─────────────────────────────────────────────────────────────────────────────+
|                     现代代理客户端三大数据劫持模型架构对比                  |
+─────────────────────────────────────────────────────────────────────────────+
[模型 A: 系统代理模式 (OSI Layer 7 应用层)]
用户浏览器 (Chrome/Edge) ──► 遵循系统代理 (127.0.0.1:7890) ──► 客户端代理核心
特点: 仅对遵循 WinINet 的应用生效；Git、终端命令行与 UDP 游戏流量完全不走代理！

=============================================================================

[模型 B: TUN 虚拟网卡模式 (OSI Layer 3 网络层)]
本机所有应用程序 (包括游戏/终端/微信) ──► Wintun 虚拟网卡驱动 ──► 客户端代理核心
特点: 接管整机全部 IP 数据包，原生支持 UDP 转发，彻底解决游戏断连与 DNS 泄漏！

=============================================================================

[模型 C: 本地 SOCKS5/HTTP 端口显式监听 (协议级适配)]
开发工具 (Git / Docker / IDE) ──► 显式指定 http_proxy=http://127.0.0.1:7890
特点: 精准控制特定程序走代理，避免全局网络环境受到干扰。
```

1. **系统代理（System Proxy，OSI 第 7 层）**：客户端通过修改操作系统的网络设置（Windows WinINet 或 macOS Network Preferences），通知所有遵循操作系统约定的应用程序将 HTTP/HTTPS 流量转交给本地监听端口（如 `127.0.0.1:7890`）。它的优势是轻量级、无需管理员内核驱动权限；缺点是对于命令行工具（CMD/PowerShell）、Docker 容器以及绝大多数基于 UDP 的外服网游完全无效；
2. **TUN 虚拟网卡模式（TUN Mode，OSI 第 3 层）**：客户端通过调用底层虚拟网卡驱动（如 Windows 下的 Wintun、macOS 的 utun），在操作系统中虚拟出一张独立的网络适配器，并通过修改系统路由表将跃点数（Metric）设为最高优先级。这使得**整机的所有 TCP 与 UDP 数据包全部强制注入代理内核**，实现真正的全局透明接管；
3. **规则分流引擎（Rule-Based Engine）**：内核内置了庞大的域名与 IP 数据库（GeoSite 与 GeoIP）。当数据包进入内核后，分流引擎在内存中以微秒级速度进行匹配：
   - **DIRECT（直连）**：国内网站（如百度、淘宝、微信）直接通过本地物理网卡发出，保证国内访问拥有 100% 原生满速，不消耗机场海外流量；
   - **PROXY（代理）**：海外受阻断域名（如 Google、GitHub、YouTube）封装进加密专线通道出境；
   - **REJECT（阻断）**：全网已知的恶意广告、追踪探针与挖矿脚本直接就地丢弃，加速网页加载。

---

## 模块二：全平台主流客户端选型决策矩阵

不同的操作系统其底层网络栈架构截然不同。下表为各平台用户推荐最具稳定性、现代感与社区维护活力的合规客户端：

| 操作系统 | 推荐主力客户端 | 备用轻量客户端 | 内置核心 | 核心亮点与推荐理由 |
|---|---|---|---|---|
| **Windows** | **Clash Verge Rev** | **v2rayN** | Mihomo (Meta) / Xray | 现代化 Tauri 界面、内建 Wintun TUN 驱动、支持脚本扩展与订阅自动合并 |
| **macOS** | **Clash Verge Rev** | **Surge (商业付费)** | Mihomo / 独立商业引擎 | 原生适配 Apple Silicon (M1~M4)，支持系统分流与原生代理快捷切换 |
| **Android** | **v2rayNG** | **Clash Verge Android** | Xray-core / Mihomo | 极简无广告、具备完善的安卓分应用代理白名单、低电耗后台常驻 |
| **iOS** | **Shadowrocket (小火箭)** | **Loon / Quantumult X** | 自研跨协议引擎 | 性价比极高（美区约 \$2.99）、全协议链兼容、支持脚本重写与 MitM 调优 |
| **Linux** | **Mihomo (命令行)** | **Clash Verge Rev (AppImage)**| Mihomo 独立二进制 | 原生支持 systemd 守护进程运行，无缝集成服务器与开发工作站环境 |

---

## 模块三：新手快速入门四象限成长路径

按照网络认知规律，新手应当遵循以下四个阶段循序渐进：

```
                    从零起步：第一台设备连接
                               ▲
                               │
        阶段 I：客户端选型与安装    │    阶段 II：订阅拉取与首次握手
    (根据操作系统匹配最佳客户端)  │   (识别专属链接/节点延迟绿灯)
    目标：安装干净官方稳定版      │   目标：30秒打通外网第一个页面
                               │
◄─────────────────────────────┼─────────────────────────────►
遇到阻碍：排查与自我救赎                        熟练进阶：长期稳定与多端协同
                               │
        阶段 III：分流模式深度调优  │    阶段 IV：多设备迁移与规则自定
    (规则模式避免国内变慢与封号)  │   (手机电脑协同/分应用按需代理)
    目标：国内直连秒开/海外走专线 │   目标：告别卡顿与流量偷跑浪费
                               │
                               ▼
                     成为独立可观测玩家
```

---

## 模块四：自动化体检：PowerShell 新手网络与本地代理服务健康度自检脚本

当您在 Windows 电脑上点击客户端后无法正常上网，切忌盲目乱点。运行以下脚本，可在一秒内定位是“本地端口未监听”、“系统代理未开启”还是“DNS 被破坏”：

```powershell
<#
.SYNOPSIS
    新手科学上网网络环境与代理健康度一键自动化诊断脚本
.DESCRIPTION
    扫描 Windows 系统代理注册表、检查 7890/10808 端口监听状态，并验证内外网连通性。
#>
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    科学上网新手网络环境与本地代理服务健康度体检" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. 检测系统代理注册表状态
Write-Host "`n>>> [步骤 1] 正在检查 Windows 系统代理 (WinINet) 配置..." -ForegroundColor Yellow
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
$proxyEnable = (Get-ItemProperty -Path $regPath).ProxyEnable
$proxyServer = (Get-ItemProperty -Path $regPath).ProxyServer

if ($proxyEnable -eq 1) {
    Write-Host " [✓] 系统代理开关: 已开启 (ProxyEnable = 1)" -ForegroundColor Green
    Write-Host "     当前代理服务器地址: $proxyServer" -ForegroundColor White
} else {
    Write-Host " [!] 系统代理开关: 已关闭 (ProxyEnable = 0)" -ForegroundColor Yellow
    Write-Host "     提示: 若未使用 TUN 模式，关闭系统代理将导致浏览器无法走代理！" -ForegroundColor Gray
}

# 2. 检查本地代理端口是否处于正常监听状态 (7890 / 10808)
Write-Host "`n>>> [步骤 2] 正在扫描常见代理端口监听状态..." -ForegroundColor Yellow
$ports = @(7890, 10808, 10809)
$foundListening = $false

foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        Write-Host " [✓] 端口 $port 正常监听中！占用进程: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Green
        $foundListening = $true
    }
}

if (-not $foundListening) {
    Write-Host " [X] 严重警告: 未检测到 7890 或 10808 端口在监听！" -ForegroundColor Red
    Write-Host "     根本原因: 代理客户端核心 (Mihomo/Xray) 可能崩溃退出或未正常启动！" -ForegroundColor Yellow
}

# 3. 连通性测试 (国内直连 vs 海外代理)
Write-Host "`n>>> [步骤 3] 正在测试端到端连通性..." -ForegroundColor Yellow
try {
    $cnTest = Invoke-WebRequest -Uri "https://www.baidu.com" -TimeoutSec 3 -UseBasicParsing
    Write-Host " [✓] 国内网络直连: 正常通畅 (HTTP $($cnTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " [X] 国内网络直连失败! 本机可能已完全断网，请检查物理网线或 Wi-Fi！" -ForegroundColor Red
}

try {
    $hkTest = Invoke-WebRequest -Uri "https://www.google.com" -Proxy "http://127.0.0.1:7890" -TimeoutSec 5 -UseBasicParsing
    Write-Host " [✓] 海外代理通道: 正常通畅！可成功连接 Google (HTTP $($hkTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " [!] 海外代理通道连接超时: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "     请核对节点是否变绿，或是否遭遇 90 秒时钟偏差/订阅过期。" -ForegroundColor Gray
}

Write-Host "`n======================= 体检任务结束 =======================" -ForegroundColor Cyan
```

---

## 模块五：本大专题下辖二级专题与三级集群规划

根据《网站内容全量落地总指令》的内容架构规范，本大专题规划了清晰的教学分工：

### 二级专题一：初次安装与首次连接专题 (/tutorials/first-time-setup/)
聚焦用户从零开始在各操作系统上完成首次配置与多端协同：
- **三级集群一：客户端模式选择与高级分流集群 (`/tutorials/first-time-setup/client-modes/`)**
  - 攻坚规则模式（Rule）与全局模式（Global）的底层路由差异、避免国内流量浪费；
  - 核心长文 1：[🔥 规则模式与全局模式原理深度解析：如何科学合理分流？](/tutorials/rule-modes)（5,387 纯汉字旗舰长文）；
  - 核心长文 2：[🛠️ 分应用代理与特定程序绕行配置指南](/tutorials/first-time-setup/client-modes/sub-app-proxy-split-tunneling)（3,628 纯汉字实操长文）；
  - 核心长文 3：[⚡ GeoSite 与自定义规则集 (Rule-Providers) 本地编写与白名单分流调优](/tutorials/geosite-direct-custom-ruleset-guide)（2,159 纯汉字调优指南）；
  - 核心长文 4：[🎮 TUN 模式与系统代理全场景深度选型指南：外服电竞、UDP 转发与路由接管实战](/tutorials/first-time-setup/client-modes/tun-vs-system-proxy-gaming-udp-guide)（2,802 纯汉字深度选型）；
- **三级集群二：全平台新手首次安装与防断网实操集群**
  - 核心长文 5：[新手从零安装科学上网客户端到首次成功连接指南](/tutorials/first-time-setup)（2,598 纯汉字实操长文）；
  - 攻坚 Windows / macOS / Android / iOS 官方纯净安装包甄别与系统权限配置。

### 二级专题二：分流规则语法与自定义直连规则专题 (/tutorials/rule-modes/)
聚焦进阶用户对手写规则、高吞吐匹配算法与生产级白名单的极致掌控：
- **二级专题枢纽**：[分流规则语法与自定义直连规则专题枢纽](/tutorials/rule-modes/)（3,089 纯汉字标准枢纽）；
- **三级集群一：自定义分流规则集与国内服务防误伤集群 (`/tutorials/rule-modes/custom-rules/`)**
  - **集群枢纽**：[自定义分流规则集与国内服务防误伤集群](/tutorials/rule-modes/custom-rules/)（2,690 纯汉字集群指南）；
  - **核心长文 1**：[DOMAIN-SUFFIX 与 IP-CIDR 核心分流规则语法全景拆解：从字段定义、通配符逻辑到匹配性能压测](/tutorials/rule-modes/custom-rules/domain-suffix-ip-cidr-rule-syntax-guide)（3,742 纯汉字技术指南）；
  - **核心长文 2**：[国内主流服务白名单与防误伤分流调优：微信、网易云音乐、金融银行与私有 NAS 直连生产级方案](/tutorials/rule-modes/custom-rules/china-domain-ip-whitelist-direct-tuning)（4,217 纯汉字实战长文）。

### 二级专题三：科学上网安全防护与数字隐私加固专题 (/tutorials/security-privacy/)
聚焦终端身份防穿透、加密 DNS 防投毒与防风控关联的工业级加固：
- **二级专题枢纽**：[科学上网安全防护与数字隐私加固专题枢纽](/tutorials/security-privacy/)（3,482 纯汉字标准枢纽）；
- **三级集群一：DNS 泄露防御与 WebRTC 穿透加固集群 (`/tutorials/security-privacy/dns-webrtc-hardening/`)**
  - **集群枢纽**：[DNS 泄露防御与 WebRTC 穿透加固集群入口](/tutorials/security-privacy/dns-webrtc-hardening/)（2,220 纯汉字集群指南）；
  - **核心长文 1**：[主流浏览器 WebRTC 真实公网 IP 穿透与防泄漏加固指南：Chrome / Edge / Firefox / Safari 彻底禁用与 mDNS 混淆实战](/tutorials/security-privacy/dns-webrtc-hardening/webrtc-browser-hardening-guide)（3,977 纯汉字技术指南）；
  - **核心长文 2**：[安全加密 DNS (DoH / DoT / DoQ) 本地配置与防运营商污染全套指南：RFC 8484 协议栈解析、客户端集成与双栈防泄漏实战](/tutorials/security-privacy/dns-webrtc-hardening/secure-dns-doh-dot-privacy-configuration)（3,774 纯汉字实战长文）。

---

## 模块六：新手日常高频痛点速查与破除方案

| 新手最常反馈的问题现象 | 真实技术诱因深度剖析 | 工业级快速修复指导 |
|---|---|---|
| **一开代理，微信发不出消息，国内软件很卡** | 错误地开启了 **`Global (全局模式)`**，强制所有国内流量绕行境外节点并遭遇国内反爬拦截 | 在客户端顶部将模式由 Global 切换为 **`Rule (规则模式)`**，使国内流量走 DIRECT 直连 |
| **浏览器能翻墙，但下载文件或 Git 连不上** | 仅开启了应用层系统代理，终端与非标准软件不走系统代理 | 客户端安装服务模式，开启 **`TUN 模式`** 接管整机三层底层数据包 |
| **刚买的机场套餐，几天时间流量就全部用光** | 后台开启了 BT/迅雷/网盘下载，P2P 流量全部被海外节点转发并消耗配额 | 在规则中将 BT/迅雷进程加入 Direct 直连，或在 P2P 下载时关闭代理软件 |
| **客户端点击测速全部红字 Timeout** | 本机时间偏差超过 90 秒，触发 VMess/VLESS 密码学防重放丢包；或机场国内入口被阻断 | 在 Windows 设置中点击“立即同步时间”；若依旧全红参阅 [Clash 节点超时排查](/clients/clash-verge-rev-timeout) |
| **关掉代理软件后，电脑彻底断网打不开网页** | 软件异常退出或强制关机，未正常清理系统代理注册表，形成“幽灵代理”死锁 | 打开 Windows 设置搜索“代理设置”，手动关闭“使用代理服务器”开关并清空地址 |

---

## 灾难恢复方案与工业级备用专线

如果按照本教程排查后，确认客户端配置无误但所有节点依然持续显示 Timeout，或者您急需一个全自动配置、即开即用的高品质专线服务，建议立即接入免除繁琐配置的旗舰服务商：

<DisasterRecoveryBox 
  alertTitle="🚨 新手配置屡屡碰壁？接入全自动化合规专线"
  triggerCondition="首次配置多次导入报错、节点大面积全红，且急需恢复跨国学术查阅或外贸办公"
  recommendedAction="切换至提供一键全自动配置下发、纯内网物理直连的高可用专线机场"
  primaryAirportName="光速云 (Guangsu)"
  primaryAirportUrl="/airports/guangsu"
  primaryFeatures="一键导入全平台自动适配 / 纯内网双专线架构 / 0 基础新手极速上手 / 晚高峰 4K 零卡顿"
  backupAirportName="微风网络 (Weifeng)"
  backupAirportUrl="/airports/weifeng"
  matrixUrl="/airports/"
/>

---

## 模块七：跨专题排障与关联通道
- 遇到连接成功但网页打不开？请参阅 [科学上网连接成功却打不开网页深度排查](/issues/connected-but-no-internet)。
- 订阅链接导入报错或格式不符？请参阅 [机场订阅链接无法导入深度排查](/subscription/import-failed)。
- 需要选购稳定高速的抗封锁专线？请参阅 [2026 稳定抗封锁 42 家机场品牌横向评测](/airports/)。
- 在线检测当前代理真实出口与 DNS 泄漏？请访问 [网络诊断实验室控制台](/diagnostics/)。
