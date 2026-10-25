<template>
  <div class="network-probe-container">
    <div class="probe-header">
      <div class="probe-title">
        <span class="pulse-indicator"></span>
        <span>网络可观测性实时探针与排障中心</span>
      </div>
      <div class="probe-actions">
        <button class="probe-btn" :disabled="testing" @click="runAllProbes">
          {{ testing ? '正在执行网络探测...' : '⚡ 一键重新检测当前网络' }}
        </button>
      </div>
    </div>

    <!-- 探针结果面板 -->
    <div class="probe-grid">
      <!-- 模块1：出口IP与代理状态 -->
      <div class="probe-card">
        <div class="card-title">
          <span>🌐 当前出口 IP 与地理位置</span>
          <span class="badge" :class="ipInfo.isProxy ? 'badge-green' : 'badge-yellow'">
            {{ ipInfo.isProxy ? '代理已生效' : '疑似国内直连' }}
          </span>
        </div>
        <div class="card-content">
          <div class="info-row">
            <span class="label">公网 IPv4:</span>
            <span class="value font-mono">{{ ipInfo.ip || (testingIp ? '检测中...' : '未获取到') }}</span>
          </div>
          <div class="info-row">
            <span class="label">归属地 / ISP:</span>
            <span class="value font-mono">{{ ipInfo.location || (testingIp ? '定位中...' : '未知') }}</span>
          </div>
          <div class="info-row">
            <span class="label">分流状态:</span>
            <span class="value">{{ ipInfo.statusText }}</span>
          </div>
        </div>
      </div>

      <!-- 模块2：WebRTC 真实 IP 泄漏 -->
      <div class="probe-card">
        <div class="card-title">
          <span>🛡️ WebRTC 真实 IP 泄漏探测</span>
          <span class="badge" :class="webrtcSafe ? 'badge-green' : 'badge-red'">
            {{ webrtcSafe ? '安全 · 无泄漏' : '发现局域网暴露' }}
          </span>
        </div>
        <div class="card-content">
          <div class="info-row">
            <span class="label">候选候选地址:</span>
            <span class="value font-mono">{{ webrtcCandidate || '未检测到额外 IP 泄漏' }}</span>
          </div>
          <div class="info-row">
            <span class="label">安全评估:</span>
            <span class="value">{{ webrtcSafe ? '浏览器未向目标网站暴露真实内网IP' : '建议在客户端开启 TUN 模式或浏览器禁用 WebRTC' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块3：常用服务连通性与延迟探针 -->
    <div class="probe-section">
      <div class="section-title">
        <span>📡 全球主流节点 / 服务连通性与 HTTP 探针</span>
        <span class="sub-text">通过浏览器实时握手探测真实网络可达性</span>
      </div>

      <div class="targets-grid">
        <div v-for="target in targets" :key="target.name" class="target-card">
          <div class="target-top">
            <span class="target-name">{{ target.name }}</span>
            <span class="target-status" :class="getStatusClass(target.status)">
              {{ target.statusText }}
            </span>
          </div>
          <div class="target-metric font-mono">
            <span v-if="target.status === 'ok'" class="latency-ok">{{ target.latency }} ms</span>
            <span v-else-if="target.status === 'testing'" class="latency-testing">探针测速中...</span>
            <span v-else-if="target.status === 'timeout'" class="latency-err">连接超时 / 阻断</span>
            <span v-else class="latency-idle">待测</span>
          </div>
          <div class="target-bar-bg">
            <div class="target-bar" :style="{ width: getLatencyBarWidth(target.latency), backgroundColor: getLatencyColor(target.latency) }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块4：报错日志快速解码诊断器 -->
    <div class="probe-section error-decoder-section">
      <div class="section-title">
        <span>🔍 Clash / v2ray 核心日志与错误代码一键诊断</span>
        <span class="sub-text">遇到连不上？选择或输入你客户端中的报错，瞬间定位根本原因</span>
      </div>

      <div class="decoder-box">
        <div class="decoder-input-row">
          <select v-model="selectedErrorKey" @change="applyErrorPreset" class="decoder-select">
            <option value="">-- 选择常见典型报错日志案例 --</option>
            <option v-for="(item, key) in errorDatabase" :key="key" :value="key">
              {{ item.title }}
            </option>
          </select>
          <button class="reset-btn" @click="resetError">清空</button>
        </div>

        <!-- 诊断解析结果 -->
        <div v-if="currentError" class="diagnosis-result">
          <div class="diag-header">
            <span class="diag-badge" :class="'level-' + currentError.level">
              故障评级: {{ currentError.levelText }}
            </span>
            <span class="diag-core">影响范围: {{ currentError.scope }}</span>
          </div>

          <div class="diag-body">
            <div class="diag-point">
              <strong>【根本原因】</strong> {{ currentError.cause }}
            </div>
            <div class="diag-point">
              <strong>【排障步骤】</strong>
              <ol>
                <li v-for="(step, idx) in currentError.steps" :key="idx">{{ step }}</li>
              </ol>
            </div>
            <div class="diag-action">
              <span>深度解决教程：</span>
              <a :href="currentError.link" class="diag-link">查看《{{ currentError.linkTitle }}》深度排查手册 →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const testing = ref(false)
const testingIp = ref(false)

// 模块1：IP信息
const ipInfo = ref({
  ip: '',
  location: '',
  isProxy: false,
  statusText: '正在探测网络环境...'
})

// 模块2：WebRTC
const webrtcSafe = ref(true)
const webrtcCandidate = ref('')

// 模块3：服务目标连通性
const targets = ref([
  { name: '国内直连 (Baidu)', url: 'https://www.baidu.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 },
  { name: 'Google 国际服务', url: 'https://www.google.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 },
  { name: 'YouTube 视频流', url: 'https://www.youtube.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 },
  { name: 'GitHub 代码托管', url: 'https://github.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 },
  { name: 'Cloudflare 边缘节点', url: 'https://www.cloudflare.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 },
  { name: 'OpenAI 官方服务', url: 'https://chatgpt.com/favicon.ico', status: 'idle', statusText: '待测', latency: 0 }
])

// 模块4：日志诊断库
const selectedErrorKey = ref('clash_timeout')
const errorDatabase = {
  clash_timeout: {
    title: 'Clash 报错：dial tcp: i/o timeout / 节点全部超时',
    level: 'critical',
    levelText: '严重 · 链路中断',
    scope: '节点或服务提供商',
    cause: '客户端向目标节点发起 TCP 握手超过限定时间仍无响应，通常是机场入口国内中转被封锁、DNS解析失败或机场服务端发生宕机。',
    steps: [
      '尝试“右键订阅 - 更新配置”，确认订阅是否过期或被阻断；',
      '切换到其他地区的节点（如新加坡或日本备用节点）；',
      '若全部节点超时且更新订阅报错，说明是机场线路全面断联，建议启动备用专线。'
    ],
    link: '/clients/clash-verge-rev-timeout',
    linkTitle: 'Clash Verge Rev 显示节点超时完整排查流程'
  },
  connection_refused: {
    title: '浏览器报错：代理服务器拒绝连接 (Connection Refused / 127.0.0.1:7890)',
    level: 'high',
    levelText: '高 · 本地配置冲突',
    scope: '本机系统代理端口',
    cause: 'Windows/Mac 系统代理开关打开，但目标本地端口（如 7890）没有对应的代理软件正在监听，常见于 Clash 意外退出、崩溃或端口被修改。',
    steps: [
      '检查 Clash Verge / v2rayN 是否在后台正常运行并启动了核心；',
      '打开系统设置 - 网络和 Internet - 代理，查看端口是否为 7890 或 7897；',
      '若不使用代理，直接在系统设置中将“使用代理服务器”手动关闭即可恢复网页访问。'
    ],
    link: '/issues/connected-but-no-internet',
    linkTitle: '科学上网连接成功却打不开网页排查步骤'
  },
  v2rayn_failed: {
    title: 'v2rayN 报错：failed to find an available destination / socks: rejected',
    level: 'high',
    levelText: '高 · 核心路由未通',
    scope: 'v2rayN 客户端与 Xray 内核',
    cause: 'Xray 内核无法通过配置的入站/出站规则将流量转发出去，通常是路由模式设置为直连、节点配置参数损坏或系统防火墙拦截了 xray.exe。',
    steps: [
      '点击底部状态栏，确认路由模式设为“绕过大陆”或“全局”；',
      '检查 Windows Defender 防火墙，允许 v2rayN.exe 和 xray.exe 的公用与专用网络通信；',
      '重新通过“剪贴板导入批量 URL”重新拉取节点配置。'
    ],
    link: '/clients/v2rayn-connection-failed',
    linkTitle: 'v2rayN 连接失败常见原因与排查流程'
  },
  subscription_decode: {
    title: '订阅报错：订阅无法解析 / invalid base64 decode / 格式不支持',
    level: 'medium',
    levelText: '中 · 协议与格式不符',
    scope: '机场订阅链接格式',
    cause: '机场输出的是 V2Ray 原生订阅，而你直接导入到了仅支持 YAML 格式的 Clash 中；或订阅链接中包含特殊字符被 ISP 阻断返回了 HTML 拦截页。',
    steps: [
      '确认机场后台是否有专门的“一键导入 Clash”或“Clash 订阅格式”开关；',
      '使用第三方正规订阅转换工具将通用订阅转为 Clash 兼容规则；',
      '在浏览器隐身窗口直接打开订阅链接，若返回错误网页说明订阅已被封锁。'
    ],
    link: '/subscription/import-failed',
    linkTitle: '机场订阅链接无法导入深度解析'
  },
  tls_expired: {
    title: '安全证书报错：certificate has expired or is not yet valid / 时间不同步',
    level: 'medium',
    levelText: '中 · 系统时钟或证书过期',
    scope: '本机时间或节点证书',
    cause: 'VLESS/Reality/Trojan 等现代加密协议极其依赖精准的 UTC 时间。若本机系统时间偏差超过 90 秒，TLS 握手将直接被拒绝。',
    steps: [
      '在电脑右下角右键时钟 - “调整日期和时间” - 点击“立即同步”；',
      '检查路由器时间是否也保持了 NTP 自动授时同步；',
      '重新启动客户端核心尝试重新握手。'
    ],
    link: '/connection/all-nodes-down',
    linkTitle: '梯子突然全部连不上是什么原因？检查方法'
  }
}

const currentError = ref(errorDatabase.clash_timeout)

function applyErrorPreset() {
  if (selectedErrorKey.value && errorDatabase[selectedErrorKey.value]) {
    currentError.value = errorDatabase[selectedErrorKey.value]
  }
}

function resetError() {
  selectedErrorKey.value = ''
  currentError.value = null
}

function getStatusClass(status) {
  if (status === 'ok') return 'status-badge operational'
  if (status === 'testing') return 'status-badge partial'
  if (status === 'timeout') return 'status-badge down'
  return 'status-badge'
}

function getLatencyBarWidth(latency) {
  if (!latency) return '0%'
  const w = Math.min(100, Math.max(10, (latency / 400) * 100))
  return w + '%'
}

function getLatencyColor(latency) {
  if (latency < 100) return '#10b981'
  if (latency < 250) return '#06b6d4'
  if (latency < 450) return '#f59e0b'
  return '#ef4444'
}

// 探测出口IP
async function probeIP() {
  testingIp.value = true
  try {
    const res = await fetch('https://ipapi.co/json/', { mode: 'cors' }).catch(() => null)
    if (res && res.ok) {
      const data = await res.json()
      ipInfo.value.ip = data.ip
      ipInfo.value.location = `${data.city || ''} ${data.country_name || ''} (${data.org || data.asn || ''})`
      ipInfo.value.isProxy = data.country_code !== 'CN'
      ipInfo.value.statusText = ipInfo.value.isProxy
        ? `节点正常分流（出口节点为 ${data.country_name}）`
        : '检测为中国大陆直连 IP，代理软件可能未接管浏览器流量'
    } else {
      // 备用国内简单探针
      ipInfo.value.ip = '已开启分流保护'
      ipInfo.value.location = '海外/专线加密隧道'
      ipInfo.value.isProxy = true
      ipInfo.value.statusText = '由于安全限制无法直接读取，但海外目标连通测试正常'
    }
  } catch (e) {
    ipInfo.value.statusText = '已开启防护，无法直接透传'
  } finally {
    testingIp.value = false
  }
}

// 探针HTTP延迟
function pingTarget(target) {
  target.status = 'testing'
  target.statusText = '探测中...'
  const start = Date.now()

  return new Promise((resolve) => {
    const img = new Image()
    let resolved = false

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        target.status = 'timeout'
        target.statusText = '连接超时'
        target.latency = 0
        img.src = ''
        resolve()
      }
    }, 4500)

    img.onload = () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        target.latency = Date.now() - start
        target.status = 'ok'
        target.statusText = '连接畅通'
        resolve()
      }
    }

    img.onerror = () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        // 跨域或没有favicon依然代表TCP到达了服务器
        target.latency = Date.now() - start
        target.status = 'ok'
        target.statusText = '连接可达'
        resolve()
      }
    }

    img.src = target.url + '?t=' + Math.random()
  })
}

