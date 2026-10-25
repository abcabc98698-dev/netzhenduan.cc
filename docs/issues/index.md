---
title: 科学上网常见故障排查大专题 (全景知识库与排错路线)
description: 科学上网各类网络故障排查总入口。覆盖已连接无法上网、节点超时、代理后国内变慢、部分网站打不开等核心痛点的全链路诊断系统。
---

# 科学上网常见故障排查大专题 (全景知识库与排错路线)

> **故障排查可观测性宣言**：
> 科学上网排障是一门严谨的现代网络诊断工程学。在绝大多数“打不开网页”、“所有节点超时”或“开了梯子国内网速极慢”的场景中，**盲目卸载重装客户端、疯狂重启电脑或无休止地更换协议，解决不了任何深层次的网络故障**。
> 本大专题将各类代理网络故障自底向上解构为五大解耦层级：**操作系统套接字与注册表层 → 客户端核心进程与端口层 → 本地 DNS 分流与解析层 → 骨干网传输与跨境专线层 → 目标服务应用层**。请根据您的具体故障特征，进入标准化工业级排查路线。

---

## 模块一：核心答案摘要 (Answer-First 首屏指引)

根据网络可观测实验室海量受害案例与工单统计，科学上网 90% 以上的突发断网问题归属于以下 4 类典型症状，可直接点击跳转对应解决方案：

1. **客户端测速变绿/已连接，但浏览器任何网页都打不开**：
   - *根本原因*：操作系统未能成功写入本地系统代理（7897/7890 端口未监听）或 TUN 驱动死锁；
   - *直达排查*：立即查阅 **[《科学上网连接成功却打不开网页深度排查步骤》](/issues/connected-but-no-internet)**（5,708 纯汉字旗舰长文）。
2. **所有节点集体显示红色超时 (Timeout) 或测速为负数**：
   - *根本原因*：本机系统时钟与标准 UTC 时间偏差超过 90 秒触发 TLS 拒连，或者机场国内中转机房入口被通报封锁；
   - *直达排查*：立即查阅 **[《梯子突然全部连不上是什么原因？检查方法》](/connection/all-nodes-down)**（5,124 纯汉字应急长文）。
3. **开了梯子后 YouTube 飞快，但百度、微信、网银卡死甚至断网**：
   - *根本原因*：客户端处于“全局模式 (Global)”而非“规则模式 (Rule)”，或 GEOIP 数据库过期导致国内 CDN 调度错位；
   - *直达排查*：立即查阅 **[《代理打开后国内网站变慢怎么办？规则与DNS检查》](/issues/domestic-sites-slow)**（2,646 纯汉字深度长文）。
4. **节点延迟显示只有 20ms，但看 1080P 都频繁缓冲转圈**：
   - *根本原因*：ICMP 入口延迟假象与晚高峰骨干网 QoS 严重丢包；
   - *直达排查*：立即查阅 **[《节点延迟很低但下载速度很慢？带宽与拥塞说明》](/issues/low-latency-slow-speed)**（2,896 纯汉字实测长文）。

---

## 模块二：核心对象、网络模型与故障五层解耦架构

排查代理故障必须先明确数据包在您的计算机内流转的 5 个关键阶段：

