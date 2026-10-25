<template>
  <div class="airport-filter-container">
    <!-- 头部与快速检索控制栏 -->
    <div class="filter-header">
      <div class="filter-title-row">
        <div class="filter-heading">
          <span class="filter-icon">⚡</span>
          <span class="filter-title">42 家机场品牌全景结构化数据多维筛选器</span>
        </div>
        <div class="filter-badge font-mono">
          收录: 42 家 | 匹配: {{ filteredList.length }} 家
        </div>
      </div>

      <!-- 搜索输入框 -->
      <div class="search-row">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索品牌名称、线路卖点、协议或优惠码（如：光速云、免配置、原生IP、AMM）..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
        </div>
        <button v-if="hasActiveFilter" class="reset-btn" @click="resetFilters">
          重置筛选
        </button>
      </div>

      <!-- 维度过滤按钮组 -->
      <div class="filter-groups">
        <!-- 线路类型 -->
        <div class="filter-group">
          <span class="group-label">线路架构:</span>
          <div class="group-options">
            <button
              v-for="opt in archOptions"
              :key="opt.value"
              :class="['filter-chip', { active: selectedArch === opt.value }]"
              @click="selectedArch = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 协议支持 -->
        <div class="filter-group">
          <span class="group-label">底层协议:</span>
          <div class="group-options">
            <button
              v-for="opt in protoOptions"
              :key="opt.value"
              :class="['filter-chip', { active: selectedProto === opt.value }]"
              @click="selectedProto = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 价格预算 -->
        <div class="filter-group">
          <span class="group-label">折合月费:</span>
          <div class="group-options">
            <button
              v-for="opt in priceOptions"
              :key="opt.value"
              :class="['filter-chip', { active: selectedPrice === opt.value }]"
              @click="selectedPrice = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 客户端模式 -->
        <div class="filter-group">
          <span class="group-label">客户端模式:</span>
          <div class="group-options">
            <button
              v-for="opt in clientOptions"
              :key="opt.value"
              :class="['filter-chip', { active: selectedClient === opt.value }]"
              @click="selectedClient = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据呈现表格 (桌面端) -->
    <div class="table-wrapper">
      <table class="filter-table">
        <thead>
          <tr>
            <th style="width: 140px;">品牌 / 市场排名</th>
            <th style="width: 150px;">线路 / 协议</th>
            <th style="width: 140px;">客户端模式</th>
            <th style="width: 130px;">起步套餐 / 月均</th>
            <th style="width: 140px;">测速 / 延迟</th>
            <th>AI / 流媒体解锁</th>
            <th style="width: 90px;">优惠码</th>
            <th style="width: 100px; text-align: center;">直达入口</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredList" :key="item.id" :class="{ 'highlight-row': item.rank.includes('主推') }">
            <td>
              <div class="brand-col">
                <span class="brand-name">{{ item.name }}</span>
                <span class="brand-rank" :class="getRankClass(item.rank)">{{ item.rank }}</span>
              </div>
            </td>
            <td>
              <div class="arch-col">
                <span class="arch-badge">{{ item.architecture }}</span>
                <span class="proto-tag font-mono">{{ item.protocol }}</span>
              </div>
            </td>
            <td>
              <span class="client-text">{{ item.clientMode }}</span>
            </td>
            <td>
              <div class="price-col">
                <span class="price-entry">{{ item.entryPlan }}</span>
                <span class="price-equiv font-mono">{{ item.monthlyPrice }}</span>
              </div>
            </td>
            <td>
              <span class="speed-badge font-mono">{{ item.speed }}</span>
            </td>
            <td>
              <div class="unlock-col">
                <span class="unlock-text">{{ item.unlock }}</span>
                <span class="feature-subtext">{{ item.features }}</span>
              </div>
            </td>
            <td>
              <code v-if="item.promoCode !== '待核实'" class="promo-code font-mono">{{ item.promoCode }}</code>
              <span v-else class="text-muted">待核实</span>
            </td>
            <td style="text-align: center;">
              <a
                v-if="item.affLink && item.affLink.startsWith('http')"
                :href="item.affLink"
                target="_blank"
                rel="nofollow sponsored noopener"
                class="direct-btn"
              >
                前往核验 ↗
              </a>
              <span v-else class="unverified-tag">待核实</span>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="8" class="empty-cell">
              未找到符合条件的品牌。请尝试调整筛选条件或重置筛选。
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 底部说明与合规声明 -->
    <div class="filter-footer font-mono">
      <span>* 数据依据 42 家机场品牌资料与网络诊断实验室实测交叉核验更新。本表按月度巡检校准，未知项严格标注为“待核实”。</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import rawData from '../data/airportsData.json'