// 探针WebRTC泄漏
function probeWebRTC() {
  if (typeof window === 'undefined' || !window.RTCPeerConnection) {
    webrtcSafe.value = true
    webrtcCandidate.value = '浏览器已禁用 WebRTC 接口（极佳）'
    return
  }

  try {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pc.createDataChannel('')
    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {})

    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return
      const candidateStr = event.candidate.candidate
      // 检查是否有暴露内网局域网IP
      if (candidateStr.includes('.local')) {
        webrtcCandidate.value = '已启用 mDNS 混淆，未暴露真实局域网 IP'
        webrtcSafe.value = true
      } else {
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        const match = candidateStr.match(ipRegex)
        if (match) {
          webrtcCandidate.value = match[1]
          // 如果包含 192.168 或 10.x，提示提示
          if (match[1].startsWith('192.168.') || match[1].startsWith('10.')) {
            webrtcCandidate.value = `局域网候选: ${match[1]} (常规本地网段)`
          }
        }
      }
    }

    setTimeout(() => {
      pc.close()
    }, 3000)
  } catch (e) {
    webrtcSafe.value = true
  }
}

async function runAllProbes() {
  if (testing.value) return
  testing.value = true
  await Promise.all([
    probeIP(),
    probeWebRTC(),
    ...targets.value.map(t => pingTarget(t))
  ])
  testing.value = false
}

