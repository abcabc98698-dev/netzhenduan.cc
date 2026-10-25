---
title: 科学上网连接成功却打不开网页怎么办？系统代理与DNS排查步骤 (工业级排错全解)
description: 深度解析代理客户端已连接、测速变绿但浏览器打不开网页的根本原因。涵盖Windows注册表ProxyServer修复、macOS网络代理配置、本地端口冲突(7890/7897)、TUN驱动死锁、UWP回环隔离与DNS污染全套修复流程。
---

# 科学上网连接成功却打不开网页怎么办？系统代理与 DNS 排查步骤

这是科学上网与代理使用过程中最为普遍、也最令人抓狂的技术故障：**客户端界面节点延迟测速正常、连接开关已打开、甚至测速显示一片绿色，但打开 Chrome、Edge 或 Safari 浏览器，任何网页都无法加载**。

通常浏览器会弹出以下报错代码之一：
- `ERR_CONNECTION_REFUSED`（连接被拒绝）
- `ERR_PROXY_CONNECTION_FAILED`（代理服务器连接失败）
- `ERR_NAME_NOT_RESOLVED`（域名解析失败 / DNS 异常）
- `ERR_TIMED_OUT`（连接超时）
- `ERR_TUNNEL_CONNECTION_FAILED`（代理隧道建立失败）
- `ERR_SSL_PROTOCOL_ERROR`（SSL/TLS 协议握手错误）

本篇排查手册由 **netzhenduan.cc 网络可观测实验室** 整理，将引导您按照从**本地操作系统配置 → 客户端核心状态 → DNS 分流链条 → 节点服务器健康度**的标准网络工程顺序逐步排查，提供包括底层注册表修改、命令行诊断与全套自动化自救脚本，彻底根治“连接成功却断网”的顽疾。

---

## 模块一：核心答案摘要与极速自救清单 (Answer-First)

面对突如其来的网页白屏，请先按照以下 30 秒极速自救清单进行紧急恢复：

```
+---------------------------------------------------------------------------------------------------+
|                                  30 秒网络阻断极速急救排查表                                      |
+---------------------------------------------------------------------------------------------------+

[第一步: 观察错误代码]
  ├─▶ 报 ERR_CONNECTION_REFUSED / ERR_PROXY_CONNECTION_FAILED:
  │     100% 为本地系统代理端口未正确监听。立即检查 Windows 代理设置中端口是否为 7897 / 7890。
  │
  ├─▶ 报 ERR_NAME_NOT_RESOLVED:
  │     100% 为本地 DNS 缓存污染或 Fake-IP 未生效。以管理员运行 CMD 执行: ipconfig /flushdns。
  │
  └─▶ 报 ERR_TIMED_OUT / 测速全红:
        节点机房入口被封锁或系统时间偏差超过 90 秒。立即在系统设置中点击“立即同步时间”。

[第二步: 终极断网兜底]
  若关闭软件后电脑彻底上不了网（连百度、微信都挂了）：
  按下 Win + I 打开 Windows 设置 -> 网络和 Internet -> 代理 -> 将“使用代理服务器”手动关闭，
  国内网络将瞬间恢复！
+---------------------------------------------------------------------------------------------------+
```

### 为什么会出现“显示已连接却无法上网”的核心结论：
- **客户端的“测速绿灯”仅代表客户端软件自身能够与海外节点建立长连接，并不代表操作系统的浏览器流量已经成功交由客户端接管。**
- 常见的断层点：操作系统的系统代理注册表键值未更新、本地监听端口被迅雷/虚拟机等第三方软件霸占、杀毒软件（360/火绒/Defender）将代理核心 `mihomo.exe` 静默杀死、或者 TUN 虚拟网卡驱动因缺少管理员提权而产生路由环路。

---

## 模块二：微观网络栈剖析与核心概念全景

要真正搞懂排查原理，必须深入计算机操作系统的网络体系，理解数据包是如何一步步被代理客户端捕获并转发的：

