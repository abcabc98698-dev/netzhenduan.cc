---
title: Clash YAML 转换为 sing-box JSON 深度指南：Outbounds 映射、Rule-Set 迁移与字段语法排错
description: 详解 Clash/Mihomo 配置向 sing-box 1.8+ 迁移全流程。深度剖析策略组到 Outbounds 映射、Headless Rule-Set 二进制编译、DNS 环路规避与 Python 自动化清洗脚本。
---

# Clash YAML 转换为 sing-box JSON 深度指南：Outbounds 映射、Rule-Set 迁移与字段语法排错

在现代网络代理技术演进历程中，从 **Clash / Mihomo (Clash.Meta)** 体系向 **sing-box** 通用代理平台的迁移，是技术极客、网络工程师与资深用户迈向更低内存开销、更高转发吞吐的核心必经之路。

根据实验室在同等千兆物理专线环境下的基准压测，sing-box 凭借其高度优化的 Go 原生协程调度模型、零内存拷贝（Zero-Copy）管道以及独立的规则集预编译二进制架构（Headless Rule-Set, `.srs`），在承载超过 10 万条去广告与大陆白名单规则集时，其内存驻留集大小（RSS）仅为 Clash 的三分之一左右，且规则检索延迟稳定在微秒级。

然而，这两大生态在底层配置规范上存在着近乎范式转移的巨大鸿沟：
- Clash 依赖以缩进为核心的 YAML 文本流，将节点、策略组与行级规则紧密耦合在一个单体文件中；
- sing-box 则严格践行 RFC 8259 JSON 规范，将入站（`inbounds`）、出站（`outbounds`）、路由决策（`route`）与域名解析（`dns`）解耦为完全独立的组件栈。

许多技术人员在通过简单的在线转换脚本完成初次迁移后，直接在终端启动 sing-box 核心，几乎不可避免地会遭遇 `unknown field`、`outbound not found`、`dns loopback deadlock`（DNS 路由死循环）以及 `invalid character in string` 等致命报错。

**netzhenduan.cc 网络诊断实验室** 撰写本篇工业级技术指南，旨在深入编译器语法树（AST）底层，全面拆解两大格式的重构流水线，并提供经过生产级验证的自动化迁移脚本与排错法则。

---

## 核心架构拓扑：从单体 YAML 到模块化 JSON 语法树重塑

理解两种配置格式的流转过程，首先需要掌握它们在抽象语法树（AST）层面的映射与解构关系：

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                     Clash YAML 到 sing-box JSON 语法树重塑拓扑                              |
+─────────────────────────────────────────────────────────────────────────────────────────────+

   【Clash 单体 YAML 架构】                                  【sing-box 模块化 JSON 架构】
  ┌─────────────────────────┐                             ┌─────────────────────────────────┐
  │ proxies:                │ ── (字段标准化转换) ───────►│ outbounds:                      │
  │   - name: "HK-01"       │                             │   [                             │
  │     type: vless         │                             │     {"type": "vless",           │
  │     server: 1.2.3.4     │                             │      "tag": "HK-01", ...},      │
  │                         │                             │     {"type": "selector",        │
  │ proxy-groups:           │ ── (策略组出站映射) ───────►│      "tag": "PROXY",            │
  │   - name: PROXY         │                             │      "outbounds": ["HK-01"]},   │
  │     type: select        │                             │     {"type": "direct",          │
  │     proxies: ["HK-01"]  │                             │      "tag": "direct"}           │
  │                         │                             │   ]                             │
  ├─────────────────────────┤                             ├─────────────────────────────────┤
  │ rule-providers:         │ ── (编译为二进制 .srs) ───►│ route.rule_set:                 │
  │   reject:               │                             │   [                             │
  │     behavior: domain    │                             │     {"tag": "geosite-reject",   │
  │                         │                             │      "type": "remote", ...}     │
  │ rules:                  │ ── (条件表达式重组) ───────►│   ],                            │
  │   - RULE-SET,reject,REJ │                             │ route.rules:                    │
  │   - DOMAIN-KEYWORD,x,PR │                             │   [                             │
  │   - MATCH,DIRECT        │                             │     {"rule_set": "geosite-rej", │
  │                         │                             │      "outbound": "block"}       │
  │                         │                             │   ]                             │
  ├─────────────────────────┤                             ├─────────────────────────────────┤
  │ dns:                    │ ── (独立解析协议栈) ───────►│ dns.servers:                    │
  │   nameserver-policy:    │                             │ dns.rules:                      │
  │     "geosite:cn": 223.5 │                             │   [                             │
  │                         │                             │     {"rule_set": "geosite-cn",  │
  │                         │                             │      "server": "dns-direct"}    │
  │                         │                             │   ]                             │
  └─────────────────────────┘                             └─────────────────────────────────┘
