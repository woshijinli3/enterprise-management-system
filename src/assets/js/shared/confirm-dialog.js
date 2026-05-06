'use strict';

const appConfirm = (function() {
  let overlay = null;
  let dialog = null;
  let icon = null;
  let title = null;
  let message = null;
  let cancelButton = null;
  let confirmButton = null;
  let pending = null;
  let lastActiveElement = null;

  /**
   * 打开统一确认弹窗。
   * @param {Object} options 弹窗配置。
   * @returns {Promise<boolean>} 用户确认时 resolve true，取消时 resolve false。
   *
   * 原因：浏览器原生 confirm 无法统一样式，后台删除等高频确认需要使用项目自己的组件。
   */
  function open(options) {
    ensureDialog();

    const config = normalizeOptions(options);
    if (pending) {
      close(false);
    }

    lastActiveElement = document.activeElement;
    title.textContent = config.title;
    message.textContent = config.message;
    cancelButton.textContent = config.cancelText;
    confirmButton.textContent = config.confirmText;
    icon.innerHTML = config.iconHtml;
    dialog.className = 'confirm-dialog confirm-dialog--' + config.type;
    overlay.classList.add('confirm-overlay--active');
    dialog.setAttribute('aria-label', config.title);

    return new Promise((resolve) => {
      pending = {
        resolve,
        onConfirm: config.onConfirm
      };

      requestAnimationFrame(() => {
        confirmButton.focus();
      });
    });
  }

  /**
   * 打开删除确认弹窗。
   * @param {string} text 提示文案。
   * @param {Object} [options] 附加配置。
   * @returns {Promise<boolean>} 用户确认结果。
   */
  function danger(text, options) {
    return open(Object.assign({
      title: '确认删除',
      message: text,
      confirmText: '删除',
      type: 'danger'
    }, options || {}));
  }

  /**
   * 关闭弹窗并返回结果。
   * @param {boolean} result 是否确认。
   * @returns {void}
   */
  function close(result) {
    if (!pending) return;

    const current = pending;
    pending = null;
    overlay.classList.remove('confirm-overlay--active');

    try {
      if (result && typeof current.onConfirm === 'function') {
        current.onConfirm();
      }
    } finally {
      current.resolve(!!result);
    }

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      requestAnimationFrame(() => lastActiveElement.focus());
    }
  }

  /**
   * 创建确认弹窗 DOM。
   * @returns {void}
   */
  function ensureDialog() {
    if (overlay) return;

    overlay = document.createElement('div');
    dialog = document.createElement('div');
    icon = document.createElement('div');
    const content = document.createElement('div');
    title = document.createElement('div');
    message = document.createElement('div');
    const actions = document.createElement('div');
    cancelButton = document.createElement('button');
    confirmButton = document.createElement('button');

    overlay.className = 'confirm-overlay';
    dialog.className = 'confirm-dialog confirm-dialog--danger';
    icon.className = 'confirm-dialog__icon';
    content.className = 'confirm-dialog__content';
    title.className = 'confirm-dialog__title';
    message.className = 'confirm-dialog__message';
    actions.className = 'confirm-dialog__actions';
    cancelButton.className = 'btn btn-ghost confirm-dialog__button';
    confirmButton.className = 'btn btn-danger confirm-dialog__button confirm-dialog__button--confirm';

    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    cancelButton.type = 'button';
    confirmButton.type = 'button';

    content.append(title, message);
    actions.append(cancelButton, confirmButton);
    dialog.append(icon, content, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelButton.addEventListener('click', () => close(false));
    confirmButton.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });

    document.addEventListener('keydown', handleKeydown);
  }

  /**
   * 处理键盘确认和关闭。
   * @param {KeyboardEvent} event 键盘事件。
   * @returns {void}
   */
  function handleKeydown(event) {
    if (!pending) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
    }

    if (event.key === 'Enter' && document.activeElement === confirmButton) {
      event.preventDefault();
      close(true);
    }
  }

  /**
   * 规范化弹窗配置。
   * @param {Object|string} options 原始配置。
   * @returns {Object} 完整配置。
   */
  function normalizeOptions(options) {
    const config = typeof options === 'string' ? { message: options } : (options || {});
    const type = config.type || 'danger';

    return {
      title: config.title || '确认操作',
      message: config.message || '确认继续执行该操作？',
      confirmText: config.confirmText || '确定',
      cancelText: config.cancelText || '取消',
      type,
      iconHtml: config.iconHtml || getIconHtml(type),
      onConfirm: config.onConfirm
    };
  }

  /**
   * 获取类型图标。
   * @param {string} type 弹窗类型。
   * @returns {string} 图标 HTML。
   */
  function getIconHtml(type) {
    const iconName = type === 'danger' ? 'alert-triangle' : 'help-circle';
    return '<i class="ti ti-' + iconName + '"></i>';
  }

  return {
    open,
    danger,
    close
  };
})();

window.appConfirm = appConfirm;