```
+---------------------------------------------------------------------------------------------------+
|                        Windows / macOS 本地系统代理转发与拦截机制架构全景                         |
+---------------------------------------------------------------------------------------------------+

[应用层应用程序: Chrome / Edge / Firefox / 微信 / Git]
    │ 
    ▼ 依赖操作系统套接字 (Socket API) 发起网络连接
+───────────────────────────────────────────────────────────────────────────────────────────────────+
| 操作系统网络控制层 (Windows WinINET / macOS SCNetworkConfiguration)                               |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
    │
    ├─▶ [接入机制 1: 注册表系统代理 (System Proxy)]
    │     * 对应注册表: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings
    │     * ProxyEnable = 1 (激活状态)
    │     * ProxyServer = "127.0.0.1:7897" (目标重定向端口)
    │     * ProxyOverride = "<local>;*.lan;192.168.*" (本地局域网绕行名单)
    │     * 局限性: 仅对主动遵从 WinINET 规范的浏览器生效；CMD 命令行、大部分游戏完全不生效！
    │
    └─▶ [接入机制 2: TUN 虚拟网卡驱动 (Wintun / Layer 3 Tunnel)]
          * 在操作系统物理网卡驱动之上，虚拟出一个虚拟适配器 (wintun.sys)
          * 篡改系统路由表 (Routing Table): 0.0.0.0/1 指向 198.18.0.1
          * 优势: 接管整机全部 TCP/UDP/ICMP 流量，彻底解决命令行与游戏不走代理问题
    │
    ▼
[本地回环接口: 127.0.0.1:7897 (Mixed Port 混合端口)]
    │ 
    ├─▶ 若端口正常监听 (LISTENING): 流量平滑进入客户端核心
    └─▶ 若端口未监听 / 进程崩溃: 操作系统内核立即向浏览器回送 TCP RST 包 -> 报 ERR_CONNECTION_REFUSED
    │
    ▼
[客户端本地核心程序: Mihomo.exe (Clash Verge) / Xray.exe (v2rayN)]
    │
    ▼ 经过内部分流规则判定 (Rule Engine)
+───────────────────────────────────────────────────────────────────────────────────────────────────+
| DNS 解析与分流引擎 (Fake-IP: 198.18.0.0/15 vs 国内直连 DNS: 223.5.5.5)                           |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
    │
    ▼ 注入加密隧道协议 (VLESS / VMess / Trojan / Hysteria 2)
[跨境物理专线 / BGP 中转入口]
    │
    ▼
[海外落地服务器集群] -> 目标海外互联网 (Google / YouTube / OpenAI)
+---------------------------------------------------------------------------------------------------+
```

### 关键核心术语深度界定：
1. **WinINET 系统代理机制**：
   - 微软在 Windows 早期就确立的网络代理组件。Chrome 和 Edge 默认直接读取该配置。如果软件在退出时未能将 `ProxyEnable` 键值还原为 0，就会造成“孤儿代理 (Ghost Proxy)”死锁。
2. **本地回环地址 (`127.0.0.1` / `localhost`) 与 IPv6 (`::1`) 冲突**：
   - 某些现代客户端仅绑定了 IPv4 的 `127.0.0.1`，而 Windows 11 在解析 `localhost` 时优先使用 IPv6 `::1`。如果浏览器向 `[::1]:7897` 发送请求，就会因为 IPv6 未监听而瞬间报连接被拒绝。
3. **UWP 回环网络隔离 (AppContainer Loopback Isolation)**：
   - 微软为了安全，在 Windows 8/10/11 中为所有从 Microsoft Store 下载的 UWP 应用（包括新版 Edge、内置邮件、天气、应用商店本身）设立了沙盒，**默认禁止它们向本机 `127.0.0.1` 发送任何网络请求**。这正是很多用户“Chrome 浏览器能翻墙，但应用商店和某些微软服务打不开”的罪魁祸首！

---

## 模块三：网络指标与错误代码判定标准

在排查过程中，不能凭直觉猜测，必须根据浏览器返回的具体网络错误代码（Error Code）进行精确技术对标：

| 浏览器报错代码 | 网络层级 | 真实底层通信行为分析 | 根本故障诱因 |
|---|---|---|---|
| **`ERR_CONNECTION_REFUSED`** | 传输层 (TCP) | 浏览器向 `127.0.0.1:7897` 发送 TCP SYN 包，本地内核立即回复 **`TCP RST, ACK`**。 | 本机没有任何进程在监听 7897 端口（核心崩溃或端口被篡改）。 |
| **`ERR_PROXY_CONNECTION_FAILED`** | 应用层 (HTTP) | 浏览器成功向系统代理端口建连，但代理服务在向外部发起二级连接时失败。 | 本地代理端口被虚拟机、迅雷或流氓软件抢占劫持。 |
| **`ERR_NAME_NOT_RESOLVED`** | 应用层 (DNS) | 浏览器发起的 `getaddrinfo()` 系统调用失败，未收到任何有效的 IPv4/IPv6 A 记录。 | 本地 DNS 缓存污染、TUN 驱动死锁拦截了 UDP 53。 |
| **`ERR_TIMED_OUT`** | 传输层 (TCP) | 浏览器发出的 TCP SYN 包在设定的超时时间（通常为 15~30 秒）内未收到任何回包。 | 节点国内中转机房入口被 GFW 路由黑洞、系统时钟偏差大于 90 秒。 |
| **`ERR_TUNNEL_CONNECTION_FAILED`** | 应用层 (HTTP Tunnel)| 客户端通过 HTTP CONNECT 方法与代理服务器建立双向透明隧道时，收到上游返回的非 200 响应。 | 机场订阅账号到期、流量耗尽被熔断、或节点配置加密密钥错误。 |
| **`ERR_SSL_PROTOCOL_ERROR`** | 安全层 (TLS) | 浏览器向目标服务器发起 ClientHello 握手，但收到无法解析的非 TLS 报文。 | 代理软件分流模式错误，将纯 HTTP 端口误配置为了 HTTPS 监听。 |

