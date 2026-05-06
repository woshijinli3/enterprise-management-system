'use strict';

window.productionSystem = window.productionSystem || {};

/**
 * 生产管理页面控制器。
 * 输入：productionSystem.store/actions/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化总览、库存、物料、订单、计划、质检或排程页。
 *
 * 原因：生产域页面展示维度多，但都读取同一份 localStorage 状态，集中初始化能保证刷新逻辑一致。
 */
productionSystem.pages = (function(store, actions, renderers, view) {
  // 渲染生产管理首页的任务行。
  function renderTaskRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.productName}</strong></td>
        <td>${item.quantity}</td>
        <td>${item.assignee}</td>
        <td>${item.deadline}</td>
        <td>${renderers.renderProgress(item.progress)}</td>
      </tr>
    `;
  }

  // 渲染生产库存页的物料库存行。
  function renderInventoryRow(item) {
    const ratio = item.required ? item.stock / item.required : 0;
    const statusClass = ratio >= 1 ? 'badge-success' : ratio >= 0.5 ? 'badge-warning' : 'badge-danger';
    const statusText = ratio >= 1 ? '充足' : ratio >= 0.5 ? '偏低' : '严重不足';

    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.spec}</td>
        <td>${item.unit}</td>
        <td>${item.stock}</td>
        <td>${item.required}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染物料需求页的物料需求行。
  function renderMaterialRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.spec}</td>
        <td>${item.unit}</td>
        <td>${item.required}</td>
        <td>${item.stock}</td>
        <td>${item.shortage > 0 ? `<span class="text-danger-strong">${item.shortage}</span>` : '—'}</td>
        <td><span class="badge ${item.shortage > 0 ? 'badge-danger' : 'badge-success'}">${item.shortage > 0 ? '短缺' : '充足'}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染生产订单页的订单行。
  function renderOrderRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.customer}</td>
        <td><strong>${item.product}</strong></td>
        <td>${item.quantity}</td>
        <td>${item.createDate}</td>
        <td>${item.deliveryDate}</td>
        <td><span class="badge ${renderers.orderStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染生产计划页的计划行。
  function renderPlanRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.startDate}</td>
        <td>${item.endDate}</td>
        <td>${item.products.join('、')}</td>
        <td><span class="badge ${renderers.planStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染生产排程页的任务行。
  function renderSchedulingRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.planId}</td>
        <td><strong>${item.productName}</strong></td>
        <td>${item.quantity}</td>
        <td>${item.assignee}</td>
        <td>${item.deadline}</td>
        <td>${renderers.renderProgress(item.progress)}</td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染质量检验页的质检记录行。
  function renderQualityRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.orderId}</td>
        <td>${item.inspector}</td>
        <td>${item.date}</td>
        <td>${item.defects > 0 ? `<span class="text-danger">${item.defects}</span>` : '0'}</td>
        <td><span class="badge ${item.result === '合格' ? 'badge-success' : 'badge-danger'}">${item.result}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 初始化生产管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('task-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const data = store.sync();
    renderers.stats([
      { icon: 'calendar', value: data.plans.length, label: '生产计划' },
      { icon: 'bolt', value: data.plans.filter((item) => item.status === '进行中').length, label: '进行中计划' },
      { icon: 'clipboard-list', value: data.orders.filter((item) => item.status !== '已完成').length, label: '待完成订单' },
      { icon: 'alert-triangle', value: data.materials.filter((item) => item.shortage > 0).length, label: '物料短缺项' }
    ]);

    view.renderRows(tbody, data.tasks, renderTaskRow, { colspan: 6, text: '暂无生产任务' });

    // 绘制订单状态分布饼图。
    var statusCanvas = document.getElementById('order-status-chart');
    if (statusCanvas && typeof EnterpriseCharts !== 'undefined') {
      var statusMap = {};
      data.orders.forEach(function(o) {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      var sDraw = function() {
        EnterpriseCharts.pieChart(statusCanvas, {
          labels: Object.keys(statusMap),
          values: Object.values(statusMap)
        });
      };
      sDraw();
      EnterpriseCharts.autoResize(statusCanvas, sDraw);
    }

    // 绘制计划进度柱状图。
    var planCanvas = document.getElementById('plan-progress-chart');
    if (planCanvas && typeof EnterpriseCharts !== 'undefined') {
      var pDraw = function() {
        EnterpriseCharts.barChart(planCanvas, {
          labels: data.plans.map(function(p) { return p.name || p.id; }),
          values: data.plans.map(function(p) { return Number(p.progress) || 0; }),
          colors: [getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#FF6B00']
        });
      };
      pDraw();
      EnterpriseCharts.autoResize(planCanvas, pDraw);
    }

    tbody.dataset.bound = '1';
  }

  // 初始化生产库存页。
  function initInventoryPage() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑物料' : '新增物料';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-spec').value = data ? data.spec : '';
      document.getElementById('f-unit').value = data ? data.unit : '';
      document.getElementById('f-required').value = data ? data.required : '';
      document.getElementById('f-stock').value = data ? data.stock : '';
      document.getElementById('f-shortage').value = data ? data.shortage : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入物料名称'; return null; }
      return {
        name: name,
        spec: view.getTrimmedValue('f-spec'),
        unit: view.getTrimmedValue('f-unit'),
        required: view.getValue('f-required'),
        stock: view.getValue('f-stock'),
        shortage: view.getValue('f-shortage')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateInventoryItem(editingId, payload);
      } else {
        actions.createInventoryItem(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      view.renderRows(tbody, list, renderInventoryRow, { colspan: 8, text: '暂无物料库存' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().materials, keyword, ['name', 'spec']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().materials.find((m) => m.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该物料？', () => actions.deleteInventoryItem(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化物料需求页。
  function initMaterialPage() {
    const tbody = document.getElementById('material-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑物料' : '新增物料';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-spec').value = data ? data.spec : '';
      document.getElementById('f-unit').value = data ? data.unit : '';
      document.getElementById('f-required').value = data ? data.required : '';
      document.getElementById('f-stock').value = data ? data.stock : '';
      document.getElementById('f-shortage').value = data ? data.shortage : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入物料名称'; return null; }
      return {
        name: name,
        spec: view.getTrimmedValue('f-spec'),
        unit: view.getTrimmedValue('f-unit'),
        required: view.getValue('f-required'),
        stock: view.getValue('f-stock'),
        shortage: view.getValue('f-shortage')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateMaterial(editingId, payload);
      } else {
        actions.createMaterial(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      const materials = store.sync().materials;
      renderers.stats([
        { icon: 'package', value: materials.length, label: '物料种类' },
        { icon: 'circle-check', value: materials.filter((item) => item.shortage === 0).length, label: '库存充足' },
        { icon: 'alert-triangle', value: materials.filter((item) => item.shortage > 0).length, label: '库存短缺' }
      ]);
      view.renderRows(tbody, list, renderMaterialRow, { colspan: 9, text: '暂无物料需求' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().materials, keyword, ['name', 'spec']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().materials.find((m) => m.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该物料？', () => actions.deleteMaterial(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化生产订单页。
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
      document.getElementById('f-customer').value = data ? data.customer : '';
      document.getElementById('f-product').value = data ? data.product : '';
      document.getElementById('f-quantity').value = data ? data.quantity : '';
      document.getElementById('f-status').value = data ? data.status : '待生产';
      document.getElementById('f-createDate').value = data ? data.createDate : '';
      document.getElementById('f-deliveryDate').value = data ? data.deliveryDate : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const customer = view.getTrimmedValue('f-customer');
      const product = view.getTrimmedValue('f-product');
      if (!customer) { errorEl.textContent = '请输入客户名称'; return null; }
      if (!product) { errorEl.textContent = '请输入产品名称'; return null; }
      return {
        customer: customer,
        product: product,
        quantity: view.getValue('f-quantity'),
        status: view.getValue('f-status'),
        createDate: view.getValue('f-createDate'),
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
        { icon: 'bolt', value: orders.filter((item) => item.status === '生产中').length, label: '生产中' },
        { icon: 'circle-check', value: orders.filter((item) => item.status === '已完成').length, label: '已完成' }
      ]);
      view.renderRows(tbody, list, renderOrderRow, { colspan: 8, text: '暂无生产订单' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().orders, keyword, ['customer', 'product']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
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

  // 初始化生产计划页。
  function initPlanPage() {
    const tbody = document.getElementById('plan-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑计划' : '新建计划';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-startDate').value = data ? data.startDate : '';
      document.getElementById('f-endDate').value = data ? data.endDate : '';
      document.getElementById('f-status').value = data ? data.status : '待启动';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入计划名称'; return null; }
      return {
        name: name,
        startDate: view.getValue('f-startDate'),
        endDate: view.getValue('f-endDate'),
        status: view.getValue('f-status')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updatePlan(editingId, payload);
      } else {
        actions.createPlan(payload);
      }
      closeModal();
      render();
    }

    function render() {
      view.renderRows(tbody, store.sync().plans, renderPlanRow, { colspan: 7, text: '暂无生产计划' });
    }

    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().plans.find((p) => p.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该计划？', () => actions.deletePlan(this.dataset.id), render);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化质量检验页。
  function initQualityPage() {
    const tbody = document.getElementById('quality-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑记录' : '新增记录';
      document.getElementById('f-orderId').value = data ? data.orderId : '';
      document.getElementById('f-inspector').value = data ? data.inspector : '';
      document.getElementById('f-date').value = data ? data.date : '';
      document.getElementById('f-result').value = data ? data.result : '合格';
      document.getElementById('f-defects').value = data ? data.defects : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const orderId = view.getTrimmedValue('f-orderId');
      const inspector = view.getTrimmedValue('f-inspector');
      if (!orderId) { errorEl.textContent = '请输入订单号'; return null; }
      if (!inspector) { errorEl.textContent = '请输入质检员'; return null; }
      return {
        orderId: orderId,
        inspector: inspector,
        date: view.getValue('f-date'),
        result: view.getValue('f-result'),
        defects: view.getValue('f-defects')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateQualityRecord(editingId, payload);
      } else {
        actions.createQualityRecord(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      const records = store.sync().qualityRecords;
      const passed = records.filter((item) => item.result === '合格').length;
      const failed = records.filter((item) => item.result === '不合格').length;
      const passRate = records.length ? ((passed / records.length) * 100).toFixed(1) : '0.0';

      renderers.stats([
        { icon: 'search', value: records.length, label: '质检总数' },
        { icon: 'circle-check', value: passed, label: '合格' },
        { icon: 'x', value: failed, label: '不合格' },
        { icon: 'chart-bar', value: passRate + '%', label: '合格率' }
      ]);
      view.renderRows(tbody, list, renderQualityRow, { colspan: 7, text: '暂无质检记录' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().qualityRecords, keyword, ['orderId', 'inspector']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().qualityRecords.find((q) => q.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该质检记录？', () => actions.deleteQualityRecord(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化生产排程页。
  function initSchedulingPage() {
    const tbody = document.getElementById('task-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑任务' : '新建任务';
      document.getElementById('f-planId').value = data ? data.planId : '';
      document.getElementById('f-productName').value = data ? data.productName : '';
      document.getElementById('f-quantity').value = data ? data.quantity : '';
      document.getElementById('f-progress').value = data ? data.progress : '';
      document.getElementById('f-assignee').value = data ? data.assignee : '';
      document.getElementById('f-deadline').value = data ? data.deadline : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const planId = view.getTrimmedValue('f-planId');
      const productName = view.getTrimmedValue('f-productName');
      if (!planId) { errorEl.textContent = '请输入所属计划编号'; return null; }
      if (!productName) { errorEl.textContent = '请输入产品名称'; return null; }
      return {
        planId: planId,
        productName: productName,
        quantity: view.getValue('f-quantity'),
        progress: view.getValue('f-progress'),
        assignee: view.getTrimmedValue('f-assignee'),
        deadline: view.getValue('f-deadline')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateTask(editingId, payload);
      } else {
        actions.createTask(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      view.renderRows(tbody, list, renderSchedulingRow, { colspan: 8, text: '暂无排产任务' });
    }

    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().tasks, keyword, ['productName', 'assignee']);
      render(list);
    }

    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().tasks.find((t) => t.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该任务？', () => actions.deleteTask(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 按当前生产管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('task-tbody')) initIndexPage();
        break;
      case 'inventory.html':
        initInventoryPage();
        break;
      case 'material.html':
        initMaterialPage();
        break;
      case 'order.html':
        initOrderPage();
        break;
      case 'plan.html':
        initPlanPage();
        break;
      case 'quality.html':
        initQualityPage();
        break;
      case 'scheduling.html':
        initSchedulingPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(productionSystem.store, productionSystem.actions, productionSystem.renderers, EnterpriseView);

// 对外暴露生产管理初始化入口，供 module-loader.js 调用。
productionSystem.init = function() {
  try {
    productionSystem.pages.init();
  } catch (error) {
    console.error('productionSystem.init failed:', error);
  }
};

// 对外暴露生产管理状态快照，供调试和兼容 API 使用。
productionSystem.getState = function() {
  return productionSystem.store.snapshot();
};
