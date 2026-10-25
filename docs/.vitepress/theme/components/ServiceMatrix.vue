<template>
  <div class="service-matrix-card">
    <div class="matrix-header">
      <span class="matrix-title">🎬 {{ brandName }} 流媒体与主流 AI 解锁可观测矩阵</span>
      <span class="matrix-tag font-mono">RegionRestrictionCheck 实测</span>
    </div>

    <div class="matrix-grid">
      <div v-for="(item, idx) in services" :key="idx" class="service-cell">
        <div class="cell-top">
          <span class="service-icon">{{ item.icon }}</span>
          <span class="service-name">{{ item.name }}</span>
        </div>
        <div class="cell-status" :class="item.status">
          <span class="status-symbol">{{ getStatusSymbol(item.status) }}</span>
          <span>{{ item.desc }}</span>
        </div>
      </div>
    </div>

    <div class="matrix-footer font-mono">
      <span>测试落地: {{ location || '香港 / 日本专线落地' }} | 判定时间: 2026.10</span>
      <span class="matrix-note">* 注: AI风控策略动态变化，若遇拦截请切换同区域其他原生节点</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  brandName: { type: String, default: '光速云' },
  location: { type: String, default: '香港 IEPL / 新加坡 专线' },
  services: {
    type: Array,
    default: () => [
      { name: 'ChatGPT', icon: '🤖', status: 'operational', desc: '原生支持 / 视节点' },
      { name: 'Claude', icon: '🧠', status: 'operational', desc: '全功能支持 / 无需降级' },
      { name: 'Gemini', icon: '✨', status: 'partial', desc: '视具体节点地区支持' },
      { name: 'Netflix', icon: '🍿', status: 'operational', desc: '非自制剧全解锁' },
      { name: 'Disney+', icon: '🏰', status: 'operational', desc: '全区原生解锁' },
      { name: 'YouTube', icon: '📺', status: 'operational', desc: '4K/8K 极速流畅' },
      { name: 'HBO Max', icon: '🎥', status: 'operational', desc: '支持美区/港区' },
      { name: 'TikTok', icon: '🎵', status: 'operational', desc: '跨区直连带原生IP' },
      { name: 'Spotify', icon: '🎧', status: 'operational', desc: '无地区封锁' }
    ]
  }
})

function getStatusSymbol(status) {
  if (status === 'operational') return '✅'
  if (status === 'partial') return '⚠️'
  return '❌'
}
</script>

<style scoped>
.service-matrix-card {
  background: var(--diag-card-bg, #090d16);
  border: 1px solid var(--table-border, #1e293b);
  border-radius: 8px;
  padding: 18px 22px;
  margin: 22px 0;
  box-shadow: var(--diag-card-shadow, 0 4px 20px rgba(0, 0, 0, 0.4));
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--table-border, #1e293b);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.matrix-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--vp-c-text-1, #f1f5f9);
}

.matrix-tag {
  font-size: 11px;
  color: #0284c7;
  background: rgba(2, 132, 199, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(2, 132, 199, 0.25);
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.service-cell {
  background: var(--vp-c-bg-soft, #0f172a);
  border: 1px solid var(--table-border, #1e293b);
  border-radius: 6px;
  padding: 12px 14px;
}

.cell-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-text-1, #e2e8f0);
  margin-bottom: 6px;
}

.cell-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.cell-status.operational { color: #10b981; }
.cell-status.partial { color: #f59e0b; }
.cell-status.down { color: #ef4444; }

.matrix-footer {
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

.matrix-note {
  color: var(--vp-c-text-2, #94a3b8);
}
</style>