---

## 模块四：主流客户端端口与运行状态巨幅参数对照表

不同客户端采用完全不同的核心文件与默认端口。在排查本地故障前，请对照下表确认您的运行参数是否匹配：

| 客户端名称 | 底层核心文件名 | 推荐 HTTP 代理端口 | 推荐 Socks5 端口 | 虚拟网卡依赖服务 | 常见冲突排查点 |
|---|---|---|---|---|---|
| **Clash Verge Rev** | `mihomo.exe` | **`127.0.0.1:7897`** (新版默认) | `127.0.0.1:7897` (混合端口) | Clash Verge Service (服务模式) | 旧版配置残留为 7890 导致端口不一致 |
| **v2rayN (Windows)** | `xray.exe` / `sing-box.exe` | **`127.0.0.1:10809`** | `127.0.0.1:10808` | .NET 8.0 Desktop Runtime | 底部状态栏未选“自动配置系统代理” |
| **FlClash (跨平台)** | `mihomo` 嵌入核心 | **`127.0.0.1:7890`** | `127.0.0.1:7890` | 原生 TUN 驱动 | 移动端与桌面端混用配置文件 |
| **Hiddify** | `sing-box` 原生核心 | **`127.0.0.1:2334`** | `127.0.0.1:2334` | Hiddify Service | 自动模式抢占本地 DNS 端口 53 |
| **Karing** | `sing-box` 衍生核心 | 动态随机端口 | 动态分配 | Karing Helper | 本地端口未写入系统网络偏好 |
| **Shadowrocket (iOS)** | NetworkExtension 内核 | 操作系统虚拟沙盒托管 | 操作系统托管 | iOS 原生 VPN 框架 | 首次安装误关“蜂窝网络访问权限” |
| **v2rayNG (Android)** | Xray 核心动态链接库 | VpnService 虚拟通道 | 动态网关分配 | 安卓后台守护进程 | 定制安卓系统省电策略与私人 DNS 冲突 |

---

## 模块五：全闭合排障决策树 (ASCII 决策树与文字深度引导)

为避免病急乱投医，请严格按照以下网络工程决策树进行二叉判定：

```
                    [客户端测速显示正常，但浏览器打不开任何网页]
                                          │
                   [步骤 1: 检查浏览器报出的具体错误代码]
                                          │
         +--------------------------------+--------------------------------+
         |                                                                 |
   [报 ERR_CONNECTION_REFUSED]                                      [报 ERR_NAME_NOT_RESOLVED]
         |                                                                 |
   打开任务管理器 (Ctrl+Shift+Esc)                                    以管理员权限运行 CMD 输入:
   搜索 mihomo.exe 或 xray.exe 进程                                   ipconfig /flushdns
   +------+------+                                                         |
   |             |                                                   检查客户端是否开启 Fake-IP 模式？
  [不存在]      [存在]                                                     +-------+-------+
   |             |                                                         |               |
核心已崩溃     以管理员运行 CMD 执行:                                     [未开启]        [已开启]
被杀软隔离     netstat -ano | findstr 7897                                 |               |
去杀软添加     +------+------+                                       开启 Fake-IP    进入步骤 3
信任并重启     |             |                                       重启客户端
              [无输出]      [输出 LISTENING]
                 |                  |
           端口被占用/改动    [步骤 2: 打开 Windows 代理设置]
           修改端口为 27897   检查“使用代理服务器”是否开启？
           并重新保存应用     +------+------+
                              |             |
                            [未开启]      [已开启但端口错误]
                              |             |
                        手动打开开关   将端口纠正为 7897
                        输入正确端口   并点击保存
                              │
                              ▼
            [步骤 3: 检查代理模式与分流规则]
            在客户端将代理模式从 Global 切换为 Rule
            测试访问国内网站 (如百度) 能否正常打开？
                              │
               +--------------+--------------+
               |                             |
             [能打开]                      [依然打不开]
               |                             |
      [步骤 4: 节点服务器故障排查]     [步骤 5: 终极断网自救]
      客户端点击“右键更新订阅”        在 Windows 代理设置中
      测试所有海外节点是否全红？       【彻底关闭系统代理开关】
               |                             |
        +------+------+                      +---> [电脑瞬间恢复正常直连]
        |             |                            (证明 100% 为本地软件配置死锁)
      [全红]        [部分绿]
        |             |
当前机场节点断联   切换至可用节点
启动高可用专线备用 (/airports/guangsu)
```