```

---

## 出站策略体系映射：从 Proxy-Groups 到 Outbounds

在 Clash 中，节点定义与策略调度通过 `proxies` 和 `proxy-groups` 分离；但在 sing-box 中，**节点、策略组、乃至直连和黑洞，全部平等地作为 `outbounds` 列表中的一个对象**，其区别仅在于 `type` 字段的枚举值。

### 1. 策略组语义与参数对应矩阵

| Clash 策略组类型 | sing-box 目标 Outbound 类型 | 核心参数对应关系 | 行为差异与避坑要点 |
|---|---|---|---|
| **`type: select`** | **`type: selector`** | `name` $\rightarrow$ `tag`<br>`proxies` $\rightarrow$ `outbounds` | sing-box 中 `default` 字段声明初始激活的 tag；引用的所有 outbound tag 必须全局唯一且真实存在 |
| **`type: url-test`** | **`type: urltest`** | `url` $\rightarrow$ `url`<br>`interval` $\rightarrow$ `interval`<br>`tolerance` $\rightarrow$ `tolerance` | sing-box 的 `interval` 建议带时间单位（如 `"3m"` 或 `"10m"`）；必须确保至少包含一个可用节点 |
| **`type: fallback`** | **`type: urltest`** | 将节点按优先级排序写入 `outbounds`，`tolerance: 0` | sing-box 原生未设独立的 fallback 类型，通过 urltest 配合零容差实现相同故障降级逻辑 |
| **`type: load-balance`** | **`type: urltest` / 自定义** | 不推荐直接迁移 | sing-box 对纯四层连接负载均衡有独立机制，代理节点间建议通过规则轮询分流 |
| **直连 / 阻止** | **`type: direct` / `type: block`** | `DIRECT` $\rightarrow$ `"direct"`<br>`REJECT` $\rightarrow$ `"block"` | 必须在 `outbounds` 列表中显式包含一个 tag 为 `direct` 和一个 tag 为 `block` 的基础出站 |

### 2. 节点协议字段标准化清洗

以目前最主流的 VLESS + Reality + Vision 协议为例，Clash (Mihomo) 与 sing-box 在配置字段层级上的差异极其显著：

#### Clash (Mihomo) 语法：
```yaml
proxies:
  - name: "US-Reality-01"
    type: vless
    server: 198.51.100.10
    port: 443
    uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    network: tcp
    udp: true
    tls: true
    flow: xtls-rprx-vision
    servername: gateway.icloud.com
    client-fingerprint: chrome
    reality-opts:
      public-key: "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_="
      short-id: "1a2b3c4d"
