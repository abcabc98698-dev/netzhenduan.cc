<template>
  <div class="disaster-recovery-box">
    <div class="box-header">
      <div class="box-badge">
        <span class="warning-icon">⚠️</span>
        <span>网络排障决策分支：服务器与节点故障应急响应</span>
      </div>
      <span class="box-tag font-mono">STATUS: HIGH_AVAILABILITY_FALLBACK</span>
    </div>

    <div class="box-desc">
      若您已完成前述步骤（确认本地网络畅通、系统代理开启且端口正确），但<strong>所有节点依然全部超时、测速全红或订阅无法更新</strong>，这通常意味着当前机场的<strong>国内中转入口被封锁、服务器宕机或发生服务异常</strong>。此时继续折腾客户端已无意义，建议启动<strong>跨机房独立专线应急备用方案</strong>：
    </div>

    <div class="box-grid">
      <!-- 推荐1：光速云（主推专线） -->
      <div class="recovery-card featured">
        <div class="card-ribbon">主推 · 旗舰专线</div>
        <div class="card-title-row">
          <span class="brand-name">光速云 (Guangsu)</span>
          <span class="brand-arch font-mono">双线路 IEPL 专线</span>
        </div>
        <div class="card-specs">
          <div class="spec-item"><span class="k">起步门槛：</span><span class="v font-mono">¥99/年 (约8元/月)</span></div>
          <div class="spec-item"><span class="k">线路特点：</span><span class="v">企业级内网+独立专线, 晚高峰0丢包</span></div>
          <div class="spec-item"><span class="k">专属优惠：</span><span class="v font-mono code-box">AMM</span></div>
        </div>
        <div class="card-bottom">
          <a href="https://sahude.gsyvipaff.com/#/?code=keqgvT5Y" target="_blank" rel="nofollow sponsored noopener" class="action-btn primary">
            获取光速云应急备用线路 →
          </a>
          <a href="/airports/guangsu" class="detail-link">实测数据与详情</a>
        </div>
      </div>

      <!-- 推荐2：飞猫云（免配置专属端） -->
      <div class="recovery-card">
        <div class="card-ribbon secondary">小白免配置</div>
        <div class="card-title-row">
          <span class="brand-name">飞猫云 (Feimao)</span>
          <span class="brand-arch font-mono">专属客户端直连</span>
        </div>
        <div class="card-specs">
          <div class="spec-item"><span class="k">起步门槛：</span><span class="v font-mono">¥7/月 (50GB/月)</span></div>
          <div class="spec-item"><span class="k">线路特点：</span><span class="v">免导入订阅, 官方客户端登录即连</span></div>
          <div class="spec-item"><span class="k">专属优惠：</span><span class="v font-mono code-box">flycat888</span></div>
        </div>
        <div class="card-bottom">
          <a href="https://guangs.flycataff.com/#/?code=6uq0Xe9y" target="_blank" rel="nofollow sponsored noopener" class="action-btn">
            访问飞猫云客户端 →
          </a>
          <a href="/airports/feimao" class="detail-link">实测数据与详情</a>
        </div>
      </div>

      <!-- 推荐3：微风网络（性价比IEPL） -->
      <div class="recovery-card">
        <div class="card-ribbon tertiary">性价比专线</div>
        <div class="card-title-row">
          <span class="brand-name">微风网络 (Breeze)</span>
          <span class="brand-arch font-mono">IEPL 专线 + VLESS</span>
        </div>
        <div class="card-specs">
          <div class="spec-item"><span class="k">起步门槛：</span><span class="v font-mono">¥137/年 (100GB/月)</span></div>
          <div class="spec-item"><span class="k">线路特点：</span><span class="v">全原生 IP 覆盖, 7×24小时真人/AI客服</span></div>
          <div class="spec-item"><span class="k">专属优惠：</span><span class="v font-mono code-box">flat888</span></div>
        </div>
        <div class="card-bottom">
          <a href="https://edp01.breezenetaff.com/#/?code=t3huofyI" target="_blank" rel="nofollow sponsored noopener" class="action-btn">
            获取微风网络专线 →
          </a>
          <a href="/airports/weifeng" class="detail-link">实测数据与详情</a>
        </div>
      </div>
    </div>

    <div class="box-footer">
      <span>💡 更多预算需求？预算极限用户可考虑 <a href="/airports/#budget">5.6元/月极限平价方案 (大佬云/闪电鼠)</a> 或查看 <a href="/airports/">2026 稳定机场横向评测与选型指南 →</a></span>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.disaster-recovery-box {
  background: linear-gradient(180deg, #131d31 0%, #090d16 100%);
  border: 1px solid #334155;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 20px;
  margin: 28px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.box-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #fbbf24;
}

.box-tag {
  font-size: 11px;
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

html:not(.dark) .box-tag {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.box-desc {
  font-size: 13.5px;
  color: #cbd5e1;
  line-height: 1.6;
  margin-bottom: 16px;
}

.box-desc strong {
  color: #f1f5f9;
}

.box-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.recovery-card {
  position: relative;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.recovery-card.featured {
  border-color: #0284c7;
  background: #0f1c34;
}

.card-ribbon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #0284c7;
  color: #ffffff;
  padding: 1px 7px;
  border-radius: 4px;
}
.card-ribbon.secondary {
  background: #10b981;
}
.card-ribbon.tertiary {
  background: #6366f1;
}

.card-title-row {
  margin-bottom: 12px;
}
.brand-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}
.brand-arch {
  display: block;
  font-size: 12px;
  color: #38bdf8;
  margin-top: 2px;
}

.card-specs {
  font-size: 12.5px;
  margin-bottom: 16px;
}
.spec-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  line-height: 1.4;
}
.spec-item .k {
  color: #64748b;
}
.spec-item .v {
  color: #e2e8f0;
  text-align: right;
}
.code-box {
  background: #1e293b;
  color: #fbbf24;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 700;
}

.card-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: block;
  text-align: center;
  padding: 8px 12px;
  background: #1e293b;
  color: #38bdf8;
  border: 1px solid #334155;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.action-btn:hover {
  background: #334155;
  color: #ffffff;
}
.action-btn.primary {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}
.action-btn.primary:hover {
  background: #0369a1;
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
}

.detail-link {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
}
.detail-link:hover {
  color: #cbd5e1;
  text-decoration: underline;
}

.box-footer {
  font-size: 12.5px;
  color: #94a3b8;
  border-top: 1px solid #1e293b;
  padding-top: 12px;
}
.box-footer a {
  color: #38bdf8;
  text-decoration: none;
}
.box-footer a:hover {
  text-decoration: underline;
}

html:not(.dark) .disaster-recovery-box {
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
html:not(.dark) .box-desc {
  color: #334155;
}
html:not(.dark) .box-desc strong {
  color: #0f172a;
}
html:not(.dark) .recovery-card {
  background: #ffffff;
  border-color: #e2e8f0;
}
html:not(.dark) .recovery-card.featured {
  background: #f0f9ff;
  border-color: #0284c7;
}
html:not(.dark) .brand-name {
  color: #0f172a;
}
html:not(.dark) .spec-item .k {
  color: #64748b;
}
html:not(.dark) .spec-item .v {
  color: #1e293b;
}
html:not(.dark) .box-footer {
  color: #64748b;
  border-top-color: #e2e8f0;
}
</style>