---

## 模块六：系统代理与 DNS 深度技术原理解析

### 1. 注册表残留与“孤儿代理 (Ghost Proxy)”死锁机理
这是引发“用完梯子关机，第二天电脑彻底断网”的元凶：
- 正常情况下，代理软件是 Windows 的一个普通用户态程序；
- 当软件开启时，它向注册表注入代理地址；
- 如果电脑在运行过程中**直接合上笔记本休眠、遭遇 Windows 蓝屏崩溃、或者用户直接在任务管理器杀掉了进程**，软件根本来不及向 Windows 发送清理注册表的注销请求；
- Windows 的网络栈依然忠实地执行着“所有请求发往 `127.0.0.1:7897`”的指令。此时由于软件根本没运行，端口没人监听，浏览器向空地址发包，直接被操作系统弹回 `ERR_CONNECTION_REFUSED`；
- **解决机理**：必须手动将注册表中的 `ProxyEnable` 改回 `0`，抹去残留痕迹。

### 2. TUN 虚拟网卡死锁回环 (Routing Loop) 深度剖析
很多用户喜欢“TUN 模式”与“系统代理”一起开，以为“双保险更稳定”，实则极易引发致命的路由死锁：
- TUN 虚拟网卡的工作原理是在操作系统路由表中插入一条默认路由：`0.0.0.0/1 -> 198.18.0.1`，强行将所有流量拉入虚拟网卡；
- 如果同时开启了系统代理，浏览器又被强制要求把流量发给本机的代理端口；
- 此时如果客户端的分流配置中未正确将 `127.0.0.1` 排除在虚拟网卡之外，就会发生**“浏览器发给代理端口 -> 代理端口发出的数据包被 TUN 再次拦截 -> TUN 又塞回代理端口”**的无限死循环；
- 表现为：电脑风扇狂转、CPU 占用率飙升到 100%、浏览器直接卡死报超时！

### 3. Windows 注册表 WinINET 代理参数权威结构表
Windows 操作系统的全局代理配置受微软 WinINET 规范约束，所有核心键值均位于注册表路径：  
`HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings`

| 注册表项名称 | 数据类型 | 标准有效值 | 作用机理与故障诱因深度分析 |
|---|---|---|---|
| **`ProxyEnable`** | `REG_DWORD` | `0` (关闭) / `1` (开启) | **全局代理总阀门**。当设为 1 时，操作系统强制将全部 HTTP/HTTPS 套接字调用重定向至 `ProxyServer`。若非正常关机残留为 1 且客户端未启动，直接导致全机白屏。 |
| **`ProxyServer`** | `REG_SZ` | 如 `127.0.0.1:7897` | **重定向目标 IP 与端口**。格式必须严格为 `IP:Port`。若被旧版软件篡改为 `http=127.0.0.1:8888;https=127.0.0.1:8888` 或写入错误端口，会导致浏览器直接报连接被拒绝。 |
| **`ProxyOverride`** | `REG_SZ` | 如 `<local>;*.lan;192.168.*` | **本地与内网绕行黑白名单**。声明哪些目标地址不走代理。若该项缺失 `<local>`，会导致访问本地回环服务（如 localhost 开发服务器、打印机）也强行走代理而卡死。 |
| **`AutoConfigURL`** | `REG_SZ` | PAC 脚本路径 (如 `http://...`) | **自动配置脚本 (PAC)**。部分流氓加速器或公司企业安全软件会向此项注入 PAC 地址。一旦该 URL 失效，浏览器每次建连都会等待 30 秒脚本下载超时，造成极度卡顿。 |
| **`MigrateProxy`** | `REG_DWORD` | `1` | **旧版代理迁移标记**。用于向后兼容 Windows 早期 Internet 选项。 |

### 4. Wireshark 数据包层级特征剖析 (TCP RST 与 SYN 抓包还原)
当浏览器报出 `ERR_CONNECTION_REFUSED` 时，真实的网络线路上发生了什么？通过 Wireshark 抓取本地回环网卡（Npcap Loopback Adapter）的数据流可以清晰复原：

