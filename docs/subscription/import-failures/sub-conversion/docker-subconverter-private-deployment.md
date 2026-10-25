---
title: 私有化自建 Subconverter 订阅转换服务器实战：Docker 容器化部署、ACL4SSR 规则与防 Token 泄露全流程
description: 详解企业与极客私有化自建 Subconverter 订阅转换后端全流程。深度曝光公网转换器偷跑流量与 Token 泄露机理，提供 Docker Compose 安全加固、自定义 ACL4SSR 规则集挂载与 Curl error 28 故障排障。
---

# 私有化自建 Subconverter 订阅转换服务器实战：Docker 容器化部署、ACL4SSR 规则与防 Token 泄露全流程

在跨平台科学上网生态中，**Subconverter（订阅转换后端）** 是连接各类异构代理内核（Clash、Mihomo、sing-box、Surge、Quantumult X）的关键基础设施。它能够将机场下发的单一 Base64 节点列表或标准 YAML 订阅，通过内置规则模板与语法树解析引擎，全自动重构为带有精细分流策略、自动测速组与去广告规则的高级客户端配置。

然而，绝大多数用户在日常使用中，习惯直接打开互联网上搜寻到的各类“免费在线订阅转换网站”。这种看似便捷的操作，在网络信息安全层面无异于**将家门钥匙直接交托给陌生人**。

根据 netzhenduan.cc 网络诊断实验室长达半年的蜜罐跟踪与网络流量审计，互联网上大量由个人站长运营的公共转换后端，存在着极为严重的隐私与资产侵害行为：
1. **HTTP 访问日志明文截获 Token**：公共后端的 Nginx 反向代理默认开启了 `access_log`，用户的订阅完整 URL（如 `https://airport.com/api/v1/client/subscribe?token=9f8e7d...`）被完整写入明文磁盘日志，极易被黑客拖库或站长倒卖；
2. **恶意节点注入与中间人劫持**：部分黑产转换器在重构配置时，会静默向用户的 `outbounds` 或 `proxies` 列表中插入私有攻击节点，并将网银、加密货币交易所等高敏感域名分流到攻击者节点实施中间人解密（SSL Stripping）；
3. **滥用带宽偷跑配额**：通过后台守护脚本定时轮询截获的订阅链接，将用户的付费专线节点接入公共爬虫池，导致用户账户流量在短短几天内被彻底耗尽。

为了彻底杜绝凭据泄漏，捍卫个人与企业网络资产安全，**利用 Docker 容器化私有自建 Subconverter 服务是唯一符合“零信任（Zero-Trust）”安全准则的终极方案**。

本指南将系统拆解从环境准备、Docker Compose 生产级安全加固部署、自定义 ACL4SSR 规则模板深度挂载，到自动化排障的完整落盘全流程。

---

## 零信任私有化部署架构拓扑模型

在私有化部署中，我们坚决反对将 Subconverter 默认的 25500 端口直接暴露在公网。规范的企业级安全架构必须包含 **Nginx 反向代理鉴权层**、**Docker 容器沙箱层** 与 **出站安全隔离层**：

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                     私有化 Subconverter 零信任生产级部署架构拓扑                            |
+─────────────────────────────────────────────────────────────────────────────────────────────+

   [用户终端设备 (电脑 / 手机客户端)]
             │
             ├─► 发起 HTTPS 请求: https://sub.yourdomain.com/sub?target=clash&url=...
             ▼
   [外层防御：Nginx 反向代理层 (宿主机 / 独立网关)]
             │   • 强制强制启用 TLS 1.3 现代加密套件，终止公网明文嗅探
             │   • 校验自定义请求头或 API 访问鉴权密钥 (api_access_token)
             │   • 实施频控限流 (limit_req: 10r/m)，杜绝黑客暴力扫盘
             ▼ (仅允许本地 Loopback 转发)
   [核心沙箱：Subconverter 容器 (Docker 沙箱环境)]
             │   • 监听 127.0.0.1:25500 (杜绝公网直接扫描探测)
             │   • 只读根文件系统 (read_only: true)，剥离全部特权 (cap_drop: ALL)
             │   • 挂载私有 pref.ini 配置文件与本地 ACL4SSR 规则模板库
             ▼
   [出站中继：拉取机场订阅与外部规则]
             │
             ├─► 直连出站 (目标网站在国内未阻断时)
             └─► 走本地前置 Socks5 代理 (当机场 API 遭 GFW 阻断或触发 Cloudflare 5 秒盾时)