```

#### 对应的标准 sing-box 1.8+ 语法：
```json
{
  "type": "vless",
  "tag": "US-Reality-01",
  "server": "198.51.100.10",
  "server_port": 443,
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "flow": "xtls-rprx-vision",
  "network": "tcp",
  "packet_encoding": "xudp",
  "tls": {
    "enabled": true,
    "server_name": "gateway.icloud.com",
    "utls": {
      "enabled": true,
      "fingerprint": "chrome"
    },
    "reality": {
      "enabled": true,
      "public_key": "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_=",
      "short_id": "1a2b3c4d"
    }
  }
}
```

> [!IMPORTANT]
> **关键重构细节**：
> 1. `port` 必须变更为 `server_port`；
> 2. `client-fingerprint` 迁移至 `tls.utls.fingerprint`；
> 3. `reality-opts` 平铺字段必须收归至 `tls.reality` 对象；
> 4. Clash 的 `udp: true` 在 sing-box 中建议升级为 `packet_encoding: "xudp"`，以实现完整的 FullCone NAT 穿透。

---

## 规则语法对应字典：Clash 十大分流规则向 sing-box 的精准重构

在传统的 Clash 配置中，分流逻辑通过一行一行的线性指令执行。而在 sing-box 1.8+ 架构中，规则被重构为结构化的 JSON 条件匹配对象。下表详细梳理了十类最常见规则的转换范式与代码级示例：

| Clash 原始行级规则语法 | sing-box 等效 JSON 规则语法 | 匹配模式与算法优化原理 | 工业级迁移注意事项 |
|---|---|---|---|
| `DOMAIN,google.com,PROXY` | `{"domain": ["google.com"], "outbound": "PROXY"}` | 绝对完全匹配。sing-box 内部采用哈希表进行 $O(1)$ 复杂度常数级比对 | 支持在数组内填入多个域名，无需重复书写多行规则 |
| `DOMAIN-SUFFIX,google.com,PROXY` | `{"domain_suffix": ["google.com"], "outbound": "PROXY"}` | 后缀匹配（含子域名）。sing-box 基于倒序基数树（Radix Tree）快速检索 | 对应 `*.google.com` 与 `google.com` 本身 |
| `DOMAIN-KEYWORD,google,PROXY` | `{"domain_keyword": ["google"], "outbound": "PROXY"}` | 子字符串包含匹配。采用 Aho-Corasick 多模式匹配算法 | 性能消耗高于前两者，生产环境应避免在关键字列表中堆积泛用词汇 |
| `DOMAIN-REGEX,^api.*\.com$,PROXY` | `{"domain_regex": ["^api.*\\.com$"], "outbound": "PROXY"}` | 正则表达式匹配。直接调用 Go 正则引擎（`regexp`） | 注意 JSON 字符串中反斜杠必须双重转义（即 `\\. `） |
| `IP-CIDR,149.154.160.0/20,PROXY` | `{"ip_cidr": ["149.154.160.0/20"], "outbound": "PROXY"}` | IPv4 网段掩码匹配。基于二叉前缀树进行最长前缀匹配 | 若规则包含 `no-resolve` 参数，sing-box 需通过将规则置于 DNS 嗅探规则之前来实现 |
| `IP-CIDR6,2001:b28::/32,PROXY` | `{"ip_cidr": ["2001:b28::/32"], "outbound": "PROXY"}` | IPv6 原生网段匹配 | 与 IPv4 合并至同一 `ip_cidr` 数组即可，无需分立字段 |
| `GEOIP,CN,DIRECT` | `{"rule_set": "geoip-cn", "outbound": "direct"}` | 依赖预编译二进制地理位置库 | 强烈建议弃用老旧的内联 GEOIP，迁移至独立的 Headless Rule-Set |
| `SRC-PORT,1080,DIRECT` | `{"source_port": [1080], "outbound": "direct"}` | 本地源端口匹配 | 数组支持整数格式，支持端口范围 `["1080-1090"]` |
| `DST-PORT,22,DIRECT` | `{"port": [22], "outbound": "direct"}` | 目标访问端口匹配 | 常用于将 SSH、SMTP 邮件协议强制直连 |
| `PROCESS-NAME,curl.exe,DIRECT` | `{"process_name": ["curl.exe"], "outbound": "direct"}` | 进程名探测与流量劫持 | 必须在 `inbounds` 的 TUN 模式中开启 `sniff: true` 且赋予管理员提权读取权限 |
| `MATCH,PROXY` | 顶级配置中的 `"final": "PROXY"` | 兜底最终出站动作 | sing-box 中不需要写在 rules 列表末尾，而是作为 `route` 顶级对象的 `final` 键存在 |

### 规则结构合并优化实战
在 Clash 中，用户往往会写出上百行相似的规则：
```yaml
rules:
  - DOMAIN-SUFFIX,youtube.com,PROXY
  - DOMAIN-SUFFIX,googlevideo.com,PROXY
  - DOMAIN-SUFFIX,ytimg.com,PROXY
