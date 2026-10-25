<template>
  <div class="airport-card" :class="{ 'is-top': rank === 1 }">
    <div class="card-badge-row">
      <div class="rank-badge font-mono" :class="'rank-' + rank">
        #{{ rank }} {{ rank === 1 ? '年度主推' : '优选推荐' }}
      </div>
      <div class="line-badge font-mono">{{ architecture }}</div>
    </div>

    <div class="card-header">
      <h3 class="card-title">{{ name }}</h3>
      <div class="card-price font-mono">
        <span class="price-num">{{ price }}</span>
        <span class="price-cycle">{{ cycle }}</span>
      </div>
    </div>

    <p class="card-desc">{{ description }}</p>

    <div class="feature-tags">
      <span v-for="(tag, i) in tags" :key="i" class="tag-item">{{ tag }}</span>
    </div>

    <div class="promo-box" v-if="promoCode">
      <span class="promo-label">专属优惠码:</span>
      <span class="promo-code font-mono">{{ promoCode }}</span>
    </div>

    <div class="card-actions">
      <a :href="affLink" target="_blank" rel="nofollow sponsored noopener" class="aff-btn">
        进入官网 / 立即体验 →
      </a>
      <a v-if="detailLink" :href="detailLink" class="info-btn">
        评测与实测数据
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rank: { type: Number, default: 1 },
  name: { type: String, required: true },
  architecture: { type: String, default: 'IEPL 专线' },
  price: { type: String, default: '¥99' },
  cycle: { type: String, default: '/年起' },
  description: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  promoCode: { type: String, default: '' },
  affLink: { type: String, required: true },
  detailLink: { type: String, default: '' }
})
</script>

<style scoped>
.airport-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: transform 0.2s, border-color 0.2s;
}

.airport-card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
}

.airport-card.is-top {
  border-color: #0284c7;
  background: linear-gradient(180deg, #132238 0%, #0f172a 100%);
  box-shadow: 0 4px 20px rgba(2, 132, 199, 0.2);
}

.card-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rank-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.rank-1 { background: #0284c7; color: #fff; }
.rank-2, .rank-3 { background: #0f766e; color: #ccfbf1; }
.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

html:not(.dark) .rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.line-badge {
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.card-title {
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 700;
  color: #f8fafc;
  border: none !important;
  padding: 0 !important;
}

.card-price {
  color: #38bdf8;
}
.price-num {
  font-size: 18px;
  font-weight: 700;
}
.price-cycle {
  font-size: 12px;
  color: #94a3b8;
}

.card-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 14px 0;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.tag-item {
  font-size: 11.5px;
  background: #1e293b;
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
}

.promo-box {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.promo-label { color: #f59e0b; }
.promo-code { color: #fbbf24; font-weight: 700; }

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.aff-btn {
  flex: 1;
  text-align: center;
  background: #0284c7;
  color: #ffffff !important;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none !important;
  transition: background 0.2s;
}
.aff-btn:hover {
  background: #0369a1;
}

.info-btn {
  text-align: center;
  background: #1e293b;
  color: #cbd5e1 !important;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  text-decoration: none !important;
  transition: background 0.2s;
}
.info-btn:hover {
  background: #334155;
  color: #fff !important;
}

html:not(.dark) .airport-card {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
html:not(.dark) .airport-card.is-top {
  background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
  border-color: #0284c7;
}
html:not(.dark) .card-title {
  color: #0f172a !important;
}
html:not(.dark) .card-desc {
  color: #475569;
}
html:not(.dark) .tag-item {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #334155;
}
html:not(.dark) .promo-box {
  background: #fefce8;
  border-color: #fef08a;
}
html:not(.dark) .info-btn {
  background: #f1f5f9;
  color: #334155 !important;
  border-color: #cbd5e1;
}
</style>
