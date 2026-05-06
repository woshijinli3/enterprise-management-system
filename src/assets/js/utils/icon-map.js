'use strict';

var ICON_ALIASES = {
  'circle-filled': 'circle-dot',
  outbox: 'transfer-out',
  'star-filled': 'star',
  'user-handshake': 'heart-handshake',
  'wave-sawtooth': 'wave-sine',
  wrench: 'tool',
  zap: 'bolt'
};

/**
 * 将 Tabler 图标名渲染为图标 HTML。
 * @param {string} name Tabler 图标名。
 * @returns {string} 图标 HTML。
 */
function renderIcon(name) {
  var key = name;
  key = ICON_ALIASES[key] || key;
  return '<i class="ti ti-' + key + '"></i>';
}

window.renderIcon = renderIcon;
