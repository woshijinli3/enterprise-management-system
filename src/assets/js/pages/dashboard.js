'use strict';

window.appPages = window.appPages || {};

window.appPages.dashboard = (function() {
  /** 各 store 的 localStorage 键名 */
  var STORE_KEYS = {
    employee: 'xm_employee_state',
    sales: 'xm_sales_state',
    equipment: 'xm_equipment_state',
    production: 'xm_production_state',
    purchase: 'xm_purchase_state',
    warehouse: 'xm_warehouse_state'
  };

  /**
   * 从 localStorage 读取 store 数据，不存在时返回 null。
   * @param {string} key localStorage 键名。
   * @returns {Object|null}
   */
  function readStore(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 获取指定字段，不存在时用默认值。
   * @param {Object} store store 数据对象。
   * @param {string} field 字段名。
   * @param {*} fallback 默认值。
   * @returns {*}
   */
  function getField(store, field, fallback) {
    if (store && store[field] !== undefined) return store[field];
    return fallback;
  }

  /**
   * 初始化仪表盘。
   * 图表库由 main.js 的页面依赖统一加载，这里只负责初始化数据与页面内容。
   * @returns {void}
   */
  function init() {
    initWelcome();
    ensureStores(function() {
      initStats();
      initAlerts();
      initCharts();
    });
  }

  /**
   * 确保所有 store 已从种子数据初始化。
   * 首次访问 dashboard 时 localStorage 可能为空，需要加载种子数据。
   * @param {Function} callback 初始化完成后的回调。
   * @returns {void}
   */
  function ensureStores(callback) {
    var domains = ['employee', 'sales', 'equipment', 'production', 'purchase', 'warehouse'];
    var needSeed = domains.some(function(d) { return !readStore(STORE_KEYS[d]); });

    if (!needSeed) {
      callback();
      return;
    }

    /* 加载 state.js 和所有种子数据文件 */
    var scripts = [
      '../assets/js/shared/state.js',
      '../data/employee.js',
      '../data/sales.js',
      '../data/equipment.js',
      '../data/production.js',
      '../data/purchase.js',
      '../data/warehouse.js'
    ];

    var loaded = 0;
    var total = scripts.length;

    function onDone() {
      loaded++;
      if (loaded < total) return;

      /* 种子数据已加载到全局常量，现在用 EnterpriseState 初始化 store 并持久化 */
      seedStore('xm_employee_state', typeof employeeData !== 'undefined' ? employeeData : null, [
        { name: 'employees', type: 'array' },
        { name: 'attendance', type: 'array' },
        { name: 'recruitment', type: 'array' },
        { name: 'performance', type: 'array' }
      ]);
      seedStore('xm_sales_state', typeof salesData !== 'undefined' ? salesData : null, [
        { name: 'customers', type: 'array' },
        { name: 'orders', type: 'array' },
        { name: 'report', type: 'object' },
        { name: 'pricing', type: 'array' },
        { name: 'team', type: 'array' }
      ]);
      seedStore('xm_equipment_state', typeof equipmentData !== 'undefined' ? equipmentData : null, [
        { name: 'equipment', type: 'array' },
        { name: 'maintenance', type: 'array' },
        { name: 'faults', type: 'array' }
      ]);
      seedStore('xm_production_state', typeof productionData !== 'undefined' ? productionData : null, [
        { name: 'plans', type: 'array' },
        { name: 'tasks', type: 'array' },
        { name: 'materials', type: 'array' },
        { name: 'orders', type: 'array' },
        { name: 'qualityRecords', type: 'array' }
      ]);
      seedStore('xm_purchase_state', typeof purchaseData !== 'undefined' ? purchaseData : null, [
        { name: 'suppliers', type: 'array' },
        { name: 'orders', type: 'array' },
        { name: 'analysis', type: 'object' }
      ]);
      seedStore('xm_warehouse_state', typeof warehouseData !== 'undefined' ? warehouseData : null, [
        { name: 'inventory', type: 'array' },
        { name: 'inbound', type: 'array' },
        { name: 'outbound', type: 'array' },
        { name: 'locations', type: 'array' }
      ]);

      callback();
    }

    var runtimeKeys = {
      '../assets/js/shared/state.js': 'shared-state'
    };

    scripts.forEach(function(src) {
      var key = runtimeKeys[src];
      if (key && document.querySelector('script[data-runtime-script="' + key + '"]')) {
        onDone();
        return;
      }
      if (!key && document.querySelector('script[src$="' + src.split('/').pop() + '"]')) {
        onDone();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      if (key) s.dataset.runtimeScript = key;
      s.onload = onDone;
      s.onerror = onDone;
      document.body.appendChild(s);
    });
  }

  /**
   * 用种子数据初始化一个 store 并写入 localStorage。
   * @param {string} key localStorage 键名。
   * @param {Object|null} data 种子数据对象。
   * @param {Array} fields 字段定义。
   * @returns {void}
   */
  function seedStore(key, data, fields) {
    if (!data || readStore(key)) return;

    var state = {};
    fields.forEach(function(f) {
      var val = data[f.name];
      if (f.type === 'array') {
        state[f.name] = Array.isArray(val) ? val.slice() : [];
      } else if (f.type === 'object') {
        state[f.name] = val && typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : {};
      } else {
        state[f.name] = val !== undefined ? val : null;
      }
    });

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      /* quota exceeded, ignore */
    }
  }

  /**
   * 初始化欢迎信息，根据时间段显示不同问候语。
   * @returns {void}
   */
  function initWelcome() {
    var user = typeof auth !== 'undefined' ? auth.getUser() : null;
    var welcomeName = document.getElementById('welcome-name');
    var welcomeTime = document.getElementById('welcome-time');
    var welcomeGreeting = document.getElementById('welcome-greeting');

    if (user && welcomeName) {
      welcomeName.textContent = user.username;
    }

    var now = new Date();
    var hour = now.getHours();
    var greeting = '晚上好';
    if (hour < 6) greeting = '夜深了';
    else if (hour < 12) greeting = '早上好';
    else if (hour < 14) greeting = '中午好';
    else if (hour < 18) greeting = '下午好';

    if (welcomeGreeting) {
      var name = user ? user.username : '管理员';
      welcomeGreeting.innerHTML = greeting + '，<span id="welcome-name">' + name + '</span> ' + renderIcon('wave-sine');
    }

    if (welcomeTime) {
      var timeStr = typeof formatDate === 'function'
        ? formatDate(now, 'YYYY年MM月DD日 HH:mm')
        : now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' +
          String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      welcomeTime.textContent = timeStr + ' · ' + greeting;
    }
  }

  /**
   * 初始化全局统计卡片。
   * @returns {void}
   */
  function initStats() {
    var statsEl = document.getElementById('dashboard-stats');
    if (!statsEl) return;

    var empStore = readStore(STORE_KEYS.employee);
    var salesStore = readStore(STORE_KEYS.sales);
    var equipStore = readStore(STORE_KEYS.equipment);
    var prodStore = readStore(STORE_KEYS.production);
    var purchStore = readStore(STORE_KEYS.purchase);
    var whStore = readStore(STORE_KEYS.warehouse);

    var employees = getField(empStore, 'employees', []);
    var orders = getField(salesStore, 'orders', []);
    var equipment = getField(equipStore, 'equipment', []);
    var prodOrders = getField(prodStore, 'orders', []);
    var inventory = getField(whStore, 'inventory', []);

    /* 计算统计值 */
    var totalEmployees = employees.length;
    var monthlyRevenue = 0;
    orders.forEach(function(o) {
      if (o.status === '已完成' || o.status === '配送中') {
        monthlyRevenue += o.amount || 0;
      }
    });

    var runningEquip = equipment.filter(function(e) { return e.status === '运行中'; }).length;
    var totalEquip = equipment.length;
    var equipRate = totalEquip > 0 ? Math.round(runningEquip / totalEquip * 100) : 0;

    var pendingOrders = prodOrders.filter(function(o) {
      return o.status === '待生产' || o.status === '待审核';
    }).length;

    var warnings = inventory.filter(function(i) { return i.stock < i.minStock; }).length;

    var completedTasks = 0;
    var tasks = getField(prodStore, 'tasks', []);
    tasks.forEach(function(t) { if (t.progress === 100) completedTasks++; });
    var taskRate = tasks.length > 0 ? Math.round(completedTasks / tasks.length * 100) : 0;

    var stats = [
      { icon: 'users', value: totalEmployees, label: '总员工数' },
      { icon: 'currency-dollar', value: formatMoney(monthlyRevenue), label: '在手订单金额' },
      { icon: 'settings', value: equipRate + '%', label: '设备运行率' },
      { icon: 'clipboard-list', value: pendingOrders, label: '待处理工单' },
      { icon: 'alert-triangle', value: warnings, label: '库存预警' },
      { icon: 'circle-check', value: taskRate + '%', label: '生产完成率' }
    ];

    statsEl.innerHTML = stats.map(function(item, index) {
      return '<div class="stat-card slide-up delay-' + ((index % 4) * 100) + '">' +
        '<div class="stat-icon">' + renderIcon(item.icon) + '</div>' +
        '<div class="stat-info">' +
          '<div class="stat-value">' + item.value + '</div>' +
          '<div class="stat-label">' + item.label + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /**
   * 初始化待办提醒。
   * @returns {void}
   */
  function initAlerts() {
    var alertsEl = document.getElementById('dashboard-alerts');
    if (!alertsEl) return;

    var alerts = [];

    /* 库存预警 */
    var whStore = readStore(STORE_KEYS.warehouse);
    var inventory = getField(whStore, 'inventory', []);
    var lowStock = inventory.filter(function(i) { return i.stock < i.minStock; });
    if (lowStock.length > 0) {
      alerts.push({ type: 'danger', text: lowStock.length + ' 项库存低于安全线' });
    }

    /* 设备故障 */
    var equipStore = readStore(STORE_KEYS.equipment);
    var faults = getField(equipStore, 'faults', []);
    var unresolved = faults.filter(function(f) { return f.status !== '已解决'; });
    if (unresolved.length > 0) {
      alerts.push({ type: 'warning', text: unresolved.length + ' 个设备故障待处理' });
    }

    /* 待审核订单 */
    var salesStore = readStore(STORE_KEYS.sales);
    var orders = getField(salesStore, 'orders', []);
    var pendingReview = orders.filter(function(o) { return o.status === '待审核'; });
    if (pendingReview.length > 0) {
      alerts.push({ type: 'info', text: pendingReview.length + ' 个销售订单待审核' });
    }

    /* 生产待审核 */
    var prodStore = readStore(STORE_KEYS.production);
    var prodOrders = getField(prodStore, 'orders', []);
    var prodPending = prodOrders.filter(function(o) { return o.status === '待审核'; });
    if (prodPending.length > 0) {
      alerts.push({ type: 'info', text: prodPending.length + ' 个生产订单待审核' });
    }

    /* 物料短缺 */
    var materials = getField(prodStore, 'materials', []);
    var shortages = materials.filter(function(m) { return m.shortage > 0; });
    if (shortages.length > 0) {
      alerts.push({ type: 'warning', text: shortages.length + ' 种物料存在缺口' });
    }

    /* 招聘中 */
    var empStore = readStore(STORE_KEYS.employee);
    var recruitment = getField(empStore, 'recruitment', []);
    var recruiting = recruitment.filter(function(r) { return r.status === '招聘中'; });
    if (recruiting.length > 0) {
      alerts.push({ type: 'info', text: recruiting.length + ' 个岗位正在招聘' });
    }

    if (alerts.length === 0) {
      alertsEl.innerHTML = '';
      return;
    }

    alertsEl.innerHTML =
      '<div class="alerts-title">' + renderIcon('pin') + ' 待办提醒</div>' +
      '<div class="alerts-list">' +
      alerts.map(function(a) {
        return '<span class="alert-tag alert-' + a.type + '">' + a.text + '</span>';
      }).join('') +
      '</div>';
  }

  /**
   * 初始化图表。
   * @returns {void}
   */
  function initCharts() {
    if (typeof EnterpriseCharts === 'undefined') {
      console.error('[dashboard] EnterpriseCharts 未定义，图表无法渲染');
      return;
    }

    try {
      initSalesChart();
    } catch (e) {
      console.error('[dashboard] 销售图表渲染失败:', e);
    }

    try {
      initEquipmentChart();
    } catch (e) {
      console.error('[dashboard] 设备图表渲染失败:', e);
    }
  }

  /**
   * 绘制月度销售趋势柱状图。
   * @returns {void}
   */
  function initSalesChart() {
    var canvas = document.getElementById('sales-trend-chart');
    if (!canvas) return;

    var salesStore = readStore(STORE_KEYS.sales);
    var report = getField(salesStore, 'report', null);
    var monthly = (report && report.monthly) ? report.monthly : [];

    /* 从种子数据获取月度报表 */
    if (!monthly.length && typeof salesData !== 'undefined') {
      monthly = (salesData.report && salesData.report.monthly) || [];
    }

    if (!monthly.length) {
      var parent = canvas.parentElement;
      EnterpriseCharts.destroy(canvas);
      if (parent) parent.innerHTML = '<div class="chart-empty">暂无销售数据</div>';
      return;
    }

    var labels = monthly.map(function(m) {
      var parts = m.month.split('-');
      return parts[1] + '月';
    });
    var values = monthly.map(function(m) { return m.revenue; });

    function draw() {
      EnterpriseCharts.barChart(canvas, {
        labels: labels,
        values: values,
        title: '',
        valuePrefix: '¥',
        colors: ['#FF6B00', '#FF8C33', '#FFB366', '#FF6B00', '#CC5500', '#FF8C33']
      });
    }

    draw();
    EnterpriseCharts.autoResize(canvas, draw);
  }

  /**
   * 绘制设备状态环形图。
   * @returns {void}
   */
  function initEquipmentChart() {
    var canvas = document.getElementById('equipment-status-chart');
    if (!canvas) return;

    var equipStore = readStore(STORE_KEYS.equipment);
    var equipment = getField(equipStore, 'equipment', []);

    if (!equipment.length && typeof equipmentData !== 'undefined') {
      equipment = equipmentData.equipment || [];
    }

    if (!equipment.length) {
      var parent = canvas.parentElement;
      EnterpriseCharts.destroy(canvas);
      if (parent) parent.innerHTML = '<div class="chart-empty">暂无设备数据</div>';
      return;
    }

    /* 统计设备状态 */
    var statusMap = {};
    equipment.forEach(function(e) {
      var s = e.status || '未知';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    var statusColors = {
      '运行中': '#52c41a',
      '维修中': '#faad14',
      '停机': '#f5222d',
      '闲置': '#1890ff'
    };

    var labels = Object.keys(statusMap);
    var values = labels.map(function(k) { return statusMap[k]; });
    var colors = labels.map(function(k) { return statusColors[k] || '#999'; });

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

  /**
   * 格式化金额。
   * @param {number} val
   * @returns {string}
   */
  function formatMoney(val) {
    if (val >= 10000) return (val / 10000).toFixed(1) + '万';
    return String(val);
  }

  return {
    init: init
  };
})();
