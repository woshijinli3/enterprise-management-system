'use strict';

window.purchaseSystem = window.purchaseSystem || {};

purchaseSystem.renderers = (function(view) {
  const orderStatusMap = { 已到货: 'badge-success', 运输中: 'badge-info', 待发货: 'badge-warning', 待审核: 'badge-default' };
  const supplierStatusMap = { 合作中: 'badge-success', 暂停: 'badge-warning' };

  /**
   * 渲染采购管理页面顶部统计卡片。
   * @param {Array<{icon: string, value: string|number, label: string}>} items 指标配置。
   * @returns {void}
   */
  function stats(items) {
    view.setHtml('stats-grid', view.renderStats(items));
  }

  /**
   * 渲染供应商评级星级。
   * @param {number} rating 1 到 5 的评级值。
   * @returns {string} 星级 HTML。
   */
  function stars(rating) {
    return '<i class="ti ti-star-filled" style="color:var(--color-warning)"></i>'.repeat(rating) + '<i class="ti ti-star" style="color:var(--color-text-disabled)"></i>'.repeat(5 - rating);
  }

  return {
    stats,
    stars,
    orderStatusMap,
    supplierStatusMap
  };
})(EnterpriseView);
