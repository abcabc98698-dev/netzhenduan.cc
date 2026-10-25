---
title: 多网卡路由跃点冲突与 TUN 虚拟网卡死锁排查集群
description: 专注解决开启代理后网页打不开、虚拟机 (VMware/VirtualBox) 抢占网关、企业内网 VPN 导致代理断网、Wintun 虚拟网卡路由死锁与杀毒软件本地回环拦截故障。
---

# 多网卡路由跃点冲突与 TUN 虚拟网卡死锁排查集群

在复杂的现代开发与远程办公环境中，用户的操作系统往往同时挂载了多个物理网络适配器与虚拟网络设备：千兆有线以太网、WiFi 无线网卡、手机 USB 共享网络、VMware / VirtualBox 虚拟化交换机、Tailscale / ZeroTier 虚拟局域网网卡、以及远程办公专用的企业级 VPN 适配器。

当用户启动代理客户端并开启 **TUN 虚拟网卡模式** 时，客户端核心（如 Mihomo / Xray / sing-box）会在系统中注入一个名为 `Wintun` 的三层虚拟网络设备，并尝试向操作系统的 IP 路由表写入一条指向虚拟网卡的默认网关记录（`0.0.0.0/0 Metric=5`）。

然而，如果操作系统中的其他虚拟网卡、物理网卡或企业 VPN 遗留路由具有更低的**接口跃点数（Interface Metric）**，或者本地安全杀毒软件在 Windows 过滤平台（WFP）中实施了针对环回端口的静默拦截，整机的网络调度将在内核层陷入彻底的死锁状态——**客户端界面显示节点延迟极低且测速正常，但浏览器和命令行工具却无法打开任何一个网页**。

本三级内容集群由 **netzhenduan.cc 网络诊断实验室** 设立，专注攻克操作系统三层网络栈中的多网卡路由竞争、TUN 驱动死锁与安全软件误杀阻断，为您提供全链路排查文章矩阵与自动化自检工具。

---

## 一、 多网卡路由决策与数据包抢占微观拓扑

理解 Windows 内核网络栈（`TCPIP.sys`）如何决定一个数据包从哪块网卡发出，是破解一切“代理已连接但打不开网页”的理论基石：

```
+─────────────────────────────────────────────────────────────────────────────+
|               Windows 内核网络栈多网卡默认网关决策拓扑 (Metric 争抢模型)        |
+─────────────────────────────────────────────────────────────────────────────+

   【应用程序发起外网请求 (如访问 www.google.com)】
                          │
                          ▼
   【Windows 内核网络栈 (TCPIP.sys 路由表匹配)】
   系统根据「最长掩码匹配」与「最低接口跃点 (Lowest Metric)」规则在路由表中仲裁：
                          │
         ┌────────────────┴────────────────┬────────────────┐
         ▼                                 ▼                ▼
   [路由分支 A: 物理以太网卡]        [路由分支 B: Wintun 代理网卡]  [路由分支 C: 虚拟机/VPN 网卡]
   - 目标: 0.0.0.0/0                - 目标: 0.0.0.0/0             - 目标: 0.0.0.0/0
   - 网关: 192.168.1.1 (光猫)       - 网关: 198.18.0.1 (虚拟)     - 网关: 10.8.0.1 (企业VPN/VM)
   - 接口跃点 Metric: 25            - 接口跃点 Metric: 10         - 接口跃点 Metric: 5 (被篡改抢占!)
         │                                 │                │
         ▼                                 ▼                ▼
   (正常走物理直连出海)           (正常被代理内核捕获出海)    【致命冲突: 数据包被吸入黑洞】
                                                           VMware/VPN 接口抢占了最低跃点，
                                                           数据包被强行路由至已断开的内网
                                                           或未经代理的虚拟机网桥，
                                                           导致整机所有外网连接全部超时！
```