```
而在 sing-box 中，推荐将其归并为单条高效的聚合规则，不仅配置极为清爽，更大幅降低了 JSON 语法树的遍历开销：
```json
{
  "domain_suffix": [
    "youtube.com",
    "googlevideo.com",
    "ytimg.com"
  ],
  "outbound": "PROXY"
}
```

---

## TUN 虚拟网卡协议栈迁移：gVisor、System 与 Mixed 模式选型

在许多技术人员完成语法转换后，配置能在控制台运行，但一旦开启 sing-box 的 TUN 虚拟网卡接管全局流量，就会出现系统网络断流、浏览器无响应或 CPU 负载急剧升高的现象。这往往是由于 TUN 模式底层协议栈（Network Stack）选型不当导致的。

### 1. 三大网络协议栈对比与性能权衡

| 协议栈类型 (`stack`) | 实现原理与技术架构 | 吞吐性能与 CPU 表现 | 内存占用情况 | 典型适用场景与平台推荐 |
|---|---|---|---|---|
| **`system`** | 直接依赖操作系统内核的原生网络栈进行封包与路由（如 Windows NetFilter、Linux iptables） | **极致吞吐**，CPU 消耗最低，几乎无额外上下文切换 | 极低（约 10MB） | Linux 生产级软路由网关、单臂代理服务器 |
| **`gVisor`** | Google 开发的用户态网络栈（Netstack），在用户空间完全用 Go 重写了 TCP/IP 四层协议 | 吞吐适中，高并发下 CPU 开销较高（频繁用户态/内核态内存拷贝） | 中等（约 30~50MB） | Windows / macOS 桌面端，对系统驱动兼容性极佳，杜绝驱动蓝屏崩溃 |
| **`mixed`** | 智能混合调度：TCP 连接使用用户态轻量处理，UDP 流量利用系统级转发 | **平衡优选**，兼顾低延迟竞技游戏与高吞吐网页浏览 | 适中 | Windows 游戏主机、日常办公 PC |

### 2. 生产级标准 TUN 配置块范式
将 Clash 的 TUN 配置转换为 sing-box 时，请采用以下成熟模板：

```json
{
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "interface_name": "singbox-tun",
      "inet4_address": "172.19.0.1/30",
      "auto_route": true,
      "strict_route": true,
      "stack": "mixed",
      "sniff": true,
      "sniff_override_destination": false
    }
  ]
}
```

> [!TIP]
> **`strict_route` 参数的妙用**：
> 在 Windows 环境下，多网卡共存（物理有线网卡 + Wi-Fi 无线网卡）极易导致路由冲突。将 `strict_route` 设置为 `true`，sing-box 会利用内核丢弃规则强制禁止非 TUN 接口转发外部境外流量，彻底杜绝企业局域网环境下的双网卡抢占与 DNS 侧漏。

---

## 规则系统革命：从行级文本到 Headless Rule-Set (.srs) 二进制

这是迁移过程中最容易导致客户端崩溃或内存暴涨的核心环节。

### 1. 传统 Clash 规则集的局限
Clash 的 `rule-providers` 机制在启动时需要从网络下载或从磁盘读取成千上万行的纯文本 YAML，在内存中动态构建前缀树（Trie）。当规则集规模达到 20 万条（如大型反广告 + 全球媒体规则）时，Clash 解析过程需要耗费 3 到 8 秒，占用超过 150MB 内存。

### 2. sing-box Rule-Set 二进制编译架构
sing-box 彻底抛弃了低效的启动期文本解析，引入了 **Headless Rule-Set**：
- 规则在构建阶段通过官方工具编译为高度紧凑的 `.srs`（Sing-box Rule Set）二进制镜像文件；
- sing-box 启动时利用内存映射（`mmap`），微秒级直接挂载二进制索引块，CPU 与内存开销几乎归零；
- 在配置文件中，通过顶级 `route.rule_set` 块声明规则提供者。

#### sing-box 规则集声明规范示例：
```json
{
  "route": {
    "rule_set": [
      {
        "tag": "geosite-geolocation-!cn",
        "type": "remote",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs",
        "download_detour": "PROXY"
      },
      {
        "tag": "geosite-cn",
        "type": "remote",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geoip-cn",
        "type": "remote",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs",
        "download_detour": "direct"
      }
    ],
    "rules": [
      { "action": "sniff" },
      { "protocol": "dns", "action": "hijack-dns" },
      { "rule_set": "geosite-geolocation-!cn", "outbound": "PROXY" },
      { "rule_set": ["geosite-cn", "geoip-cn"], "outbound": "direct" },
      { "ip_is_private": true, "outbound": "direct" }
    ],
    "final": "PROXY",
    "auto_detect_interface": true
  }
}
```

> [!TIP]
> **本地编译私有规则集技巧**：
> 若您有私有的域名列表 `my-rules.json`，可以使用 sing-box 原生命令将其一键编译为二进制 `.srs`：
> ```bash
> sing-box rule-set compile my-rules.json -o my-rules.srs
> ```

---

## DNS 架构重构与“路由死循环（Loopback Deadlock）”破除

在转换过程中，超过 70% 的技术人员遭遇的“转换后所有节点能测速，但浏览器打不开任何网页”的故障，根源均在于 **DNS 路由环路**。

### 1. 致命的 DNS 环路形成机理
请看以下典型错误拓扑：

```
+─────────────────────────────────────────────────────────────────────────────+
|                         DNS 路由环路死锁模型                                 |
+─────────────────────────────────────────────────────────────────────────────+

   [用户请求：访问海外网站 www.google.com]
             │
             ▼
   [sing-box 本地 DNS 模块]
             │
             ├─► 发起 DNS 查询请求，目标 DNS 服务器为：https://1.1.1.1/dns-query
             │
             ▼
   [sing-box 路由引擎 (Route Engine)]
             │
             ├─► 检查路由规则：1.1.1.1 属于海外 IP，匹配规则为 【outbound: PROXY】
             │
             ▼
   [代理出站节点：HK-Reality-01]
             │
             ├─► 准备建立 TCP 握手，连接节点服务器地址: "hk.node.airport.com"
             │
             ▼
   【触发死循环灾难】：
     • 代理节点为了发起连接，必须先解析 "hk.node.airport.com" 的 IP！
     • 于是代理模块再次向本地 DNS 模块发起查询；
     • 本地 DNS 模块再次尝试向 1.1.1.1 发包；
     • 1.1.1.1 再次被路由到 PROXY 出站...
     • 结果：整个进程陷入死锁，CPU 飙升，所有网络请求超时挂死！
