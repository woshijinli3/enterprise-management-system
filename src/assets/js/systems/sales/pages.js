'use strict';

window.salesSystem = window.salesSystem || {};

/**
 * 销售管理页面控制器。
 * 输入：salesSystem.store/actions/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化销售总览、客户、订单、定价、报表或团队页。
 *
 * 原因：销售域页面共享客户、订单、定价和团队状态，集中分发能保持筛选和统计刷新一致。
 */
salesSystem.pages = (function(store, actions, renderers, view) {
  // 渲染销售管理首页的订单摘要行。
  function renderSalesIndexRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.customerName}</td>
        <td>${item.product}</td>
        <td><strong>${formatMoney(item.amount)}</strong></td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
      </tr>
    `;
  }

  // 渲染客户管理页的客户行。
  function renderCustomerRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.contact}</td>
        <td>${item.phone}</td>
        <td>${item.city}</td>
        <td><span class="badge ${renderers.levelMap[item.level] || 'badge-default'}">${item.level}</span></td>
        <td>${formatMoney(item.totalAmount)}</td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染销售订单页的订单行。
  function renderOrderRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.customerName}</td>
        <td><strong>${item.product}</strong></td>
        <td>${item.quantity}</td>
        <td>${formatMoney(item.unitPrice)}</td>
        <td><strong>${formatMoney(item.amount)}</strong></td>
        <td>${item.createDate}</td>
        <td>${item.deliveryDate}</td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染价格策略页的定价行。
  function renderPricingRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.product}</strong></td>
        <td>${formatMoney(item.standardPrice)}</td>
        <td><strong style="color:var(--color-primary)">${formatMoney(item.currentPrice)}</strong></td>
        <td>${item.discount < 1 ? `<span class="badge badge-warning">${(item.discount * 10).toFixed(1)}折</span>` : '—'}</td>
        <td>${item.validFrom} ~ ${item.validTo}</td>
        <td><span class="badge badge-success">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  /**
   * 创建销售月度报表行渲染器。
   * @param {number} maxRevenue 当前报表周期内最高销售额。
   * @returns {Function} 接收月度报表数据并返回表格行 HTML 的渲染函数。
   */
  function renderMonthlyReportRow(maxRevenue) {
    return (item) => {
      const barWidth = maxRevenue ? Math.round((item.revenue / maxRevenue) * 100) : 0;
      return `
        <tr>
          <td>${item.month}</td>
          <td><strong>${formatMoney(item.revenue)}</strong></td>
          <td>${item.orders}</td>
          <td>${item.newCustomers}</td>
          <td>${barWidth}%</td>
        </tr>
      `;
    };
  }

  // 渲染销售团队页的团队成员行。
  function renderTeamRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.role}</td>
        <td>${item.region}</td>
        <td>${formatMoney(item.target)}</td>
        <td>${formatMoney(item.achieved)}</td>
        <td>${(item.rate * 100).toFixed(1)}%</td>
      </tr>
    `;
  }


  // 初始化销售管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('order-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const data = store.sync();
    renderers.stats([
      { icon: 'currency-dollar', value: formatMoney(data.orders.reduce((sum, item) => sum + item.amount, 0)), label: '本月销售额' },
      { icon: 'clipboard-list', value: data.orders.length, label: '订单总数' },
      { icon: 'circle-check', value: data.orders.filter((item) => item.status === '已完成').length, label: '已完成订单' },
      { icon: 'star', value: data.customers.filter((item) => item.level === 'VIP').length, label: 'VIP客户' }
    ]);

    view.renderRows(tbody, data.orders.slice(0, 5), renderSalesIndexRow, { colspan: 5, text: '暂无销售订单' });

    tbody.dataset.bound = '1';
  }

  // 初始化客户管理页。
  function initCustomerPage() {
    const tbody = document.getElementById('customer-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const form = document.getElementById('customer-form');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑客户' : '新增客户';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-contact').value = data ? data.contact : '';
      document.getElementById('f-phone').value = data ? data.phone : '';
      document.getElementById('f-email').value = data ? data.email : '';
      document.getElementById('f-city').value = data ? data.city : '';
      document.getElementById('f-level').value = data ? data.level : '普通';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入客户名称'; return null; }
      return {
        name: name,
        contact: view.getTrimmedValue('f-contact'),
        phone: view.getTrimmedValue('f-phone'),
        email: view.getTrimmedValue('f-email'),
        city: view.getTrimmedValue('f-city'),
        level: view.getValue('f-level')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateCustomer(editingId, payload);
      } else {
        actions.createCustomer(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      const customers = store.sync().customers;
      renderers.stats([
        { icon: 'user-handshake', value: customers.length, label: '客户总数' },
        { icon: 'star', value: customers.filter((item) => item.level === 'VIP').length, label: 'VIP客户' },
        { icon: 'currency-dollar', value: formatMoney(customers.reduce((sum, item) => sum + item.totalAmount, 0)), label: '累计销售额' }
      ]);
      view.renderRows(tbody, list, renderCustomerRow, { colspan: 8, text: '暂无客户' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().customers, keyword, ['name', 'contact']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().customers.find((c) => c.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该客户？', () => actions.deleteCustomer(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化销售订单页。
  function initOrderPage() {
    const tbody = document.getElementById('order-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑订单' : '新建订单';
      document.getElementById('f-customerName').value = data ? data.customerName : '';
      document.getElementById('f-product').value = data ? data.product : '';
      document.getElementById('f-quantity').value = data ? data.quantity : '';
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
      const customerName = view.getTrimmedValue('f-customerName');
      const product = view.getTrimmedValue('f-product');
      if (!customerName) { errorEl.textContent = '请输入客户名称'; return null; }
      if (!product) { errorEl.textContent = '请输入产品名称'; return null; }
      return {
        customerName: customerName,
        product: product,
        quantity: view.getValue('f-quantity'),
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

    function render(list) {
      const orders = store.sync().orders;
      renderers.stats([
        { icon: 'clipboard-list', value: orders.length, label: '订单总数' },
        { icon: 'currency-dollar', value: formatMoney(orders.reduce((sum, item) => sum + item.amount, 0)), label: '订单总额' },
        { icon: 'circle-check', value: orders.filter((item) => item.status === '已完成').length, label: '已完成' }
      ]);
      view.renderRows(tbody, list, renderOrderRow, { colspan: 10, text: '暂无销售订单' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const status = view.getValue('status-filter');
      const list = view.filterByKeyword(store.sync().orders, keyword, ['customerName', 'product'])
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
      view.confirmDelete('确认删除该订单？', () => actions.deleteOrder(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化价格策略页。
  function initPricingPage() {
    const tbody = document.getElementById('pricing-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑定价' : '新增定价';
      document.getElementById('f-product').value = data ? data.product : '';
      document.getElementById('f-standardPrice').value = data ? data.standardPrice : '';
      document.getElementById('f-currentPrice').value = data ? data.currentPrice : '';
      document.getElementById('f-validFrom').value = data ? data.validFrom : '';
      document.getElementById('f-validTo').value = data ? data.validTo : '';
      document.getElementById('f-status').value = data ? data.status : '生效中';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const product = view.getTrimmedValue('f-product');
      if (!product) { errorEl.textContent = '请输入产品名称'; return null; }
      return {
        product: product,
        standardPrice: view.getValue('f-standardPrice'),
        currentPrice: view.getValue('f-currentPrice'),
        validFrom: view.getValue('f-validFrom'),
        validTo: view.getValue('f-validTo'),
        status: view.getValue('f-status')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updatePricing(editingId, payload);
      } else {
        actions.createPricing(payload);
      }
      closeModal();
      render();
    }

    function render() {
      view.renderRows(tbody, store.sync().pricing, renderPricingRow, { colspan: 8, text: '暂无价格策略' });
    }

    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().pricing.find((p) => p.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该定价策略？', () => actions.deletePricing(this.dataset.id), render);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化销售报表页。
  function initReportPage() {
    const tbody = document.getElementById('report-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const monthly = store.sync().report.monthly || [];
    const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = monthly.reduce((sum, item) => sum + item.orders, 0);
    const maxRevenue = Math.max.apply(null, monthly.map((item) => item.revenue).concat([0]));

    renderers.stats([
      { icon: 'currency-dollar', value: formatMoney(totalRevenue), label: '6个月总销售额' },
      { icon: 'clipboard-list', value: totalOrders, label: '6个月总订单数' },
      { icon: 'chart-line', value: formatMoney(maxRevenue), label: '单月最高销售额' }
    ]);

    view.renderRows(tbody, monthly, renderMonthlyReportRow(maxRevenue), { colspan: 5, text: '暂无销售报表' });

    // 绘制月度销售额柱状图。
    var revenueCanvas = document.getElementById('revenue-chart');
    if (revenueCanvas && typeof EnterpriseCharts !== 'undefined') {
      var rDraw = function() {
        EnterpriseCharts.barChart(revenueCanvas, {
          labels: monthly.map(function(m) { return m.month; }),
          values: monthly.map(function(m) { return m.revenue; }),
          colors: [getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#FF6B00']
        });
      };
      rDraw();
      EnterpriseCharts.autoResize(revenueCanvas, rDraw);
    }

    // 绘制月度订单数折线图。
    var ordersCanvas = document.getElementById('orders-chart');
    if (ordersCanvas && typeof EnterpriseCharts !== 'undefined') {
      var oDraw = function() {
        EnterpriseCharts.lineChart(ordersCanvas, {
          labels: monthly.map(function(m) { return m.month; }),
          datasets: [{
            values: monthly.map(function(m) { return m.orders; }),
            label: '订单数',
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#22c55e'
          }]
        });
      };
      oDraw();
      EnterpriseCharts.autoResize(ordersCanvas, oDraw);
    }

    tbody.dataset.bound = '1';
  }

  // 初始化销售团队页。
  function initTeamPage() {
    const tbody = document.getElementById('team-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const team = store.sync().team;
    const totalTarget = team.reduce((sum, item) => sum + item.target, 0);
    const totalAchieved = team.reduce((sum, item) => sum + item.achieved, 0);
    const avgRate = totalTarget ? ((totalAchieved / totalTarget) * 100).toFixed(1) : '0.0';

    renderers.stats([
      { icon: 'users', value: team.length, label: '团队人数' },
      { icon: 'target', value: formatMoney(totalTarget), label: '团队目标' },
      { icon: 'currency-dollar', value: formatMoney(totalAchieved), label: '已完成' },
      { icon: 'chart-bar', value: avgRate + '%', label: '平均完成率' }
    ]);

    view.renderRows(tbody, team, renderTeamRow, { colspan: 7, text: '暂无销售团队数据' });

    tbody.dataset.bound = '1';
  }

  // 按当前销售管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('order-tbody')) initIndexPage();
        break;
      case 'customer.html':
        initCustomerPage();
        break;
      case 'order.html':
        initOrderPage();
        break;
      case 'pricing.html':
        initPricingPage();
        break;
      case 'report.html':
        initReportPage();
        break;
      case 'team.html':
        initTeamPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(salesSystem.store, salesSystem.actions, salesSystem.renderers, EnterpriseView);

// 对外暴露销售管理初始化入口，供 module-loader.js 调用。
salesSystem.init = function() {
  try {
    salesSystem.pages.init();
  } catch (error) {
    console.error('salesSystem.init failed:', error);
  }
};

// 对外暴露销售管理状态快照，供调试和兼容 API 使用。
salesSystem.getState = function() {
  return salesSystem.store.snapshot();
};