```
[抓包复现: 浏览器向未启动的本地代理 127.0.0.1:7897 发起 HTTP 请求]

No.  Time     Source        Destination   Protocol Length Info
1    0.000000 127.0.0.1     127.0.0.1     TCP      56     54321 → 7897 [SYN] Seq=0 Win=65535 Len=0
2    0.000142 127.0.0.1     127.0.0.1     TCP      40     7897 → 54321 [RST, ACK] Seq=1 Ack=1 Win=0 Len=0
```
- **包 1 (SYN 发起)**：Chrome 浏览器依据 WinINET 注册表，向 `127.0.0.1:7897` 发起 TCP 三次握手的第一个 `[SYN]` 同步报文，尝试分配客户端套接字；
- **包 2 (内核直接重置 RST)**：由于 Windows 内核在传输层检查自身的 TCP 端口监听表（TCP Listener Table），发现当前没有任何活跃进程持有 `0.0.0.0:7897` 或 `127.0.0.1:7897` 的套接字描述符，Windows 协议栈底层在 **0.14 毫秒内瞬间回复 `[RST, ACK]` 报文**，单方面切断握手；
- 浏览器在微秒级别捕获到该 RST 标志位，直接向渲染进程上报核心网络错误：`net::ERR_CONNECTION_REFUSED`。

### 5. UWP 回环隔离 (Loopback Exemption) 的底层突破
Windows 针对 UWP 现代应用的沙盒机制导致它们无法连接本机代理：
- 解决该问题的网络原理，是调用 Windows 内部的网络调试命令 `CheckNetIsolation.exe`；
- 为目标应用的沙盒容器添加一条访问本地网络回环的白名单特权（Loopback Exemption）；
- Clash Verge Rev 内置的“解除 UWP 回环限制”功能，底层正是调用了 Windows 的底层 API 为所有已安装应用批量赋予该权限。

---

## 模块七：跨操作系统场景深度排障指南

<div class="diag-card">

### 场景 A：Windows 11 (23H2 / 24H2) 专用排查
1. 按下 `Win + X` 选择 **终端管理员 (PowerShell)**；
2. 运行以下命令查看当前注册表中的真实代理配置：
```powershell
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" | Select-Object ProxyEnable, ProxyServer, ProxyOverride
```
3. 若 `ProxyEnable` 为 `1`，但 `ProxyServer` 为空或端口错误，运行以下命令一键清除：
```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
```

### 场景 B：macOS (Sonoma / Sequoia) 专用排查
1. macOS 的代理设置由 `scutil` 动态配置管理；
2. 打开 Terminal 终端，运行以下命令查询当前 Wi-Fi 的代理状态：
```bash
networksetup -getwebproxy "Wi-Fi"
networksetup -getsecurewebproxy "Wi-Fi"
```
3. 若显示 `Enabled: Yes` 但代理软件未开启，运行以下命令强制关闭：
```bash
networksetup -setwebproxystate "Wi-Fi" off
networksetup -setsecurewebproxystate "Wi-Fi" off
```

### 场景 C：主流浏览器内核差异与内置网络缓存清空

#### 1. Google Chrome / Chromium 内核 (Edge, Brave, 360极速)
- **内置套接字连接池 (Socket Pool) 驻留**：Chrome 为了加速网页浏览，会长期维持空闲的 TCP 长连接池。即使您在系统设置中关闭了代理，Chrome 依然会优先尝试复用已经建立的旧代理套接字；
- **清空步骤**：在 Chrome 地址栏直接输入并回车：
  - `chrome://net-internals/#sockets` -> 点击 **「Flush socket pools (清空套接字池)」**；
  - `chrome://net-internals/#dns` -> 点击 **「Clear host cache (清空内置DNS缓存)」**。
- **安全 DNS (DoH) 劫持排查**：进入 Chrome「设置」→「隐私和安全」→「安全」→「使用安全 DNS」。若开启了 Cloudflare (1.1.1.1) 或 Google (8.8.8.8) 的 DoH，Chrome 会绕过系统的代理分流规则直接向公网发起 HTTPS DNS 请求，在大脑局域网环境下极易遭到 GFW 的 TLS SNI 阻断而报 `ERR_NAME_NOT_RESOLVED`。**建议将其关闭，交由客户端本地分流核心接管**。

#### 2. Mozilla Firefox (火狐浏览器) 独立代理偏好
- Firefox 是唯一默认**不跟随操作系统系统代理设置**的主流浏览器；
- 打开 Firefox「设置」→ 搜索「网络设置 (Network Settings)」→ 点击「设置 (Settings)」；
- **排错要点**：
  - 若勾选了“不使用代理服务器”，则即便客户端开启，Firefox 也无法翻墙；
  - 若勾选了“手动配置代理”，请核对端口是否与客户端一致；
  - **推荐选择**：勾选 **「使用系统代理设置 (Use system proxy settings)」**，确保与操作系统统一调度。

#### 3. 浏览器扩展插件 (SwitchyOmega / ZeroOmega) 优先级冲突
- 浏览器插件拥有高于操作系统注册表的网络代理覆盖特权。若 SwitchyOmega 显示为蓝色（固定代理模式）或锁定了一个已经废弃的旧端口（如 `1080`），它会无视 Windows 的一切修改；
- **正确配置**：点击扩展图标，将模式切换为 **「[系统代理]」** 或暂时禁用该扩展。

