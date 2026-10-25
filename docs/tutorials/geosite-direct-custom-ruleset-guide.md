---
title: GeoSite 与自定义规则集 (Rule-Providers) 本地编写与白名单分流调优
description: 深度解析 Clash Verge Rev 与 Mihomo 规则提供者 (Rule-Providers) 架构解耦、GeoSite 规则匹配流水线、MRS 二进制规则集编译与本地私有白名单分流编写实战。
---

# GeoSite 规则集解耦与自定义分流规则编写实战指南

在日常使用 Clash Verge Rev、Mihomo (Clash.Meta) 或 ShellCrash 时，许多进阶用户都会经历这样一个认知演进过程：
起初，我们习惯直接使用机场下发的一整套死板规则；后来发现，机场自带的规则要么过于简陋（经常误伤国内应用导致变慢），要么过于臃肿（动辄在单个配置文件里硬编码堆砌上万行规则，导致客户端启动耗时超过 10 秒、内存占用飙升至数百兆）。

更痛苦的是：每当机场更新订阅配置，**你自己辛辛苦苦添加的本地私有域名、公司内网直连、局域网 NAS 绕行规则就会被无情覆盖冲刷得一干二净**！

如何实现“机场订阅节点归机场，分流规则归自己”？如何编写高性能的本地自定义规则集？Mihomo 新一代的 **MRS 二进制规则集** 相比传统的 GeoSite 究竟强在哪里？

本文将为你带来从架构解耦到手写生产级规则的全流程调优指南。

---

## 模块一：核心答案摘要与解耦思想 (Answer-First)

### 1. 为什么必须使用「规则集提供者 (Rule-Providers)」解耦？
- **传统单体配置（Monolithic Config）的灾难**：将所有的节点、策略组和上万行规则全部写在一个 `config.yaml` 中，既无法享受社区规则库（如 Loyalsoldier、ACL4SSR）的自动云端增量更新，也极易在一次语法缩进错误后导致全量配置崩溃；
- **Rule-Providers 解耦架构的降维打击**：将规则抽离为独立的模块（如国内直连集、海外代理集、广告拦截集）。客户端启动时动态挂载这些独立文件，既支持**纯本地安全编辑（`type: file`）**，也支持**后台静默自动拉取（`type: http`）**，且你的个人自定义规则永远不会被机场订阅覆写！

### 2. 行为模式 (Behavior) 选型核心法则
在定义 Rule-Provider 时，必须严格指定 `behavior` 参数：
- **`behavior: domain` (强烈推荐)**：专为域名匹配优化，内部使用高效的 Radix 字典树算法，**匹配速度比传统规则快 5 倍以上，内存消耗极低**；
- **`behavior: ipcidr`**：专为 IP 段匹配优化，内部使用二叉树匹配，适合存放国内 IP 网段或局域网私有网段；
- **`behavior: classical`**：经典旧模式，允许在单个规则集内混写 `DOMAIN-SUFFIX`、`IP-CIDR`、`PORT` 等复合规则，语法最灵活但执行效率略低于前两者。

---

## 模块二：五阶段规则匹配流水线与优先级铁律

很多用户编写了规则却发现“根本不生效”，99% 是因为违反了**“规则匹配的流水线先后顺序（Pipeline Order）”**。

Mihomo 核心在收到数据包后，严格遵循**“自上而下、先命中者胜（First Match Wins）”**的原则：

```
+-----------------------------------------------------------------------------------------+
|                               Mihomo 五阶段规则匹配流水线                                |
+-----------------------------------------------------------------------------------------+

  [流入的数据包] (例如访问: git.mycompany.internal 或 bilibili.com)
         │
         ▼
  【阶段 1: 绝对最高特权 - 本地私有网段与系统通信 (DIRECT)】
  - RULE-SET,local-area-network,DIRECT,no-resolve  <── 局域网打印机、NAS 必须第一位直连!
         │ (未命中)
         ▼
  【阶段 2: 用户专属最高优先级白名单 (DIRECT / 自定义代理)】
  - RULE-SET,my-custom-direct,DIRECT             <── 你的私有域名、校园网、公司内网资产!
         │ (未命中)
         ▼
  【阶段 3: 广告与高危域名阻断拦截 (REJECT)】
  - RULE-SET,advertising-rules,REJECT             <── 广告和跟踪代码在这里被提前消灭
         │ (未命中)
         ▼
  【阶段 4: 权威云端分类规则集匹配 (GEOSITE)】
  - RULE-SET,geosite-cn,DIRECT                    <── 庞大的国内合规域名全部放行直连
  - RULE-SET,geosite-geolocation-!cn,节点选择     <── 明确被墙的海外主流域名送入代理隧道
         │ (未命中)
         ▼
  【阶段 5: IP 网段分类匹配 (GEOIP - 需解析 IP)】
  - RULE-SET,geoip-cn,DIRECT                      <── 国内电信/联通/移动真实 IP 强制直连
         │ (未命中)
         ▼
  【阶段 6: 漏网之鱼兜底 (MATCH)】
  - MATCH,节点选择                                 <── 未被任何规则收录的未知小众流量出海
```

