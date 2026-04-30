'use strict';

window.equipmentSystem = window.equipmentSystem || {};

/**
 * 设备管理页面控制器。
 * 输入：equipmentSystem.store/actions/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化设备总览、状态监控、设备档案、维护计划或故障记录页。
 *
 * 原因：设备域多个子页面共用同一份本地状态，集中分发能避免页面内联脚本漂移。
 */
equipmentSystem.pages = (function(store, actions, renderers, view) {
  // 渲染设备管理首页的设备概览行。
  function renderEquipmentSummaryRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.model}</td>
        <td>${item.location}</td>
        <td>${item.nextMaintain}</td>
        <td><span class="badge ${renderers.equipmentStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
      </tr>
    `;
  }

  // 渲染设备监控页的设备状态行。
  function renderEquipmentMonitorRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.model}</td>
        <td>${item.location}</td>
        <td>${item.purchaseDate}</td>
        <td>${item.lastMaintain}</td>
        <td>${item.nextMaintain}</td>
        <td><span class="badge ${renderers.equipmentStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
      </tr>
    `;
  }

  // 渲染设备档案页的设备档案行。
  function renderEquipmentInfoRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.model}</td>
        <td>${item.location}</td>
        <td>${item.purchaseDate}</td>
        <td>${item.lastMaintain}</td>
        <td>${item.nextMaintain}</td>
        <td><span class="badge ${renderers.equipmentStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button>
          </div>
        </td>
      </tr>
    `;
  }

  // 渲染设备维护计划行。
  function renderMaintenanceRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.equipName}</strong></td>
        <td>${item.type}</td>
        <td>${item.planDate}</td>
        <td>${item.technician}</td>
        <td>${formatMoney(item.cost)}</td>
        <td><span class="badge ${renderers.maintenanceStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button>
          </div>
        </td>
      </tr>
    `;
  }

  // 渲染设备故障记录行。
  function renderFaultRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.equipName}</strong></td>
        <td>${item.faultDate}</td>
        <td style="max-width:260px;color:var(--color-text-secondary)">${item.description}</td>
        <td><span class="badge ${renderers.severityMap[item.severity] || 'badge-default'}">${item.severity}</span></td>
        <td>${item.handler}</td>
        <td><span class="badge ${renderers.faultStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button>
          </div>
        </td>
      </tr>
    `;
  }

  // 初始化设备管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('equip-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const data = store.sync();
    renderers.stats([
      { icon: 'building-factory', value: data.equipment.length, label: '设备总数' },
      { icon: 'circle-check', value: data.equipment.filter((item) => item.status === '运行中').length, label: '运行中' },
      { icon: 'wrench', value: data.equipment.filter((item) => item.status === '维修中').length, label: '维修中' },
      { icon: 'alert-triangle', value: data.faults.filter((item) => item.status !== '已解决').length, label: '待处理故障' }
    ]);

    view.renderRows(tbody, data.equipment, renderEquipmentSummaryRow, { colspan: 6, text: '暂无设备' });

    tbody.dataset.bound = '1';
  }

  // 初始化设备状态监控页。
  function initMonitorPage() {
    const tbody = document.getElementById('monitor-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    function render() {
      const list = store.sync().equipment;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(list, keyword, ['name', 'model', 'location']) : list;

      renderers.stats([
        { icon: 'building-factory', value: list.length, label: '设备总数' },
        { icon: 'circle-check', value: list.filter((item) => item.status === '运行中').length, label: '运行中' },
        { icon: 'wrench', value: list.filter((item) => item.status === '维修中').length, label: '维修中' },
        { icon: 'player-stop', value: list.filter((item) => item.status === '停机').length, label: '停机' }
      ]);

      view.renderRows(tbody, filtered, renderEquipmentMonitorRow, { colspan: 8, text: '暂无设备监控数据' });
      initEquipStatusChart(list);
    }

    on(document.getElementById('search-input'), 'input', render);

    tbody.dataset.bound = '1';
    render();
  }

  /**
   * 绘制设备状态分布饼图。
   * @param {Array} list 设备列表。
   * @returns {void}
   *
   * 原因：监控页需要直观展示各状态设备数量占比，使用 EnterpriseCharts.pieChart 绘制环形图。
   */
  function initEquipStatusChart(list) {
    const canvas = document.getElementById('equip-status-chart');
    if (!canvas) return;

    if (!list.length) {
      const parent = canvas.parentElement;
      if (parent) parent.innerHTML = '<div style="text-align:center;color:var(--color-text-secondary);padding:60px 0">暂无设备数据</div>';
      return;
    }

    const statusMap = {};
    list.forEach((item) => {
      const s = item.status || '未知';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    const statusColors = {
      '运行中': '#52c41a',
      '维修中': '#faad14',
      '停机': '#f5222d',
      '闲置': '#1890ff'
    };

    const labels = Object.keys(statusMap);
    const values = labels.map((k) => statusMap[k]);
    const colors = labels.map((k) => statusColors[k] || '#999');

    function draw() {
      EnterpriseCharts.pieChart(canvas, {
        labels: labels,
        values: values,
        title: '',
        colors: colors,
        innerRadius: 0.55,
        showLegend: true
      });
    }

    draw();
    EnterpriseCharts.autoResize(canvas, draw);
  }

  // 初始化设备档案页。
  function initInfoPage() {
    const tbody = document.getElementById('info-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    // 打开设备档案新增或编辑弹窗。
    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑设备' : '新增设备';
      document.getElementById('f-name').value = data ? data.name : '';
      document.getElementById('f-model').value = data ? data.model : '';
      document.getElementById('f-location').value = data ? data.location : '';
      document.getElementById('f-status').value = data ? data.status : '运行中';
      document.getElementById('f-purchaseDate').value = data ? data.purchaseDate : '';
      document.getElementById('f-lastMaintain').value = data ? data.lastMaintain : '';
      document.getElementById('f-nextMaintain').value = data ? data.nextMaintain : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    // 关闭设备档案弹窗。
    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    // 读取设备档案弹窗表单数据。
    function readForm() {
      const name = view.getTrimmedValue('f-name');
      if (!name) { errorEl.textContent = '请输入设备名称'; return null; }
      return {
        name: name,
        model: view.getTrimmedValue('f-model'),
        location: view.getTrimmedValue('f-location'),
        status: view.getValue('f-status'),
        purchaseDate: view.getValue('f-purchaseDate'),
        lastMaintain: view.getValue('f-lastMaintain'),
        nextMaintain: view.getValue('f-nextMaintain')
      };
    }

    // 保存设备档案弹窗表单数据。
    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateEquipment(editingId, payload);
      } else {
        actions.createEquipment(payload);
      }
      closeModal();
      refresh();
    }

    // 刷新设备档案页列表。
    function refresh() {
      const keyword = view.getTrimmedValue('search-input');
      const list = view.filterByKeyword(store.sync().equipment, keyword, ['name', 'model']);
      view.renderRows(tbody, list, renderEquipmentInfoRow, { colspan: 9, text: '暂无设备档案' });
    }

    view.bindModalClose(closeModal);
    on(document.getElementById('search-input'), 'input', refresh);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);

    // 将当前行设备档案载入编辑弹窗。
    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().equipment.find((e) => e.id === this.dataset.id);
      if (item) openModal(item);
    });

    // 删除当前行的设备档案。
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该设备？', () => actions.deleteEquipment(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化设备维护计划页。
  function initMaintenancePage() {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    // 打开维护计划新增或编辑弹窗。
    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑维护计划' : '新建维护计划';
      document.getElementById('f-equipName').value = data ? data.equipName : '';
      document.getElementById('f-type').value = data ? data.type : '定期保养';
      document.getElementById('f-planDate').value = data ? data.planDate : '';
      document.getElementById('f-status').value = data ? data.status : '待执行';
      document.getElementById('f-technician').value = data ? data.technician : '';
      document.getElementById('f-cost').value = data ? data.cost : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    // 关闭维护计划弹窗。
    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    // 读取维护计划弹窗表单数据。
    function readForm() {
      const equipName = view.getTrimmedValue('f-equipName');
      if (!equipName) { errorEl.textContent = '请输入设备名称'; return null; }
      return {
        equipName: equipName,
        type: view.getValue('f-type'),
        planDate: view.getValue('f-planDate'),
        status: view.getValue('f-status'),
        technician: view.getTrimmedValue('f-technician'),
        cost: view.getValue('f-cost', 0)
      };
    }

    // 保存维护计划弹窗表单数据。
    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateMaintenance(editingId, payload);
      } else {
        actions.createMaintenance(payload);
      }
      closeModal();
      render();
    }

    // 刷新设备维护统计和维护计划列表。
    function render() {
      const list = store.sync().maintenance;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(list, keyword, ['equipName', 'type']) : list;

      renderers.stats([
        { icon: 'clipboard-list', value: list.length, label: '维护计划总数' },
        { icon: '⏳', value: list.filter((item) => item.status === '待执行').length, label: '待执行' },
        { icon: 'wrench', value: list.filter((item) => item.status === '进行中').length, label: '进行中' },
        { icon: 'currency-dollar', value: formatMoney(list.reduce((sum, item) => sum + item.cost, 0)), label: '预估总费用' }
      ]);

      view.renderRows(tbody, filtered, renderMaintenanceRow, { colspan: 8, text: '暂无维护计划' });
    }

    view.bindModalClose(closeModal);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    on(document.getElementById('search-input'), 'input', render);

    // 将当前行维护计划载入编辑弹窗。
    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().maintenance.find((m) => m.id === this.dataset.id);
      if (item) openModal(item);
    });

    // 删除当前行的设备维护计划。
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该维护计划？', () => actions.deleteMaintenance(this.dataset.id), render);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化设备故障记录页。
  function initFaultPage() {
    const tbody = document.getElementById('fault-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    // 打开故障记录新增或编辑弹窗。
    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑故障记录' : '报告故障';
      document.getElementById('f-equipName').value = data ? data.equipName : '';
      document.getElementById('f-faultDate').value = data ? data.faultDate : '';
      document.getElementById('f-description').value = data ? data.description : '';
      document.getElementById('f-severity').value = data ? data.severity : '一般';
      document.getElementById('f-status').value = data ? data.status : '待处理';
      document.getElementById('f-handler').value = data ? data.handler : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    // 关闭故障记录弹窗。
    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    // 读取故障记录弹窗表单数据。
    function readForm() {
      const equipName = view.getTrimmedValue('f-equipName');
      if (!equipName) { errorEl.textContent = '请输入设备名称'; return null; }
      return {
        equipName: equipName,
        faultDate: view.getValue('f-faultDate'),
        description: view.getTrimmedValue('f-description'),
        severity: view.getValue('f-severity'),
        status: view.getValue('f-status'),
        handler: view.getTrimmedValue('f-handler')
      };
    }

    // 保存故障记录弹窗表单数据。
    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateFault(editingId, payload);
      } else {
        actions.createFault(payload);
      }
      closeModal();
      render();
    }

    // 刷新设备故障统计和故障记录列表。
    function render() {
      const list = store.sync().faults;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(list, keyword, ['equipName', 'description', 'handler']) : list;

      renderers.stats([
        { icon: 'alert-triangle', value: list.length, label: '故障总数' },
        { icon: 'circle-filled', value: list.filter((item) => item.status !== '已解决').length, label: '未解决' },
        { icon: 'bell-ringing', value: list.filter((item) => item.severity === '严重').length, label: '严重故障' }
      ]);

      view.renderRows(tbody, filtered, renderFaultRow, { colspan: 8, text: '暂无故障记录' });
    }

    view.bindModalClose(closeModal);
    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    on(document.getElementById('search-input'), 'input', render);

    // 将当前行故障记录载入编辑弹窗。
    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().faults.find((f) => f.id === this.dataset.id);
      if (item) openModal(item);
    });

    // 删除当前行的设备故障记录。
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该故障记录？', () => actions.deleteFault(this.dataset.id), render);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 按当前设备管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('equip-tbody')) initIndexPage();
        break;
      case 'monitor.html':
        initMonitorPage();
        break;
      case 'info.html':
        initInfoPage();
        break;
      case 'maintenance.html':
        initMaintenancePage();
        break;
      case 'fault.html':
        initFaultPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(equipmentSystem.store, equipmentSystem.actions, equipmentSystem.renderers, EnterpriseView);

// 对外暴露设备管理初始化入口，供 module-loader.js 调用。
equipmentSystem.init = function() {
  try {
    equipmentSystem.pages.init();
  } catch (error) {
    console.error('equipmentSystem.init failed:', error);
  }
};

// 对外暴露设备管理状态快照，供调试和兼容 API 使用。
equipmentSystem.getState = function() {
  return equipmentSystem.store.snapshot();
};
