'use strict';

/**
 * emoji → Tabler Icons 名称映射。
 * 用于将项目中硬编码的 emoji 替换为图标字体类名。
 */
var ICON_MAP = {
  '📊': 'chart-bar',
  '🏭': 'building-factory',
  '📈': 'chart-line',
  '⚙️': 'settings',
  '🛒': 'shopping-cart',
  '🏬': 'building-warehouse',
  '👥': 'users',
  '👋': 'wave-sawtooth',
  '📋': 'clipboard-list',
  '📦': 'package',
  '💰': 'currency-dollar',
  '🔧': 'wrench',
  '🚚': 'truck',
  '🤝': 'user-handshake',
  '👤': 'user',
  '📅': 'calendar',
  '🏆': 'trophy',
  '📡': 'radar',
  '📥': 'inbox',
  '📤': 'outbox',
  '🗺️': 'map',
  '⚠️': 'alert-triangle',
  '✅': 'circle-check',
  '📌': 'pin',
  '🕐': 'clock',
  '🏢': 'building',
  '🟢': 'circle-dot',
  '📨': 'mail',
  '🔴': 'circle-filled',
  '🚨': 'bell-ringing',
  '🛑': 'player-stop',
  '🎯': 'target',
  '🗓️': 'calendar-event',
  '🔍': 'search',
  '⭐': 'star',
  '⏰': 'alarm',
  '❌': 'x',
  '⚡': 'zap',
  '⏸️': 'player-pause'
};

/**
 * 将 emoji 或 Tabler 图标名渲染为图标 HTML。
 * @param {string} name emoji 字符串或 Tabler 图标名。
 * @returns {string} 图标 HTML。
 */
function renderIcon(name) {
  var key = ICON_MAP[name] || name;
  return '<i class="ti ti-' + key + '"></i>';
}

window.renderIcon = renderIcon;
