'use strict';

window.purchaseSystem = window.purchaseSystem || {};

/**
 * 采购管理页面控制器。
 * 输入：purchaseSystem.store/actions/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化采购总览、供应商、流程、跟踪或分析页。
 *
 * 原因：采购域需要在多个静态页面间共享供应商和订单状态，集中初始化避免内联脚本重复实现。
 */
purchaseSystem.pages = (function(store, actions, renderers, view) {
  // 渲染采购管理首页的订单摘要行。
  function renderPurchaseIndexRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.supplierName}</td>
        <td><strong>${item.item}</strong></td>
        <td><strong>${formatMoney(item.amount)}</strong></td>
        <td>${item.deliveryDate}</td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
      </tr>
    `;
  }

  // 渲染供应商管理页的供应商行。
  function renderSupplierRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.contact}</td>
        <td>${item.phone}</td>
        <td>${item.category}</td>
        <td>${renderers.stars(item.rating)}</td>
        <td><span class="badge ${renderers.supplierStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染采购流程页的订单流程行。
  function renderProcessRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.supplierName}</td>
        <td><strong>${item.item}</strong></td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${formatMoney(item.unitPrice)}</td>
        <td><strong>${formatMoney(item.amount)}</strong></td>
        <td>${item.createDate}</td>
        <td>${item.deliveryDate}</td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  /**
   * 格式化采购到货剩余天数展示。
   * @param {string} status 采购订单状态。
   * @param {string} deliveryDateText 预计到货日期文本。
   * @returns {string} 可直接放入表格单元格的到货天数 HTML 或文本。
   *
   * 原因：逾期、临近到货和已到货的展示规则嵌套较深，拆出后订单行渲染只负责表格结构。
   */
  function formatDeliveryDaysDisplay(status, deliveryDateText) {
    const today = new Date();
    const deliveryDate = new Date(deliveryDateText);
    const daysLeft = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

    if (status === '已到货') {
      return '—';
    }

    if (daysLeft < 0) {
      return `<span style="color:var(--color-danger);font-weight:600">已逾期 ${Math.abs(daysLeft)} 天</span>`;
    }

    if (daysLeft <= 3) {
      return `<span style="color:var(--color-warning);font-weight:600">${daysLeft} 天</span>`;
    }

    return `${daysLeft} 天`;
  }

  // 渲染到货跟踪页的采购订单行。
  function renderTrackingRow(item) {
    const daysDisplay = formatDeliveryDaysDisplay(item.status, item.deliveryDate);

    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.supplierName}</td>
        <td><strong>${item.item}</strong></td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${item.deliveryDate}</td>
        <td>${daysDisplay}</td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
      </tr>
    `;
  }

  /**
   * 创建采购月度分析行渲染器。
   * @param {number} maxAmount 当前分析周期内最高采购额。
   * @returns {Function} 接收月度数据并返回表格行 HTML 的渲染函数。
   */
  function renderMonthlyAnalysisRow(maxAmount) {
    return (item) => {
      const barWidth = maxAmount ? Math.round((item.amount / maxAmount) * 100) : 0;
      return `
        <tr>
          <td>${item.month}</td>
          <td><strong>${formatMoney(item.amount)}</strong></td>
          <td>${item.orders}</td>
          <td>${barWidth}%</td>
        </tr>
      `;
    };
  }

  /**
   * 创建供应商采购额占比行渲染器。
   * @param {number} total 采购总额。
   * @returns {Function} 接收供应商名称和金额元组并返回表格行 HTML 的渲染函数。
   */
  function renderSupplierAmountRow(total) {
    return ([name, amount]) => {
      const percent = total ? ((amount / total) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td><strong>${name}</strong></td>
          <td>${formatMoney(amount)}</td>
          <td>${percent}%</td>
        </tr>
      `;
    };
  }

  /**
   * 汇总供应商采购额。
   * @param {Array<Object>} orders 采购订单列表。
   * @returns {Object<string, number>} 供应商名称到采购额的映射。
   */
  function collectSupplierAmounts(orders) {
    return orders.reduce((result, item) => {
      result[item.supplierName] = (result[item.supplierName] || 0) + item.amount;
      return result;
    }, {});
  }


  // 初始化采购管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('order-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const data = store.sync();
    renderers.stats([
      { icon: 'user-handshake', value: data.suppliers.filter((item) => item.status === '合作中').length, label: '合作供应商' },
      { icon: 'clipboard-list', value: data.orders.length, label: '采购订单' },
      { icon: 'currency-dollar', value: formatMoney(data.orders.reduce((sum, item) => sum + item.amount, 0)), label: '采购总额' },
      { icon: 'circle-check', value: data.orders.filter((item) => item.status === '已到货').length, label: '已到货' }
    ]);

    view.renderRows(tbody, data.orders, renderPurchaseIndexRow, { colspan: 6, text: '暂无采购订单' });

    tbody.dataset.bound = '1';
  }

  // 初始化供应商管理页。
  function initSupplierPage() {
    const tbody = document.getElementById('supplier-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑供应商' : '新增供应商';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-contact').value = data ? data.contact : '';
      document.getElementById('f-phone').value = data ? data.phone : '';
      document.getElementById('f-category').value = data ? data.category : '原材料';
      document.getElementById('f-rating').value = data ? data.rating : '3';
      document.getElementById('f-status').value = data ? data.status : '合作中';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入供应商名称'; return null; }
      return {
        name: name,
        contact: view.getTrimmedValue('f-contact'),
        phone: view.getTrimmedValue('f-phone'),
        category: view.getValue('f-category'),
        rating: view.getValue('f-rating'),
        status: view.getValue('f-status')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateSupplier(editingId, payload);
      } else {
        actions.createSupplier(payload);
      }
      closeModal();
      refresh();
    }

    // 渲染供应商筛选结果。
    function render(list) {
      const suppliers = store.sync().suppliers;
      const active = suppliers.filter((item) => item.status === '合作中').length;
      renderers.stats([
        { icon: 'user-handshake', value: suppliers.length, label: '供应商总数' },
        { icon: 'circle-check', value: active, label: '合作中' },
        { icon: 'player-pause', value: suppliers.length - active, label: '已暂停' }
      ]);

      view.renderRows(tbody, list, renderSupplierRow, { colspan: 8, text: '暂无供应商' });
    }

    // 刷新供应商列表。
    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().suppliers, keyword, ['name', 'contact']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().suppliers.find((s) => s.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该供应商？', () => actions.deleteSupplier(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化采购流程页。
  function initProcessPage() {
    const tbody = document.getElementById('order-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑采购单' : '新建采购单';
      document.getElementById('f-supplierName').value = data ? data.supplierName : '';
      document.getElementById('f-item').value = data ? data.item : '';
      document.getElementById('f-quantity').value = data ? data.quantity : '';
      document.getElementById('f-unit').value = data ? data.unit : '吨';
      document.getElementById('f-unitPrice').value = data ? data.unitPrice : '';
      document.getElementById('f-status').value = data ? data.status : '待审核';
      document.getElementById('f-deliveryDate').value = data ? data.deliveryDate : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const supplierName = view.getTrimmedValue('f-supplierName');
      const item = view.getTrimmedValue('f-item');
      if (!supplierName) { errorEl.textContent = '请输入供应商名称'; return null; }
      if (!item) { errorEl.textContent = '请输入采购物料'; return null; }
      return {
        supplierName: supplierName,
        item: item,
        quantity: view.getValue('f-quantity'),
        unit: view.getTrimmedValue('f-unit'),
        unitPrice: view.getValue('f-unitPrice'),
        status: view.getValue('f-status'),
        deliveryDate: view.getValue('f-deliveryDate')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateOrder(editingId, payload);
      } else {
        actions.createOrder(payload);
      }
      closeModal();
      refresh();
    }

    // 渲染采购流程筛选结果。
    function render(list) {
      const orders = store.sync().orders;
      renderers.stats([
        { icon: 'clipboard-list', value: orders.length, label: '订单总数' },
        { icon: 'currency-dollar', value: formatMoney(orders.reduce((sum, item) => sum + item.amount, 0)), label: '采购总额' },
        { icon: 'circle-check', value: orders.filter((item) => item.status === '已到货').length, label: '已到货' }
      ]);

      view.renderRows(tbody, list, renderProcessRow, { colspan: 10, text: '暂无采购流程记录' });
    }

    // 刷新采购流程列表。
    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const status = view.getValue('status-filter');
      const list = view.filterByKeyword(store.sync().orders, keyword, ['supplierName', 'item'])
        .filter((item) => !status || item.status === status);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('status-filter'), 'change', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().orders.find((o) => o.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该采购订单？', () => actions.deleteOrder(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化到货跟踪页。
  function initTrackingPage() {
    const tbody = document.getElementById('tracking-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    function render() {
      const orders = store.sync().orders;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(orders, keyword, ['supplierName', 'item']) : orders;

      renderers.stats([
        { icon: 'truck', value: orders.filter((item) => item.status === '运输中').length, label: '运输中' },
        { icon: '⏳', value: orders.filter((item) => item.status === '待发货' || item.status === '待审核').length, label: '待发货/待审核' },
        { icon: 'circle-check', value: orders.filter((item) => item.status === '已到货').length, label: '已到货' }
      ]);

      view.renderRows(tbody, filtered, renderTrackingRow, { colspan: 7, text: '暂无到货跟踪' });
    }

    on(document.getElementById('search-input'), 'input', render);

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化采购分析页。
  function initAnalysisPage() {
    const analysisBody = document.getElementById('analysis-tbody');
    const supplierBody = document.getElementById('supplier-tbody');
    if (!analysisBody || !supplierBody || analysisBody.dataset.bound === '1') return;

    const state = store.sync();
    const monthly = state.analysis.monthly || [];
    const totalAmount = monthly.reduce((sum, item) => sum + item.amount, 0);
    const totalOrders = monthly.reduce((sum, item) => sum + item.orders, 0);
    const maxAmount = Math.max.apply(null, monthly.map((item) => item.amount).concat([0]));
    const avgAmount = monthly.length ? Math.round(totalAmount / monthly.length) : 0;

    renderers.stats([
      { icon: 'currency-dollar', value: formatMoney(totalAmount), label: '6个月采购总额' },
      { icon: 'clipboard-list', value: totalOrders, label: '6个月总订单数' },
      { icon: 'chart-line', value: formatMoney(maxAmount), label: '单月最高采购额' },
      { icon: 'chart-bar', value: formatMoney(avgAmount), label: '月均采购额' }
    ]);

    view.renderRows(analysisBody, monthly, renderMonthlyAnalysisRow(maxAmount), { colspan: 4, text: '暂无采购分析数据' });

    const supplierMap = collectSupplierAmounts(state.orders);
    const supplierTotal = Object.values(supplierMap).reduce((sum, value) => sum + value, 0);
    const supplierRows = Object.entries(supplierMap).sort((a, b) => b[1] - a[1]);
    view.renderRows(supplierBody, supplierRows, renderSupplierAmountRow(supplierTotal), { colspan: 3, text: '暂无供应商占比' });

    // 绘制月度采购趋势柱状图。
    var chartCanvas = document.getElementById('purchase-trend-chart');
    if (chartCanvas && typeof EnterpriseCharts !== 'undefined') {
      var labels = monthly.map(function(m) {
        var parts = m.month.split('-');
        return parts[1] + '月';
      });
      var values = monthly.map(function(m) { return m.amount; });

      function draw() {
        EnterpriseCharts.barChart(chartCanvas, {
          labels: labels,
          values: values,
          title: '',
          valuePrefix: '¥'
        });
      }

      draw();
      EnterpriseCharts.autoResize(chartCanvas, draw);
    }

    analysisBody.dataset.bound = '1';
  }

  // 按当前采购管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('order-tbody')) initIndexPage();
        break;
      case 'supplier.html':
        initSupplierPage();
        break;
      case 'process.html':
        initProcessPage();
        break;
      case 'tracking.html':
        initTrackingPage();
        break;
      case 'analysis.html':
        initAnalysisPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(purchaseSystem.store, purchaseSystem.actions, purchaseSystem.renderers, EnterpriseView);

// 对外暴露采购管理初始化入口，供 module-loader.js 调用。
purchaseSystem.init = function() {
  try {
    purchaseSystem.pages.init();
  } catch (error) {
    console.error('purchaseSystem.init failed:', error);
  }
};

// 对外暴露采购管理状态快照，供调试和兼容 API 使用。
purchaseSystem.getState = function() {
  return purchaseSystem.store.snapshot();
};