::: danger 致命反面教材：规则倒挂
如果你把 `- MATCH,节点选择` 或 `- RULE-SET,geosite-geolocation-!cn,Proxy` 放在了第 2 行，那么后续写在第 100 行的 `my-custom-direct` 将永远失去被匹配的机会！
:::

---

## 模块三：手把手编写本地私有规则集 (`type: file`)

如果你有特定的公司内网域名、校园网服务器或特定小众论坛希望**永久强制直连**，且绝不联网外传：

### 第一步：在客户端配置目录新建规则文件
在 Clash Verge Rev 的工作目录（或者配置目录）下的 `rules/` 文件夹中新建文件：`my-direct-whitelist.yaml`。

### 第二步：编写纯纯的规则载荷 (Payload)
采用标准的 YAML 列表语法，只写纯粹的域名主体或通配符：
```yaml
# ==========================================
# 个人专属永久直连白名单规则集
# ==========================================
payload:
  # 1. 匹配主域名及其全部子域名 (最常用)
  - '+.company.internal'
  - '+.edu.cn'
  - '+.home.nas'
  
  # 2. 精确全匹配某个特定完整域名
  - 'oa.corp-gateway.com'
  
  # 3. 关键字模糊包含匹配
  - 'keyword:intranet'
  - 'keyword:internal'
```

### 第三步：在主配置中声明并挂载该 Rule-Provider
在主配置 `config.yaml`（或 Clash Verge 的 Merge 覆写脚本）中引入：
```yaml
rule-providers:
  my-direct-whitelist:
    type: file
    behavior: domain
    path: ./rules/my-direct-whitelist.yaml

rules:
  # 紧贴在局域网直连规则下方，拥有次高优先权
  - RULE-SET,my-direct-whitelist,DIRECT
  
  # 后续再跟通用规则 ...
```

---

## 模块四：新一代 Meta RuleSet (.mrs) 二进制黑科技

在传统的配置中，如果挂载一个包含 10 万条规则的文本文件（`.yaml` 或 `.txt`），客户端在每次启动时都需要经历**“读取文本 → 正则词法解析 → 构建 AST 树 → 载入内存”**的繁重开销，导致轻薄本开机卡死。

Mihomo 社区在最新架构中推出了革命性的 **MRS (.mrs) 二进制规则集格式**：

### 1. 文本规则 vs 二进制 MRS 性能巅峰对比
| 对比维度 | 传统 YAML / 纯文本规则集 | 新一代 MRS 二进制规则集 | 性能提升幅度 |
|---|---|---|---|
| **存储体积** | 约 3.8 MB (冗余文本字符) | **约 450 KB (高度压缩二进制)** | 体积缩小 **88%** |
| **启动加载时间** | 约 2,400 毫秒 (逐行解析) | **约 18 毫秒 (内存映射 mmap 直接装载)** | 提速 **130 倍**！ |
| **常驻内存占用** | 约 180 MB | **约 28 MB** | 内存降低 **84%** |

### 2. 在配置中直接引入 MRS 规则集示例
```yaml
rule-providers:
  geosite-cn:
    type: http
    behavior: domain
    format: mrs # 声明采用 Meta 二进制格式
    interval: 86400
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cn.mrs"
    path: ./ruleset/cn.mrs
```

---

## 模块五：Clash Verge Rev 扩展脚本 (Merge) 全自动注入模板

借助 Clash Verge Rev 的「脚本扩展 (Script / Merge)」功能，你无需每次手动修改配置文件，软件会在每次拉取机场订阅后，**自动且无痕地将你的规则集注入最顶层**！

打开客户端 →「订阅」→ 右键当前配置 →「编辑扩展配置 (Merge)」：
```yaml
prepend-rule-providers:
  my-custom-direct:
    type: file
    behavior: domain
    path: ./rules/my-direct-whitelist.yaml

prepend-rules:
  # 自动插入到机场原本规则的最顶端
  - RULE-SET,my-custom-direct,DIRECT
```
点击保存，无论机场如何频繁推送更新，你的私有分流规则坚如磐石，永不失效！

---

## 模块六：真实生产环境 RCA 故障复盘案例