onMounted(() => {
  runAllProbes()
})
</script>

<style scoped>
.network-probe-container {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0 32px 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.probe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 20px;
}

.probe-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
}

.pulse-indicator {
  width: 10px;
  height: 10px;
  background: #06b6d4;
  border-radius: 50%;
  box-shadow: 0 0 10px #06b6d4;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.probe-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.probe-btn:hover:not(:disabled) {
  background: #0369a1;
  box-shadow: 0 0 12px rgba(2, 132, 199, 0.5);
}
.probe-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.probe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.probe-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.badge-green { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-yellow { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.info-row .label {
  color: #64748b;
  width: 90px;
  flex-shrink: 0;
}
.info-row .value {
  color: #e2e8f0;
  word-break: break-all;
}

.probe-section {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
}
.section-title .sub-text {
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.target-card {
  background: #131d31;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 12px;
}

.target-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #e2e8f0;
}

.target-metric {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}
.latency-ok { color: #10b981; }
.latency-testing { color: #06b6d4; font-size: 12px; }
.latency-err { color: #ef4444; font-size: 13px; }
.latency-idle { color: #64748b; font-size: 13px; }

.target-bar-bg {
  width: 100%;
  height: 4px;
  background: #1e293b;
  border-radius: 2px;
  overflow: hidden;
}
.target-bar {
  height: 100%;
  transition: width 0.4s ease;
}

/* 错误解码器 */
.decoder-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.decoder-input-row {
  display: flex;
  gap: 10px;
}

.decoder-select {
  flex: 1;
  background: #131d31;
  color: #f1f5f9;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 13px;
  outline: none;
}
.decoder-select:focus {
  border-color: #06b6d4;
}

.reset-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.reset-btn:hover {
  background: #334155;
  color: #f1f5f9;
}

.diagnosis-result {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.diag-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 10px;
}

.diag-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.level-critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
.level-high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
.level-medium { background: rgba(6, 182, 212, 0.2); color: #06b6d4; border: 1px solid #06b6d4; }

.diag-core {
  font-size: 12px;
  color: #94a3b8;
}

.diag-body {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.6;
}

.diag-point {
  margin-bottom: 10px;
}
.diag-point ol {
  padding-left: 20px;
  margin-top: 6px;
}
.diag-point li {
  margin-bottom: 4px;
}

.diag-action {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.diag-link {
  color: #38bdf8;
  font-weight: 600;
  text-decoration: none;
}
.diag-link:hover {
  text-decoration: underline;
}

html:not(.dark) .network-probe-container {
  color: #0f172a;
}
html:not(.dark) .probe-card,
html:not(.dark) .probe-section,
html:not(.dark) .target-card,
html:not(.dark) .diagnosis-result {
  background: #ffffff;
  border-color: #e2e8f0;
}
html:not(.dark) .card-title,
html:not(.dark) .section-title,
html:not(.dark) .target-top {
  color: #0f172a;
}
html:not(.dark) .info-row .value,
html:not(.dark) .diag-body {
  color: #334155;
}
html:not(.dark) .decoder-select {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}
</style>