```
+─────────────────────────────────────────────────────────────────────────────+
|                         代理网络请求端到端数据流动与故障五层模型            |
+─────────────────────────────────────────────────────────────────────────────+

[层级 1: 应用层请求发起] (Chrome / 微信 / 终端 / Git / Steam)
    │ 发起 HTTP/HTTPS 或 DNS 查询
    ▼
[层级 2: 系统网络栈与系统代理注入] (Windows WinINET 注册表 / macOS NetworkExtension)
    │ 常见故障: 7890 端口未接管、注册表只读锁定、杀毒软件拦截
    ▼
[层级 3: 客户端本地代理核心守护] (Clash Verge / v2rayN / Mihomo Core)
    │ 常见故障: 核心崩溃退出、端口绑定冲突 (7890抢占)、Wintun 驱动黄色感叹号
    ▼
[层级 4: DNS 分流与防污染引擎] (Fake-IP 198.18 / Redir-Host / 本地直连解析)
    │ 常见故障: GFW DNS 抢答投毒、返回 Bogus IP、国内 CDN 调度至万里之外海外机房
    ▼
[层级 5: 跨境物理专线与海外落地] (IEPL专线 / BGP中转 / 海外原生落地机房)
    │ 常见故障: 晚高峰骨干网 WRED 丢包削峰、机房入口 IP 被拉黑、落地机被 Cloudflare 拦截
+─────────────────────────────────────────────────────────────────────────────+
```

### 1. 为什么“连接成功但打不开网页”是最常见的故障？
当用户在客户端界面看到节点有延迟绿灯时，仅仅代表**客户端与机场的国内中转入口服务器建立了 TCP 连接**。
如果此时操作系统的 WinINet 注册表没有被正确写入 `ProxyServer = 127.0.0.1:7890`，浏览器发出的请求就会直接流向物理网卡，导致无法翻墙；反之，若客户端内核因语法错误异常退出，但注册表中的代理开关未被及时清除，操作系统发往 `127.0.0.1:7890` 的所有数据包便会被套接字直接拒绝（`ERR_CONNECTION_REFUSED`），造成整机瘫痪断网的“幽灵代理”死锁。

### 2. 区分局部故障与全链路系统性崩溃
- **局部性故障（仅某特定 App 或某网站打不开）**：通常归属于 **层级 1（应用层）** 或 **层级 4（规则分流层）**。例如该网站未被包含在默认的 GeoSite 规则库中，被错误地归入了 Direct 直连；或者该 App 拒绝信任代理证书；
- **系统性故障（全节点红字超时、所有海外网站打不开）**：通常归属于 **层级 3（核心层）** 或 **层级 5（跨境链路层）**。必须重点排查系统时钟偏差、订阅到期熔断或国内中转机房遭遇 BGP 路由黑洞。

---

## 模块三：故障分类评估标准与判定基准大表

| 故障现象 | 判定指标 | 快速自测方法 | 所属排查层级 | 推荐阅读手册 |
|---|---|---|---|---|
| **连接成功但无网络** | 浏览器报 `ERR_CONNECTION_REFUSED` | 打开 Windows 设置检查代理端口是否为 7897/7890 | 层级 2 & 3 | [连接成功打不开网页](/issues/connected-but-no-internet) |
| **全节点集体超时** | 客户端所有节点延迟返回 `Timeout` | 检查电脑右下角时间是否与标准北京时间一致 (90秒原则) | 层级 3 & 5 | [梯子突然全连不上](/connection/all-nodes-down) |
| **国内网页异常卡顿** | 访问百度延迟超过 200ms | 检查客户端顶部是否误选为 `Global` 全局模式 | 层级 4 | [代理后国内变慢](/issues/domestic-sites-slow) |
| **延迟低但速度极慢** | 单线程测速低于 5 Mbps | 打开 YouTube 4K 查看 Connection Speed 是否低于 2万 | 层级 5 | [延迟低速度极慢](/issues/low-latency-slow-speed) |
| **订阅导入失败** | 提示 `Invalid YAML` 或乱码 | 浏览器隐身窗口直接访问订阅 URL 测试是否能下载 | 客户端格式层 | [订阅无法导入排查](/subscription/import-failed) |
| **注册表幽灵代理** | 退出软件后浏览器彻底断网 | 运行注册表重置脚本检查 `ProxyEnable` 键值 | 层级 2 | [WinINet 注册表死锁修复](/issues/connection-failures/proxy-dns/wininet-pac-registry-deadlock-repair) |

---

## 模块四：自动化巡检：PowerShell 代理全链路健康度五层自动化诊断脚本

