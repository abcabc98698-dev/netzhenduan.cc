---
layout: home

hero:
  name: "netzhenduan.cc"
  text: "科学上网故障排查与网络可观测实验室"
  tagline: "以真实排障为核心：连不上、打不开、节点超时、订阅失败、速度慢全链路深度诊断。"
  image:
    src: /avatar.jpg
    alt: "netzhenduan avatar"
  actions:
    - theme: brand
      text: ⚡ 在线网络探针与日志诊断
      link: /diagnostics/
    - theme: alt
      text: 🛠️ 故障速查库
      link: /issues/

features:
  - title: 🌐 科学上网连接故障排查
    details: 连接成功但打不开网页？节点突然全部超时？系统代理与 DNS 泄漏排查指引。
    link: /issues/connected-but-no-internet
  - title: 📱 主流客户端专属手册
    details: Clash Verge Rev、v2rayN、v2rayNG、Shadowrocket 常见报错代码解码与配置修复。
    link: /clients/
  - title: 📡 机场订阅与鉴权排障
    details: 订阅链接无法导入、更新失败、格式错误与 Base64 解析异常全流程解决方案。
    link: /subscription/import-failed
  - title: 🛡️ 节点可观测性与专线雷达
    details: 丢包率测速图、AI与流媒体解锁矩阵、晚高峰拥堵监控与高可用容灾备用方案。
    link: /airports/
---

<div class="diag-card" style="margin-top: 32px;">
  <h2 style="margin-top: 0; font-size: 20px; color: #38bdf8;">🚨 正在遭遇科学上网网络中断？30 秒快速自检路径</h2>
  <p style="color: #cbd5e1; font-size: 14px;">请根据当前客户端现象点击对应排障流程，按照标准化技术逻辑快速恢复连接：</p>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 16px;">
    <a href="/issues/connected-but-no-internet" style="background: #131d31; border: 1px solid #1e293b; padding: 14px; border-radius: 8px; text-decoration: none; display: block;">
      <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 4px;">🟢 客户端显示已连接，但网页打不开？</div>
      <div style="font-size: 12.5px; color: #94a3b8;">排查系统代理开关、端口占用 (7890/7897)、TUN 模式与本地 DNS 污染。</div>
    </a>
    <a href="/connection/all-nodes-down" style="background: #131d31; border: 1px solid #1e293b; padding: 14px; border-radius: 8px; text-decoration: none; display: block;">
      <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 4px;">🔴 梯子所有节点突然全部超时 (Timeout)？</div>
      <div style="font-size: 12.5px; color: #94a3b8;">排查系统时钟偏差 (90秒原则)、订阅是否过期、国内中转机房封锁或启动容灾备用。</div>
    </a>
    <a href="/subscription/import-failed" style="background: #131d31; border: 1px solid #1e293b; padding: 14px; border-radius: 8px; text-decoration: none; display: block;">
      <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 4px;">📑 机场订阅链接导入失败 / 解析错误？</div>
      <div style="font-size: 12.5px; color: #94a3b8;">解决 YAML 语法错误、Base64 解码异常、ISP 域名阻断与订阅格式转换问题。</div>
    </a>
    <a href="/issues/low-latency-slow-speed" style="background: #131d31; border: 1px solid #1e293b; padding: 14px; border-radius: 8px; text-decoration: none; display: block;">
      <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 4px;">🟡 节点延迟显示很低，但下载速度极慢？</div>
      <div style="font-size: 12.5px; color: #94a3b8;">揭开 ICMP Ping 与真实 TCP 承载差异、晚高峰带宽超售与 QoS 限速排查。</div>
    </a>
  </div>
</div>

<!-- 嵌入交互式探针演示 -->
<NetworkProbe />

<div class="diag-card">
  <h2 style="margin-top: 0; font-size: 18px; color: #f1f5f9;">📡 核心技术专题集群导航</h2>
  <table>
    <thead>
      <tr>
        <th>一级分类</th>
        <th>核心排障与覆盖专题</th>
        <th>典型搜索词覆盖</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong><a href="/issues/">科学上网问题</a></strong></td>
        <td>系统代理冲突、DNS 污染防范、部分网站打不开、代理后国内网站变慢</td>
        <td>科学上网无法连接、连接成功打不开网页、代理后国内网速慢</td>
      </tr>
      <tr>
        <td><strong><a href="/connection/">梯子连不上</a></strong></td>
        <td>节点大面积超时、手机能用电脑连不上、端口拒绝连接、时钟同步</td>
        <td>梯子突然全部连不上、梯子连不上、节点超时怎么办</td>
      </tr>
      <tr>
        <td><strong><a href="/clients/">客户端故障</a></strong></td>
        <td>Clash Verge Rev、v2rayN、v2rayNG、Shadowrocket 常见日志解析</td>
        <td>Clash无法连接、v2rayN连接失败、小火箭连不上</td>
      </tr>
      <tr>
        <td><strong><a href="/subscription/">机场订阅问题</a></strong></td>
        <td>订阅格式不兼容、更新失败、鉴权401/403报错、订阅链接被拦截</td>
        <td>机场订阅失败、订阅无法导入、订阅更新失败</td>
      </tr>
      <tr>
        <td><strong><a href="/diagnostics/">网络诊断</a></strong></td>
        <td>WebRTC IP 泄漏测试、真实出口识别、全球服务连通性探针、单/多线程测速</td>
        <td>网络诊断、IP查询、DNS检查、节点测速</td>
      </tr>
      <tr>
        <td><strong><a href="/airports/">机场推荐</a></strong></td>
        <td>IEPL/IPLC 物理专线与备用容灾方案评测、晚高峰实测数据矩阵、流媒体AI解锁</td>
        <td>稳定机场推荐、备用机场、IEPL专线机场、便宜机场</td>
      </tr>
    </tbody>
  </table>
</div>