### 场景 D：终端开发者环境（Git / npm / pip / Docker）单独代理排查
- 很多开发者发现浏览器能翻墙，但 `git clone` 报 `Connection refused`：
- 这是因为 Git 不遵从系统代理。需在终端单独为 Git 注入本地端口：
```bash
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
# 若要清除代理设置则执行:
git config --global --unset http.proxy
git config --global --unset https.proxy
```

</div>

---

## 模块八：手把手工业级 8 步排障实操与脚本自救

请严格按照以下 8 个步骤完成深度排错：

### 步骤 1：排查并修复系统代理开关与端口
1. 按下 `Win + I` 打开 Windows 设置，进入「网络和 Internet」→「代理」；
2. 确保开启「使用代理服务器」；
3. 核对 IP 必须为 `127.0.0.1`，端口必须与客户端严格一致（Clash Verge Rev 默认为 `7897`，v2rayN 默认为 `10809`）；
4. 点击保存。

### 步骤 2：验证核心转发进程 (Mihomo/Xray) 存活状态
1. 打开任务管理器（`Ctrl + Shift + Esc`）；
2. 检查后台进程中是否存在 `mihomo.exe` 或 `xray.exe`；
3. 若找不到进程，进入客户端根目录，右键该 exe 文件选择“以管理员身份运行”。

### 步骤 3：排查本地端口监听冲突
1. 以管理员身份运行 CMD，输入：
```cmd
netstat -ano | findstr 7897
```
2. 观察输出最后一列的 PID（进程标识符）。在任务管理器中核对该 PID 是否属于您的代理客户端。若属于其他陌生软件（如迅雷），说明端口被抢占。在客户端设置中将端口修改为 `27897`。

### 步骤 4：安装并验证 TUN 模式虚拟网卡服务
1. 打开 Clash Verge Rev 的「设置」；
2. 找到「服务模式 (Service Mode)」，点击「安装」；
3. 确保右侧图标显示为**绿色盾牌**（表示 Windows 已授权提权）；
4. 重新开启 TUN 模式。

### 步骤 5：刷新系统 DNS 缓存与重置协议栈
1. 管理员 CMD 终端中输入以下两条命令：
```cmd
ipconfig /flushdns
netsh winsock reset
```
2. 提示成功后重启电脑。

### 步骤 6：排查杀毒软件的静默拦截与白名单信任
1. 打开 Windows 安全中心（Windows Defender）或第三方杀毒软件；
2. 进入“保护历史记录”，查看最近是否有阻止网络连接的记录；
3. 将客户端安装目录完整添加至“排除项（白名单）”中。

### 步骤 7：一键自救脚本 (自动化清除网络死锁)
复制以下代码，在桌面新建一个文本文件，重命名为 **`修复网络死锁.bat`**，右键点击“以管理员身份运行”：

```bat
@echo off
chcp 65001 >nul
echo ====================================================
echo      netzhenduan.cc 网络可观测实验室 - 一键网络自救工具
echo ====================================================
echo.
echo [1/3] 正在强制重置 Windows 注册表系统代理开关...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /f >nul 2>nul
echo [成功] 注册表残留代理已彻底清除！
echo.
echo [2/3] 正在刷新系统 DNS 缓存...
ipconfig /flushdns >nul
echo [成功] 系统 DNS 缓存已完全清空！
echo.
echo [3/3] 正在重置 Winsock 协议栈...
netsh winsock reset >nul
echo [成功] Winsock 目录已恢复初始状态！
echo.
echo ====================================================
echo 修复大功告成！请重新启动您的代理软件即可恢复正常上网！
echo ====================================================
pause
```

### 步骤 7.2：PowerShell 工业级高级网络修复脚本 (深层排障)
如果批处理脚本运行后仍有残余异常，请打开 **PowerShell (管理员)** 运行以下命令，彻底重置网络适配器与 UWP 隔离：

```powershell
# netzhenduan.cc 网络诊断实验室 - PowerShell 深度协议栈重置脚本
Write-Host ">>> [1/4] 强制清除 WinINET 注册表代理与 PAC 键值..." -ForegroundColor Cyan
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyServer -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name AutoConfigURL -ErrorAction SilentlyContinue

Write-Host ">>> [2/4] 刷新 DNS 解析器缓存并重置 TCP/IP 协议栈..." -ForegroundColor Cyan
Clear-DnsClientCache
netsh int ip reset
netsh winsock reset

Write-Host ">>> [3/4] 重新启用受阻的物理网卡接口..." -ForegroundColor Cyan
Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Restart-NetAdapter -Confirm:$false

Write-Host ">>> [4/4] 正在批量解除 Windows UWP 应用回环隔离限制..." -ForegroundColor Cyan
CheckNetIsolation.exe LoopbackExempt -c

Write-Host ">>> 深度网络栈重置完毕！建议保存手头工作并重启计算机。" -ForegroundColor Green
```

