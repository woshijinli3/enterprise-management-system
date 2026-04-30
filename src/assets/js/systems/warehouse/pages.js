'use strict';

window.warehouseSystem = window.warehouseSystem || {};

/**
 * 仓储管理页面控制器。
 * 输入：warehouseSystem.store/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化库存总览、货位、出入库、运输或预警页。
 *
 * 原因：仓储域当前以展示为主，多张表共享同一份库存状态，集中初始化可避免页面内联统计逻辑。
 */
warehouseSystem.pages = (function(store, actions, renderers, view) {
  // 渲染仓储首页的库存行。
  function renderInventoryRow(item) {
    const low = item.stock < item.minStock;
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.location}</td>
        <td>${low ? `<span style="color:var(--color-danger);font-weight:600">${item.stock}</span>` : item.stock} ${item.unit}</td>
        <td>${item.minStock} ${item.unit}</td>
        <td><span class="badge ${low ? 'badge-danger' : 'badge-success'}">${low ? '库存不足' : '正常'}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染仓库布局页的货位行。
  function renderLocationRow(item) {
    const usage = item.capacity ? ((item.used / item.capacity) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.code}</strong></td>
        <td>${item.zone}</td>
        <td>${item.type}</td>
        <td>${item.capacity}</td>
        <td>${item.used}</td>
        <td>${usage}%</td>
        <td><span class="badge badge-success">${item.status}</span></td>
      </tr>
    `;
  }

  // 渲染仓库布局页的库存明细行。
  function renderInventoryDetailRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.spec}</td>
        <td>${item.location}</td>
        <td>${item.stock} ${item.unit}</td>
        <td>${item.lastUpdate}</td>
      </tr>
    `;
  }

  // 渲染入库记录行。
  function renderInboundRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.item}</strong></td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${item.supplier}</td>
        <td>${item.date}</td>
        <td>${item.operator}</td>
      </tr>
    `;
  }

  // 渲染出库记录行。
  function renderOutboundRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.item}</strong></td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${item.customer}</td>
        <td>${item.date}</td>
        <td>${item.operator}</td>
      </tr>
    `;
  }

  /**
   * 格式化运输跟踪状态文案。
   * @param {Date} today 当前日期。
   * @param {string} outDateText 出库日期文本。
   * @returns {string} 运输跟踪状态文案。
   *
   * 原因：计划中、今日和已出库天数的判断属于日期展示规则，拆出后行渲染器只负责表格结构。
   */
  function formatTransportStatusText(today, outDateText) {
    const outDate = new Date(outDateText);
    const daysSince = Math.ceil((today - outDate) / (1000 * 60 * 60 * 24));

    if (daysSince < 0) {
      return `计划中 (${Math.abs(daysSince)}天后)`;
    }

    if (daysSince === 0) {
      return '今日';
    }

    return `${daysSince} 天前`;
  }

  /**
   * 创建运输跟踪行渲染器。
   * @param {Date} today 当前日期。
   * @returns {Function} 接收出库记录并返回运输跟踪表格行 HTML 的渲染函数。
   */
  function renderTransportRow(today) {
    return (item) => {
      const statusText = formatTransportStatusText(today, item.date);

      return `
        <tr>
          <td>${item.id}</td>
          <td><strong>${item.item}</strong></td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.customer}</td>
          <td>${item.date}</td>
          <td>${item.operator}</td>
          <td>${statusText}</td>
        </tr>
      `;
    };
  }


  // 渲染库存预警行。
  function renderWarningRow(item) {
    const gap = item.minStock - item.stock;
    const urgency = item.stock / item.minStock < 0.5 ? '紧急' : '一般';
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.spec}</td>
        <td><span style="color:var(--color-danger);font-weight:600">${item.stock} ${item.unit}</span></td>
        <td>${item.minStock} ${item.unit}</td>
        <td><span style="color:var(--color-danger);font-weight:600">${gap} ${item.unit}</span></td>
        <td><span class="badge ${urgency === '紧急' ? 'badge-danger' : 'badge-warning'}">${urgency}</span></td>
      </tr>
    `;
  }

  // 渲染正常库存行。
  function renderNormalStockRow(item) {
    const ratio = item.minStock ? ((item.stock / item.minStock) * 100).toFixed(0) : '0';
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.stock} ${item.unit}</td>
        <td>${item.minStock} ${item.unit}</td>
        <td>${ratio}%</td>
      </tr>
    `;
  }

  // 初始化仓储管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑库存' : '新增库存';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-category').value = data ? data.category : '成品';
      document.getElementById('f-spec').value = data ? data.spec : '';
      document.getElementById('f-unit').value = data ? data.unit : '件';
      document.getElementById('f-stock').value = data ? data.stock : '';
      document.getElementById('f-minStock').value = data ? data.minStock : '';
      document.getElementById('f-location').value = data ? data.location : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入物品名称'; return null; }
      return {
        name: name,
        category: view.getValue('f-category'),
        spec: view.getTrimmedValue('f-spec'),
        unit: view.getTrimmedValue('f-unit'),
        stock: view.getValue('f-stock'),
        minStock: view.getValue('f-minStock'),
        location: view.getTrimmedValue('f-location')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateInventory(editingId, payload);
      } else {
        actions.createInventory(payload);
      }
      closeModal();
      refresh();
    }

    function render(list) {
      const data = store.sync();
      const keyword = view.getTrimmedValue('search-input');
      const inventory = keyword ? view.filterByKeyword(data.inventory, keyword, ['name', 'category', 'location']) : data.inventory;
      renderers.stats([
        { icon: 'package', value: data.inventory.length, label: '库存品类' },
        { icon: 'alert-triangle', value: data.inventory.filter((item) => item.stock < item.minStock).length, label: '库存预警' },
        { icon: 'inbox', value: data.inbound.length, label: '近期入库' },
        { icon: 'outbox', value: data.outbound.length, label: '近期出库' }
      ]);
      view.renderRows(tbody, list || inventory, renderInventoryRow, { colspan: 8, text: '暂无库存数据' });

      // 绘制库存分类分布饼图。
      var catCanvas = document.getElementById('category-chart');
      if (catCanvas && typeof EnterpriseCharts !== 'undefined') {
        var catMap = {};
        data.inventory.forEach(function(item) {
          catMap[item.category] = (catMap[item.category] || 0) + 1;
        });
        var cDraw = function() {
          EnterpriseCharts.pieChart(catCanvas, {
            labels: Object.keys(catMap),
            values: Object.values(catMap)
          });
        };
        cDraw();
        EnterpriseCharts.autoResize(catCanvas, cDraw);
      }

      // 绘制库存状态概览饼图（正常 vs 预警）。
      var statusCanvas = document.getElementById('stock-status-chart');
      if (statusCanvas && typeof EnterpriseCharts !== 'undefined') {
        var lowCount = data.inventory.filter(function(item) { return item.stock < item.minStock; }).length;
        var normalCount = data.inventory.length - lowCount;
        var sDraw = function() {
          EnterpriseCharts.pieChart(statusCanvas, {
            labels: ['库存正常', '库存预警'],
            values: [normalCount, lowCount]
          });
        };
        sDraw();
        EnterpriseCharts.autoResize(statusCanvas, sDraw);
      }
    }

    function refresh() {
      render();
    }

    if (document.getElementById('add-btn')) {
      on(document.getElementById('add-btn'), 'click', () => openModal(null));
    }
    if (overlay) {
      on(document.getElementById('modal-save'), 'click', saveModal);
      view.bindModalClose(closeModal);
    }
    on(document.getElementById('search-input'), 'input', refresh);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().inventory.find((i) => i.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该库存物品？', () => actions.deleteInventory(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化仓库布局页。
  function initLayoutPage() {
    const layoutBody = document.getElementById('layout-tbody');
    const detailBody = document.getElementById('detail-tbody');
    if (!layoutBody || !detailBody || layoutBody.dataset.bound === '1') return;

    function render() {
      const data = store.sync();
      const keyword = view.getTrimmedValue('search-input');
      const locations = keyword ? view.filterByKeyword(data.locations, keyword, ['code', 'zone']) : data.locations;
      const inventory = keyword ? view.filterByKeyword(data.inventory, keyword, ['name', 'category', 'location']) : data.inventory;
      const totalCap = data.locations.reduce((sum, item) => sum + item.capacity, 0);
      const totalUsed = data.locations.reduce((sum, item) => sum + item.used, 0);
      const avgUsage = totalCap ? ((totalUsed / totalCap) * 100).toFixed(1) : '0.0';

      renderers.stats([
        { icon: 'map', value: data.locations.length, label: '货位数量' },
        { icon: 'package', value: totalCap, label: '总容量' },
        { icon: 'chart-bar', value: avgUsage + '%', label: '平均使用率' }
      ]);

      view.renderRows(layoutBody, locations, renderLocationRow, { colspan: 8, text: '暂无货位数据' });
      view.renderRows(detailBody, inventory, renderInventoryDetailRow, { colspan: 7, text: '暂无库存明细' });
    }

    on(document.getElementById('search-input'), 'input', render);

    layoutBody.dataset.bound = '1';
    render();
  }

  // 初始化出入库作业页。
  function initOperationPage() {
    const inboundBody = document.getElementById('inbound-tbody');
    const outboundBody = document.getElementById('outbound-tbody');
    if (!inboundBody || !outboundBody || inboundBody.dataset.bound === '1') return;

    const inboundOverlay = document.getElementById('inbound-modal');
    const outboundOverlay = document.getElementById('outbound-modal');

    function openInboundModal() {
      document.getElementById('ib-item').value = '';
      document.getElementById('ib-quantity').value = '';
      document.getElementById('ib-unit').value = '件';
      document.getElementById('ib-supplier').value = '';
      document.getElementById('ib-date').value = new Date().toISOString().slice(0, 10);
      document.getElementById('ib-operator').value = '仓管员小张';
      document.getElementById('ib-error').textContent = '';
      addClass(inboundOverlay, 'active');
    }

    function closeInboundModal() {
      removeClass(inboundOverlay, 'active');
    }

    function saveInbound() {
      const item = view.getTrimmedValue('ib-item');
      if (!item) { document.getElementById('ib-error').textContent = '请输入物品名称'; return; }
      actions.createInbound({
        item: item,
        quantity: view.getValue('ib-quantity'),
        unit: view.getTrimmedValue('ib-unit'),
        supplier: view.getTrimmedValue('ib-supplier'),
        date: view.getValue('ib-date'),
        operator: view.getTrimmedValue('ib-operator')
      });
      closeInboundModal();
      refresh();
    }

    function openOutboundModal() {
      document.getElementById('ob-item').value = '';
      document.getElementById('ob-quantity').value = '';
      document.getElementById('ob-unit').value = '件';
      document.getElementById('ob-customer').value = '';
      document.getElementById('ob-date').value = new Date().toISOString().slice(0, 10);
      document.getElementById('ob-operator').value = '仓管员小李';
      document.getElementById('ob-error').textContent = '';
      addClass(outboundOverlay, 'active');
    }

    function closeOutboundModal() {
      removeClass(outboundOverlay, 'active');
    }

    function saveOutbound() {
      const item = view.getTrimmedValue('ob-item');
      if (!item) { document.getElementById('ob-error').textContent = '请输入物品名称'; return; }
      actions.createOutbound({
        item: item,
        quantity: view.getValue('ob-quantity'),
        unit: view.getTrimmedValue('ob-unit'),
        customer: view.getTrimmedValue('ob-customer'),
        date: view.getValue('ob-date'),
        operator: view.getTrimmedValue('ob-operator')
      });
      closeOutboundModal();
      refresh();
    }

    function render() {
      const data = store.sync();
      const keyword = view.getTrimmedValue('search-input');
      const inbound = keyword ? view.filterByKeyword(data.inbound, keyword, ['item', 'supplier']) : data.inbound;
      const outbound = keyword ? view.filterByKeyword(data.outbound, keyword, ['item', 'customer']) : data.outbound;

      renderers.stats([
        { icon: 'inbox', value: data.inbound.length, label: '入库单数' },
        { icon: 'outbox', value: data.outbound.length, label: '出库单数' },
        { icon: 'package', value: data.inbound.reduce((sum, item) => sum + item.quantity, 0), label: '入库总量' },
        { icon: 'truck', value: data.outbound.reduce((sum, item) => sum + item.quantity, 0), label: '出库总量' }
      ]);
      view.renderRows(inboundBody, inbound, renderInboundRow, { colspan: 6, text: '暂无入库记录' });
      view.renderRows(outboundBody, outbound, renderOutboundRow, { colspan: 6, text: '暂无出库记录' });
    }

    function refresh() {
      render();
    }

    on(document.getElementById('add-inbound-btn'), 'click', openInboundModal);
    on(document.getElementById('inbound-save'), 'click', saveInbound);
    on(document.getElementById('inbound-close'), 'click', closeInboundModal);
    on(document.getElementById('inbound-cancel'), 'click', closeInboundModal);
    on(inboundOverlay, 'click', (e) => { if (e.target === inboundOverlay) closeInboundModal(); });
    on(document.getElementById('search-input'), 'input', refresh);

    on(document.getElementById('add-outbound-btn'), 'click', openOutboundModal);
    on(document.getElementById('outbound-save'), 'click', saveOutbound);
    on(document.getElementById('outbound-close'), 'click', closeOutboundModal);
    on(document.getElementById('outbound-cancel'), 'click', closeOutboundModal);
    on(outboundOverlay, 'click', (e) => { if (e.target === outboundOverlay) closeOutboundModal(); });

    inboundBody.dataset.bound = '1';
    render();
  }

  // 初始化运输跟踪页。
  function initTransportPage() {
    const transportBody = document.getElementById('transport-tbody');
    const sourceBody = document.getElementById('source-tbody');
    if (!transportBody || !sourceBody || transportBody.dataset.bound === '1') return;

    function render() {
      const data = store.sync();
      const today = new Date();
      const keyword = view.getTrimmedValue('search-input');
      const outbound = keyword ? view.filterByKeyword(data.outbound, keyword, ['item', 'customer']) : data.outbound;
      const inbound = keyword ? view.filterByKeyword(data.inbound, keyword, ['item', 'supplier']) : data.inbound;

      renderers.stats([
        { icon: 'outbox', value: data.outbound.length, label: '出库单数' },
        { icon: 'truck', value: data.outbound.reduce((sum, item) => sum + item.quantity, 0), label: '出库总量' },
        { icon: 'inbox', value: data.inbound.length, label: '入库单数' },
        { icon: 'package', value: data.inbound.reduce((sum, item) => sum + item.quantity, 0), label: '入库总量' }
      ]);

      view.renderRows(transportBody, outbound, renderTransportRow(today), { colspan: 7, text: '暂无运输记录' });
      view.renderRows(sourceBody, inbound, renderInboundRow, { colspan: 6, text: '暂无入库来源' });
    }

    on(document.getElementById('search-input'), 'input', render);

    transportBody.dataset.bound = '1';
    render();
  }

  // 初始化库存预警页。
  function initWarningPage() {
    const warningBody = document.getElementById('warning-tbody');
    const normalBody = document.getElementById('normal-tbody');
    if (!warningBody || !normalBody || warningBody.dataset.bound === '1') return;

    function render() {
      const inventory = store.sync().inventory;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(inventory, keyword, ['name', 'category']) : inventory;
      const lowItems = filtered.filter((item) => item.stock < item.minStock);
      const normalItems = filtered.filter((item) => item.stock >= item.minStock);

      renderers.stats([
        { icon: 'package', value: inventory.length, label: '库存品类' },
        { icon: 'alert-triangle', value: inventory.filter((item) => item.stock < item.minStock).length, label: '预警品类' },
        { icon: 'circle-check', value: inventory.filter((item) => item.stock >= item.minStock).length, label: '库存正常' }
      ]);

      view.renderRows(warningBody, lowItems, renderWarningRow, { colspan: 8, text: '暂无库存预警' });
      view.renderRows(normalBody, normalItems, renderNormalStockRow, { colspan: 6, text: '暂无正常库存' });
    }

    on(document.getElementById('search-input'), 'input', render);

    warningBody.dataset.bound = '1';
    render();
  }

  // 按当前仓储管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('inventory-tbody')) initIndexPage();
        break;
      case 'layout.html':
        initLayoutPage();
        break;
      case 'operation.html':
        initOperationPage();
        break;
      case 'transport.html':
        initTransportPage();
        break;
      case 'warning.html':
        initWarningPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(warehouseSystem.store, warehouseSystem.actions, warehouseSystem.renderers, EnterpriseView);

// 对外暴露仓储管理初始化入口，供 module-loader.js 调用。
warehouseSystem.init = function() {
  try {
    warehouseSystem.pages.init();
  } catch (error) {
    console.error('warehouseSystem.init failed:', error);
  }
};

// 对外暴露仓储管理状态快照，供调试和兼容 API 使用。
warehouseSystem.getState = function() {
  return warehouseSystem.store.snapshot();
};
