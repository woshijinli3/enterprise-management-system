'use strict';

const appFormControls = (function() {
  const SELECT_SELECTOR = 'select.form-control:not([data-enhanced-control])';
  const TIME_INPUT_SELECTOR = [
    'input.form-control[type="date"]:not([data-enhanced-control])',
    'input.form-control[type="month"]:not([data-enhanced-control])',
    'input.form-control[type="time"]:not([data-enhanced-control])',
    'input.form-control[type="datetime-local"]:not([data-enhanced-control])'
  ].join(',');

  const selectControls = new Map();
  const timeControls = new Map();
  let activeControl = null;
  let observer = null;
  let initialized = false;
  let scanTimer = null;
  let syncTimer = null;

  /**
   * 初始化所有表单增强控件。
   * @returns {void}
   *
   * 原因：后台页面没有构建流程，统一入口负责扫描静态表单并监听后续业务渲染。
   */
  function init() {
    if (initialized) {
      scanControls();
      syncAll();
      return;
    }

    initialized = true;
    scanControls();
    bindGlobalEvents();
    observeControlChanges();
  }

  /**
   * 扫描当前页面所有可增强控件。
   * @returns {void}
   */
  function scanControls() {
    cleanupDetachedControls();
    document.querySelectorAll(SELECT_SELECTOR).forEach(enhanceSelect);
    document.querySelectorAll(TIME_INPUT_SELECTOR).forEach(enhanceTimeInput);
    syncAll();
  }

  /**
   * 清理已经离开 DOM 的增强控件。
   * @returns {void}
   */
  function cleanupDetachedControls() {
    selectControls.forEach((control, source) => {
      if (!source.isConnected) {
        destroyControl(control);
        selectControls.delete(source);
      }
    });

    timeControls.forEach((control, source) => {
      if (!source.isConnected) {
        destroyControl(control);
        timeControls.delete(source);
      }
    });
  }

  /**
   * 销毁增强控件的浮层和监听器。
   * @param {Object} control 控件状态。
   * @returns {void}
   */
  function destroyControl(control) {
    if (activeControl === control) {
      activeControl = null;
    }

    if (control.optionsObserver) {
      control.optionsObserver.disconnect();
    }

    if (control.panel && control.panel.parentElement) {
      control.panel.remove();
    }

    if (control.wrapper && control.wrapper.parentElement && !control.source.isConnected) {
      control.wrapper.remove();
    }
  }

  /**
   * 创建增强下拉控件。
   * @param {HTMLSelectElement} select 原生下拉。
   * @returns {void}
   */
  function enhanceSelect(select) {
    if (selectControls.has(select)) return;

    const wrapper = document.createElement('div');
    const trigger = document.createElement('button');
    const value = document.createElement('span');
    const arrow = document.createElement('span');
    const panel = document.createElement('div');
    const list = document.createElement('div');

    select.dataset.enhancedControl = 'select';
    select.classList.add('form-control--native-enhanced');

    wrapper.className = 'enhanced-select';
    if (select.style.width) {
      wrapper.style.width = select.style.width;
    }

    trigger.type = 'button';
    trigger.className = 'enhanced-control-trigger enhanced-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    value.className = 'enhanced-control-trigger__value';
    arrow.className = 'enhanced-control-trigger__arrow';
    arrow.setAttribute('aria-hidden', 'true');

    panel.className = 'enhanced-select__panel';
    list.className = 'enhanced-select__list';
    list.setAttribute('role', 'listbox');

    trigger.append(value, arrow);
    panel.appendChild(list);
    wrapper.appendChild(trigger);
    select.insertAdjacentElement('afterend', wrapper);
    document.body.appendChild(panel);

    const control = {
      type: 'select',
      source: select,
      wrapper,
      trigger,
      value,
      panel,
      list,
      optionsObserver: null
    };

    selectControls.set(select, control);
    rebuildSelectOptions(control);
    syncSelect(control);

    trigger.addEventListener('click', () => toggleControl(control));
    trigger.addEventListener('keydown', (event) => handleSelectTriggerKeydown(event, control));
    select.addEventListener('change', () => syncSelect(control));
    select.addEventListener('input', () => syncSelect(control));

    control.optionsObserver = new MutationObserver(() => {
      rebuildSelectOptions(control);
      syncSelect(control);
    });
    control.optionsObserver.observe(select, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['disabled', 'label', 'selected', 'value']
    });
  }

  /**
   * 根据原生 option 重新构建视觉选项。
   * @param {Object} control 下拉控件状态。
   * @returns {void}
   */
  function rebuildSelectOptions(control) {
    control.list.innerHTML = '';

    Array.from(control.source.options).forEach((option, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'enhanced-select__option';
      item.textContent = option.textContent;
      item.dataset.value = option.value;
      item.setAttribute('role', 'option');

      if (option.disabled) {
        item.disabled = true;
        item.classList.add('is-disabled');
      }

      item.addEventListener('click', () => {
        if (option.disabled) return;
        control.source.selectedIndex = index;
        dispatchNativeChange(control.source);
        syncSelect(control);
        closeActiveControl();
      });

      control.list.appendChild(item);
    });
  }

  /**
   * 同步下拉视觉状态。
   * @param {Object} control 下拉控件状态。
   * @returns {void}
   */
  function syncSelect(control) {
    const selected = control.source.options[control.source.selectedIndex];
    control.value.textContent = selected ? selected.textContent : '请选择';
    control.trigger.disabled = control.source.disabled;
    control.wrapper.classList.toggle('is-disabled', control.source.disabled);

    Array.from(control.list.children).forEach((item) => {
      const isSelected = selected && item.dataset.value === selected.value;
      item.classList.toggle('is-selected', !!isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  /**
   * 创建日期、月份、时间类增强控件。
   * @param {HTMLInputElement} input 原生时间输入。
   * @returns {void}
   */
  function enhanceTimeInput(input) {
    if (timeControls.has(input)) return;

    const wrapper = document.createElement('div');
    const trigger = document.createElement('button');
    const value = document.createElement('span');
    const icon = document.createElement('span');
    const panel = document.createElement('div');

    input.dataset.enhancedControl = 'time';
    input.classList.add('form-control--native-enhanced');

    wrapper.className = 'enhanced-date';
    if (input.style.width) {
      wrapper.style.width = input.style.width;
    }

    trigger.type = 'button';
    trigger.className = 'enhanced-control-trigger enhanced-date__trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    value.className = 'enhanced-control-trigger__value';
    icon.className = 'enhanced-date__icon ti ti-calendar';
    icon.setAttribute('aria-hidden', 'true');
    panel.className = 'enhanced-date__panel';

    trigger.append(value, icon);
    wrapper.appendChild(trigger);
    input.insertAdjacentElement('afterend', wrapper);
    document.body.appendChild(panel);

    const control = {
      type: 'time',
      source: input,
      inputType: input.type,
      wrapper,
      trigger,
      value,
      panel,
      viewDate: getInputDate(input),
      timeValue: getInputTime(input)
    };

    timeControls.set(input, control);
    syncTimeInput(control);

    trigger.addEventListener('click', () => toggleControl(control));
    trigger.addEventListener('keydown', (event) => handleTimeTriggerKeydown(event, control));
    input.addEventListener('change', () => syncTimeInput(control));
    input.addEventListener('input', () => syncTimeInput(control));
  }

  /**
   * 打开或关闭指定控件。
   * @param {Object} control 控件状态。
   * @returns {void}
   */
  function toggleControl(control) {
    if (activeControl === control) {
      closeActiveControl();
      return;
    }

    openControl(control);
  }

  /**
   * 打开指定控件并完成定位。
   * @param {Object} control 控件状态。
   * @returns {void}
   */
  function openControl(control) {
    closeActiveControl();
    activeControl = control;
    control.wrapper.classList.add('is-open');
    control.trigger.setAttribute('aria-expanded', 'true');

    if (control.type === 'time') {
      control.viewDate = getInputDate(control.source);
      control.timeValue = getInputTime(control.source);
      renderTimePanel(control);
    } else {
      syncSelect(control);
    }

    control.panel.classList.add('is-open');
    positionPanel(control);
  }

  /**
   * 关闭当前打开的控件。
   * @returns {void}
   */
  function closeActiveControl() {
    if (!activeControl) return;

    activeControl.wrapper.classList.remove('is-open');
    activeControl.panel.classList.remove('is-open');
    activeControl.trigger.setAttribute('aria-expanded', 'false');
    activeControl = null;
  }

  /**
   * 根据触发器位置放置浮层。
   * @param {Object} control 控件状态。
   * @returns {void}
   */
  function positionPanel(control) {
    const rect = control.trigger.getBoundingClientRect();
    const panel = control.panel;
    const viewportGap = 12;
    const width = Math.min(
      Math.max(rect.width, control.type === 'time' ? 292 : 220),
      window.innerWidth - viewportGap * 2
    );

    panel.style.width = `${width}px`;
    panel.style.left = `${Math.max(viewportGap, Math.min(rect.left, window.innerWidth - width - viewportGap))}px`;
    panel.style.top = `${rect.bottom + 8}px`;

    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const shouldOpenUp = panelRect.bottom > window.innerHeight - viewportGap && rect.top > panelRect.height;
      panel.classList.toggle('is-above', shouldOpenUp);
      panel.style.top = shouldOpenUp ? `${rect.top - panelRect.height - 8}px` : `${rect.bottom + 8}px`;
    });
  }

  /**
   * 渲染日期、月份或时间浮层。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function renderTimePanel(control) {
    if (control.inputType === 'time') {
      renderClockPanel(control);
      return;
    }

    if (control.inputType === 'month') {
      renderMonthPanel(control);
      return;
    }

    renderDatePanel(control);
  }

  /**
   * 渲染日期面板。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function renderDatePanel(control) {
    const year = control.viewDate.getFullYear();
    const month = control.viewDate.getMonth();
    const selectedDate = parseDateValue(control.source.value);
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < startOffset; index += 1) {
      cells.push('<span class="enhanced-date__day is-empty"></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateValue = toDateValue(new Date(year, month, day));
      const isSelected = selectedDate && selectedDate.value === dateValue;
      cells.push(
        '<button type="button" class="enhanced-date__day' + (isSelected ? ' is-selected' : '') + '" data-date="' + dateValue + '">' + day + '</button>'
      );
    }

    control.panel.innerHTML = [
      '<div class="enhanced-date__header">',
      '<button type="button" class="enhanced-date__nav" data-action="prev" aria-label="上个月"><i class="ti ti-chevron-left"></i></button>',
      '<div class="enhanced-date__title">' + year + '年' + pad(month + 1) + '月</div>',
      '<button type="button" class="enhanced-date__nav" data-action="next" aria-label="下个月"><i class="ti ti-chevron-right"></i></button>',
      '</div>',
      '<div class="enhanced-date__weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>',
      '<div class="enhanced-date__grid">' + cells.join('') + '</div>',
      control.inputType === 'datetime-local' ? renderTimeFooter(control) : ''
    ].join('');

    bindDatePanel(control);
  }

  /**
   * 渲染月份面板。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function renderMonthPanel(control) {
    const year = control.viewDate.getFullYear();
    const selected = control.source.value;
    const months = Array.from({ length: 12 }, (_, index) => {
      const value = year + '-' + pad(index + 1);
      return '<button type="button" class="enhanced-date__month' + (selected === value ? ' is-selected' : '') + '" data-month="' + value + '">' + pad(index + 1) + '月</button>';
    });

    control.panel.innerHTML = [
      '<div class="enhanced-date__header">',
      '<button type="button" class="enhanced-date__nav" data-action="prev-year" aria-label="上一年"><i class="ti ti-chevron-left"></i></button>',
      '<div class="enhanced-date__title">' + year + '年</div>',
      '<button type="button" class="enhanced-date__nav" data-action="next-year" aria-label="下一年"><i class="ti ti-chevron-right"></i></button>',
      '</div>',
      '<div class="enhanced-date__months">' + months.join('') + '</div>'
    ].join('');

    bindDatePanel(control);
  }

  /**
   * 渲染时间面板。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function renderClockPanel(control) {
    const time = splitTime(control.timeValue);
    const hours = Array.from({ length: 24 }, (_, hour) => {
      const text = pad(hour);
      return '<button type="button" class="enhanced-date__time-item' + (time.hour === text ? ' is-selected' : '') + '" data-hour="' + text + '">' + text + '</button>';
    });
    const minutes = Array.from({ length: 60 }, (_, minute) => {
      const text = pad(minute);
      return '<button type="button" class="enhanced-date__time-item' + (time.minute === text ? ' is-selected' : '') + '" data-minute="' + text + '">' + text + '</button>';
    });

    control.panel.innerHTML = [
      '<div class="enhanced-date__time">',
      '<div class="enhanced-date__time-column">' + hours.join('') + '</div>',
      '<div class="enhanced-date__time-column">' + minutes.join('') + '</div>',
      '</div>'
    ].join('');

    bindDatePanel(control);
    scrollSelectedTime(control.panel);
  }

  /**
   * 渲染 datetime-local 的时间区域。
   * @param {Object} control 时间类控件状态。
   * @returns {string} 时间选择 HTML。
   */
  function renderTimeFooter(control) {
    const time = splitTime(control.timeValue);
    return [
      '<div class="enhanced-date__footer">',
      '<select class="enhanced-date__time-select" data-time-part="hour" aria-label="小时">',
      Array.from({ length: 24 }, (_, hour) => '<option value="' + pad(hour) + '"' + (pad(hour) === time.hour ? ' selected' : '') + '>' + pad(hour) + '</option>').join(''),
      '</select>',
      '<span>:</span>',
      '<select class="enhanced-date__time-select" data-time-part="minute" aria-label="分钟">',
      Array.from({ length: 60 }, (_, minute) => '<option value="' + pad(minute) + '"' + (pad(minute) === time.minute ? ' selected' : '') + '>' + pad(minute) + '</option>').join(''),
      '</select>',
      '<button type="button" class="enhanced-date__done" data-action="done">完成</button>',
      '</div>'
    ].join('');
  }

  /**
   * 绑定时间面板内的按钮事件。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function bindDatePanel(control) {
    control.panel.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => handlePanelAction(control, button.dataset.action));
    });

    control.panel.querySelectorAll('[data-date]').forEach((button) => {
      button.addEventListener('click', () => {
        setDateValue(control, button.dataset.date);
        if (control.inputType === 'date') {
          closeActiveControl();
        } else {
          renderTimePanel(control);
          positionPanel(control);
        }
      });
    });

    control.panel.querySelectorAll('[data-month]').forEach((button) => {
      button.addEventListener('click', () => {
        control.source.value = button.dataset.month;
        dispatchNativeChange(control.source);
        syncTimeInput(control);
        closeActiveControl();
      });
    });

    control.panel.querySelectorAll('[data-hour], [data-minute]').forEach((button) => {
      button.addEventListener('click', () => {
        setTimeValue(control, button.dataset.hour, button.dataset.minute);
        renderTimePanel(control);
      });
    });

    control.panel.querySelectorAll('[data-time-part]').forEach((select) => {
      select.addEventListener('change', () => {
        const hour = control.panel.querySelector('[data-time-part="hour"]').value;
        const minute = control.panel.querySelector('[data-time-part="minute"]').value;
        setTimeValue(control, hour, minute);
      });
    });
  }

  /**
   * 处理面板导航动作。
   * @param {Object} control 时间类控件状态。
   * @param {string} action 动作名。
   * @returns {void}
   */
  function handlePanelAction(control, action) {
    if (action === 'prev') control.viewDate.setMonth(control.viewDate.getMonth() - 1);
    if (action === 'next') control.viewDate.setMonth(control.viewDate.getMonth() + 1);
    if (action === 'prev-year') control.viewDate.setFullYear(control.viewDate.getFullYear() - 1);
    if (action === 'next-year') control.viewDate.setFullYear(control.viewDate.getFullYear() + 1);
    if (action === 'done') {
      closeActiveControl();
      return;
    }

    renderTimePanel(control);
    positionPanel(control);
  }

  /**
   * 设置日期值。
   * @param {Object} control 时间类控件状态。
   * @param {string} dateValue yyyy-mm-dd。
   * @returns {void}
   */
  function setDateValue(control, dateValue) {
    if (control.inputType === 'datetime-local') {
      control.source.value = dateValue + 'T' + control.timeValue;
    } else {
      control.source.value = dateValue;
    }

    dispatchNativeChange(control.source);
    syncTimeInput(control);
  }

  /**
   * 设置时间值。
   * @param {Object} control 时间类控件状态。
   * @param {string|undefined} nextHour 小时。
   * @param {string|undefined} nextMinute 分钟。
   * @returns {void}
   */
  function setTimeValue(control, nextHour, nextMinute) {
    const current = splitTime(control.timeValue);
    const hour = nextHour || current.hour;
    const minute = nextMinute || current.minute;
    control.timeValue = hour + ':' + minute;

    if (control.inputType === 'datetime-local') {
      const dateValue = control.source.value ? control.source.value.slice(0, 10) : toDateValue(control.viewDate);
      control.source.value = dateValue + 'T' + control.timeValue;
    } else {
      control.source.value = control.timeValue;
    }

    dispatchNativeChange(control.source);
    syncTimeInput(control);
  }

  /**
   * 同步时间类控件视觉状态。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function syncTimeInput(control) {
    control.value.textContent = formatInputValue(control.source);
    control.trigger.disabled = control.source.disabled;
    control.wrapper.classList.toggle('is-disabled', control.source.disabled);
    control.timeValue = getInputTime(control.source);
  }

  /**
   * 绑定全局事件。
   * @returns {void}
   */
  function bindGlobalEvents() {
    document.addEventListener('pointerdown', (event) => {
      if (!activeControl) return;
      if (activeControl.wrapper.contains(event.target) || activeControl.panel.contains(event.target)) return;
      closeActiveControl();
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeActiveControl();
    });

    document.addEventListener('click', scheduleSync, true);
    window.addEventListener('resize', () => activeControl && positionPanel(activeControl));
    window.addEventListener('scroll', () => activeControl && positionPanel(activeControl), true);
  }

  /**
   * 监听动态表单和弹窗打开状态。
   * @returns {void}
   */
  function observeControlChanges() {
    observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      let shouldSync = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') shouldScan = true;
        if (mutation.type === 'attributes') shouldSync = true;
      });

      if (shouldScan) scheduleScan();
      if (shouldSync) scheduleSync();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled', 'style', 'type']
    });
  }

  /**
   * 延迟扫描，合并同一轮 DOM 改动。
   * @returns {void}
   */
  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = requestAnimationFrame(() => {
      scanTimer = null;
      scanControls();
    });
  }

  /**
   * 延迟同步，覆盖业务代码直接设置 value 的情况。
   * @returns {void}
   */
  function scheduleSync() {
    if (syncTimer) return;
    syncTimer = requestAnimationFrame(() => {
      syncTimer = null;
      cleanupDetachedControls();
      syncAll();
    });
  }

  /**
   * 同步全部增强控件。
   * @returns {void}
   */
  function syncAll() {
    selectControls.forEach(syncSelect);
    timeControls.forEach(syncTimeInput);
  }

  /**
   * 处理下拉触发器键盘事件。
   * @param {KeyboardEvent} event 键盘事件。
   * @param {Object} control 下拉控件状态。
   * @returns {void}
   */
  function handleSelectTriggerKeydown(event, control) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    openControl(control);
  }

  /**
   * 处理时间触发器键盘事件。
   * @param {KeyboardEvent} event 键盘事件。
   * @param {Object} control 时间类控件状态。
   * @returns {void}
   */
  function handleTimeTriggerKeydown(event, control) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openControl(control);
  }

  /**
   * 触发原生变更事件，让业务筛选和保存逻辑保持原样。
   * @param {HTMLElement} element 原生控件。
   * @returns {void}
   */
  function dispatchNativeChange(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * 获取输入对应日期。
   * @param {HTMLInputElement} input 原生输入。
   * @returns {Date} 可展示日期。
   */
  function getInputDate(input) {
    const parsed = parseDateValue(input.value);
    return parsed ? parsed.date : new Date();
  }

  /**
   * 获取输入对应时间。
   * @param {HTMLInputElement} input 原生输入。
   * @returns {string} HH:mm。
   */
  function getInputTime(input) {
    if (input.type === 'datetime-local' && input.value.includes('T')) {
      return input.value.split('T')[1].slice(0, 5);
    }

    if (input.type === 'time' && input.value) {
      return input.value.slice(0, 5);
    }

    return '09:00';
  }

  /**
   * 解析日期值。
   * @param {string} value 控件值。
   * @returns {{date: Date, value: string}|null} 日期信息。
   */
  function parseDateValue(value) {
    if (!value) return null;

    const datePart = value.includes('T') ? value.split('T')[0] : value;
    const match = datePart.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3] || '1');
    return {
      date: new Date(year, month, day),
      value: year + '-' + pad(month + 1) + '-' + pad(day)
    };
  }

  /**
   * 格式化输入展示值。
   * @param {HTMLInputElement} input 原生输入。
   * @returns {string} 展示文本。
   */
  function formatInputValue(input) {
    if (!input.value) {
      return input.placeholder || getEmptyText(input.type);
    }

    if (input.type === 'date') return input.value.replace(/-/g, '/');
    if (input.type === 'month') return input.value.replace('-', '/');
    if (input.type === 'datetime-local') return input.value.replace('T', ' ').replace(/-/g, '/');
    return input.value;
  }

  /**
   * 获取空值文案。
   * @param {string} type 输入类型。
   * @returns {string} 空值文案。
   */
  function getEmptyText(type) {
    if (type === 'month') return '请选择月份';
    if (type === 'time') return '请选择时间';
    if (type === 'datetime-local') return '请选择日期时间';
    return '请选择日期';
  }

  /**
   * 滚动时间列到选中项附近。
   * @param {HTMLElement} panel 浮层。
   * @returns {void}
   */
  function scrollSelectedTime(panel) {
    panel.querySelectorAll('.enhanced-date__time-column').forEach((column) => {
      const selected = column.querySelector('.is-selected');
      if (selected) {
        column.scrollTop = Math.max(0, selected.offsetTop - column.clientHeight / 2 + selected.clientHeight / 2);
      }
    });
  }

  /**
   * 拆分时间。
   * @param {string} time HH:mm。
   * @returns {{hour: string, minute: string}} 时间片段。
   */
  function splitTime(time) {
    const parts = String(time || '09:00').split(':');
    return {
      hour: pad(Number(parts[0]) || 0),
      minute: pad(Number(parts[1]) || 0)
    };
  }

  /**
   * 日期转 yyyy-mm-dd。
   * @param {Date} date 日期对象。
   * @returns {string} 日期值。
   */
  function toDateValue(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /**
   * 两位补零。
   * @param {number|string} value 数值。
   * @returns {string} 两位字符。
   */
  function pad(value) {
    return String(value).padStart(2, '0');
  }

  return {
    init,
    scan: scanControls,
    sync: syncAll
  };
})();

window.appFormControls = appFormControls;