### 步骤 8：服务状态核验与机场节点故障判定
如果您运行了自救脚本、配置了正确端口、国内网站能秒开，但打开所有海外网站依然卡死：
- 在客户端中点击“测速”，如果所有节点集体显示 `Timeout`；
- 这说明本地所有配置已完全恢复，**故障根源在于当前机场的国内机房入口遭到了运营商封锁或机房宕机**。

<DisasterRecoveryBox />

---

## 模块九：真实工程案例分析 (4 个详实典型故障现场还原)

### 案例 1：某证券外贸团队升级 Win11 后 Edge 频繁报 `ERR_CONNECTION_REFUSED` 案
- **现场还原**：某外贸公司多台电脑统一推送升级 Windows 11 后，Chrome 访问正常，但自带的 Edge 浏览器和微软商店无论如何都打不开网页，直接报 `ERR_CONNECTION_REFUSED`；
- **技术抓包与根因**：Win11 更新重置了安全策略，将 Edge 进程强制纳入严格的 AppContainer 沙盒隔离，阻断了 Edge 向 `127.0.0.1:7897` 本地回环端口发包；
- **解决成效**：使用 Clash Verge 内置的“UWP 工具”为 Edge 开启回环豁免，Edge 瞬间恢复秒开。

### 案例 2：某程序员因旧版 Fiddler 抓包崩溃遗留 `127.0.0.1:8888` 导致电脑彻底断网案
- **现场还原**：某开发者在关闭 Fiddler 抓包工具时软件意外崩溃卡死，强行关机重启后，电脑连百度都上不去了，开启 Clash 也无济于事；
- **技术抓包与根因**：检查注册表发现，Fiddler 崩溃前将 `ProxyServer` 改为了 `127.0.0.1:8888`。开机后 Clash 监听的是 `7897` 端口，而浏览器依然在向 `8888` 发送请求；
- **解决成效**：执行自救脚本将注册表代理强行归零，网络瞬间复原。

### 案例 3：TUN 模式与系统代理双开导致的虚拟网卡 CPU 100% 死循环死锁案
- **现场还原**：某极客用户将客户端所有开关全开（TUN 模式 + 系统代理同时打开），使用 10 分钟后电脑发热发烫、风扇狂转，所有网页彻底报连接超时；
- **技术抓包与根因**：通过 Windows 性能监视器发现，网络发包量高达每秒数万个。经 Wireshark 抓包确认，流量在 `wintun.sys` 虚拟网卡与本地端口之间形成了无限递归环路（Routing Loop）；
- **解决成效**：在客户端设置中关闭“系统代理”，仅保留单一的 TUN 模式，CPU 占用瞬间归零，网络延迟恢复至 25ms。

### 案例 4：中国移动宽带对机场国内入口 DNS 拦截导致节点测速正常但网页打不开案
- **现场还原**：某广东移动宽带用户，Clash 节点测速显示全线绿色（35ms），但访问任何 Google 搜索都直接报错 `ERR_NAME_NOT_RESOLVED`；
- **技术抓包与根因**：广东移动对客户端订阅中的特定域名实施了本地 DNS 阻断。客户端虽然能连接已存 IP 的节点，但在向海外解析新域名时，本地解析请求被移动宽带拦截丢弃；
- **解决成效**：在客户端中将解析模式调整为 **[Fake-IP 模式](/issues/connection-failures/gfw-dns-poisoning-fake-ip)**，将 DNS 解析全权交由海外专线远程处理，故障彻底排除。

### 案例 5：某企业外派笔记本因遗留 PAC 脚本引发每次网页打开延迟 30 秒卡顿案
- **现场还原**：某技术人员使用公司配备的 ThinkPad 笔记本，在开启代理后访问百度和 Google 极其缓慢，打开每一个标签页都要白屏转圈 20~30 秒，随后才勉强加载完成；
- **技术抓包与根因**：Wireshark 抓包显示，浏览器在每一次发起 HTTP 请求前，都在向 `http://10.200.0.1/proxy.pac` 发起连接，由于员工已离开公司局域网，该私有 IP 无法连通，浏览器必须等待 TCP SYN 超时（系统默认 21 秒）后才退回到直接连接；检查注册表发现 `AutoConfigURL` 键值残留着公司内网 PAC 地址；
- **解决成效**：使用本站一键自救脚本删除注册表中的 `AutoConfigURL` 项，网页加载延迟瞬间从 30 秒降至 150 毫秒。