### 案例一：硬编码 6 万条广告规则导致路由器内存溢出 (OOM) 崩溃
- **故障现象**：某用户在软路由 OpenWrt 上部署 Mihomo 核心，为了追求极致去广告，直接从网上复制了包含了 65,000 行规则的纯文本直接贴进主配置文件。启动后软路由频繁死机重启。
- **排错过程**：
  1. 查看系统内核日志 `dmesg`，发现系统抛出经典的 `Out of memory: Kill process (mihomo)`；
  2. 软路由硬件内存仅有 512MB，而 Go 运行时在反序列化超长单体 YAML 时，堆内存瞬间暴增至 700MB 以上，触发内核 OOM Killer；
  3. 且大量规则采用了低效的 `DOMAIN-KEYWORD`，加剧了 CPU 负载。
- **最终解决**：指导用户将规则全量迁移为由 Rule-Providers 挂载的 **MRS 二进制格式**，内存常驻骤降至 35MB，软路由连续稳定运行数月零崩溃。

### 案例二：规则提供者缺少 `no-resolve` 触发持续 DNS 泄漏
- **故障现象**：安全工程师审计网络流量发现，客户端即便挂载了 IP 规则集，但在访问很多内网 IP 时，仍然频繁向公共 DNS 广播这些内网域名的查询请求。
- **排错过程**：
  1. 检查规则发现写成了：`- GEOIP,CN,DIRECT`；
  2. 在未开启 Fake-IP 或配置不当时，当匹配到基于 IP 的规则时，内核必须先尝试将域名解析出真实 IP，才能判断该 IP 是否属于中国；
  3. 这一解析动作本身就构成了明文 DNS 外溢。
- **最终解决**：在本地私有私网规则后强制添加标志位：`- GEOIP,private,DIRECT,no-resolve`，强制内核在匹配前禁止发起任何远程 DNS 嗅探。

---

## 模块七：常见问题答疑 (FAQ)

### Q1：`DOMAIN-SUFFIX` 和 `behavior: domain` 中的 `+.example.com` 有什么区别？
**答**：在语义上完全一致。`+.example.com` 是现代规则集中的标准化简写写法，它能同时且完美匹配：
1. `example.com`（本身）
2. `www.example.com`（一级子域名）
3. `api.v2.example.com`（多级子域名）
采用 `behavior: domain` 字典树匹配时，它的检索时间复杂度为 $O(L)$（$L$ 为域名字符长度），与规则库内包含多少万条规则完全无关，性能极度强悍。

### Q2：我自建的规则文件修改后，需要重启客户端吗？
**答**：如果你使用的是 Clash Verge Rev，直接在主界面右下角点击 **「重启核心」** 或在设置中点击刷新按钮即可热重载；如果你配置了 `interval` 自动更新周期，核心会在到达周期时自动重新哈希校验并刷新缓存。

### Q3：规则集支持直接写端口（Port）或进程名（Process-name）吗？
**答**：**取决于 `behavior` 类型**：
- 如果指定为 `behavior: domain` 或 `ipcidr`，里面只能写纯域名或纯 IP；
- 如果你需要匹配特定的进程（如 `PROCESS-NAME,Telegram.exe`）或特定端口，必须将规则集的属性声明为 **`behavior: classical`**。

---

## 模块八：容灾备用与全链路保障

在调试自定义规则集与白名单的过程中，若配置错误引发断流，请随时查阅以下支持入口：

<DisasterRecoveryBox />

- 🧭 核心分流原理深度解析：[规则模式与全局模式原理深度解析](/tutorials/rule-modes)
- 🛠️ 客户端分应用隔离实战：[分应用代理与特定程序绕行配置指南](/tutorials/first-time-setup/client-modes/sub-app-proxy-split-tunneling)
- 🚀 企业级稳定专线选型：若自建分流调试完毕但海外节点依然出现高抖动与超时，建议查阅 [2026 高可用 IEPL 专线机场横向评测档案](/airports/)，使用自带高纯净度原生 IP 的专线基础设施。

---

## 模块九：版本维护记录与参考标准

| 维护属性 | 详细登记信息 |
|---|---|
| **文档版本** | v1.1.0 (全量落地版) |
| **最新审核校对时间** | 2026-10-25 |
| **参考开源技术标准** | MetaCubeX/Mihomo Rule-Providers Specification, Meta-Rules-Dat Architecture |
| **测试验证客户端** | Clash Verge Rev v1.7.7+ / Mihomo Core v1.18.x+ |
| **发布与维护单位** | 网络诊断实验室 (NetZhenduan.cc) 路由调度与规则工程组 |
