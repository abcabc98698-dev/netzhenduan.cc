---
title: 分流规则编排与扩展覆写 (Merge) 排查集群
description: 专注 Clash Verge Rev 扩展配置 (Merge) 与脚本预处理 (Script) 体系。深度解决订阅更新后自定义配置被覆盖、YAML 缩进语法崩溃与 Rule-Providers 动态注入故障。
---

# 分流规则编排与扩展覆写 (Merge) 排查集群

在桌面端代理软件的日常使用中，绝大多数技术人员与资深用户都会面临一个极其棘手的工程痛点：
> **“为了实现公司内网域名直连、家庭 NAS 私有 DNS 解析或特定的流媒体走特定节点，我们在本地配置文件中辛辛苦苦添加了几十行自定义规则；然而，只要在客户端点击一次‘更新订阅’，机场下发的最新配置就会瞬间无情地抹除并覆盖掉所有本地自定义修改！”**

为了解决“**订阅动态拉取**”与“**本地私有定制**”之间的根本性冲突，新一代科学上网客户端 **Clash Verge Rev** 引入了高度解耦的扩展流水线机制：**扩展配置（Merge）** 与 **脚本预处理（Script）**。

这一机制允许用户将私有规则、DNS 覆写以及自定义策略组独立保存在外部补丁文件中。无论上游机场订阅如何频繁更新或轮换节点，客户端在将配置提交给后台 **Mihomo (Clash.Meta)** 核心启动之前，都会在内存中自动执行 AST 深度合并或 JavaScript 脚本函数，将用户的私有补丁无缝注入到最终配置树中。

然而，扩展覆写机制也带来了更高的配置技术门槛：
- **YAML 字典合并（Deep Merge）与列表覆盖陷阱**：误以为直接写 `rules:` 能追加规则，结果导致上游成百上千条分流规则被完全清空替换；
- **`prepend-rules` 语法优先级颠倒**：自定义的直连或代理规则插入位置错误，被上游的 `MATCH` 兜底规则截胡失效；
- **JavaScript 脚本沙箱运行时报错**：在 Script 模式下编写节点清洗函数时未处理 `undefined` 空指针，导致 Mihomo 核心启动秒崩；
- **Rule-Providers 规则集异步加载阻塞**：从 GitHub 引入外部规则集时遭遇网络超时，导致客户端界面长时间假死。

**netzhenduan.cc 网络诊断实验室** 设立本三级攻坚集群，旨在为运维人员与深度用户提供一套兼具灵活性、稳健性与防覆盖的规则编排全套方法论。

---

## 扩展覆写与配置热合成流水线架构拓扑

理解用户的私有定制如何在每次订阅更新后完好无损地生效，请仔细审视 Clash Verge Rev 在内存中执行的五阶配置热合成流水线：

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                     Clash Verge Rev 扩展配置 (Merge/Script) 热合成流水线                     |
+─────────────────────────────────────────────────────────────────────────────────────────────+

   [上游服务商：原始订阅配置] ──────────────────────────────────────────┐
     • 由机场面板动态生成                                             │
     • 包含 proxies 节点列表与基础 rules                              ▼
                                                    【阶段一：内存反序列化为 AST 语法树】
   [用户私有补丁：扩展配置 (Merge YAML)] ───────────►  • 解析原始订阅 YAML
     • prepend-rules: 私有高优先级直连白名单          • 校验核心字典合法性
     • dns: 私有 DoH 加密与 Fake-IP 调优                              │
     • proxy-groups: 自定义极速专线分组                               ▼
                                                    【阶段二：YAML 深度合并引擎 (Deep Merge)】
                                                       • 递归合并字典键值对 (dns, tun 等)
                                                       • 依据 prepend/append 策略拼接规则列表
                                                                      │
                                                                      ▼
                                                    【阶段三：JavaScript 脚本沙箱 (Script main)】
                                                       • 执行用户的动态清洗函数
                                                       • 自动过滤营销节点、重命名、动态测速
                                                                      │
                                                                      ▼
                                                    【阶段四：静态语法合规校验 (Validator)】
                                                       • 校验策略组出站引用是否悬空 (Broken Link)
                                                       • 剔除非法制表符 Tab 与特殊乱码字符
                                                                      │
                                                                      ▼
                                                    【阶段五：生成运行时临时配置并通知核心】
                                                       • 安全写入 AppData 临时 run 配置文件
                                                       • 向 127.0.0.1:9097 下发 Mihomo 热重载信号
