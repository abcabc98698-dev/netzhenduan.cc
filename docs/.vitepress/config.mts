import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '网络诊断实验室',
  titleTemplate: ':title - netzhenduan.cc 科学上网故障排查',
  description: '专注科学上网连不上、节点超时、订阅失败、Clash/v2ray报错等网络故障深度排查，提供在线网络探针、日志诊断与高可用专线备用方案。',
  cleanUrls: true,
  appearance: 'dark',
  sitemap: {
    hostname: 'https://netzhenduan.cc',
    transformItems(items) {
      return items.map((item) => ({
        ...item,
        lastmod: '2026-10-25T18:00:00+08:00',
        changefreq: item.url === '' ? 'daily' : 'weekly',
        priority: item.url === '' ? 1.0 : (item.url.startsWith('airports') || item.url.startsWith('issues') ? 0.9 : 0.8)
      }))
    }
  },
  transformPageData(pageData) {
    const canonicalUrl = `https://netzhenduan.cc/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
    
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'link',
      { rel: 'canonical', href: canonicalUrl }
    ])

    const pageTitle = pageData.title || pageData.frontmatter.title || '网络诊断实验室'
    const pageDesc = pageData.description || pageData.frontmatter.description || '专注科学上网连不上、节点超时、订阅失败、Clash/v2ray报错等网络故障深度排查，提供在线网络探针、日志诊断与高可用专线备用方案。'
    const isHome = pageData.relativePath === 'index.md'

    if (isHome) {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://netzhenduan.cc/#website',
            'url': 'https://netzhenduan.cc/',
            'name': '网络诊断实验室',
            'description': pageDesc,
            'publisher': {
              '@type': 'Organization',
              '@id': 'https://netzhenduan.cc/#organization',
              'name': '网络诊断实验室',
              'url': 'https://netzhenduan.cc/',
              'logo': 'https://netzhenduan.cc/avatar.jpg'
            }
          },
          {
            '@type': 'Organization',
            '@id': 'https://netzhenduan.cc/#organization',
            'name': '网络诊断实验室',
            'url': 'https://netzhenduan.cc/',
            'logo': 'https://netzhenduan.cc/avatar.jpg',
            'description': '专注于网络工程可观测性、BGP Anycast / IEPL 专线质量监测、TLS/QUIC 协议级握手故障排查的专业工程实验机构。'
          }
        ]
      }
      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify(websiteSchema)
      ])
    } else {
      const sectionNameMap: Record<string, string> = {
        'issues': '科学上网故障排查',
        'connection': '梯子连不上排查',
        'clients': '客户端故障排查',
        'subscription': '订阅配置故障',
        'diagnostics': '网络诊断工具',
        'tutorials': '使用教程手册',
        'airports': '机场推荐与选购',
        'free': '免费机场风险评估',
        'about': '关于我们',
        'methodology': '评测方法论',
        'privacy': '隐私政策',
        'terms': '服务条款',
        'disclosure': '推广披露声明',
        'connection-failures': '连接失败专题',
        'timeout-failures': '节点超时专题',
        'handshake-cipher': 'TLS握手与密码套件',
        'streaming-unlock': '流媒体解锁与住宅IP',
        'privacy-security-risks': '安全与隐私风险',
        'mihomo-service': 'Mihomo服务模式',
        'sing-box': 'Sing-box进阶',
        'clash-verge': 'Clash Verge进阶',
        'shadowrocket': '小火箭配置',
        'surge': 'Surge高级策略',
        'clash-meta': 'Clash Meta配置',
        'v2rayn': 'v2rayN指南',
        'v2rayng': 'v2rayNG指南',
        'sub-store': 'Sub-Store配置',
        'yaml-syntax': 'YAML语法修复',
        'security-certs': '安全证书排障',
        'native-ip-audit': '原生IP审计',
        'mitm-sniffing': '流量嗅探分析',
        'ntp-relay': 'NTP时钟与机房链路',
        'gfw-sni-blocking': 'SNI阻断与端口跳跃',
        'tls13-alpn': 'TLS1.3与ALPN协商'
      }

      const pathParts = pageData.relativePath.replace(/\.md$/, '').split('/').filter(Boolean)
      const breadcrumbItems: any[] = [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': '首页',
          'item': 'https://netzhenduan.cc/'
        }
      ]
      let currentPath = 'https://netzhenduan.cc'
      pathParts.forEach((part, index) => {
        if (part === 'index') return
        currentPath += `/${part}`
        const isLast = index === pathParts.length - 1 || (index === pathParts.length - 2 && pathParts[pathParts.length - 1] === 'index')
        const friendlyName = isLast ? pageTitle : (sectionNameMap[part] || part)
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': breadcrumbItems.length + 1,
          'name': friendlyName,
          'item': currentPath
        })
      })

      const isIndex = pageData.relativePath.endsWith('index.md')
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems
      }

      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': isIndex && pathParts.length <= 1 ? 'CollectionPage' : 'TechArticle',
        '@id': `${canonicalUrl}#article`,
        'headline': pageTitle,
        'description': pageDesc,
        'url': canonicalUrl,
        'inLanguage': 'zh-CN',
        'mainEntityOfPage': canonicalUrl,
        'datePublished': '2026-10-25T12:00:00+08:00',
        'dateModified': '2026-10-25T18:00:00+08:00',
        'author': {
          '@type': 'Organization',
          'name': '网络诊断实验室技术专家组',
          'url': 'https://netzhenduan.cc/about'
        },
        'publisher': {
          '@type': 'Organization',
          'name': '网络诊断实验室',
          'url': 'https://netzhenduan.cc/',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://netzhenduan.cc/avatar.jpg'
          }
        }
      }

      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [breadcrumbSchema, articleSchema]
        })
      ])
    }
  },
  head: [
    ['link', { rel: 'icon', href: '/avatar.jpg' }],
    ['meta', { name: 'keywords', content: '科学上网无法连接,梯子连不上,机场订阅失败,Clash无法连接,代理速度慢,节点超时,系统代理,TUN模式,网络诊断' }],
    ['meta', { name: 'author', content: 'netzhenduan.cc 网络可观测实验室' }],
    ['meta', { property: 'og:site_name', content: 'netzhenduan.cc 网络诊断' }],
    ['meta', { property: 'og:type', content: 'article' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }]
  ],
  themeConfig: {
    siteTitle: '⚡ NETZHENDUAN 网络诊断',
    logo: '/avatar.jpg',
    nav: [
      { text: '首页', link: '/' },
      {
        text: '故障排查',
        items: [
          { text: '科学上网问题', link: '/issues/' },
          { text: '梯子连不上', link: '/connection/' },
          { text: '客户端故障', link: '/clients/' },
          { text: '机场订阅问题', link: '/subscription/' }
        ]
      },
      { text: '网络诊断工具', link: '/diagnostics/' },
      { text: '客户端手册', link: '/clients/' },
      { text: '使用教程', link: '/tutorials/' },
      { text: '机场推荐', link: '/airports/' },
      { text: '免费机场', link: '/free/' },
      {
        text: '关于本站',
        items: [
          { text: '关于我们', link: '/about' },
          { text: '评测方法论', link: '/methodology' },
          { text: '推广披露', link: '/disclosure' },
          { text: '隐私政策', link: '/privacy' },
          { text: '服务条款', link: '/terms' }
        ]
      }
    ],
    sidebar: {
      '/issues/': [
        {
          text: '科学上网故障排查大专题',
          collapsed: false,
          items: [
            { text: '故障排查总览与分类索引', link: '/issues/' }
          ]
        },
        {
          text: '二级专题：连接成功但无法上网',
          collapsed: false,
          items: [
            { text: '专题总览：链路中断排查', link: '/issues/connection-failures/' },
            { text: '三级集群：系统代理与 DNS 排错', link: '/issues/connection-failures/proxy-dns/' },
            { text: '连接成功打不开网页深度排障', link: '/issues/connected-but-no-internet' },
            { text: 'DNS 污染抢答与 Fake-IP 修复', link: '/issues/connection-failures/gfw-dns-poisoning-fake-ip' }
          ]
        },
        {
          text: '体验与分流问题',
          collapsed: false,
          items: [
            { text: '节点延迟很低但下载极慢', link: '/issues/low-latency-slow-speed' },
            { text: '代理开启后国内网站变慢', link: '/issues/domestic-sites-slow' }
          ]
        },
        {
          text: '快捷诊断通道',
          items: [
            { text: '在线连通性探针控制台', link: '/diagnostics/' },
            { text: '梯子突然全部连不上', link: '/connection/all-nodes-down' }
          ]
        }
      ],
      '/connection/': [
        {
          text: '梯子连不上全链路排查大专题',
          collapsed: false,
          items: [
            { text: '连不上故障总览与分类索引', link: '/connection/' }
          ]
        },
        {
          text: '二级专题：多节点大面积超时与链路阻断',
          collapsed: false,
          items: [
            { text: '专题总览：节点全红超时排错', link: '/connection/timeout-failures/' },
            { text: '三级集群：时钟偏差与机房阻断排查', link: '/connection/timeout-failures/ntp-relay/' },
            { text: '梯子突然全部连不上全面排查', link: '/connection/all-nodes-down' },
            { text: 'NTP 时钟偏差与 TLS 握手解密', link: '/connection/timeout-failures/ntp-clock-skew-tls-handshake' },
            { text: '中转机房 RST 复位与 BGP 黑洞分析', link: '/connection/timeout-failures/ntp-relay/transit-relay-node-rst-packet-analysis' },
            { text: '三级集群：GFW SNI 阻断与端口跳跃', link: '/connection/timeout-failures/gfw-sni-blocking/' },
            { text: 'TLS SNI 阻断与 RST 复位检测', link: '/connection/timeout-failures/gfw-sni-blocking/tls-sni-rst-inspection' },
            { text: '中转端口跳跃与动态 NAT 容灾', link: '/connection/timeout-failures/gfw-sni-blocking/transit-port-hopping-nat' }
          ]
        },
        {
          text: '二级专题：TLS 握手协商与加密套件排查',
          collapsed: false,
          items: [
            { text: '专题总览：握手协商与密码套件', link: '/connection/handshake-cipher/' },
            { text: '三级集群：TLS 1.3 密码套件与 ALPN 协商故障', link: '/connection/handshake-cipher/tls13-alpn/' },
            { text: '🌐 TLS ALPN 协商失败深度排查 (h2 / http/1.1)', link: '/connection/handshake-cipher/tls13-alpn/tls-alpn-h2-http11-negotiation-failure' },
            { text: '🔐 Cipher Suite 加密套件协商失败与 VLESS-Reality 伪装报错', link: '/connection/handshake-cipher/tls13-alpn/cipher-suite-mismatch-reality-tls-troubleshooting' }
          ]
        },
        {
          text: '设备与网络差异排查',
          collapsed: false,
          items: [
            { text: '手机能连但电脑不能用排查', link: '/connection/phone-works-pc-fails' }
          ]
        },
        {
          text: '关联排障与工具',
          items: [
            { text: '在线连通性实时探针', link: '/diagnostics/' },
            { text: 'Clash Verge 节点超时排查', link: '/clients/clash-verge-rev-timeout' }
          ]
        }
      ],
      '/clients/': [
        {
          text: '主流客户端故障排查',
          collapsed: false,
          items: [
            { text: '客户端故障索引总览', link: '/clients/' }
          ]
        },
        {
          text: '二级专题：Clash Verge Rev 核心进阶',
          collapsed: false,
          items: [
            { text: '专题总览：Clash Verge Rev 进阶', link: '/clients/clash-verge/' },
            { text: '三级集群：Mihomo 内核与服务模式', link: '/clients/clash-verge/mihomo-service/' },
            { text: '🔥 节点超时 12 大模块深度排障', link: '/clients/clash-verge-rev-timeout' },
            { text: '🛠️ TUN 模式与 Wintun 虚拟网卡修复', link: '/clients/clash-verge/mihomo-service/tun-mode-wintun-troubleshooting' },
            { text: '基础指南：安装配置与分流模式', link: '/clients/clash-verge-rev' }
          ]
        },
        {
          text: '二级专题：v2rayN / Xray 核心架构',
          collapsed: false,
          items: [
            { text: '专题总览：v2rayN 进阶架构', link: '/clients/v2rayn/' },
            { text: '三级集群：双内核切换与分流路由', link: '/clients/v2rayn/core-routing/' },
            { text: '🛠️ Xray-core 闪退与退出代码深度排查', link: '/clients/v2rayn/core-routing/xray-core-process-crash-exit-code-troubleshooting' },
            { text: '📊 自定义路由规则与 geosite 调优实战', link: '/clients/v2rayn/core-routing/custom-routing-rules-geosite-geoip-tuning' }
          ]
        },
        {
          text: '二级专题：v2rayNG 安卓移动端深度排障',
          collapsed: false,
          items: [
            { text: '专题总览：v2rayNG 移动端进阶', link: '/clients/v2rayng/' },
            { text: '三级集群：分应用代理与中国 IP 绕行', link: '/clients/v2rayng/per-app-proxy/' },
            { text: '🔥 分应用代理配置：黑白名单与银行防阻断', link: '/clients/v2rayng/per-app-proxy/per-app-proxy-split-tunneling-configuration-guide' },
            { text: '🛠️ 绕过大陆地址与私密 DNS 冲突防泄漏', link: '/clients/v2rayng/per-app-proxy/bypass-lan-china-ip-mobile-dns-leak-tuning' },
            { text: '🔋 熄屏断流与保活白名单全品牌配置', link: '/clients/v2rayng-battery-optimization-background-keepalive' }
          ]
        },
        {
          text: '二级专题：Shadowrocket iOS 进阶与重写',
          collapsed: false,
          items: [
            { text: '专题总览：Shadowrocket 进阶', link: '/clients/shadowrocket/' },
            { text: '三级集群：MitM 解密与重写脚本', link: '/clients/shadowrocket/mitm-rewrite/' },
            { text: '🔐 CA 证书安装与信任链故障排查', link: '/clients/shadowrocket/mitm-rewrite/mitm-ca-certificate-trust-chain-troubleshooting' },
            { text: '⚙️ URL 重写与脚本规则语法全解', link: '/clients/shadowrocket/mitm-rewrite/url-rewrite-script-rule-syntax-guide' },
            { text: 'HTTPS 解密与重写实战', link: '/clients/shadowrocket-certificate-mitm-rewrite-guide' }
          ]
        },
        {
          text: '其他主流客户端故障手册',
          collapsed: false,
          items: [
            { text: 'v2rayN 电脑客户端手册', link: '/clients/v2rayn' },
            { text: 'v2rayN 连接失败排错', link: '/clients/v2rayn-connection-failed' },
            { text: 'v2rayNG 安卓手机排错', link: '/clients/v2rayng' },
            { text: 'Shadowrocket 小火箭排错', link: '/clients/shadowrocket' }
          ]
        },
        {
          text: '关联排障与备用方案',
          items: [
            { text: '科学上网打不开网页排障', link: '/issues/connected-but-no-internet' },
            { text: '梯子突然全部连不上排查', link: '/connection/all-nodes-down' },
            { text: '42 家高可用专线机场横评', link: '/airports/' }
          ]
        }
      ],
      '/subscription/': [
        {
          text: '机场订阅与鉴权排错',
          collapsed: false,
          items: [
            { text: '订阅故障总览与分类索引', link: '/subscription/' }
          ]
        },
        {
          text: '二级专题：订阅无法导入与格式异常',
          collapsed: false,
          items: [
            { text: '专题总览：无法导入排查', link: '/subscription/import-failures/' },
            { text: '三级集群：Base64与YAML语法校验', link: '/subscription/import-failures/base64-yaml/' },
            { text: '🔥 订阅链接无法导入 12 模块排查', link: '/subscription/import-failed' },
            { text: '🛠️ YAML 语法错误与缩进修复指南', link: '/subscription/import-failures/base64-yaml/yaml-syntax-indentation-fix' }
          ]
        },
        {
          text: '订阅更新与鉴权状态排错',
          collapsed: false,
          items: [
            { text: '订阅更新失败与401/403鉴权排查', link: '/subscription/update-failed' }
          ]
        },
        {
          text: '关联排障与备用方案',
          items: [
            { text: 'Clash Verge 节点超时排查', link: '/clients/clash-verge-rev-timeout' },
            { text: '梯子突然全部连不上排查', link: '/connection/all-nodes-down' },
            { text: '42 家高可用专线机场横评', link: '/airports/' }
          ]
        }
      ],
      '/diagnostics/': [
        {
          text: '网络诊断与可观测实验室',
          collapsed: false,
          items: [
            { text: '在线网络探针控制台 (核心入口)', link: '/diagnostics/' }
          ]
        },
        {
          text: '二级专题：DNS 泄漏与防污染检测',
          collapsed: false,
          items: [
            { text: '专题总览：DNS 泄漏防御', link: '/diagnostics/dns-leak-prevention/' },
            { text: '三级集群：WebRTC 穿透与 DoH 加密', link: '/diagnostics/dns-leak-prevention/webrtc-doh/' },
            { text: '🔥 DNS 泄漏与防污染 12 模块排查', link: '/diagnostics/dns-leak' },
            { text: '🛠️ WebRTC 真实 IP 泄漏与 STUN 防御', link: '/diagnostics/dns-leak-prevention/webrtc-doh/webrtc-ip-leak-stun-fix' }
          ]
        },
        {
          text: '二级专题：真实网络测速与晚高峰可观测性',
          collapsed: false,
          items: [
            { text: '专题总览：真实测速与可观测性', link: '/diagnostics/latency-speed/' },
            { text: '三级集群：单/多线程吞吐与 Bufferbloat', link: '/diagnostics/latency-speed/throughput-jitter/' },
            { text: '🛠️ 路由器 Bufferbloat 缓冲膨胀与队列调优', link: '/diagnostics/latency-speed/throughput-jitter/bufferbloat-router-queue-latency-tuning' },
            { text: '📊 iperf3 跨境单线程吞吐与 TCP 窗口调优', link: '/diagnostics/latency-speed/throughput-jitter/iperf3-cross-border-throughput-tcp-window-diagnosis' },
            { text: '入门实操：真实延迟与单/多线程测速指南', link: '/diagnostics/latency-speed' }
          ]
        },
        {
          text: '关联排障与备用方案',
          items: [
            { text: '科学上网打不开网页排障', link: '/issues/connected-but-no-internet' },
            { text: 'Clash 节点超时深度排错', link: '/clients/clash-verge-rev-timeout' },
            { text: '42 家高可用专线机场横评', link: '/airports/' }
          ]
        }
      ],
      '/tutorials/': [
        {
          text: '科学上网新手使用教程',
          collapsed: false,
          items: [
            { text: '新手使用教程与模式总览', link: '/tutorials/' }
          ]
        },
        {
          text: '二级专题：初次安装与首次连接',
          collapsed: false,
          items: [
            { text: '专题总览：初次安装与首次连接', link: '/tutorials/first-time-setup/' },
            { text: '三级集群：模式选择与高级分流', link: '/tutorials/first-time-setup/client-modes/' },
            { text: '🔥 规则模式与全局模式 12 模块解析', link: '/tutorials/rule-modes' },
            { text: '🛠️ 分应用代理与特定程序绕行指南', link: '/tutorials/first-time-setup/client-modes/sub-app-proxy-split-tunneling' },
            { text: '🎮 TUN 模式与系统代理全场景选型', link: '/tutorials/first-time-setup/client-modes/tun-vs-system-proxy-gaming-udp-guide' },
            { text: '入门教程：零基础初次安装到首次连接', link: '/tutorials/first-time-setup' }
          ]
        },
        {
          text: '二级专题：分流规则语法与自定义直连',
          collapsed: false,
          items: [
            { text: '专题总览：分流规则语法与直连', link: '/tutorials/rule-modes/' },
            { text: '三级集群：自定义规则集与防误伤', link: '/tutorials/rule-modes/custom-rules/' },
            { text: '📜 DOMAIN-SUFFIX 与 IP-CIDR 语法全景拆解', link: '/tutorials/rule-modes/custom-rules/domain-suffix-ip-cidr-rule-syntax-guide' },
            { text: '🛡️ 国内主流服务白名单与防误伤方案', link: '/tutorials/rule-modes/custom-rules/china-domain-ip-whitelist-direct-tuning' },
            { text: '⚡ GeoSite 与自定义规则集编写调优', link: '/tutorials/geosite-direct-custom-ruleset-guide' }
          ]
        },
        {
          text: '二级专题：安全防护与数字隐私加固',
          collapsed: false,
          items: [
            { text: '专题总览：安全防护与隐私加固', link: '/tutorials/security-privacy/' },
            { text: '三级集群：DNS 泄露防御与 WebRTC 穿透', link: '/tutorials/security-privacy/dns-webrtc-hardening/' },
            { text: '🛡️ 主流浏览器 WebRTC 真实公网 IP 防泄漏', link: '/tutorials/security-privacy/dns-webrtc-hardening/webrtc-browser-hardening-guide' },
            { text: '🔐 安全加密 DNS (DoH/DoT/DoQ) 本地配置', link: '/tutorials/security-privacy/dns-webrtc-hardening/secure-dns-doh-dot-privacy-configuration' }
          ]
        },
        {
          text: '关联排障与备用方案',
          items: [
            { text: '科学上网打不开网页排障', link: '/issues/connected-but-no-internet' },
            { text: 'Clash 节点超时深度排错', link: '/clients/clash-verge-rev-timeout' },
            { text: '42 家高可用专线机场横评', link: '/airports/' }
          ]
        }
      ],
      '/airports/': [
        {
          text: '2026 机场推荐与选型大专题',
          collapsed: false,
          items: [
            { text: '机场评测与选型总榜 (核心入口)', link: '/airports/' }
          ]
        },
        {
          text: '二级专题：晚高峰与抗封锁稳定性',
          collapsed: false,
          items: [
            { text: '专题总览：稳定性选型标准', link: '/airports/speed-stability/' },
            { text: '三级集群：IEPL/IPLC 专线实测对比', link: '/airports/speed-stability/iepl-vs-iplc/' },
            { text: 'IEPL 专线底层拓扑与技术全景', link: '/airports/speed-stability/iepl-technology-deep-dive' },
            { text: '三级集群：延迟抖动与逐跳丢包排查', link: '/airports/speed-stability/packet-loss-latency/' },
            { text: '🔥 TCP BBR 拥塞控制与内核调优指南', link: '/airports/speed-stability/packet-loss-latency/tcp-bbr-congestion-control-airport-tuning' },
            { text: '🛠️ MTR 逐跳路由追踪与丢包诊断指南', link: '/airports/speed-stability/packet-loss-latency/mtr-packet-loss-hop-by-hop-diagnosis' }
          ]
        },
        {
          text: '二级专题：流媒体解锁与落地 IP 纯净度',
          collapsed: false,
          items: [
            { text: '专题总览：流媒体与落地纯净度', link: '/airports/streaming-unlock/' },
            { text: '三级集群：原生 IP 判定与欺诈分风控', link: '/airports/streaming-unlock/native-ip-audit/' },
            { text: '🎬 原生 IP vs 广播机房 IP 深度鉴别与流媒体解锁', link: '/airports/streaming-unlock/native-ip-audit/native-vs-broadcast-ip-netflix-disney-unlock-guide' },
            { text: '🤖 IP 欺诈分与 ChatGPT/Claude 平台风控审计', link: '/airports/streaming-unlock/native-ip-audit/ip-fraud-score-chatgpt-claude-risk-control-tuning' }
          ]
        },
        {
          text: '品牌深度实测档案',
          collapsed: false,
          items: [
            { text: '光速云 (主推第一·IEPL双专线)', link: '/airports/guangsu' },
            { text: '飞猫云 (免配置·专属客户端)', link: '/airports/feimao' },
            { text: '微风网络 (高性价比·IEPL)', link: '/airports/weifeng' }
          ]
        }
      ],
      '/free/': [
        {
          text: '免费机场与应急替代大专题',
          collapsed: false,
          items: [
            { text: '免费机场避坑与低成本方案总览', link: '/free/' }
          ]
        },
        {
          text: '二级专题：隐私风险与蜜罐嗅探',
          collapsed: false,
          items: [
            { text: '专题总览：隐私风险与蜜罐防范', link: '/free/privacy-security-risks/' },
            { text: '三级集群：蜜罐识别与流量嗅探防御', link: '/free/privacy-security-risks/mitm-sniffing/' },
            { text: '🔥 免费节点 5 大安全威胁 12 模块指南', link: '/free/privacy-security-risks/free-node-security-threats' },
            { text: '🛠️ 蜜罐节点识别技术与安全审计', link: '/free/privacy-security-risks/mitm-sniffing/honeypot-node-identification' }
          ]
        },
        {
          text: '正规低成本替代路线',
          items: [
            { text: '大佬云 (¥5.6/月 IEPL专线)', link: '/airports/#大佬云-dalaoyun' },
            { text: '微风网络 (¥9.9/月 入门专线)', link: '/airports/weifeng' },
            { text: '42 家高可用专线机场横评', link: '/airports/' }
          ]
        }
      ]
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索故障 / 客户端 / 报错日志',
                buttonAriaLabel: '搜索故障'
              },
              modal: {
                noResultsText: '无法找到相关排障文档',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        }
      }
    },
    outline: {
      level: [2, 3],
      label: '本页故障排查目录'
    },
    docFooter: {
      prev: '上一篇故障排查',
      next: '下一步排障操作'
    },
    footer: {
      message: '网络诊断实验室（NetZhenDuan.cc）坚持独立技术实测与客观数据呈现。部分测速与线路评测内容包含商业推广标记（Sponsored），返利佣金不影响最终评测结论与用户付费价格。',
      copyright: 'Copyright © 2024-2026 网络诊断实验室 (NetZhenDuan.cc) All Rights Reserved. 严禁用于任何非法网络活动。'
    }
  }
})