**工程判定铁律**：
在多网卡并存的操作系统中，**接口跃点数（Interface Metric）最小的网卡具有最高路由优先级**。如果 TUN 虚拟网卡的跃点高于任何一个其他活跃网卡，TUN 模式就会被直接旁路穿透或产生黑洞丢包。

---

## 二、 集群排障文章导航与专业技术分工

本三级集群下设两篇工业级深度技术长文，分别从“路由跃点与网关争抢”和“本地安全软件与 WFP 拦截”两个微观维度彻底根治连接故障：

| 页面链接与排查指南 | 核心攻坚的技术边界与底层机理 | 典型适用故障现象与用户诉求 |
|---|---|---|
| [**🔥 多网卡接口跃点 (Metric) 冲突与默认网关抢占排障全指南**](/issues/connection-failures/tun-routing/multi-nic-metric-route-conflict) | Windows 路由表最长匹配原则、IPv4/IPv6 接口跃点自动与手动权重分配、VMware / VirtualBox 虚拟网卡抢占 0.0.0.0/0 路由、企业 VPN 残留清理与 PowerShell 批量自愈 | 开启代理后电脑断网；电脑插了网线又连 WiFi 导致代理失效；安装虚拟机或内网办公 VPN 后海外网页彻底打不开 |
| [**🛠️ 第三方杀毒软件拦截本地回环 (127.0.0.1) 流量排查全指南**](/issues/connection-failures/tun-routing/antivirus-loopback-rst-interception) | Windows 过滤平台 (WFP) 架构、TCP RST 复位包注入嗅探、火绒/360/火绒安全/Windows Defender 网络保护组件对 7890/7897 端口的误杀机制与白名单规则放行 | 客户端显示已连接且节点延迟正常，但浏览器所有网页均报 `ERR_CONNECTION_RESET` 或 `ERR_CONNECTION_REFUSED`；杀软提示拦截未经授权网络连接 |

---

## 三、 核心故障排查四步递进筛选法

在阅读具体长文之前，建议按照以下标准化流程在 60 秒内快速完成初筛，直接锁定诱因所在的具体层级：

### 1. 执行路由表快速快照排查
以管理员身份打开 PowerShell 或命令提示符，执行以下命令：
```cmd
route print 0.0.0.0
```
观察输出结果中的「活动路由」列表：
- 如果存在**两条或两条以上指向不同网关的 `0.0.0.0` 默认路由**，立即核对其最右侧的「跃点数（Metric）」；
- 若指向代理虚拟网卡（通常网关为 `198.18.0.1`）的跃点数不是全表中最小的数值，说明**默认路由已被其他网卡抢占**，数据包无法被 TUN 虚拟网卡截获。

### 2. 检查虚拟机与虚拟组网适配器状态
进入 Windows「控制面板」->「网络和共享中心」->「更改适配器设置」：
- 检查是否存在名为 `VMware Network Adapter VMnet1/VMnet8`、`VirtualBox Host-Only Ethernet Adapter` 或 `Tailscale` 的网卡；
- 临时右键将上述虚拟网卡点击「禁用」，然后重新测试浏览器是否恢复上网。如果恢复，100% 确认是虚拟机网卡的 Metric 配置不当。

### 3. 区分“网络层丢包”与“应用层 TCP RST 复位”
打开 Chrome 浏览器，按 `F12` 打开开发者工具，切换到 **Network (网络)** 面板并刷新网页：
- **报错为 `ERR_CONNECTION_TIMED_OUT`**：数据包发出后无任何响应，属于典型的**路由跃点错误或网关黑洞丢包**（按步骤 1 排查网卡路由）；
- **报错为 `ERR_CONNECTION_RESET`**：数据包在毫秒级内被强制切断，属于典型的**本地杀毒软件或防火墙主动注入 TCP RST 复位包**（按步骤 4 排查杀软白名单）。