```

---

## 本集群下辖攻坚技术长文矩阵

本集群汇集了两篇由网络实验室专家深度编写的工业级技术攻坚长文：

### 1. [🔥 Clash Verge Rev 扩展配置 (Merge) 编写与订阅更新防覆盖实战：从 DNS 覆写到私有直连规则注入](/clients/clash-verge/rule-merge/merge-extension-config-guide)
- **技术定位**：零代码基础用户的模块化防覆盖实战手册。
- **核心攻坚**：
  - 深度剖析 YAML 字典深度合并（Deep Merge）与列表替换机制；
  - 掌握 `prepend-rules`（前置高优先级插入）与 `append-rules`（后置兜底追加）的工业级用法；
  - 实操场景化注入：公司内网/局域网设备直连、私有 DoH 解析器覆写、自动提取所有 IEPL 专线聚合为专属策略组；
  - 提供开箱即用的高可用 Merge 生产级配置模板与 2 大典型生产 RCA 复盘。

### 2. [🛠️ Clash Verge Rev 脚本预处理 (Script) 与 Rule-Providers 动态规则集深度实战](/clients/clash-verge/rule-merge/script-ruleset-clash-verge-rev)
- **技术定位**：进阶极客与网络工程师的高级动态调度指南。
- **核心攻坚**：
  - 详解 Tauri 前端环境下的 JavaScript 预处理函数 `main(config, profileName)` 运行机制；
  - 编写高性能正则过滤脚本，全自动剔除“官网”、“流量充值”、“到期时间”等无用营销节点；
  - 动态外挂 `rule-providers` 规则集，集成最新去广告、流媒体解锁与反诈拦截规则；
  - 深度对比文本规则集与 Mihomo MRS（Meta Rule-Set）二进制规则集的内存与匹配性能表现。

---

## 配置定制三类途径技术特性对比基准表

下表客观对比了在 Clash Verge Rev 中修改配置的三种主要途径，方便用户根据实际场景精准选型：

| 维度对比 | 直接编辑订阅文件 (Raw Edit) | 扩展配置 (Merge YAML) | 脚本预处理 (Script JS) |
|---|---|---|---|
| **技术实现载体** | 直接修改 `profiles/` 目录下的 `.yaml` 文件 | 外部独立 YAML 补丁片段 | 外部独立 JavaScript 脚本代码 |
| **订阅更新防覆盖能力** | **极差（0 分）**。只要点击更新订阅，本地修改即刻被完全覆盖抹除 | **完美（100 分）**。配置独立存储，更新后全自动触发内存合并 | **完美（100 分）**。配置独立存储，更新后全自动执行动态清洗 |
| **配置编写门槛** | 简单（常规文本编辑） | 中等（需遵循 YAML 严格缩进与保留字段） | 较高（需掌握基础 JavaScript 语法与对象遍历） |
| **逻辑处理能力** | 纯静态文本，无逻辑能力 | 支持字典合并与列表插入，无法做条件分支 | **极强**。支持条件判断、正则匹配、数组重构与动态重命名 |
| **执行开销与性能** | 无额外运行时开销 | 微秒级（仅在载入或更新时执行一次 YAML 合并） | 毫秒级（在 V8/QuickJS 引擎中执行内存对象重塑） |
| **适用典型场景** | 临时单次测试特定节点参数 | 固化内网 DNS 覆写、插入公司私有白名单直连规则 | 批量过滤垃圾广告节点、动态提取特定关键词构建分组 |

---

## 规则匹配生命周期五阶段深度剖析

为了写出真正生效且不产生副作用的扩展配置，技术人员必须清晰掌握 Mihomo 内核在收到数据包后，如何逐层遍历 `rules` 列表中的条目：

1. **第一阶段：入站元数据嗅探（Sniffing）**
   数据包进入混合端口（7897）或 Wintun 虚拟网卡后，内核网络栈首先提取传输层四元组（源 IP、源端口、目标 IP、目标端口）。若开启了 TLS/HTTP 流量嗅探，核心在握手报文中截获明文 SNI 域名，并将其赋值给内部会话元数据（Metadata）；
2. **第二阶段：进程名与应用程序规则匹配（PROCESS-NAME）**
   核心优先比对操作系统当前发起网络请求的进程二进制名称（如 `git.exe`、`chrome.exe` 或 `EpicGamesLauncher.exe`）。进程规则具有最高执行优先级，一旦命中立即跳出后续规则判断，直接分流至对应出站策略；
3. **第三阶段：域名抽象树快速匹配（DOMAIN / DOMAIN-SUFFIX / Rule-Providers）**
   核心将截获的域名送入倒序基数树（Radix Tree）与 Aho-Corasick 多模式匹配状态机中，依次比对完全匹配域名、后缀域名与外部外挂的 GeoSite 规则集。这是我们通过 `prepend-rules` 插入白名单直连规则的最核心生效区间；
4. **第四阶段：IP-CIDR 与地理位置归属匹配（IP-CIDR / GEOIP）**
   若上述域名阶段未匹配成功，或流量原本就是通过原生裸 IP 发起的直连请求，核心开始检索目标 IP 地址池。在开启 Fake-IP 模式下，核心会反向查询本地内存中的 Fake-IP 映射字典（将 `198.18.x.x` 还原为真实域名），随后执行本地 GeoIP 数据库比对（如 `GEOIP,CN,DIRECT`）；
5. **第五阶段：最终全局兜底分流（MATCH）**
   所有未被上述四个阶段命中截胡的孤立数据包，无条件跌入规则列表末尾的 `MATCH` 规则，分流到用户指定的默认策略组（如 `PROXY` 或自动测速组）。

---

## 分流规则编排与扩展覆写高频问答 (FAQ)

### Q1：为什么我在 Merge 配置中写了 `rules:`，更新订阅后其他所有网站都打不开了？
**答**：这是最典型的“列表全量覆盖”陷阱。在 YAML 深度合并（Deep Merge）标准中，字典（Key-Value 键值对，如 `dns:` 下的各项属性）支持递归合并；但**列表数组（Array/List，如 `rules:` 或 `proxies:`）默认不支持智能插入，而是直接用新列表完全覆盖替换旧列表**！如果您在 Merge 中声明了 `rules:`，会导致上游订阅中成百上千条分流规则被完全抹除，仅剩您写的那几行。正确的工业级做法是使用客户端专有的增量键：前置高优先级插入使用 **`prepend-rules`**，后置低优先级追加使用 **`append-rules`**。

### Q2：我在扩展配置中注入了自建内网 DNS 服务器，为什么内网连通了但国内公网网站变得极慢？
**答**：这通常是因为您覆写了全局 `nameserver` 但未配置基于域名的解析分流策略（`nameserver-policy`）。当您把全局 DNS 强行指向内网自建 DNS 或海外公共 DoH（如 `8.8.8.8`）时，所有国内主流平台（如淘宝、Bilibili、腾讯视频）的解析请求均向该 DNS 发起，失去了 EDNS Client Subnet（ECS）本地运营商就近调度优势，拿到了跨省甚至海外的 CDN 边缘节点 IP。解决方案是在扩展配置中保留 `nameserver-policy`，将 `geosite:cn` 明确绑定给阿里 DNS（`223.5.5.5`）或腾讯 DNS（`119.29.29.29`）。

### Q3：Clash Verge Rev 里的 Merge（扩展配置）与 Script（脚本预处理）哪个先执行？
**答**：流水线执行顺序为**先 Merge，后 Script**。客户端在底层首先执行 YAML 补丁的静态深度合并，生成合并后的 AST 对象；随后将该完整对象作为参数传给 JavaScript 脚本中的 `main(config, profileName)` 函数。因此，您在 Script 脚本中可以完全访问并二次修改经过 Merge 合并后的最新配置，具有绝对的最终裁决权重。

---

## 扩展配置冲突与失效四步排查自检法

当发现编写的 Merge 配置或 Script 脚本未能生效，或者导致客户端保存后核心崩溃时，请依次执行以下四步自检流程：

```
+─────────────────────────────────────────────────────────────────────────────+
|                        扩展配置冲突与失效四步自检流水线                     |
+─────────────────────────────────────────────────────────────────────────────+
  [步骤一：扩展配置启用状态核验]
    • 检查 Clash Verge Rev 的“订阅”界面中，目标配置右侧是否正确勾选了对应的 Merge 补丁
    • 确认“全局扩展”与“单订阅独立扩展”的作用域范围是否混淆
         │
         ▼
  [步骤二：YAML 基础语法合规审查]
    • 严查是否在缩进中混入了制表符 (Tab, \t)
    • 检查 prepend-rules 列表中，每条规则的逗号后是否规范添加了空格（如 DOMAIN-SUFFIX,example.com,DIRECT）
         │
         ▼
  [步骤三：查看合并后最终运行配置]
    • 在订阅卡片右键选择“查看运行时配置 (View Runtime Config)”
    • 在生成的合并完整 YAML 中全局搜索私有规则，确认是否真正被写入到了 rules 数组顶端
         │
         ▼
  [步骤四：核心日志捕获与 Trace 追踪]
    • 打开客户端“日志”页面，过滤级别设为 "debug" 或 "info"
    • 触发一次“重启核心”，查看是否存在 "apply merge failed" 或 "unmarshal config error" 报错