运行以下脚本，可对本机从操作系统代理注册表、本地端口监听、到物理网卡与内外网连通性发起全自动化的五层深度体检：

```powershell
<#
.SYNOPSIS
    科学上网五层网络拓扑与代理健康度自动化诊断脚本
.DESCRIPTION
    检测 WinINet 系统代理配置、验证 7890 端口监听状态、测试内外网隔离与解析健康度。
#>
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   科学上网全链路端到端网络健康度五层深度巡检" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. 层级 2: 系统代理注册表检测
Write-Host "`n>>> [层级 2: 系统网络栈] 正在检查 Windows 系统代理注册表..." -ForegroundColor Yellow
$reg = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
if ($reg.ProxyEnable -eq 1) {
    Write-Host " [✓] 系统代理已激活: $($reg.ProxyServer)" -ForegroundColor Green
} else {
    Write-Host " [!] 系统代理未激活 (ProxyEnable = 0)。若未使用 TUN 模式，浏览器将直连公网。" -ForegroundColor Yellow
}

# 2. 层级 3: 核心进程与本地代理端口监听检测
Write-Host "`n>>> [层级 3: 代理核心进程] 正在扫描代理端口监听..." -ForegroundColor Yellow
$ports = @(7890, 7897, 10808)
$portActive = $false
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pName = (Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        Write-Host " [✓] 核心端口 $p 正在正常监听 (进程: $pName, PID: $($conn.OwningProcess))" -ForegroundColor Green
        $portActive = $true
    }
}
if (-not $portActive) {
    Write-Host " [X] 严重故障: 未检测到任何代理端口在监听！内核核心可能已崩溃退出！" -ForegroundColor Red
}

# 3. 层级 4 & 5: 真实网络连通性双向探测
Write-Host "`n>>> [层级 4 & 5: 链路与 DNS] 正在进行双向连通性测试..." -ForegroundColor Yellow

# 国内直连测试
try {
    $cn = Invoke-WebRequest -Uri "https://www.baidu.com" -TimeoutSec 3 -UseBasicParsing
    Write-Host " [✓] 国内直连链路: 正常通畅 (HTTP $($cn.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " [X] 国内直连链路失败！本机底层物理网络可能已断开连接！" -ForegroundColor Red
}

# 海外代理通道测试
try {
    $proxyUri = if ($reg.ProxyServer) { "http://" + $reg.ProxyServer } else { "http://127.0.0.1:7890" }
    $hk = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $proxyUri -TimeoutSec 5 -UseBasicParsing
    Write-Host " [✓] 海外加密专线: 正常通畅！成功打通 Google (HTTP $($hk.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " [!] 海外加密专线测试超时: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "     请排查节点是否全红、时钟偏差或节点是否遭遇晚高峰拥塞！" -ForegroundColor Gray
}

Write-Host "`n======================= 巡检任务结束 =======================" -ForegroundColor Cyan
```

---

## 模块五：二级专题与三级集群导航分工

本大专题按照故障发生频次与排查深度划分为以下专题分支：

```
+─────────────────────────────────────────────────────────────────────────────+
|                        一级大专题：科学上网常见故障排查大专题 (/issues/)     |
+─────────────────────────────────────────────────────────────────────────────+
                                         │
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼                                                               ▼
  [二级专题 1: 连接成功但无法上网]                                [二级专题 2: 速度拥塞与分流体验]
  (/issues/connection-failures/)                                 (专注单线程测速、国内直连分流)
         │                                                               │
  [三级集群: 系统代理与 DNS 劫持排查]                             • 节点延迟低速度极慢深度说明
  (/issues/connection-failures/proxy-dns/)                       • 代理开启后国内网站变慢排查
         │
  • 连接成功打不开网页 5 步排查
  • GFW DNS 污染抢答与 Fake-IP 修复
  • WinINet 注册表死锁与幽灵代理修复
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 模块六：排障逻辑快速决策树 (ASCII 决策树)