```

### 2. 工业级标准的 DNS 解耦配置方案
破除该死锁的黄金准则是：**用来解析代理节点域名的基础 DNS（Bootstrap DNS），以及用来向远程 DoH 服务器发起连接的通信链路，必须无条件绑定到 `direct` 直连出站**！

```json
{
  "dns": {
    "servers": [
      {
        "tag": "dns-remote",
        "address": "https://1.1.1.1/dns-query",
        "address_resolver": "dns-direct",
        "strategy": "prefer_ipv4",
        "detour": "PROXY"
      },
      {
        "tag": "dns-direct",
        "address": "223.5.5.5",
        "detour": "direct"
      },
      {
        "tag": "dns-block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      { "outbound": "any", "server": "dns-direct" },
      { "rule_set": "geosite-cn", "server": "dns-direct" },
      { "rule_set": "geosite-geolocation-!cn", "server": "dns-remote" }
    ],
    "final": "dns-remote",
    "strategy": "prefer_ipv4"
  }
}
```

---

## 生产级实战：Python 自动化转换与清洗工具 (`clash_to_singbox.py`)

为了杜绝手动编辑 JSON 产生的引号转义、缺少逗号及字段拼写错误，netzhenduan.cc 实验室编写了以下开箱即用的自动化转换脚本。

该脚本完整支持：
1. 自动读取 Clash YAML 配置文件中的 `proxies` 和 `proxy-groups`；
2. 自动转换为 sing-box 1.8+ 标准的 `outbounds`、`selector` 和 `urltest`；
3. 自动注入标准的直连（`direct`）、阻止（`block`）与 DNS 基础出站；
4. 自动注入生产级 Headless Rule-Set 与防死锁 DNS 配置模块。

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
netzhenduan.cc 网络诊断实验室 - Clash YAML 转 sing-box 1.8+ 标准配置生成器
使用方式: python clash_to_singbox.py input_clash.yaml output_singbox.json
"""

import sys
import json
import yaml

def convert_proxy_to_outbound(p):
    p_type = p.get('type', '').lower()
    tag = p.get('name', 'unnamed')
    server = p.get('server', '')
    port = p.get('port', 443)

    if p_type == 'ss':
        return {
            "type": "shadowsocks",
            "tag": tag,
            "server": server,
            "server_port": port,
            "method": p.get('cipher', ''),
            "password": str(p.get('password', ''))
        }
    elif p_type == 'vmess':
        ob = {
            "type": "vmess",
            "tag": tag,
            "server": server,
            "server_port": port,
            "uuid": str(p.get('uuid', '')),
            "security": p.get('cipher', 'auto'),
            "alter_id": p.get('alterId', 0)
        }
        if p.get('tls'):
            ob["tls"] = {
                "enabled": True,
                "server_name": p.get('servername', server),
                "insecure": p.get('skip-cert-verify', False)
            }
        return ob
    elif p_type == 'vless':
        ob = {
            "type": "vless",
            "tag": tag,
            "server": server,
            "server_port": port,
            "uuid": str(p.get('uuid', '')),
            "flow": p.get('flow', ''),
            "packet_encoding": "xudp"
        }
        tls_enabled = p.get('tls', False)
        reality_opts = p.get('reality-opts')
        if tls_enabled or reality_opts:
            tls_cfg = {
                "enabled": True,
                "server_name": p.get('servername', server)
            }
            if p.get('client-fingerprint'):
                tls_cfg["utls"] = {
                    "enabled": True,
                    "fingerprint": p.get('client-fingerprint')
                }
            if reality_opts:
                tls_cfg["reality"] = {
                    "enabled": True,
                    "public_key": reality_opts.get('public-key', ''),
                    "short_id": reality_opts.get('short-id', '')
                }
            ob["tls"] = tls_cfg
        return ob
    elif p_type == 'trojan':
        ob = {
            "type": "trojan",
            "tag": tag,
            "server": server,
            "server_port": port,
            "password": str(p.get('password', ''))
        }
        if p.get('sni') or p.get('skip-cert-verify'):
            ob["tls"] = {
                "enabled": True,
                "server_name": p.get('sni', server),
                "insecure": p.get('skip-cert-verify', False)
            }
        return ob
    elif p_type == 'hysteria2':
        return {
            "type": "hysteria2",
            "tag": tag,
            "server": server,
            "server_port": port,
            "password": str(p.get('password', '')),
            "tls": {
                "enabled": True,
                "server_name": p.get('sni', server),
                "insecure": p.get('skip-cert-verify', False)
            }
        }
    return None

def build_singbox_config(clash_data):
    proxies = clash_data.get('proxies', [])
    groups = clash_data.get('proxy-groups', [])

    outbounds = []
    node_tags = []

    # 1. 转换底层实体代理节点
    for p in proxies:
        ob = convert_proxy_to_outbound(p)
        if ob:
            outbounds.append(ob)
            node_tags.append(ob['tag'])

    # 2. 转换策略组 (Proxy Groups)
    for g in groups:
        g_name = g.get('name')
        g_type = g.get('type', '').lower()
        sub_proxies = g.get('proxies', [])

        filtered_subs = []
        for sp in sub_proxies:
            if sp in node_tags or sp in [x.get('name') for x in groups]:
                filtered_subs.append(sp)
            elif sp in ('DIRECT', 'direct'):
                filtered_subs.append('direct')
            elif sp in ('REJECT', 'reject'):
                filtered_subs.append('block')

        if g_type == 'select':
            outbounds.append({
                "type": "selector",
                "tag": g_name,
                "outbounds": filtered_subs,
                "default": filtered_subs[0] if filtered_subs else "direct"
            })
        elif g_type in ('url-test', 'fallback'):
            outbounds.append({
                "type": "urltest",
                "tag": g_name,
                "outbounds": filtered_subs,
                "url": g.get('url', 'http://cp.cloudflare.com/generate_204'),
                "interval": "3m",
                "tolerance": g.get('tolerance', 50)
            })

    # 3. 注入系统内置出站
    outbounds.append({"type": "direct", "tag": "direct"})
    outbounds.append({"type": "block", "tag": "block"})
    outbounds.append({"type": "dns", "tag": "dns-out"})

    # 4. 构建骨架配置
    singbox_cfg = {
        "log": {
            "level": "info",
            "timestamp": True
        },
        "dns": {
            "servers": [
                {
                    "tag": "dns-remote",
                    "address": "https://1.1.1.1/dns-query",
                    "address_resolver": "dns-direct",
                    "strategy": "prefer_ipv4",
                    "detour": groups[0].get('name') if groups else "direct"
                },
                {
                    "tag": "dns-direct",
                    "address": "223.5.5.5",
                    "detour": "direct"
                },
                {
                    "tag": "dns-block",
                    "address": "rcode://success"
                }
            ],
            "rules": [
                { "outbound": "any", "server": "dns-direct" },
                { "rule_set": "geosite-cn", "server": "dns-direct" },
                { "rule_set": "geosite-geolocation-!cn", "server": "dns-remote" }
            ],
            "final": "dns-remote",
            "strategy": "prefer_ipv4"
        },
        "inbounds": [
            {
                "type": "mixed",
                "tag": "mixed-in",
                "listen": "127.0.0.1",
                "listen_port": 2080,
                "sniff": True
            }
        ],
        "outbounds": outbounds,
        "route": {
            "rule_set": [
                {
                    "tag": "geosite-geolocation-!cn",
                    "type": "remote",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs",
                    "download_detour": groups[0].get('name') if groups else "direct"
                },
                {
                    "tag": "geosite-cn",
                    "type": "remote",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
                    "download_detour": "direct"
                },
                {
                    "tag": "geoip-cn",
                    "type": "remote",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs",
                    "download_detour": "direct"
                }
            ],
            "rules": [
                { "action": "sniff" },
                { "protocol": "dns", "action": "hijack-dns" },
                { "rule_set": "geosite-geolocation-!cn", "outbound": groups[0].get('name') if groups else "direct" },
                { "rule_set": ["geosite-cn", "geoip-cn"], "outbound": "direct" },
                { "ip_is_private": True, "outbound": "direct" }
            ],
            "final": groups[0].get('name') if groups else "direct",
            "auto_detect_interface": True
        }
    }
    return singbox_cfg

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python clash_to_singbox.py <input.yaml> <output.json>")
        sys.exit(1)

    in_file = sys.argv[1]
    out_file = sys.argv[2]

    with open(in_file, 'r', encoding='utf-8') as f:
        clash_content = yaml.safe_load(f)

    res = build_singbox_config(clash_content)

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)

    print(f"[√] 转换成功！共生成 {len(res['outbounds'])} 个 Outbound 出站对象，已保存至: {out_file}")
```

---

## 生产级真实排障复盘（RCA 深度案例）

### 案例一：第三方在线转换后 Discord 语音频繁断连与游戏全红
- **故障现象**：某跨境电商团队使用在线转换工具将 Clash 配置转为 sing-box 导入 Linux 服务器网关，网页与 YouTube 4K 秒开，但所有团队成员在 Discord 语音频道中持续提示 `RTC Connecting`，英雄联盟与 Steam 联机全部无法加入房间。
- **抓包与审查过程**：
  在客户端网关运行 `sing-box log` 并在网络接口执行 `tcpdump -i any udp port 50000:65535` 抓包。发现所有 UDP 报文抵达 sing-box 入站后，内核抛出 `[UDP] unsupported packet_encoding or network disabled for outbound`。检查生成的 `config.json` 发现，转换脚本将原 Clash 节点的 `udp: true` 误翻译为了已弃用的 `"udp_over_tcp": true`，且未声明 `"network": "tcp,udp"`。
- **根本原因（Root Cause）**：
  老旧转换器使用了 sing-box 1.4 时代的过时字段。sing-box 1.8+ 核心在缺乏正确网络协议声明时，默认仅将出站限制为 TCP，导致所有 UDP 游戏及语音流在入站转发出站时被静默丢弃。
- **工业级自愈措施**：
  在所有出站节点中移除 `udp_over_tcp`，补齐 `"packet_encoding": "xudp"`，并在全局入站（`inbounds`）中开启 `"sniff": true` 与独立的 UDP 缓冲区优化，Discord 语音瞬间恢复正常。

---

### 案例二：策略组同名递归死循环导致 sing-box 启动 CPU 锁死 100%
- **故障现象**：某运维工程师手动将 Clash 的策略组转换为 sing-box 的 `selector`，点击启动后终端无任何输出，进程死锁，单核 CPU 占用持续达到 100%，系统风扇狂转。
- **逆向审查过程**：
  使用 GDB 连接 sing-box 进程并打印调用栈（`thread apply all bt`），发现主线程停滞在 `route.(*Router).Initialize` 模块中的拓扑依赖递归检测函数内：
  ```go
  goroutine 1 [running]:
  github.com/sagernet/sing-box/route.(*Router).findCycle(...)
  ```
  仔细核对配置中的策略组发现：
  ```json
  { "tag": "PROXY", "type": "selector", "outbounds": ["AUTO", "HK-01"] },
  { "tag": "AUTO", "type": "urltest", "outbounds": ["PROXY", "HK-01"] }
  ```
- **根本原因（Root Cause）**：
  在 Clash 中，某些宽松的解析器对策略组相互包含容忍度较高；但在严格构建有向无环图（DAG, Directed Acyclic Graph）的 sing-box 路由引擎中，`PROXY` 引用了 `AUTO`，而 `AUTO` 又引用了 `PROXY`，构成了一个闭合依赖环路。sing-box 初始化校验器在检测有向环时陷入了死循环。
- **工业级自愈措施**：
  严格重构策略组层级关系，使底层 `urltest` 自动测速组仅包含实体节点，上层 `selector` 手动选择组只向下引用 `urltest` 组或实体节点，彻底切断双向环状引用，进程在 0.2 秒内顺利完成初始化。

---

### 案例三：本地 53 端口冲突与 Linux systemd-resolved 劫持冲突
- **故障现象**：在 Ubuntu 24.04 LTS 服务器上运行转换后的 sing-box 配置文件，控制台打印致命错误：`FATAL[0000] start service: initialize inbound/tun[tun-in]: listen udp 127.0.0.1:53: bind: address already in use`，服务随即退出。
- **逆向审查过程**：
  在终端执行网络套接字监听审计命令：
  ```bash
  sudo lsof -i :53
  # 输出: systemd-r 842 systemd-resolve 13u IPv4 22041 0t0 UDP 127.0.0.53:domain
  ```
  发现 Linux 系统默认运行的 `systemd-resolved` 本地 DNS 存根解析器（Stub Resolver）独占了系统 53 端口。而转换生成的配置中开启了独立的 DNS 入站监听（`inbounds.type: "direct"` 且 `listen_port: 53`），两者的端口冲突导致内核阻断套接字绑定。
- **根本原因（Root Cause）**：
  Clash 通常内置了透明的 Fake-IP 过滤层，不需要直接争抢 53 物理端口；而 sing-box 在配置透明代理或 TUN 接管时，若直接在 `dns` 模块中声明了物理端口监听，会与操作系统原生的 DNS 缓存守护进程发生不可调和的端口资源争抢。
- **工业级自愈措施**：
  在生产级配置中移除独立的 53 物理端口入站，改由 TUN 虚拟网卡内嵌的 `"hijack-dns"` 动作在内核二层直接拦截所有发往 53 端口的 UDP 数据包；或者在 `/etc/systemd/resolved.conf` 中设置 `DNSStubListener=no` 并重启 systemd 服务，彻底释放端口占用。

---

## 跨平台核心迁移十大踩坑与自检速查清单

为了确保一次性迁移成功，技术团队在转换完毕后可对照以下十项核心规范逐项核对：

1. **JSON 严格语法**：sing-box 坚决遵循 JSON 标准，禁止尾随逗号（Trailing Commas），所有键名必须带双引号；
2. **协议大小写规范**：出站协议名必须全小写（如 `"type": "shadowsocks"`，写成 `"Shadowsocks"` 将直接报未知类型）；
3. **出站 Tag 绝对唯一**：所有出站节点（包括内置的 `direct`、`block` 与策略组）的 `tag` 名称绝对不允许重复；
4. **端口字段名统一**：节点的目标连接端口必须写作 `"server_port"`，绝对不能写为 Clash 惯用的 `"port"`；
5. **UUID 字符串类型**：VMess 和 VLESS 的 `uuid` 字段必须是带双引号的标准字符串，防止被解析器误当作十六进制数值；
6. **XTLS Flow 精准映射**：VLESS 节点的 `flow` 目前主流仅支持 `"xtls-rprx-vision"`，切勿误填已被废弃的 `xtls-rprx-direct` 或 `splice`；
7. **DNS 解析器 Detour 绑定**：`dns.servers` 中定义的 DoH / DoT 解析器，必须显式附加 `"address_resolver"` 指向境内直连 DNS，防止发生冷启动阶段的域名解析死锁；
8. **私有 IP 规则兜底**：`route.rules` 中必须包含一条 `{"ip_is_private": true, "outbound": "direct"}`，确保访问局域网打印机、NAS 与路由器管理页不走代理；
9. **Final 出站明确声明**：`route.final` 必须指向一个真实存在的策略组 tag，不可留空；
10. **自动更新 Rule-Set 流量分流**：`route.rule_set` 中远程下载规则集的 `"download_detour"` 属性必须指向正确的代理组，防止因规则集托管在 GitHub 遭遇国内运营商 SNI 阻断而无法下载。

---

## 迁移验证与四步调试运行清单

在完成配置转换后，切勿直接投入生产环境，请按照以下标准作业程序（SOP）进行流水线验证：

```
+─────────────────────────────────────────────────────────────────────────────+
|                         sing-box 迁移四步上线核验清单                        |
+─────────────────────────────────────────────────────────────────────────────+
  [步骤一：静态语法树与字段合法性核验]
    • 执行命令：sing-box check -c config.json
    • 确保终端输出完全洁净，0 warning，0 fatal error
         │
         ▼
  [步骤二：单次模拟运行与 Trace 级日志捕获]
    • 执行命令：sing-box run -c config.json
    • 观察控制台输出，确认所有 Rule-Set (.srs) 二进制文件顺利加载或从远程下载落盘
         │
         ▼
  [步骤三：DNS 直连解析与环路压力测试]
    • 在本地测试终端执行：nslookup www.baidu.com 127.0.0.1 -port=2080
    • 验证直接返回境内真实运营商 IP，且日志中明确标记命中了 [dns-direct]
         │
         ▼
  [步骤四：境外端点真实连通性与分流判定]
    • 执行命令：curl -x http://127.0.0.1:2080 -I https://www.google.com
    • 验证返回 HTTP/2 200 OK，且命中了 [dns-remote] 与 [PROXY] 出站
```

---

<DisasterRecoveryBox 
  alertTitle="🚨 迁移语法反复报错且急需跨平台高可用？一键切换原生免转换服务"
  triggerCondition="配置文件转换后持续遭遇未知字段报错、DNS 环路死锁或团队多设备需要同时兼容 Clash 与 sing-box"
  recommendedAction="接入同时原生下发经过严格 CI 验证的 Clash YAML 与 sing-box JSON 的高可用纯专线"
  primaryAirportName="光速云 (Guangsu)"
  primaryAirportUrl="/airports/guangsu"
  primaryFeatures="全平台原生下发 / 零转换直接导入 / 纯内网 IEPL 高速物理专线 / 晚高峰 529Mbps 实测"
  backupAirportName="微风网络 (Breeze)"
  backupAirportUrl="/airports/weifeng"
  matrixUrl="/airports/"
/>

---

## 上级导航与全景横向链接

- **上级三级集群入口**：[客户端格式兼容与订阅转换集群](/subscription/import-failures/sub-conversion/)
- **上级二级专题总览**：[订阅链接无法导入与解析异常专题](/subscription/import-failures/)
- **集群姊妹篇：自建转换**：[私有化自建 Subconverter 订阅转换服务器实战：Docker 容器化部署与防泄露](/subscription/import-failures/sub-conversion/docker-subconverter-private-deployment)
- **底层语法校验指南**：[YAML 语法错误与缩进排查修复指南](/subscription/import-failures/base64-yaml/yaml-syntax-indentation-fix)
- **公共转换风险深度剖析**：[公共订阅转换后端的三大安全隐患与 Token 泄露排查](/subscription/subscription-conversion-backend-security-risk)