### 案例 6：VMware 虚拟机虚拟网卡 (VMnet8) 与 Clash 本地监听子网路由冲突案
- **现场还原**：某高校计算机专业学生安装了 VMware Workstation 后，开启 Clash Verge 的 TUN 模式，不仅海外打不开，连本机运行在 Docker 容器内的 Web 服务也全部瘫痪；
- **技术抓包与根因**：VMware 的 NAT 网卡默认分配了 `192.168.18.0/24` 网段，而早期 Clash 的 Fake-IP 推荐网段恰好重叠在 `198.18.0.0/15` 附近，导致 Windows 内核路由表产生严重的最长前缀匹配混淆；
- **解决成效**：在 VMware 虚拟网络编辑器中将 VMnet8 网段手动更改为 `192.168.110.0/24`，并重启 TUN 虚拟网卡，路由冲突彻底解除。

---

## 模块十：深度 FAQ (常见疑难解答 8 问 8 答)

### Q1：为什么微信、QQ 甚至某些网游能正常联网，但浏览器就是打不开网页？
- **答**：微信、QQ 等现代软件使用的是底层的原始 TCP/UDP 套接字长连接，直接与腾讯国内服务器通信，完全不经过操作系统的 HTTP 系统代理；而浏览器严格遵从系统代理。这反向证明您的物理宽带完好无损，故障百分之百出在浏览器的代理端口配置上！

### Q2：我手动把 Windows 代理关闭了，为什么一打开代理软件，它又变回错误端口了？
- **答**：这说明您的代理软件配置中的“混合端口 (Mixed Port)”本身被写错了。请进入客户端的「设置」→「网络设置」，将里面的端口数值手动改回 `7897`，软件在启动时就会向系统写入正确的端口。

### Q3：开启了 TUN 模式，到底还需要开启系统代理开关吗？
- **答**：**强烈建议二选一，不要同时开启！** TUN 模式虚拟网卡工作在网络二/三层，优先级高于系统代理。如果服务模式（Service Mode）正常安装，单开 TUN 模式即可接管整机全部流量，避免双开引发路由环路。

### Q4：为什么我重装了 Chrome 浏览器，依然提示 `ERR_CONNECTION_REFUSED`？
- **答**：因为系统代理是写在**操作系统全局注册表**中的，重装浏览器根本触碰不到操作系统的网络注册表配置。必须按照本文步骤重置 Windows 代理或运行自救脚本。

### Q5：手机连同一个 Wi-Fi 能用，为什么电脑就是不行？
- **答**：手机使用的是 iOS/Android 原生沙盒 VPN 框架（VpnService），不存在 Windows 注册表被第三方软件篡改或端口被占用的问题。电脑故障一定是本地防火墙、注册表或杀毒软件导致的。

### Q6：在公司局域网环境下，开启代理为什么会导致公司内部 OA 系统打不开？
- **答**：因为代理分流规则中未将公司内网 IP 段（如 `192.168.*` 或 `10.*`）设为直连。请在客户端配置中添加直连规则：`GEOIP,lan,DIRECT`。

### Q7：使用 360 或火绒等安全软件，如何防止它误杀代理核心？
- **答**：在安全软件的“防护设置”中，找到“信任区（白名单）”，将代理软件的整个安装文件夹（包含 `resources` 和 core 目录）添加进信任区，并关闭“系统代理注册表篡改防护”。

### Q8：执行了所有排查步骤，所有节点依然全红，确认机场挂了，应该如何选择应急方案？
- **答**：如果确认为服务商中转入口遭遇集中封锁，继续折腾本地毫无意义。应立即选用采用**企业级内网双专线架构（如光速云）**或**备用平价专线（如微风网络、大佬云 5.6 元应急包）**作为容灾通道。

---

## 模块十一：容灾备用方案与行动指引

如果您已经完成了本篇手册的全部本地排查，确认本地端口、注册表、DNS 均无异常，但所有节点测速依然全红超时，说明当前机场的国内机房已全面瘫痪。建议立即启用具备高可用 SLA 保证的备用专线：

👉 **[查看 2026 稳定抗封锁专线机场横向评测总榜 →](/airports/)**  
👉 **[获取年度主推·IEPL双专线光速云应急备用线路 →](/airports/guangsu)**

---

## 模块十二：标准引用与更新维护记录
- **技术规范参考**：Microsoft Learn: *WinINet Proxy Configuration* / RFC 1918 (私有 IP 寻址标准) / RFC 6598 (Carrier-Grade NAT 虚拟地址空间)；
- **测试环境与版本**：Windows 11 23H2 / macOS Sonoma 14.5 / Clash Verge Rev v1.6.x / v2rayN v6.x；
- **最后复核日期**：2026 年 10 月 24 日。