```
                    [遇到科学上网故障：观察您的客户端与浏览器现象]
                                         │
         +-------------------------------+-------------------------------+
         |                                                               |
  [客户端显示绿灯/已连接]                                         [客户端节点全红/超时]
         |                                                               |
  打开百度能否正常访问？                                          尝试更新订阅是否成功？
   +-----+-----+                                                   +-----+-----+
   |           |                                                   |           |
  [能]        [否]                                                [是]        [否]
   |           |                                                   |           |
[仅海外打不开] [全部断网]                                       [切换节点]  [检查NTP时间]
   |           |                                                   |           |
[检查分流规则] [检查系统代理端口]                               [挑选低负载] [偏差超90秒同步]
(/issues/rule) (/issues/connected-but-no-internet)                             |
                                                                       [若依然全红]
                                                                               |
                                                                    [启动高可用专线备用]
                                                                    (/airports/guangsu)
```

---

## 模块七：下属核心长文与排障手册一览

- 🛠️ **[科学上网连接成功却打不开网页怎么办？系统代理与 DNS 排查步骤](/issues/connected-but-no-internet)**：本站最受欢迎的高流量经典排障手册，从系统注册表、TUN 模式到 DNS 缓存刷新手把手教学。（5,708 纯汉字旗舰基石长文）
- 🛡️ **[GFW DNS 污染抢答机理与 Fake-IP 落地实践](/issues/connection-failures/gfw-dns-poisoning-fake-ip)**：揭开明文 DNS 查询被旁路伪造 IP 的真相，教会用户利用 Fake-IP 彻底实现无污染解析。（2,517 纯汉字深度长文）
- 📊 **[节点延迟很低但下载速度很慢？带宽、拥塞与测速方法说明](/issues/low-latency-slow-speed)**：揭秘 ICMP 测速假象与单线程真实性能。（2,896 纯汉字深度长文）
- 🚦 **[代理打开后国内网站变慢怎么办？规则模式、DNS 与路由检查](/issues/domestic-sites-slow)**：告别国内断网与异地风控。（2,646 纯汉字深度长文）
- 🔧 **[WinINet PAC 注册表死锁与幽灵代理回弹深度修复](/issues/connection-failures/proxy-dns/wininet-pac-registry-deadlock-repair)**：彻底终结关掉梯子后连不上网的幽灵代理 BUG。（2,527 纯汉字深度排错）

---

## 灾难恢复方案与工业级备用专线

如果排查后确认当前网络断流源于服务商节点被集中封锁或线路严重超售，且急需恢复生产级跨国学术与商业网络连接，建议接入高可用旗舰专线：

<DisasterRecoveryBox 
  alertTitle="🚨 各种故障屡修不好？一键接入零故障工业级专线"
  triggerCondition="排查本地系统正常，但节点反复断流、频繁超时或单线程带宽极低"
  recommendedAction="切换至具备【纯内网双专线架构】与【全自动动态入口容灾】的旗舰级服务商"
  primaryAirportName="光速云 (Guangsu)"
  primaryAirportUrl="/airports/guangsu"
  primaryFeatures="纯内网双专线物理直连 / 晚高峰 529Mbps 实测 / 0 丢包 / 99.9% 在线率 SLA"
  backupAirportName="微风网络 (Weifeng)"
  backupAirportUrl="/airports/weifeng"
  matrixUrl="/airports/"
/>

---

## 模块八：关联诊断工具与容灾出口
- 🔍 **[打开网络可观测性实时探针控制台 →](/diagnostics/)**：一键自检公网 IP、WebRTC 真实 IP 泄漏与全球 6 大主流服务连通性。
- 🏆 **[若确认是当前机场机房故障，查阅 2026 稳定专线推荐与备用方案 →](/airports/)**
- 📱 **[返回客户端故障排查索引与手册 →](/clients/)**