const airports = ref(rawData)

// 筛选状态
const searchQuery = ref('')
const selectedArch = ref('ALL')
const selectedProto = ref('ALL')
const selectedPrice = ref('ALL')
const selectedClient = ref('ALL')

const archOptions = [
  { label: '全部线路', value: 'ALL' },
  { label: 'IEPL 专线', value: 'IEPL' },
  { label: 'IPLC 专线', value: 'IPLC' },
  { label: 'BGP 智能调度', value: 'BGP' },
  { label: '专线直连', value: '专线直连' },
  { label: '中转优化', value: '中转' }
]

const protoOptions = [
  { label: '全部协议', value: 'ALL' },
  { label: 'VLESS', value: 'VLESS' },
  { label: 'Trojan', value: 'Trojan' },
  { label: 'Shadowsocks', value: 'Shadowsocks' },
  { label: '专属协议', value: '专属' }
]

const priceOptions = [
  { label: '全部预算', value: 'ALL' },
  { label: '¥10以下/月 (平价入门)', value: 'low' },
  { label: '¥10-¥25/月 (主流均衡)', value: 'mid' },
  { label: '¥25以上/月 (高端旗舰)', value: 'high' }
]

const clientOptions = [
  { label: '全部客户端', value: 'ALL' },
  { label: '官方专属端 (免配订阅)', value: 'exclusive' },
  { label: '第三方兼容 (Clash/小火箭)', value: 'thirdparty' }
]

const hasActiveFilter = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedArch.value !== 'ALL' ||
    selectedProto.value !== 'ALL' ||
    selectedPrice.value !== 'ALL' ||
    selectedClient.value !== 'ALL'
  )
})

function resetFilters() {
  searchQuery.value = ''
  selectedArch.value = 'ALL'
  selectedProto.value = 'ALL'
  selectedPrice.value = 'ALL'
  selectedClient.value = 'ALL'
}

function getRankClass(rank) {
  if (rank.includes('#1')) return 'rank-top1'
  if (rank.includes('#2') || rank.includes('#3')) return 'rank-top3'
  return 'rank-regular'
}

const filteredList = computed(() => {
  return airports.value.filter((item) => {
    // 搜索词过滤
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = item.name.toLowerCase().includes(q)
      const matchEn = (item.enName || '').toLowerCase().includes(q)
      const matchArch = item.architecture.toLowerCase().includes(q)
      const matchProto = item.protocol.toLowerCase().includes(q)
      const matchPromo = item.promoCode.toLowerCase().includes(q)
      const matchFeatures = (item.features || '').toLowerCase().includes(q)
      const matchUnlock = (item.unlock || '').toLowerCase().includes(q)
      if (!matchName && !matchEn && !matchArch && !matchProto && !matchPromo && !matchFeatures && !matchUnlock) {
        return false
      }
    }

    // 线路过滤
    if (selectedArch.value !== 'ALL') {
      if (selectedArch.value === 'IEPL' && !item.architecture.includes('IEPL')) return false
      if (selectedArch.value === 'IPLC' && !item.architecture.includes('IPLC')) return false
      if (selectedArch.value === 'BGP' && !item.architecture.includes('BGP')) return false
      if (selectedArch.value === '专线直连' && !item.architecture.includes('直连') && !item.architecture.includes('中继')) return false
      if (selectedArch.value === '中转' && !item.architecture.includes('中转')) return false
    }

    // 协议过滤
    if (selectedProto.value !== 'ALL') {
      if (selectedProto.value === 'VLESS' && !item.protocol.includes('VLESS')) return false
      if (selectedProto.value === 'Trojan' && !item.protocol.includes('Trojan')) return false
      if (selectedProto.value === 'Shadowsocks' && !item.protocol.includes('Shadowsocks') && !item.protocol.includes('SS')) return false
      if (selectedProto.value === '专属' && !item.protocol.includes('专属')) return false
    }

    // 价格过滤
    if (selectedPrice.value !== 'ALL') {
      if (item.priceTier !== selectedPrice.value) return false
    }

    // 客户端过滤
    if (selectedClient.value !== 'ALL') {
      if (selectedClient.value === 'exclusive') {
        if (!item.clientMode.includes('专属') && !item.clientMode.includes('自研')) return false
      }
      if (selectedClient.value === 'thirdparty') {
        if (!item.clientMode.includes('第三方') && !item.clientMode.includes('兼容') && !item.clientMode.includes('通用')) return false
      }
    }

    return true
  })
})
</script>

