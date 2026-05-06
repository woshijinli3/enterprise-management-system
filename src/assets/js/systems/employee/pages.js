'use strict';

window.employeeSystem = window.employeeSystem || {};

/**
 * 员工管理页面控制器。
 * 输入：employeeSystem.store/actions/renderers 与 EnterpriseView。
 * 输出：按当前 HTML 文件名初始化员工首页、考勤、绩效、招聘或档案维护页。
 *
 * 原因：员工域包含多个静态子页面，统一分发能保持 HTML 里不写内联业务脚本。
 */
employeeSystem.pages = (function(store, actions, renderers, view) {
  // 打开员工首页的档案详情弹窗。
  function showEmployeeDetail(id) {
    const employee = store.sync().employees.find((item) => item.id === id);
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    if (!employee || !title || !body) return;

    title.textContent = employee.name + ' 的员工档案';
    body.innerHTML = `
      <div class="form-row">
        <div class="form-group"><div class="form-label">工号</div><div>${employee.id}</div></div>
        <div class="form-group"><div class="form-label">姓名</div><div>${employee.name}</div></div>
        <div class="form-group"><div class="form-label">性别</div><div>${employee.gender}</div></div>
        <div class="form-group"><div class="form-label">部门</div><div>${employee.dept}</div></div>
        <div class="form-group"><div class="form-label">职位</div><div>${employee.position}</div></div>
        <div class="form-group"><div class="form-label">手机</div><div>${employee.phone}</div></div>
        <div class="form-group"><div class="form-label">邮箱</div><div>${employee.email}</div></div>
        <div class="form-group"><div class="form-label">入职日期</div><div>${employee.entryDate}</div></div>
        <div class="form-group"><div class="form-label">薪资</div><div>${formatMoney(employee.salary)}</div></div>
        <div class="form-group"><div class="form-label">状态</div><div>${employee.status}</div></div>
      </div>
    `;

    addClass(document.getElementById('modal-overlay'), 'active');
  }

  // 统计员工总数、在职人数、试用期人数和部门数。
  function renderEmployeeStats(list) {
    renderers.stats([
      { icon: 'users', value: list.length, label: '员工总数' },
      { icon: 'circle-check', value: list.filter((item) => item.status === '在职').length, label: '在职员工' },
      { icon: 'clock', value: list.filter((item) => item.status === '试用期').length, label: '试用期员工' },
      { icon: 'building', value: new Set(list.map((item) => item.dept)).size, label: '部门数量' }
    ]);
  }

  // 根据员工数据刷新部门筛选下拉框。
  function renderDeptFilter(list) {
    const select = document.getElementById('dept-filter');
    if (!select) return;

    const currentValue = select.value;
    const defaultOption = select.options[0]
      ? `<option value="${select.options[0].value}">${select.options[0].textContent}</option>`
      : '<option value="">全部部门</option>';
    const options = Array.from(new Set(list.map((item) => item.dept))).map((dept) => `
      <option value="${dept}">${dept}</option>
    `);

    select.innerHTML = defaultOption + options.join('');
    select.value = currentValue;
  }

  // 渲染员工首页的员工概览行。
  function renderEmployeeIndexRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.gender}</td>
        <td>${item.dept}</td>
        <td>${item.position}</td>
        <td>${item.entryDate}</td>
        <td>${renderers.employeeStatus(item.status)}</td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="detail" data-id="${item.id}">详情</button></div></td>
      </tr>
    `;
  }

  // 渲染考勤统计页的员工考勤行。
  function renderAttendanceRow(item) {
    const rate = ((item.actualDays / item.workDays) * 100).toFixed(1);
    const rateClass = rate >= 95 ? 'badge-success' : rate >= 85 ? 'badge-warning' : 'badge-danger';

    return `
      <tr>
        <td>${item.empId}</td>
        <td><strong>${item.empName}</strong></td>
        <td>${item.workDays} 天</td>
        <td>${item.actualDays} 天</td>
        <td>${item.lateTimes > 0 ? `<span class="badge badge-warning">${item.lateTimes} 次</span>` : '—'}</td>
        <td>${item.leaveDays > 0 ? item.leaveDays + ' 天' : '—'}</td>
        <td>${item.overtimeHours} h</td>
        <td><span class="badge ${rateClass}">${rate}%</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染绩效管理页的员工绩效行。
  function renderPerformanceRow(item) {
    return `
      <tr>
        <td>${item.empId}</td>
        <td><strong>${item.empName}</strong></td>
        <td>${item.dept}</td>
        <td>${item.period}</td>
        <td><strong>${item.score}</strong></td>
        <td><span class="badge ${renderers.gradeMap[item.grade] || 'badge-default'}">${item.grade}</span></td>
        <td class="text-muted-cell">${item.comment}</td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染招聘管理页的招聘计划行。
  function renderRecruitmentRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.position}</strong></td>
        <td>${item.dept}</td>
        <td>${item.headcount} 人</td>
        <td>${item.publishDate}</td>
        <td>${item.deadline}</td>
        <td>${item.applicants}</td>
        <td><span class="badge ${renderers.recruitmentStatusMap[item.status] || 'badge-default'}">${item.status}</span></td>
        <td><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button></div></td>
      </tr>
    `;
  }

  // 渲染员工档案维护页的员工档案行。
  function renderEmployeeInfoRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.gender}</td>
        <td>${item.dept}</td>
        <td>${item.position}</td>
        <td>${item.phone}</td>
        <td>${item.entryDate}</td>
        <td>${formatMoney(item.salary)}</td>
        <td>${renderers.employeeStatus(item.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${item.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">删除</button>
          </div>
        </td>
      </tr>
    `;
  }

  // 初始化员工管理首页。
  function initIndexPage() {
    const tbody = document.getElementById('employee-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const searchInput = document.getElementById('search-input');
    const deptFilter = document.getElementById('dept-filter');
    // 详情弹窗只展示员工信息，不维护编辑状态，关闭时只需要移除遮罩激活类。
    const closeModal = () => removeClass(document.getElementById('modal-overlay'), 'active');

    // 刷新员工首页统计、部门筛选和员工列表。
    function refresh() {
      const employees = store.sync().employees;
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const dept = deptFilter ? deptFilter.value : '';
      const filtered = view.filterByKeyword(employees, keyword, ['name', 'dept', 'position'])
        .filter((item) => !dept || item.dept === dept);

      renderEmployeeStats(employees);
      renderDeptFilter(employees);
      view.renderRows(tbody, filtered, renderEmployeeIndexRow, { colspan: 8, text: '暂无匹配员工' });
    }

    // 打开员工首页当前行的员工档案弹窗。
    function handleDetailClick() {
      showEmployeeDetail(this.dataset.id);
    }

    view.bindModalClose(closeModal);
    on(searchInput, 'input', refresh);
    on(deptFilter, 'change', refresh);
    delegate(tbody, '[data-action="detail"]', 'click', handleDetailClick);

    tbody.dataset.bound = '1';
    refresh();
  }

  // 初始化考勤统计页。
  function initAttendancePage() {
    const tbody = document.getElementById('attendance-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑考勤' : '新增考勤';
      document.getElementById('f-empId').value = data ? data.empId : '';
      document.getElementById('f-empName').value = data ? data.empName : '';
      document.getElementById('f-month').value = data ? data.month : '';
      document.getElementById('f-workDays').value = data ? data.workDays : '22';
      document.getElementById('f-actualDays').value = data ? data.actualDays : '';
      document.getElementById('f-lateTimes').value = data ? data.lateTimes : '0';
      document.getElementById('f-leaveDays').value = data ? data.leaveDays : '0';
      document.getElementById('f-overtimeHours').value = data ? data.overtimeHours : '0';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const empId = view.getTrimmedValue('f-empId');
      if (!empId) { errorEl.textContent = '请输入工号'; return null; }
      const empName = view.getTrimmedValue('f-empName');
      if (!empName) { errorEl.textContent = '请输入姓名'; return null; }
      return {
        empId: empId,
        empName: empName,
        month: view.getValue('f-month'),
        workDays: view.getValue('f-workDays'),
        actualDays: view.getValue('f-actualDays'),
        lateTimes: view.getValue('f-lateTimes'),
        leaveDays: view.getValue('f-leaveDays'),
        overtimeHours: view.getValue('f-overtimeHours')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateAttendance(editingId, payload);
      } else {
        actions.createAttendance(payload);
      }
      closeModal();
      refresh();
    }

    function render() {
      const list = store.sync().attendance;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(list, keyword, ['empId', 'empName']) : list;

      renderers.stats([
        { icon: 'users', value: list.length, label: '统计人数' },
        { icon: 'calendar', value: list.reduce((sum, item) => sum + item.actualDays, 0), label: '总出勤天数' },
        { icon: 'alarm', value: list.reduce((sum, item) => sum + item.overtimeHours, 0) + 'h', label: '总加班时长' },
        { icon: 'alert-triangle', value: list.reduce((sum, item) => sum + item.lateTimes, 0), label: '迟到次数' }
      ]);
      view.renderRows(tbody, filtered, renderAttendanceRow, { colspan: 9, text: '暂无考勤记录' });
    }

    function refresh() { render(); }

    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    on(document.getElementById('search-input'), 'input', refresh);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().attendance.find((a) => a.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该考勤记录？', () => actions.deleteAttendance(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化绩效管理页。
  function initPerformancePage() {
    const tbody = document.getElementById('perf-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑绩效' : '新增绩效';
      document.getElementById('f-empId').value = data ? data.empId : '';
      document.getElementById('f-empName').value = data ? data.empName : '';
      document.getElementById('f-dept').value = data ? data.dept : '';
      document.getElementById('f-period').value = data ? data.period : '';
      document.getElementById('f-score').value = data ? data.score : '';
      document.getElementById('f-grade').value = data ? data.grade : 'B';
      document.getElementById('f-comment').value = data ? data.comment : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const empId = view.getTrimmedValue('f-empId');
      if (!empId) { errorEl.textContent = '请输入工号'; return null; }
      const empName = view.getTrimmedValue('f-empName');
      if (!empName) { errorEl.textContent = '请输入姓名'; return null; }
      return {
        empId: empId,
        empName: empName,
        dept: view.getTrimmedValue('f-dept'),
        period: view.getTrimmedValue('f-period'),
        score: view.getValue('f-score'),
        grade: view.getValue('f-grade'),
        comment: view.getTrimmedValue('f-comment')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updatePerformance(editingId, payload);
      } else {
        actions.createPerformance(payload);
      }
      closeModal();
      refresh();
    }

    function render() {
      const list = store.sync().performance;
      const keyword = view.getTrimmedValue('search-input');
      const filtered = keyword ? view.filterByKeyword(list, keyword, ['empId', 'empName', 'dept']) : list;
      const average = list.length ? (list.reduce((sum, item) => sum + item.score, 0) / list.length).toFixed(1) : '0.0';
      const aCount = list.filter((item) => String(item.grade).startsWith('A')).length;

      renderers.stats([
        { icon: 'chart-bar', value: list.length, label: '参评人数' },
        { icon: 'star', value: average, label: '平均分' },
        { icon: 'trophy', value: aCount, label: 'A级人数' }
      ]);
      view.renderRows(tbody, filtered, renderPerformanceRow, { colspan: 8, text: '暂无绩效记录' });
    }

    function refresh() { render(); }

    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    on(document.getElementById('search-input'), 'input', refresh);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().performance.find((p) => p.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该绩效记录？', () => actions.deletePerformance(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 初始化招聘管理页。
  function initRecruitmentPage() {
    const tbody = document.getElementById('recruit-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const errorEl = document.getElementById('form-error');
    let editingId = null;

    function openModal(data) {
      editingId = data ? data.id : null;
      titleEl.textContent = data ? '编辑招聘计划' : '发布职位';
      document.getElementById('f-position').value = data ? data.position : '';
      document.getElementById('f-dept').value = data ? data.dept : '人事部';
      document.getElementById('f-headcount').value = data ? data.headcount : '1';
      document.getElementById('f-status').value = data ? data.status : '招聘中';
      document.getElementById('f-publishDate').value = data ? data.publishDate : '';
      document.getElementById('f-deadline').value = data ? data.deadline : '';
      errorEl.textContent = '';
      addClass(overlay, 'active');
    }

    function closeModal() {
      removeClass(overlay, 'active');
      editingId = null;
    }

    function readForm() {
      const position = view.getTrimmedValue('f-position');
      if (!position) { errorEl.textContent = '请输入职位名称'; return null; }
      return {
        position: position,
        dept: view.getTrimmedValue('f-dept'),
        headcount: view.getValue('f-headcount'),
        status: view.getValue('f-status'),
        publishDate: view.getValue('f-publishDate'),
        deadline: view.getValue('f-deadline')
      };
    }

    function saveModal() {
      const payload = readForm();
      if (!payload) return;
      if (editingId) {
        actions.updateRecruitment(editingId, payload);
      } else {
        actions.createRecruitment(payload);
      }
      closeModal();
      refresh();
    }

    function render() {
      const list = store.sync().recruitment;
      renderers.stats([
        { icon: 'clipboard-list', value: list.length, label: '招聘计划' },
        { icon: 'circle-dot', value: list.filter((item) => item.status === '招聘中').length, label: '招聘中' },
        { icon: 'user', value: list.reduce((sum, item) => sum + item.headcount, 0), label: '招聘总人数' },
        { icon: 'mail', value: list.reduce((sum, item) => sum + item.applicants, 0), label: '总投递数' }
      ]);
      view.renderRows(tbody, list, renderRecruitmentRow, { colspan: 9, text: '暂无招聘计划' });
    }

    function refresh() { render(); }

    on(document.getElementById('add-btn'), 'click', () => openModal(null));
    on(document.getElementById('modal-save'), 'click', saveModal);
    view.bindModalClose(closeModal);

    delegate(tbody, '[data-action="edit"]', 'click', function() {
      const item = store.sync().recruitment.find((r) => r.id === this.dataset.id);
      if (item) openModal(item);
    });
    delegate(tbody, '[data-action="delete"]', 'click', function() {
      view.confirmDelete('确认删除该招聘计划？', () => actions.deleteRecruitment(this.dataset.id), refresh);
    });

    tbody.dataset.bound = '1';
    render();
  }

  // 创建员工档案页上下文，集中保存当前表格和编辑状态。
  function createInfoContext(tbody) {
    return {
      tbody,
      editingId: null
    };
  }

  // 关闭员工档案弹窗并退出编辑状态。
  function closeInfoModal(context) {
    removeClass(document.getElementById('modal-overlay'), 'active');
    context.editingId = null;
  }

  // 打开员工档案新增或编辑弹窗。
  function openInfoModal(title) {
    const titleElement = document.getElementById('modal-title');
    const errorElement = document.getElementById('form-error');
    if (titleElement) titleElement.textContent = title;
    if (errorElement) errorElement.textContent = '';
    addClass(document.getElementById('modal-overlay'), 'active');
  }

  // 将员工档案数据写入弹窗表单。
  function fillInfoForm(employee) {
    const fields = {
      name: employee.name || '',
      gender: employee.gender || '男',
      dept: employee.dept || '',
      position: employee.position || '',
      phone: employee.phone || '',
      email: employee.email || '',
      entryDate: employee.entryDate || '',
      salary: employee.salary || ''
    };

    Object.keys(fields).forEach((key) => {
      const element = document.getElementById('f-' + key);
      if (element) element.value = fields[key];
    });
  }

  // 读取员工档案弹窗表单数据。
  function readInfoForm() {
    return {
      name: view.getTrimmedValue('f-name'),
      gender: view.getValue('f-gender', '男') || '男',
      dept: view.getTrimmedValue('f-dept'),
      position: view.getTrimmedValue('f-position'),
      phone: view.getTrimmedValue('f-phone'),
      email: view.getTrimmedValue('f-email'),
      entryDate: view.getValue('f-entryDate'),
      salary: view.getValue('f-salary', 0)
    };
  }

  // 渲染员工档案维护页表格。
  function renderInfoTable(context, list) {
    view.renderRows(context.tbody, list, renderEmployeeInfoRow, { colspan: 10, text: '暂无员工档案' });
  }

  // 按工号和姓名筛选员工档案。
  function filterInfoEmployees() {
    const keyword = view.getTrimmedValue('search-input');
    return view.filterByKeyword(store.sync().employees, keyword, ['id', 'name']);
  }

  // 刷新员工档案维护页列表。
  function refreshInfoPage(context) {
    renderInfoTable(context, filterInfoEmployees());
  }

  // 保存员工档案弹窗表单数据。
  function saveInfoForm(context) {
    const form = readInfoForm();
    const errorElement = document.getElementById('form-error');
    if (!form.name) {
      if (errorElement) errorElement.textContent = '姓名为必填项';
      return;
    }

    if (context.editingId) {
      actions.updateEmployee(context.editingId, form);
    } else {
      actions.createEmployee(form);
    }

    closeInfoModal(context);
    refreshInfoPage(context);
  }

  // 绑定员工档案维护页的新增、保存、搜索、编辑和删除事件。
  function bindInfoEvents(context) {
    view.bindModalClose(() => closeInfoModal(context));
    on(document.getElementById('add-btn'), 'click', () => {
      context.editingId = null;
      fillInfoForm({ gender: '男' });
      openInfoModal('新增员工');
    });
    on(document.getElementById('modal-save'), 'click', () => saveInfoForm(context));
    on(document.getElementById('search-input'), 'input', () => refreshInfoPage(context));

    // 将当前行员工档案载入编辑弹窗。
    function handleEditClick() {
      const employee = store.sync().employees.find((item) => item.id === this.dataset.id);
      if (!employee) return;
      context.editingId = employee.id;
      fillInfoForm(employee);
      openInfoModal('编辑员工');
    }

    // 删除当前行员工档案。
    function handleDeleteClick() {
      view.confirmDelete('确认删除该员工？', () => actions.deleteEmployee(this.dataset.id), () => refreshInfoPage(context));
    }

    delegate(context.tbody, '[data-action="edit"]', 'click', handleEditClick);
    delegate(context.tbody, '[data-action="delete"]', 'click', handleDeleteClick);
  }

  // 初始化员工档案维护页。
  function initInfoPage() {
    const tbody = document.getElementById('info-tbody');
    if (!tbody || tbody.dataset.bound === '1') return;

    const context = createInfoContext(tbody);
    bindInfoEvents(context);
    tbody.dataset.bound = '1';
    refreshInfoPage(context);
  }

  // 按当前员工管理子页面分发初始化逻辑。
  function init() {
    switch (view.pageName()) {
      case 'index.html':
        if (document.getElementById('employee-tbody')) initIndexPage();
        break;
      case 'attendance.html':
        initAttendancePage();
        break;
      case 'performance.html':
        initPerformancePage();
        break;
      case 'recruitment.html':
        initRecruitmentPage();
        break;
      case 'info.html':
        initInfoPage();
        break;
      default:
        break;
    }
  }

  return {
    init
  };
})(employeeSystem.store, employeeSystem.actions, employeeSystem.renderers, EnterpriseView);

// 对外暴露员工管理初始化入口，供 module-loader.js 调用。
employeeSystem.init = function() {
  try {
    employeeSystem.pages.init();
  } catch (error) {
    console.error('employeeSystem.init failed:', error);
  }
};

// 对外暴露员工管理状态快照，供调试和兼容 API 使用。
employeeSystem.getState = function() {
  return employeeSystem.store.snapshot();
};
