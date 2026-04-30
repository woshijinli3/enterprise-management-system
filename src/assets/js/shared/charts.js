'use strict';

/**
 * 原生 Canvas 图表工具模块。
 * 提供柱状图、饼图/环形图、折线图三种基础图表，零外部依赖。
 *
 * 原因：项目保持零框架原则，使用 Canvas 2D API 替代 Chart.js 等库。
 */
const EnterpriseCharts = (function () {
  /** 默认颜色板，与项目 CSS 变量对应 */
  var COLORS = [
    '#FF6B00', '#1890ff', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#13c2c2', '#eb2f96', '#95de64', '#ffc53d'
  ];

  /*
   * 获取 CSS 变量值。
   * @param {string} name CSS 变量名（含 --）。
   * @param {string} fallback 回退值。
   * @returns {string}
   */
  function getCSSVar(name, fallback) {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    } catch (e) {
      return fallback;
    }
  }

  /**
   * 解析颜色：支持 CSS 变量名或直接色值。
   * @param {string} color CSS 变量名或直接色值。
   * @returns {string} 解析后的色值。
   *
   * 原因：业务页可传入 --color-primary 等变量名或 #FF6B00 等直接色值，统一解析后图表模块无需关心来源。
   */
  function resolveColor(color) {
    if (color && color.startsWith('--')) {
      return getCSSVar(color, COLORS[0]);
    }
    return color || COLORS[0];
  }

  /**
   * 设置 canvas 的逻辑像素尺寸以匹配容器。
   * @param {HTMLCanvasElement} canvas
   * @returns {{w: number, h: number, dpr: number}}
   */
  function fitCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.parentElement;
    var w, h;

    if (parent) {
      var style = getComputedStyle(parent);
      var padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      var padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      var rect = parent.getBoundingClientRect();
      w = (rect.width - padX) || 300;
      h = (rect.height - padY) || 200;
    } else {
      w = canvas.width || 300;
      h = canvas.height || 200;
    }

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    return { w: w, h: h, dpr: dpr, ctx: ctx };
  }

  /**
   * 绘制柱状图。
   * @param {HTMLCanvasElement} canvas 目标 canvas 元素。
   * @param {Object} config 配置对象。
   * @param {string[]} config.labels X 轴标签数组。
   * @param {number[]} config.values 数据值数组。
   * @param {string} [config.title] 图表标题。
   * @param {string[]} [config.colors] 自定义颜色数组。
   * @param {boolean} [config.showValue=true] 是否在柱顶显示数值。
   * @param {string} [config.valuePrefix=''] 数值前缀（如 '¥'）。
   * @returns {void}
   */
  function barChart(canvas, config) {
    if (!canvas || !config) return;

    var setup = fitCanvas(canvas);
    var ctx = setup.ctx;
    var w = setup.w;
    var h = setup.h;
    var labels = config.labels || [];
    var values = config.values || [];
    var colors = config.colors || COLORS;
    var title = config.title || '';
    var showValue = config.showValue !== false;
    var valuePrefix = config.valuePrefix || '';
    var n = Math.min(labels.length, values.length);

    if (n === 0) return;

    var padding = { top: title ? 40 : 20, right: 20, bottom: 40, left: 50 };
    var chartW = w - padding.left - padding.right;
    var chartH = h - padding.top - padding.bottom;
    var maxVal = Math.max.apply(null, values) || 1;
    maxVal = Math.ceil(maxVal * 1.15);
    var barWidth = Math.max(8, (chartW / n) * 0.6);
    var gap = (chartW - barWidth * n) / (n + 1);

    ctx.clearRect(0, 0, w, h);

    /* 标题 */
    if (title) {
      ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
      ctx.font = 'bold ' + getCSSVar('--font-size-md', '15px') + ' sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, padding.left, 24);
    }

    /* 网格线和 Y 轴刻度 */
    ctx.strokeStyle = getCSSVar('--border-color', '#ebeef5');
    ctx.lineWidth = 1;
    ctx.fillStyle = getCSSVar('--color-text-secondary', '#666');
    ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
    ctx.textAlign = 'right';

    var gridLines = 4;
    for (var i = 0; i <= gridLines; i++) {
      var y = padding.top + chartH - (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      var labelVal = Math.round((maxVal / gridLines) * i);
      ctx.fillText(formatAxisValue(labelVal), padding.left - 8, y + 4);
    }

    /* 柱子 */
    for (var j = 0; j < n; j++) {
      var barH = (values[j] / maxVal) * chartH;
      var x = padding.left + gap + j * (barWidth + gap);
      var barY = padding.top + chartH - barH;
      var color = colors[j % colors.length];

      /* 渐变填充 */
      var grad = ctx.createLinearGradient(x, barY, x, padding.top + chartH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '66');
      ctx.fillStyle = grad;

      roundRect(ctx, x, barY, barWidth, barH, 4);
      ctx.fill();

      /* 数值 */
      if (showValue) {
        ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
        ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(valuePrefix + formatAxisValue(values[j]), x + barWidth / 2, barY - 6);
      }

      /* X 轴标签 */
      ctx.fillStyle = getCSSVar('--color-text-secondary', '#666');
      ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[j], x + barWidth / 2, padding.top + chartH + 20);
    }
  }

  /**
   * 绘制饼图或环形图。
   * @param {HTMLCanvasElement} canvas 目标 canvas 元素。
   * @param {Object} config 配置对象。
   * @param {string[]} config.labels 分类标签。
   * @param {number[]} config.values 数据值。
   * @param {string} [config.title] 图表标题。
   * @param {string[]} [config.colors] 自定义颜色。
   * @param {number} [config.innerRadius=0.55] 内圆半径比例（0~1，0 为实心饼图）。
   * @param {boolean} [config.showLegend=true] 是否显示图例。
   * @returns {void}
   */
  function pieChart(canvas, config) {
    if (!canvas || !config) return;

    var setup = fitCanvas(canvas);
    var ctx = setup.ctx;
    var w = setup.w;
    var h = setup.h;
    var labels = config.labels || [];
    var values = config.values || [];
    var colors = config.colors || COLORS;
    var title = config.title || '';
    var innerRadius = config.innerRadius != null ? config.innerRadius : 0.55;
    var showLegend = config.showLegend !== false;
    var n = Math.min(labels.length, values.length);

    if (n === 0) return;

    var total = values.reduce(function (s, v) { return s + v; }, 0);
    if (total === 0) return;

    var padding = { top: title ? 44 : 20, right: 20, bottom: 20, left: 20 };
    var legendW = showLegend ? 120 : 0;
    var availW = w - padding.left - padding.right - legendW;
    var availH = h - padding.top - padding.bottom;
    var cx = padding.left + availW / 2;
    var cy = padding.top + availH / 2;
    var outerR = Math.min(availW, availH) / 2 - 10;
    var innerR = outerR * innerRadius;

    ctx.clearRect(0, 0, w, h);

    /* 标题 */
    if (title) {
      ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
      ctx.font = 'bold ' + getCSSVar('--font-size-md', '15px') + ' sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, padding.left, 26);
    }

    /* 扇形 */
    var startAngle = -Math.PI / 2;
    for (var i = 0; i < n; i++) {
      var sliceAngle = (values[i] / total) * Math.PI * 2;
      var endAngle = startAngle + sliceAngle;
      var color = colors[i % colors.length];

      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      /* 百分比标注 */
      if (sliceAngle > 0.25) {
        var midAngle = startAngle + sliceAngle / 2;
        var labelR = (outerR + innerR) / 2;
        var lx = cx + labelR * Math.cos(midAngle);
        var ly = cy + labelR * Math.sin(midAngle);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + getCSSVar('--font-size-xs', '12px') + ' sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(values[i] / total * 100) + '%', lx, ly);
      }

      startAngle = endAngle;
    }

    /* 中心文字 */
    if (innerR > 20) {
      ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
      ctx.font = 'bold ' + getCSSVar('--font-size-xl', '20px') + ' sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, cx, cy - 6);
      ctx.fillStyle = getCSSVar('--color-text-secondary', '#666');
      ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
      ctx.fillText('总计', cx, cy + 12);
    }

    /* 图例 */
    if (showLegend) {
      var legendX = w - padding.right - legendW + 10;
      var legendY = padding.top + 10;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      for (var k = 0; k < n; k++) {
        var iy = legendY + k * 22;
        ctx.fillStyle = colors[k % colors.length];
        ctx.fillRect(legendX, iy - 5, 10, 10);
        ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
        ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
        ctx.fillText(labels[k], legendX + 16, iy);
      }
    }
  }

  /**
   * 绘制折线图。
   * @param {HTMLCanvasElement} canvas 目标 canvas 元素。
   * @param {Object} config 配置对象。
   * @param {string[]} config.labels X 轴标签。
   * @param {Array<number[]|Object>} config.datasets 数据系列。
   *   每项可以是 number[] 或 { values: number[], label: string, color: string }。
   * @param {string} [config.title] 图表标题。
   * @param {boolean} [config.showArea=false] 是否填充面积。
   * @param {boolean} [config.showLegend=true] 是否显示图例。
   * @returns {void}
   */
  function lineChart(canvas, config) {
    if (!canvas || !config) return;

    var setup = fitCanvas(canvas);
    var ctx = setup.ctx;
    var w = setup.w;
    var h = setup.h;
    var labels = config.labels || [];
    var datasets = config.datasets || [];
    var title = config.title || '';
    var showArea = config.showArea === true;
    var showLegend = config.showLegend !== false;

    if (!labels.length || !datasets.length) return;

    /* 规范化数据集 */
    var series = datasets.map(function (ds, idx) {
      if (Array.isArray(ds)) {
        return { values: ds, label: '系列' + (idx + 1), color: COLORS[idx % COLORS.length] };
      }
      return {
        values: ds.values || [],
        label: ds.label || '系列' + (idx + 1),
        color: ds.color || COLORS[idx % COLORS.length]
      };
    });

    var n = labels.length;
    var allVals = [];
    series.forEach(function (s) {
      s.values.forEach(function (v) { allVals.push(v); });
    });
    var maxVal = Math.max.apply(null, allVals) || 1;
    maxVal = Math.ceil(maxVal * 1.15);

    var legendH = showLegend && series.length > 1 ? 30 : 0;
    var padding = { top: (title ? 40 : 20) + legendH, right: 20, bottom: 40, left: 50 };
    var chartW = w - padding.left - padding.right;
    var chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    /* 标题 */
    if (title) {
      ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
      ctx.font = 'bold ' + getCSSVar('--font-size-md', '15px') + ' sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, padding.left, 24);
    }

    /* 图例 */
    if (showLegend && series.length > 1) {
      var legendX = padding.left;
      var legendY = title ? 42 : 20;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';

      series.forEach(function (s, idx) {
        var lx = legendX + idx * 100;
        ctx.fillStyle = s.color;
        ctx.fillRect(lx, legendY - 5, 10, 10);
        ctx.fillStyle = getCSSVar('--color-text-primary', '#1a1a1a');
        ctx.fillText(s.label, lx + 16, legendY);
      });
    }

    /* 网格线 */
    ctx.strokeStyle = getCSSVar('--border-color', '#ebeef5');
    ctx.lineWidth = 1;
    ctx.fillStyle = getCSSVar('--color-text-secondary', '#666');
    ctx.font = getCSSVar('--font-size-xs', '12px') + ' sans-serif';
    ctx.textAlign = 'right';

    var gridLines = 4;
    for (var g = 0; g <= gridLines; g++) {
      var gy = padding.top + chartH - (chartH / gridLines) * g;
      ctx.beginPath();
      ctx.moveTo(padding.left, gy);
      ctx.lineTo(w - padding.right, gy);
      ctx.stroke();
      ctx.fillText(formatAxisValue(Math.round((maxVal / gridLines) * g)), padding.left - 8, gy + 4);
    }

    /* X 轴标签 */
    ctx.textAlign = 'center';
    ctx.fillStyle = getCSSVar('--color-text-secondary', '#666');
    for (var xl = 0; xl < n; xl++) {
      var xx = padding.left + (n > 1 ? (xl / (n - 1)) * chartW : chartW / 2);
      ctx.fillText(labels[xl], xx, padding.top + chartH + 20);
    }

    /* 折线 */
    series.forEach(function (s) {
      var points = [];
      for (var p = 0; p < Math.min(s.values.length, n); p++) {
        var px = padding.left + (n > 1 ? (p / (n - 1)) * chartW : chartW / 2);
        var py = padding.top + chartH - (s.values[p] / maxVal) * chartH;
        points.push({ x: px, y: py });
      }

      /* 面积填充 */
      if (showArea && points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach(function (pt) { ctx.lineTo(pt.x, pt.y); });
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = s.color + '20';
        ctx.fill();
      }

      /* 线条 */
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      points.forEach(function (pt, idx) {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      /* 数据点 */
      points.forEach(function (pt) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }

  /**
   * 绘制圆角矩形路径。
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} r
   */
  function roundRect(ctx, x, y, w, h, r) {
    if (h < r * 2) r = h / 2;
    if (w < r * 2) r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * 格式化坐标轴数值（大数字缩写）。
   * @param {number} val
   * @returns {string}
   */
  function formatAxisValue(val) {
    if (val >= 10000) return (val / 10000).toFixed(1) + '万';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return String(val);
  }

  /**
   * 自动响应容器大小变化。
   * @param {HTMLCanvasElement} canvas
   * @param {Function} drawFn 重绘函数。
   * @returns {ResizeObserver|null}
   */
  function autoResize(canvas, drawFn) {
    if (!window.ResizeObserver) return null;

    var observer = new ResizeObserver(function () {
      drawFn();
    });

    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return observer;
  }

  return {
    barChart: barChart,
    pieChart: pieChart,
    lineChart: lineChart,
    autoResize: autoResize,
    COLORS: COLORS,
    getCSSVar: getCSSVar,
    formatAxisValue: formatAxisValue
  };
})();

window.EnterpriseCharts = EnterpriseCharts;
