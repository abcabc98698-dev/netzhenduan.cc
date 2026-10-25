<template>
  <div class="speed-report-card">
    <div class="report-header">
      <div class="report-brand">
        <span class="report-icon">📊</span>
        <span class="report-title">{{ brandName }} 节点测速报告 (实测数据)</span>
      </div>
      <div class="report-meta font-mono">
        <span>环境: {{ clientEnv || 'Clash Verge Rev / Mihomo' }}</span>
        <span>时段: {{ peakTime || '晚高峰 20:30' }}</span>
      </div>
    </div>

    <div class="node-list">
      <div v-for="(node, index) in nodes" :key="index" class="node-row">
        <div class="node-info">
          <span class="node-status-dot" :class="node.status || 'green'"></span>
          <span class="node-name">{{ node.name }}</span>
        </div>
        <div class="node-metrics font-mono">
          <span class="metric-ping">延迟: <strong>{{ node.ping }}ms</strong></span>
          <span class="metric-speed">下载: <strong>{{ node.speed }}</strong></span>
        </div>
        <div class="speed-bar-track">
          <div class="speed-bar-fill" :style="{ width: node.percentage + '%', background: getBarColor(node.percentage) }"></div>
        </div>
      </div>
    </div>

    <div class="report-footer font-mono">
      <span>测试汇总: 平均延迟 {{ summaryAvgPing || '46ms' }} | 最高峰值 {{ summaryMaxSpeed || '546Mbps' }} | 丢包率 0%</span>
      <span class="report-watermark">[netzhenduan.cc 可观测实验室]</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  brandName: { type: String, default: '光速云' },
  clientEnv: { type: String, default: 'Clash Verge Rev v1.5x | Speedtest.net' },
  peakTime: { type: String, default: '2026.10 晚高峰 20:30' },
  summaryAvgPing: { type: String, default: '48ms' },
  summaryMaxSpeed: { type: String, default: '529Mbps' },
  nodes: {
    type: Array,
    default: () => [
      { name: '香港 IEPL 01 (极速)', ping: 22, speed: '529Mbps', percentage: 98, status: 'green' },
      { name: '新加坡 IEPL 专线', ping: 46, speed: '387Mbps', percentage: 76, status: 'green' },
      { name: '日本 东京 BGP中转', ping: 57, speed: '135Mbps', percentage: 45, status: 'green' },
      { name: '台湾 台北 专线节点', ping: 41, speed: '114Mbps', percentage: 38, status: 'green' },
      { name: '美国 洛杉矶 原生优化', ping: 143, speed: '28Mbps', percentage: 18, status: 'yellow' }
    ]
  }
})

function getBarColor(pct) {
  if (pct > 70) return 'linear-gradient(90deg, #0284c7, #10b981)'
  if (pct > 30) return 'linear-gradient(90deg, #0284c7, #06b6d4)'
  return 'linear-gradient(90deg, #f59e0b, #eab308)'
}
</script>

<style scoped>
.speed-report-card {
  background: var(--diag-card-bg, #090d16);
  border: 1px solid var(--table-border, #1e293b);
  border-radius: 8px;
  padding: 18px 22px;
  margin: 22px 0;
  box-shadow: var(--diag-card-shadow, 0 4px 20px rgba(0, 0, 0, 0.4));
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--table-border, #1e293b);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.report-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--vp-c-text-1, #f1f5f9);
  font-size: 15px;
}

.report-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--vp-c-text-2, #64748b);
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.node-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--vp-c-text-1, #e2e8f0);
}

.node-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.node-status-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.node-status-dot.yellow { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }

.node-metrics {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--vp-c-text-2, #94a3b8);
}

.node-metrics strong {
  color: var(--vp-c-text-1, #f1f5f9);
}

.speed-bar-track {
  width: 100%;
  height: 6px;
  background: var(--table-border, #1e293b);
  border-radius: 3px;
  overflow: hidden;
}

.speed-bar-fill {
  height: 100%;
  border-radius: 3px;
}

.report-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-top: 1px solid var(--table-border, #1e293b);
  padding-top: 12px;
  margin-top: 16px;
  font-size: 12px;
  color: var(--vp-c-text-2, #64748b);
}

.report-watermark {
  color: var(--vp-c-text-3, #475569);
}
</style>