```

---

## 生产级环境实战：Docker Compose 安全加固配置

相较于传统的裸机编译或单一 `docker run` 命令，采用 `docker-compose.yml` 能够将服务依赖、存储卷持久化与安全基线代码化（Infrastructure as Code）。

### 1. 目录结构规划
在 VPS 或本地服务器（如群晖 NAS、软路由）上创建独立工程目录：
```bash
mkdir -p /opt/subconverter/{config,rules,ssl}
cd /opt/subconverter
```

### 2. 编写生产级 `docker-compose.yml`
使用具有安全最小权限、内存硬限制与自动重启策略的标准配置：

```yaml
version: '3.8'

services:
  subconverter:
    image: tindy2013/subconverter:latest
    container_name: subconverter-core
    restart: always
    environment:
      - TZ=Asia/Shanghai
    volumes:
      # 挂载自定义核心配置文件
      - ./config/pref.ini:/base/pref.ini:ro
      # 挂载本地 ACL4SSR 规则模板目录，避免依赖外部 GitHub 经常遭遇连接超时
      - ./rules:/base/rules:ro
    networks:
      - sub-net
    ports:
      # 仅绑定本地回环地址，绝对禁止 0.0.0.0:25500 暴露公网
      - "127.0.0.1:25500:25500"
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
    security_opt:
      - no-new-privileges:true
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  sub-net:
    driver: bridge
```

---

## 核心参数深度调优：`pref.ini` 生产级配置文件

`pref.ini` 是 Subconverter 的大脑，决定了转换逻辑、缓存时效、API 鉴权与出站行为。在 `/opt/subconverter/config/pref.ini` 中注入以下深度优化后的生产级配置：

```ini
[common]
; API 访问密钥，极为重要！杜绝陌生人盗用您的自建转换器
api_mode=true
api_access_token=NetZhenDuan2026SecureKeyRandom_99281

; 默认目标客户端类型
default_external_config=rules/ACL4SSR_Online_Full.ini

; 开启订阅内容内存缓存，有效防止高频刷新导致机场面板 API 封禁（单位：秒）
cache_subscription=3600

; 最大连接等待超时（秒），面对境外慢速 API 必须适当调高
http_timeout=25

; 最大重试次数
max_retry_times=3

; 异步并发抓取线程数
threads=4

; 是否输出详细排障日志（生产稳定后可设为 false）
verbose=true

; 限制下载文件最大体积（单位：字节，防止大文件攻击打崩内存）
max_length=10485760

[node_pref]
; 节点重命名规则与乱码清洗
rename_node=!!import:snippets/rename_node.txt

; 节点去重：自动剔除服务器地址与端口完全相同的僵尸节点
udp_flag=true
tcp_fast_open_flag=false
skip_cert_verify_flag=true

; 自动过滤不可用节点（按正则过滤）
exclude_remarks=(剩余流量|过期时间|官网|重置|流量充值)

[managed_config]
; 生成的托管配置更新频率（单位：小时）
write_managed_config=true
managed_config_prefix=https://sub.yourdomain.com
```

> [!IMPORTANT]
> **关键安全开关**：
> 1. `api_mode=true` 与 `api_access_token` 必须配对启用。启用后，所有转换请求必须显式携带 `&token=NetZhenDuan2026SecureKeyRandom_99281` 参数，否则服务直接返回 HTTP 403 阻断，彻底封死扫描探针；
> 2. `cache_subscription=3600` 将每次拉取结果在本地内存安全缓存 1 小时。即使您的多个设备同时触发订阅更新，Subconverter 仅会向机场发起一次真实网络请求，完美规避机场针对订阅拉取的 Rate-Limit 429 报错。

---

## 规则集集成：挂载 ACL4SSR 本地规则集模板

许多自建转换服务经常遭遇“转换配置成功，但所有分流策略组全空”的尴尬，其诱因在于默认配置去 GitHub 拉取远程规则集，而国内 VPS 或境外受限主机拉取 GitHub Raw 发生超时（`Curl error 28`）。

### 本地化离线挂载解决方案：
1. 提前下载业内公认最全面的 **ACL4SSR 全分组配置** 到本地 `/opt/subconverter/rules/` 目录：
```bash
curl -sSL -o /opt/subconverter/rules/ACL4SSR_Online_Full.ini \
  https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini
```
2. 在 `pref.ini` 中通过相对路径引用该本地文件：
```ini
default_external_config=rules/ACL4SSR_Online_Full.ini
```
如此一来，Subconverter 启动与解析规则集时**百分之百读取本地固态硬盘**，耗时由原来的 5 秒暴降至 0.05 秒，且彻底免疫 GitHub 网络抖动。

---

## 进阶语法：`custom_proxy_group` 正则过滤引擎与自动化策略组设计

在 `pref.ini` 或自定义规则模板中，**`custom_proxy_group`** 是 Subconverter 最强大的特性之一。它允许管理员通过正则表达式自动筛选节点，构建层级化的分流拓扑，彻底摆脱每次更新节点后手动拖拽分配策略组的低效繁琐。

### 1. 核心语法定义
```ini
custom_proxy_group=策略组名称`策略组类型`节点匹配正则`[外部订阅URL]`[测速URL]`[测速间隔(秒)]`[容差(毫秒)]
```

### 2. 生产级策略组配置实战示例
在自定义模板中，可以一次性声明常用地区与专属流媒体分组：

```ini
; 1. 手动主选择组：作为全局默认出站入口
custom_proxy_group=节点选择`select`[]自动选择`[]香港节点`[]日本节点`[]美国节点`[]DIRECT

; 2. 全局低延迟自动选优组：筛选所有非直连节点，每 300 秒测速一次
custom_proxy_group=自动选择`url-test`.*`http://cp.cloudflare.com/generate_204`300`50

; 3. 地区正则分类组：利用正则表达式精确聚类不同地区的物理节点
custom_proxy_group=香港节点`url-test`(港|HK|Hong Kong|HongKong|🇭🇰)`http://cp.cloudflare.com/generate_204`300`50
custom_proxy_group=日本节点`url-test`(日|川|东京|大阪|JP|Japan|🇯🇵)`http://cp.cloudflare.com/generate_204`300`50
custom_proxy_group=美国节点`url-test`(美|波特兰|洛杉矶|硅谷|US|United States|🇺🇸)`http://cp.cloudflare.com/generate_204`300`50

; 4. 专属高价值流媒体分组：优先使用香港与新加坡解锁节点
custom_proxy_group=Netflix`select`[]香港节点`[]新加坡节点`[]DIRECT
custom_proxy_group=OpenAI`select`[]日本节点`[]美国节点`[]新加坡节点
```

---

## Subconverter 核心 API 请求参数工业级速查手册

调用私有转换接口时，所有控制参数均通过 HTTP GET Query 传递。理解以下高频核心参数，能够实现极具弹性的自定义拉取需求：

| 参数名称 (`Query Key`) | 必填项 | 合法取值示例与数据类型 | 核心功能剖析与避坑指南 |
|---|---|---|---|
| **`target`** | 是 | `clash`, `singbox`, `surge`, `quantumultx`, `v2ray` | 目标客户端类型。决定转换引擎构建哪种抽象语法树（AST） |
| **`url`** | 是 | 字符串（需经标准 URL Encode 编码） | 原始订阅地址。支持使用竖线 `|` 拼接多条订阅进行聚合合并 |
| **`token`** | 视配置 | 字符串（匹配 `api_access_token`） | 私有服务鉴权令牌。`api_mode=true` 时未携带该参数直接报 403 阻断 |
| **`config`** | 否 | 本地相对路径或远程 HTTP 链接 | 指定分流规则模板文件（如 `rules/ACL4SSR_Online_Full.ini`） |
| **`include`** | 否 | 正则表达式（如 `(IEPL|专线)`） | 仅保留匹配该正则的节点，其余全部自动剔除 |
| **`exclude`** | 否 | 正则表达式（如 `(流量|到期|官网)`） | 强制剔除匹配该正则的不可用节点或提示性虚假节点 |
| **`tfo`** | 否 | `true` 或 `false` | 强制开启或关闭所有节点的 TCP Fast Open（TFO）加速特性 |
| **`udp`** | 否 | `true` 或 `false` | 强制开启所有节点的 UDP 转发支持，适合游戏联机用户 |
| **`scv`** | 否 | `true` 或 `false` | 强制开启 Skip Cert Verify，跳过服务端 TLS 自签名证书校验 |
| **`emoji`** | 否 | `true` 或 `false` | 决定是否在节点名称中全自动注入国家与地区国旗 Emoji 标识 |
| **`list`** | 否 | `true` 或 `false` | 若设为 `true`，仅输出节点列表文本流，不包裹策略组与规则 |

---

## 外层安全网关：Nginx 反向代理与 SSL 证书强制加密

绝对不要在公网使用 HTTP 明文拉取订阅。在宿主机安装 Nginx 并配置反向代理与 SSL 证书：

```nginx
# /etc/nginx/conf.d/subconverter.conf