### 4. 验证杀毒软件 Web 监控模块
尝试临时右键退出第三方杀毒软件（如火绒、360 安全卫士、卡巴斯基）的“实时网络防护 / Web 威胁防护”模块：
- 若退出后海外网页立刻秒开，证明杀软的 WFP 网络过滤驱动将代理客户端的核心回环通信判定为木马通信。

---

## 四、 自动化体检：PowerShell 多网卡路由跃点与网关审计脚本

在 Windows 终端中运行以下脚本，自动化抓取整机所有网卡的物理状态、IPv4 接口跃点与默认网关优先级：

```powershell
<#
.SYNOPSIS
    netzhenduan.cc 多网卡接口跃点与默认网关审计工具
.DESCRIPTION
    遍历系统所有网络适配器，核验 InterfaceMetric 数值与 0.0.0.0/0 默认网关优先级，
    标注是否存在虚拟机/VPN 网关越权抢占风险。
#>

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  netzhenduan.cc 多网卡接口跃点与默认网关优先级审计探针  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. 抓取所有处于激活状态的 IPv4 网络接口
Write-Host "`n[1/3] 审计所有活跃网络适配器的接口跃点 (InterfaceMetric)..." -ForegroundColor Yellow
$interfaces = Get-NetIPInterface -AddressFamily IPv4 | Where-Object { $_.ConnectionState -eq "Connected" } | Sort-Object InterfaceMetric

Write-Host ("{0,-6} {1,-30} {2,-15} {3,-10}" -f "索引", "适配器别名", "接口跃点(Metric)", "自动跃点模式") -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

foreach ($if in $interfaces) {
    $alias = $if.InterfaceAlias
    $idx = $if.InterfaceIndex
    $metric = $if.InterfaceMetric
    $auto = $if.AutomaticMetric
    
    $highlight = "White"
    if ($alias -match "Wintun" -or $alias -match "clash" -or $alias -match "Meta") {
        $highlight = "Green"
    } elseif ($alias -match "VMware" -or $alias -match "VirtualBox" -or $alias -match "vEthernet") {
        $highlight = "DarkYellow"
    }
    
    Write-Host ("{0,-6} {1,-30} {2,-15} {3,-10}" -f $idx, $alias, $metric, $auto) -ForegroundColor $highlight
}

# 2. 抓取 0.0.0.0/0 默认路由优先级
Write-Host "`n[2/3] 审计系统 0.0.0.0/0 默认路由调度优先级..." -ForegroundColor Yellow
$routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -AddressFamily IPv4 -ErrorAction SilentlyContinue | Sort-Object RouteMetric

if (-not $routes) {
    Write-Host "  [CRITICAL] 系统不存在任何 0.0.0.0/0 默认路由，整机外网通信已彻底断开！" -ForegroundColor Red
} else {
    Write-Host ("{0,-20} {1,-10} {2,-10} {3,-25}" -f "下一跳网关", "路由跃点", "接口索引", "对应网卡别名") -ForegroundColor White
    Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
    
    $rank = 0
    foreach ($r in $routes) {
        $rank++
        $ifAlias = (Get-NetIPInterface -InterfaceIndex $r.InterfaceIndex -AddressFamily IPv4).InterfaceAlias
        $color = if ($rank -eq 1) { "Green" } else { "Gray" }
        Write-Host ("{0,-20} {1,-10} {2,-10} {3,-25}" -f $r.NextHop, $r.RouteMetric, $r.InterfaceIndex, $ifAlias) -ForegroundColor $color
    }
}