<style scoped>
.airport-filter-container {
  background: var(--diag-card-bg, #090d16);
  border: 1px solid var(--diag-card-border, #1e293b);
  border-radius: 8px;
  padding: 18px 20px;
  margin: 24px 0;
  box-shadow: var(--diag-card-shadow, 0 4px 20px rgba(0, 0, 0, 0.4));
}

.filter-header {
  border-bottom: 1px solid var(--table-border, #1e293b);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.filter-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  font-size: 18px;
}

.filter-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1, #f1f5f9);
}

.filter-badge {
  font-size: 12px;
  color: #0284c7;
  background: rgba(2, 132, 199, 0.1);
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(2, 132, 199, 0.25);
}

.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.search-box {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 34px;
  background: var(--vp-c-bg-soft, #0f172a);
  border: 1px solid var(--table-border, #334155);
  border-radius: 6px;
  color: var(--vp-c-text-1, #f1f5f9);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #0284c7;
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.reset-btn {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.filter-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2, #94a3b8);
  width: 80px;
}

.group-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  background: var(--vp-c-bg-soft, #0f172a);
  border: 1px solid var(--table-border, #334155);
  color: var(--vp-c-text-2, #cbd5e1);
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.filter-chip:hover {
  border-color: #0284c7;
  color: var(--vp-c-text-1, #f8fafc);
}

.filter-chip.active {
  background: rgba(2, 132, 199, 0.15);
  border-color: #0284c7;
  color: #0284c7;
  font-weight: 600;
}

/* 表格展示 - 保证超宽不挤压 */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--table-border, #1e293b);
  border-radius: 6px;
}

.filter-table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.filter-table th {
  background: var(--table-header-bg, #0f172a);
  color: var(--vp-c-text-2, #94a3b8);
  font-size: 12px;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid var(--table-border, #1e293b);
  white-space: nowrap;
}

.filter-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--table-border, #1e293b);
  vertical-align: middle;
  background: var(--vp-c-bg, #090d16);
  color: var(--vp-c-text-1);
}

.filter-table tr:nth-child(2n) td {
  background: var(--table-zebra-bg, rgba(255, 255, 255, 0.025));
}

.filter-table tr:hover td {
  background: var(--table-hover-bg, rgba(56, 189, 248, 0.05));
}

.highlight-row td {
  background: rgba(2, 132, 199, 0.06) !important;
}

.brand-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.brand-name {
  font-weight: 700;
  color: var(--vp-c-text-1, #f1f5f9);
}

.brand-rank {
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  width: fit-content;
  white-space: nowrap;
}

.rank-top1 {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.rank-top3 {
  background: rgba(2, 132, 199, 0.15);
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.3);
}

.rank-regular {
  background: rgba(148, 163, 184, 0.15);
  color: var(--vp-c-text-1, #cbd5e1);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

html:not(.dark) .rank-regular {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.arch-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.arch-badge {
  font-size: 12px;
  color: var(--vp-c-text-1, #cbd5e1);
}

.proto-tag {
  font-size: 10px;
  color: #10b981;
  white-space: nowrap;
}

.client-text {
  font-size: 12px;
  color: var(--vp-c-text-2, #94a3b8);
}

.price-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.price-entry {
  font-size: 12px;
  color: var(--vp-c-text-1, #cbd5e1);
  white-space: nowrap;
}

.price-equiv {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
  white-space: nowrap;
}

.speed-badge {
  font-size: 11px;
  color: #0284c7;
  background: rgba(2, 132, 199, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  white-space: nowrap;
}

.unlock-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.unlock-text {
  font-size: 12px;
  color: var(--vp-c-text-1, #e2e8f0);
}

.feature-subtext {
  font-size: 11px;
  color: #64748b;
  line-height: 1.3;
}

.promo-code {
  font-size: 11px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.text-muted {
  font-size: 11px;
  color: var(--vp-c-text-2, #94a3b8);
}

.direct-btn {
  display: inline-block;
  background: rgba(2, 132, 199, 0.15);
  border: 1px solid rgba(2, 132, 199, 0.4);
  color: #0284c7 !important;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none !important;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.direct-btn:hover {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff !important;
}

.unverified-tag {
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  white-space: nowrap;
}

html:not(.dark) .unverified-tag {
  color: #475569;
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.empty-cell {
  text-align: center;
  padding: 32px;
  color: var(--vp-c-text-2, #94a3b8);
  font-size: 14px;
}

.filter-footer {
  margin-top: 14px;
  font-size: 12px;
  color: var(--vp-c-text-2, #94a3b8);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .group-label {
    width: 100%;
    margin-bottom: 2px;
  }
}
</style>