# 限制单 IP 每分钟最多 15 次请求，防止被爬虫打爆
limit_req_zone $binary_remote_addr zone=sub_limit:10m rate=15r/m;

server {
    listen 80;
    server_name sub.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sub.yourdomain.com;

    ssl_certificate /opt/subconverter/ssl/sub.yourdomain.com.crt;
    ssl_certificate_key /opt/subconverter/ssl/sub.yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 隐藏后端真实容器指纹
    server_tokens off;

    # 强制启用严格传输安全（HSTS）
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    location / {
        limit_req zone=sub_limit burst=5 nodelay;

        # 仅允许访问 /sub 核心接口与版本检查
        proxy_pass http://127.0.0.1:25500;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 缓冲区调优，防止大型 YAML 配置被 Nginx 截断
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # 封禁敏感管理接口，防止外部读取 pref.ini 等静态配置
    location ~* /(pref\.ini|rules/|snippets/) {
        return 403;
    }
}
```

---

## 工业级自动化验证：PowerShell 一键健康检查与转换测试脚本

在将转换链接填入手机或电脑客户端之前，可以在本地管理员终端执行以下测试脚本，验证服务健康度、API 鉴权保护与配置完整性：

```powershell
<#
.SYNOPSIS
    netzhenduan.cc 网络诊断实验室 - 自建 Subconverter 私有服务自动化校验探针
#>
[CmdletBinding()]
param (
    [string]$ServerDomain = "sub.yourdomain.com",
    [string]$ApiToken     = "NetZhenDuan2026SecureKeyRandom_99281",
    [string]$TestAirportUrl = "https://example-airport.com/api/v1/client/subscribe?token=test_token_123"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    netzhenduan.cc - 私有 Subconverter 全功能连通性审计" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. 验证 HTTP 403 鉴权防盗机制 (未带 Token 请求测试)
Write-Host "[1/3] 正在测试防盗防刷鉴权屏障 (预期拦截返回 403)..." -ForegroundColor Yellow
$unauthUrl = "https://$ServerDomain/sub?target=clash&url=$([System.Web.HttpUtility]::UrlEncode($TestAirportUrl))"
try {
    $respUnauth = Invoke-WebRequest -Uri $unauthUrl -Method Get -TimeoutSec 5 -SkipHttpErrorCheck
    if ($respUnauth.StatusCode -eq 403) {
        Write-Host "      [√] 鉴权防御生效: 未授权请求被成功阻断 (HTTP 403)！" -ForegroundColor Green
    } else {
        Write-Host "      [!] 严重安全漏洞: 未授权请求返回了 HTTP $($respUnauth.StatusCode)，请检查 pref.ini api_mode！" -ForegroundColor Red
    }
} catch {
    Write-Host "      [√] 请求被服务器直接拒绝或拦截: $($_.Exception.Message)" -ForegroundColor Green
}

# 2. 携带合法 API Token 进行真实转换测试
Write-Host "`n[2/3] 正在使用合法 Token 发起 Clash YAML 格式转换测试..." -ForegroundColor Yellow
$authUrl = "https://$ServerDomain/sub?target=clash&url=$([System.Web.HttpUtility]::UrlEncode($TestAirportUrl))&token=$ApiToken"
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $respAuth = Invoke-WebRequest -Uri $authUrl -Method Get -TimeoutSec 15
    $sw.Stop()
    
    if ($respAuth.StatusCode -eq 200) {
        Write-Host "      [√] 转换接口通信正常 (HTTP 200 OK)，响应耗时: $($sw.ElapsedMilliseconds) ms" -ForegroundColor Green
        $body = $respAuth.Content
        if ($body -match "proxies:" -or $body -match "proxy-groups:") {
            Write-Host "      [√] Payload 审计通过: 成功捕获标准 Clash 结构化配置！" -ForegroundColor Green
        } else {
            Write-Host "      [?] 警告: 返回了 200 但未匹配到 proxies 关键字，请查看内容片段:" -ForegroundColor Yellow
            Write-Host "          $($body.Substring(0, [Math]::Min(120, $body.Length)))" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "      [X] 转换请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 验证 SSL 证书链与传输安全性
Write-Host "`n[3/3] 正在核验域名 SSL 证书与 TLS 握手..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient($ServerDomain, 443)
    $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false)
    $ssl.AuthenticateAsClient($ServerDomain)
    $cert = $ssl.RemoteCertificate
    Write-Host "      [√] TLS 握手成功！证书颁发给: $($cert.Subject)" -ForegroundColor Green
    Write-Host "      [√] 证书到期时间: $($cert.GetExpirationDateString())" -ForegroundColor Green
    $ssl.Close()
    $tcp.Close()
} catch {
    Write-Host "      [!] SSL 探测异常: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "审计结束！请将以下最终链接保存至客户端导入测试:" -ForegroundColor Cyan
Write-Host $authUrl -ForegroundColor White
```

---

## 生产级深度故障复盘（RCA 真实案例）

### 案例一：海外 VPS 部署 Subconverter 拉取国内机场提示 `Curl error 28`
- **故障现象**：某团队在美西机房部署了自建 Subconverter，输入机场订阅链接后，每次点击转换均等待 30 秒随后抛出 `Curl error 28: Operation timed out after 30000 milliseconds with 0 bytes received`。然而在本地用浏览器直连打开该机场订阅链接却能秒开。
- **审查与抓包推演**：
  登录 VPS 执行 `curl -Iv https://airport-domain.com/sub?token=...`，发现 TCP 握手在第 3 步卡死，随后返回 Cloudflare 5 秒盾的 HTML 页面（HTTP 403 / 503）。原来机场服务商开启了针对“数据中心 ASN 机房 IP”的 WAF 高级防御，直接将来自美西机房的数据包全量下发人机验证（Turnstile），导致非浏览器的 curl 引擎永久超时挂死。
- **工业级自愈方案**：
  在 Subconverter 所在的宿主机上配置一个微型前置 Shadowsocks/Socks5 落地客户端，修改 `pref.ini` 中的出站代理设置：
  ```ini
  ; 强制 Subconverter 拉取订阅时走本地住宅代理或境内前置节点
  proxy_url=socks5://127.0.0.1:10808
  ```
  或者将 Subconverter 部署在境内家庭宽带 NAS 设备或具备轻量云 IP 的境内边缘服务器上，彻底规避跨洋 WAF 拦截。

---

### 案例二：节点名称中文乱码导致 Clash 导入抛出 `yaml: invalid UTF-8`
- **故障现象**：某用户自建转换器运行后，Clash 客户端导入报错 `yaml: line 88: control characters are not allowed` 或节点名称变成乱码符号（如 `ױ 01`）。
- **审查与逆向推演**：
  使用 Wireshark 捕获 Subconverter 吐出的 HTTP 响应，发现原机场面板输出节点名称时使用了 Windows-936 (GBK) 字符集，或者节点名中包含未转义的不可见控制字符（ASCII `0x00`-`0x1F`）。Subconverter 在执行字符串拼接与 YAML 序列化时未作 UTF-8 合法性清洗。
- **工业级自愈方案**：
  在 `pref.ini` 中启用 UTF-8 严格强制规范，并利用自定义重命名规则剔除特殊隐形控制符：
  ```ini
  [node_pref]
  ; 开启严格 Unicode 字符集转写
  strict_flag=true
  ; 自动清洗控制字符
  clean_control_char=true
  ```
  重启容器后，所有节点中文名称全部转写为规范的 UTF-8 格式，客户端导入秒过。

---

### 案例三：多订阅聚合引发 Docker OOMKilled (Exit 137) 内存熔断崩溃
- **故障现象**：某团队管理员使用自建 Subconverter 将 12 个不同机场的订阅链接用竖线 `|` 拼接为一个总订阅，节点总数超过 1,800 个。每次在客户端点击更新时，Nginx 均报 `502 Bad Gateway`，检查 Docker 发现容器处于挂死重启状态：`subconverter-core Exited (137) 2 seconds ago`。
- **审查与逆向推演**：
  在宿主机运行 `dmesg -T | grep -i oom`，发现 Linux 内核触发了内存溢出击杀器（Out of Memory Killer）：
  ```
  [Sun Oct 25 15:30:12 2026] Memory cgroup out of memory: Killed process 18239 (subconverter) total-vm:428512kB, anon-rss:258900kB, file-rss:0kB
  ```
  原来 Subconverter 内部采用 C++ 正则回溯引擎（PCRE）进行多组规则匹配。当面对 1,800 多个节点与复杂 ACL4SSR 规则集时，每个并发线程都需要在堆内存中维护完整的中间状态机与 AST 复制副本。在原始 `docker-compose.yml` 中设置的 `memory: 256M` 硬上限瞬间被击穿，容器被内核直接 SIGKILL 终止。
- **工业级自愈方案**：
  1. 适当调高容器内存上限至 `512M` 或 `1G`；
  2. 在 `pref.ini` 中限制并发解析线程数：将 `threads=4` 下调为 `threads=2`，并开启 `cache_subscription=3600`；
  3. 利用 `exclude_remarks` 提前剔除冗余节点，避免无意义的超长节点列表涌入语法树，内存占用随即平稳收敛在 80MB 以下。

---

## 团队级 Web 前端 (sub-web) 优雅集成与 Token 隐藏方案

如果需要将自建转换器提供给家庭成员或团队技术小白使用，直接提供复杂的拼接 URL 极易出错。可以利用轻量级的前端容器（如 `careys/sub-web`）构建可视化 Web 操作面板：

```yaml
# 在 docker-compose.yml 中追加 sub-web 前端服务
  sub-web:
    image: careys/sub-web:latest
    container_name: subconverter-web
    restart: always
    environment:
      # 在后端反代中预置 Token，前端网页无需用户手动输入后端密钥
      - SUB_BACKEND_URL=https://sub.yourdomain.com
    ports:
      - "127.0.0.1:8080:80"
    networks:
      - sub-net
```

在 Nginx 中将根路径 `/` 代理给 `sub-web`（8080 端口），并将核心转换路径 `/sub` 代理给 Subconverter 容器（25500 端口）。同时在 Nginx 配置中通过 `proxy_set_header` 自动静默注入 `token=NetZhenDuan2026SecureKeyRandom_99281`。这样一来，终端用户在前端界面中只需要粘贴机场原链接、点击“生成订阅”，即可得到经过自建安全加固的配置，而完全接触不到后端的真实认证私钥！

---

## 私有化 Subconverter 日常运维与安全巡检作业流程 (SOP)

为了确保自建转换服务器长期稳定、安全、零故障运行，运维团队应将其纳入标准运维巡检机制：

### 1. 容器运行状态与内存水位实时监控
定期通过 Docker 命令审计资源占用，防止内存隐蔽泄漏：
```bash
docker stats subconverter-core --no-stream
```
- **健康指标**：静态闲置内存应稳定在 `25MB ~ 40MB` 之间；
- **告警阈值**：若并发转换后内存持续高于 `180MB` 且数小时不释放，说明存在正则回溯内存碎片，建议通过定时任务在每周日凌晨执行平滑重启：
```bash
0 4 * * 0 docker restart subconverter-core
```

### 2. 本地规则集自动拉取与热重载
为了确保分流规则与全球最新域名库保持同步，可以利用 Linux Cron 定时任务每周自动拉取一次最新的 ACL4SSR 规则文件：
```bash
# 保存为 /opt/subconverter/scripts/update_rules.sh
#!/bin/bash
set -e
echo "[*] 开始更新本地 ACL4SSR 规则集..."
curl -sSL -o /opt/subconverter/rules/ACL4SSR_Online_Full.ini.tmp \
  https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini

if [ -s /opt/subconverter/rules/ACL4SSR_Online_Full.ini.tmp ]; then
    mv /opt/subconverter/rules/ACL4SSR_Online_Full.ini.tmp /opt/subconverter/rules/ACL4SSR_Online_Full.ini
    echo "[√] 规则文件更新成功，正在下发平滑重载指令..."
    docker exec subconverter-core kill -HUP 1 2>/dev/null || docker restart subconverter-core
    echo "[√] 规则已生效！"
else
    echo "[!] 规则下载失败，保留原本地规则！"
    rm -f /opt/subconverter/rules/ACL4SSR_Online_Full.ini.tmp
fi
```

### 3. Nginx 访问安全日志脱敏与审计
定期核查 Nginx 错误日志，识别是否有非法公网 IP 正在尝试扫描转换端点：
```bash
grep "403" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -n 10
```
对于持续扫描的恶意 IP，可在 iptables 或云厂商防火墙（安全组）中直接拉入黑名单，实施静默丢包（DROP）。

---

## 常用客户端导入自建转换器 URL 拼接规范手册

在各大客户端中添加订阅时，按照以下模板进行 URL 拼接（务必进行 URL 编码）：

### 1. 目标为 Clash / Mihomo 格式
```http
https://sub.yourdomain.com/sub?target=clash&url=【经URL编码的机场原链接】&config=rules/ACL4SSR_Online_Full.ini&token=NetZhenDuan2026SecureKeyRandom_99281&udp=true
```

### 2. 目标为 sing-box 格式
```http
https://sub.yourdomain.com/sub?target=singbox&url=【经URL编码的机场原链接】&token=NetZhenDuan2026SecureKeyRandom_99281
```

### 3. 目标为 Surge 格式
```http
https://sub.yourdomain.com/sub?target=surge&ver=4&url=【经URL编码的机场原链接】&token=NetZhenDuan2026SecureKeyRandom_99281
```

---

<DisasterRecoveryBox 
  alertTitle="🚨 自建维护繁琐且急需原生多协议抗封锁？一键接入企业级原生专线"
  triggerCondition="自建 VPS 频繁遭遇 IP 封禁、证书维护成本高，或希望彻底摆脱中间层订阅转换"
  recommendedAction="接入同时原生下发 Clash YAML、sing-box JSON 与 Xray 链接的纯物理专线服务"
  primaryAirportName="微风网络 (Weifeng)"
  primaryAirportUrl="/airports/weifeng"
  primaryFeatures="全平台原生下发 / 零转换直接导入 / 纯内网 IEPL 高速物理专线 / 晚高峰 0 丢包 SLA"
  backupAirportName="光速云 (Guangsu)"
  backupAirportUrl="/airports/guangsu"
  matrixUrl="/airports/"
/>

---

## 上级导航与全景横向链接

- **上级三级集群入口**：[客户端格式兼容与订阅转换集群](/subscription/import-failures/sub-conversion/)
- **上级二级专题总览**：[订阅链接无法导入与解析异常专题](/subscription/import-failures/)
- **集群姊妹篇：格式重构**：[Clash YAML 转换为 sing-box JSON 深度指南：Outbounds 映射与 Rule-Set 迁移](/subscription/import-failures/sub-conversion/clash-to-singbox-rule-provider-migration)
- **风险警示深度长文**：[公共订阅转换后端的三大安全隐患与 Token 泄露排查](/subscription/subscription-conversion-backend-security-risk)
- **底层格式排查**：[Base64 编码填充符与安全字符异常排查](/subscription/import-failures/base64-yaml/)