# 3. 冲突与风险综合研判
Write-Host "`n[3/3] 路由决策冲突判定结果:" -ForegroundColor Yellow
$firstRoute = $routes | Select-Object -First 1
if ($firstRoute) {
    $firstAlias = (Get-NetIPInterface -InterfaceIndex $firstRoute.InterfaceIndex -AddressFamily IPv4).InterfaceAlias
    if ($firstAlias -match "VMware" -or $firstAlias -match "VirtualBox") {
        Write-Host "  [WARN] 严重警告: 默认网关被虚拟机网卡 ($firstAlias) 抢占！会导致代理流量丢失！" -ForegroundColor Red
    } elseif ($firstAlias -match "Wintun" -or $firstAlias -match "Meta") {
        Write-Host "  [OK] 正常: 代理 TUN 虚拟网卡成功夺取最高路由优先级 (Metric 最小)。" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] 当前最高优先级默认路由由物理网卡 ($firstAlias) 承载。" -ForegroundColor Cyan
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
```

---

## 五、 常见高频报错特征与快速自救表

| 故障现象 | 发生技术层级 | 根本物理诱因 | 快速自救方案 |
|---|---|---|---|
| 开启代理后所有网页 `ERR_CONNECTION_TIMED_OUT` | 路由层 (三层) | 电脑同时连接了 WiFi 与插上网线，有线网卡抢占了更低 Metric，TUN 路由失效 | 拔掉网线或断开 WiFi，保持仅有一块主物理网卡连接 |
| 启动 VMware 虚拟机后代理瞬间瘫痪 | 适配器层 | VMware 虚拟网卡 `VMnet8` 默认设置了过低的跃点，夺取了默认网关 | 执行脚本将 `VMnet8` 接口跃点手动调高至 `100` 以上 |
| 退出公司 VPN 软件后浏览器完全打不开网页 | 路由表持久化 | 企业 VPN 客户端在退出时未清理写入路由表的 `0.0.0.0/0` 路由 | 以管理员身份打开 CMD，运行 `route delete 0.0.0.0` 并重启电脑 |
| 访问任何网站瞬间提示 `ERR_CONNECTION_RESET` | 过滤平台 (WFP) | 杀毒软件网络保护模块将代理核心的本地监听端口误判为恶意劫持 | 在安全软件中将 `mihomo.exe` 与客户端目录加入网络防护信任白名单 |
| 开启 TUN 模式后局域网打印机与 NAS 无法访问 | 私有地址路由 | 客户端接管了私有保留网段，将局域网内网流量误送入代理加密隧道 | 在客户端配置私有 IP 绕行白名单（将 `192.168.0.0/16` 等设置为直连） |

---

## 六、 场景化容灾逃生机制

<DisasterRecoveryBox 
  alertTitle="🚨 多网卡路由与杀软拦截已全部排查，但节点测速依然全红超时？"
  triggerCondition="经排查整机默认网关优先级正常且杀软已放行，但客户端所有海外节点依旧显示红字 Timeout，判定为服务商中转机房入口遭受阻断"
  recommendedAction="切换至具备全线多入口 BGP 自动故障转移与纯内网物理 IEPL 专线的工业级备用机场"
  primaryAirportName="光速云 (Guangsu)"
  primaryAirportUrl="/airports/guangsu"
  primaryFeatures="全线多入口 BGP 自动容灾 / 晚高峰 529Mbps / 纯物理 IEPL 内网专线 / 晚高峰 0 丢包"
  backupAirportName="微风网络 (Breeze)"
  backupAirportUrl="/airports/weifeng"
  matrixUrl="/airports/"
/>

---

## 七、 上级导航与全景横向链接
- **上级专题入口**：[连接成功但无法上网与数据流中断排错专题](/issues/connection-failures/)
- **集群一技术长文**：[科学上网连接成功却打不开网页怎么办？系统代理与 DNS 排查步骤](/issues/connected-but-no-internet)
- **集群一技术长文**：[Windows 系统代理注册表死锁与 PAC 脚本缓存崩溃排障实战](/issues/connection-failures/proxy-dns/wininet-pac-registry-deadlock-repair)
- **客户端专题参考**：[Clash Verge Rev 显示节点超时 12 大模块排查全流程](/clients/clash-verge-rev-timeout)
- **网络诊断实验室**：[在线 WebRTC / DNS 泄漏与链路安全诊断](/diagnostics/)