```

---

## 生产级自动化核验：PowerShell 扩展配置语法与缩进探针脚本

在将自己手写的 Merge 规则应用到客户端之前，可以在本地终端执行以下 PowerShell 脚本，快速扫描是否存在制表符污染、冒号格式破坏以及规则语法瑕疵：

```powershell
<#
.SYNOPSIS
    netzhenduan.cc 网络诊断实验室 - Clash Verge Rev 扩展配置 (Merge) 语法与格式自检探针
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$FilePath
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  正在启动 Clash Verge 扩展配置语法审计: $FilePath" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $FilePath)) {
    Write-Host "[X] 致命错误: 指定的文件不存在: $FilePath" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $FilePath -Encoding UTF8
$errorCount = 0
$warnCount = 0

for ($i = 0; $i -lt $lines.Count; $i++) {
    $lineNum = $i + 1
    $rawLine = $lines[$i]
    
    # 1. 检测制表符 (Tab) 污染 (YAML 规范零容忍)
    if ($rawLine -match "\t") {
        Write-Host " [X] 行 $lineNum 发现非法制表符 (Tab 字符)! YAML 仅允许使用空格缩进!" -ForegroundColor Red
        $errorCount++
    }
    
    # 2. 检测冒号后缺少空格 (常见键值对断裂)
    if ($rawLine -match "^[\s]*[a-zA-Z0-9_\-]+:(?![\s$])") {
        Write-Host " [X] 行 $lineNum 键值对冒号后缺少空格! 正确格式应为 'key: value'" -ForegroundColor Red
        $errorCount++
    }
    
    # 3. 检查 prepend-rules 或 rules 列表中的格式
    if ($rawLine -match "^\s*-\s+(DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD|IP-CIDR|GEOIP|MATCH)") {
        $ruleContent = $rawLine.TrimStart().Substring(2)
        $parts = $ruleContent -split ","
        if ($parts.Count -lt 2) {
            Write-Host " [X] 行 $lineNum 规则格式严重残缺: '$ruleContent'" -ForegroundColor Red
            $errorCount++
        } elseif ($parts[0] -in @("DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD", "IP-CIDR") -and $parts.Count -lt 3) {
            Write-Host " [X] 行 $lineNum 规则缺少目标策略组或直连动作 (如 DIRECT): '$ruleContent'" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host "`n======================= 审计报告汇总 =======================" -ForegroundColor Cyan
if ($errorCount -eq 0) {
    Write-Host "[√] 完美通过！未检测到 Tab 制表符污染与关键语法缺陷，可安全注入客户端！" -ForegroundColor Green
} else {
    Write-Host "[!] 审计未通过: 共发现 $errorCount 处致命语法错误，请修复后再次注入！" -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan
```

---

<DisasterRecoveryBox 
  alertTitle="🚨 自定义分流频发冲突且急需开箱即用体验？切换高可用企业专线"
  triggerCondition="编写扩展覆写配置后反复遭遇白屏、规则失效，或希望服务商原生内置完备的大陆白名单与流媒体分流"
  recommendedAction="接入预置企业级智能分流规则、完美兼容 Clash Verge Rev 全特性的原生专线服务"
  primaryAirportName="光速云 (Guangsu)"
  primaryAirportUrl="/airports/guangsu"
  primaryFeatures="出厂预置 ACL4SSR 完善分流 / 零配置直接使用 / 纯内网 IEPL 极速专线 / 晚高峰 529Mbps 实测"
  backupAirportName="微风网络 (Breeze)"
  backupAirportUrl="/airports/weifeng"
  matrixUrl="/airports/"
/>

---

## 上级导航与全景横向链接

- **上级二级专题总览**：[Clash Verge Rev 核心配置与进阶排错专题](/clients/clash-verge/)
- **上级一级大专题入口**：[主流代理客户端故障手册与排查索引](/clients/)
- **姊妹三级集群入口**：[Mihomo 内核与服务模式故障排查集群](/clients/clash-verge/mihomo-service/)
- **经典长文必读**：[Clash Verge Rev 节点超时与内核崩溃综合排查指南](/clients/clash-verge-rev-timeout)
- **底层驱动排查**：[TUN 模式与 Wintun 虚拟网卡崩溃排错全指南](/clients/clash-verge/mihomo-service/tun-mode-wintun-troubleshooting)
