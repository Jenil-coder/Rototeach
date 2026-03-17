// ============================================================
// CHART RENDERING UTILITIES
// ============================================================

// Dynamic chart colors based on theme
function getChartColors() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  if (isDark) {
    return {
      ACCENT:  '#7C3AED',
      DARK:    '#06B6D4',
      GRAY:    '#4C1D95',
      LGRAY:   '#0E7490',
      TICK:    '#64748B',
      GRID:    'rgba(124,58,237,0.08)',
      COLORS:  ['#7C3AED','#06B6D4','#A855F7','#22D3EE','#5B21B6','#0891B2','#8B5CF6','#67E8F9'],
      CHART_COLORS: ['#7C3AED','#06B6D4','#A855F7','#22D3EE','#5B21B6','#0891B2','#8B5CF6','#67E8F9']
    };
  }
  return {
    ACCENT:  '#F2D94A',
    DARK:    '#1A1A1A',
    GRAY:    '#888888',
    LGRAY:   '#BBBBBB',
    TICK:    '#888888',
    GRID:    'rgba(26,26,26,0.06)',
    COLORS:  ['#1A1A1A','#F2D94A','#888888','#BBBBBB','#2E2E2E','#F5F4E8','#444','#CCC'],
    CHART_COLORS: ['#1A1A1A','#F2D94A','#4A4A4A','#AAAAAA','#888888','#DDDDDD','#666','#BBB']
  };
}

// Registry to destroy existing charts before recreating
const CHARTS = {};

function destroyChart(id) {
  if (CHARTS[id]) { CHARTS[id].destroy(); delete CHARTS[id]; }
}

function destroyAllCharts() {
  Object.keys(CHARTS).forEach(id => destroyChart(id));
}

function makeChart(id, config) {
  destroyChart(id);
  const el = document.getElementById(id);
  if (!el) return;
  CHARTS[id] = new Chart(el, config);
  return CHARTS[id];
}

function baseScales(opts = {}) {
  const { GRID, TICK } = getChartColors();
  return {
    x: {
      grid: { color: GRID, display: opts.xGrid !== false },
      ticks: { color: TICK, maxTicksLimit: opts.maxX || 10, font: { family: 'DM Mono', size: 10 } }
    },
    y: {
      grid: { color: GRID },
      ticks: {
        color: TICK, font: { family: 'DM Mono', size: 10 },
        callback: opts.yFmt || (v => fmtM(v))
      },
      beginAtZero: true
    }
  };
}

function renderRevTrend(data) {
  const labels = data.map(d => d.month.split(' ')[0]);
  const { DARK, GRID, TICK } = getChartColors();
  makeChart('chartRevTrend', {
    type: 'line',
    data: { labels, datasets: [{ label: 'Revenue', data: data.map(d => d.revenue), borderColor: DARK, backgroundColor: DARK.replace(')', ',.06)').replace('1A1A1A', 'rgba(26,26,26').replace('1E3A8A', 'rgba(30,58,138'), fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { ...baseScales({ maxX: 8 }), x: { grid: { display: false }, ticks: { color: TICK, font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 8 } } } }
  });
}

const pieLabelsPlugin = {
  id: 'pieLabels',
  afterDatasetDraw(chart) {
    const { ACCENT } = getChartColors();
    const { ctx, data } = chart;
    const meta = chart.getDatasetMeta(0);
    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

    meta.data.forEach((arc, i) => {
      const value = data.datasets[0].data[i];
      const pct = total ? Math.round((value / total) * 100) : 0;

      // Only draw label if slice is big enough (> 5%)
      if (pct < 5) return;

      // Get center point of the arc slice
      const cx = arc.x;
      const cy = arc.y;
      const innerRadius = arc.innerRadius || 0;
      const outerRadius = arc.outerRadius;
      const midRadius = innerRadius + (outerRadius - innerRadius) * 0.6;
      const startAngle = arc.startAngle;
      const endAngle = arc.endAngle;
      const midAngle = startAngle + (endAngle - startAngle) / 2;

      const x = cx + midRadius * Math.cos(midAngle);
      const y = cy + midRadius * Math.sin(midAngle);

      // Determine text color based on slice background
      const bgColor = data.datasets[0].backgroundColor[i];
      const isLight = bgColor === ACCENT || bgColor === '#F2D94A' || bgColor === '#fff' || bgColor === '#ffffff' || bgColor === '#3B82F6' || bgColor === '#93C5FD' || bgColor === '#BFDBFE' || bgColor === '#60A5FA' || bgColor === '#DBEAFE';
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw formatted value
      ctx.fillStyle = isLight ? '#1A1A1A' : '#FFFFFF';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText(fmtM(value), x, y - 6);

      // Draw percentage below value
      ctx.font = '9px Outfit, sans-serif';
      ctx.fillStyle = isLight ? 'rgba(26,26,26,0.7)' : 'rgba(255,255,255,0.7)';
      ctx.fillText(pct + '%', x, y + 6);
      
      ctx.restore();
    });
  }
};

function renderIndustry(data) {
  const top4 = data.slice(0, 4);
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const { ACCENT, DARK } = getChartColors();
  const dColors = isDark
    ? ['#7C3AED','#06B6D4','#A855F7','#22D3EE','rgba(92,33,182,0.7)','rgba(8,145,178,0.5)']
    : ['#F2D94A','#fff','rgba(255,255,255,.5)','rgba(255,255,255,.3)','rgba(255,255,255,.2)'];
  const DOT_COLORS = isDark ? dColors : [ACCENT, '#fff', 'rgba(255,255,255,.5)', 'rgba(255,255,255,.3)', 'rgba(255,255,255,.2)'];
  const lg = document.getElementById('industryLegend');
  if (lg) {
    lg.innerHTML = top4.map((d, i) => `
      <div class="ind-row">
        <span class="ind-dot" style="background:${DOT_COLORS[i]}"></span>
        <span class="ind-name">${d.industry}</span>
        <span class="ind-pct">${d.pct.toFixed(1)}%</span>
      </div>`).join('');
  }
  makeChart('chartIndustry', {
    type: 'pie',
    data: { labels: data.map(d => d.industry), datasets: [{ data: data.map(d => d.revenue), backgroundColor: DOT_COLORS, borderWidth: 2, borderColor: DARK }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtM(ctx.raw)}` } } } },
    plugins: [pieLabelsPlugin]
  });
}

function renderHBar(id, labels, values, opts = {}) {
  const { ACCENT, DARK, GRID, TICK } = getChartColors();
  const bgs = opts.colors || labels.map((_, i) => i === 0 ? ACCENT : DARK);
  makeChart(id, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: bgs, borderRadius: 4 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK, font: { family: 'DM Mono', size: 10 }, callback: v => fmtM(v) }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: opts.tickColor || TICK, font: { family: 'DM Mono', size: 10 } } }
      }
    }
  });
}

function renderVBar(id, labels, values, opts = {}) {
  const { ACCENT, DARK, GRID, TICK } = getChartColors();
  const bgs = opts.colors || labels.map(() => DARK);
  makeChart(id, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: bgs, borderRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        ...baseScales({ xGrid: false }),
        x: { grid: { display: false }, ticks: { color: opts.tickColor || TICK, font: { family: 'DM Mono', size: 10 } } }
      }
    }
  });
}

function renderGroupedBar(id, labels, datasets, opts = {}) {
  const { TICK } = getChartColors();
  makeChart(id, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { color: TICK, font: { family: 'DM Mono', size: 10 }, boxWidth: 12 } } },
      scales: { ...baseScales({ xGrid: false }) }
    }
  });
}

function renderYoyLine(id, data) {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const { ACCENT, DARK, TICK } = getChartColors();
  makeChart(id, {
    type: 'line',
    data: {
      labels: data.map(d => d.month),
      datasets: [
        { label: 'Current Year', data: data.map(d => d.current), borderColor: isDark ? '#7C3AED' : DARK, backgroundColor: isDark ? 'rgba(124,58,237,0.08)' : (DARK === '#1A1A1A' ? 'rgba(26,26,26,.04)' : 'rgba(30,58,138,.04)'), fill: true, tension: 0.4, pointRadius: 3 },
        { label: 'Previous Year', data: data.map(d => d.prev), borderColor: isDark ? '#06B6D4' : ACCENT, backgroundColor: isDark ? 'rgba(6,182,212,0.08)' : (ACCENT === '#F2D94A' ? 'rgba(242,217,74,.08)' : 'rgba(59,130,246,.08)'), fill: false, tension: 0.4, pointRadius: 3, borderDash: [4, 4] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { color: TICK, font: { family: 'DM Mono', size: 10 }, boxWidth: 12 } } },
      scales: { ...baseScales({ xGrid: false }) }
    }
  });
}

function renderPipelineStagesChart(stageData) {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const { ACCENT, DARK } = getChartColors();
  const labels = Object.keys(stageData);
  const values = labels.map(s => stageData[s].value);
  const bgs = isDark
    ? ['#4C1D95','#7C3AED','#06B6D4','#22D3EE','#0E7490']
    : ['#94A3B8', DARK, DARK, ACCENT, DARK].map((c, i) => labels[i] ? (c || '#888') : '#888');
  renderVBar('chartPipeStages', labels, values, { colors: bgs });
}

function renderAllCharts(D) {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const { ACCENT, DARK, TICK } = getChartColors();
  // Overview Tab
  renderRevTrend(D.revenueByMonth);
  renderIndustry(D.revenueByIndustry);
  renderVBar('chartPlants', D.revenueByPlant.map(d => shorten(d.plant)), D.revenueByPlant.map(d => d.revenue),
    { colors: D.revenueByPlant.map((_, i) => i === 0 ? ACCENT : DARK) });
  renderVBar('chartRegions', D.revenueByRegion.map(d => d.region), D.revenueByRegion.map(d => d.revenue),
    { colors: D.revenueByRegion.map(() => DARK) });
  renderVBar('chartSales', D.revenueBySalesperson.map(d => d.name.split(' ')[0]), D.revenueBySalesperson.map(d => d.revenue),
    { colors: D.revenueBySalesperson.map(() => DARK), tickColor: TICK });

  // Insights Tab
  renderVBar('chartInsPlants', D.revenueByPlant.slice(0,6).map(d => shorten(d.plant)),
    D.revenueByPlant.slice(0,6).map(d => d.revenue),
    { colors: D.revenueByPlant.slice(0,6).map((_, i) => i === 0 ? ACCENT : DARK) });
  renderHBar('chartInsCustomers', D.revenueByCustomer.slice(0,6).map(d => d.customer),
    D.revenueByCustomer.slice(0,6).map(d => d.revenue));

  // Alerts Tab - YoY grouped bar chart
  renderYoyLine('chartYoyMonth', D.yoy.byMonth);
  renderGroupedBar('chartYoyPlant',
    D.yoy.byPlant.map(d => shorten(d.plant)),
    [
      { label: 'Current', data: D.yoy.byPlant.map(d => d.current), backgroundColor: isDark ? '#7C3AED' : DARK, borderRadius: 4 },
      { label: 'Previous', data: D.yoy.byPlant.map(d => d.prev), backgroundColor: isDark ? '#06B6D4' : ACCENT, borderRadius: 4 }
    ]
  );
}

function shorten(str, max = 10) {
  if (!str) return '';
  const words = str.split(' ');
  return words[0].length > max ? words[0].substring(0, max) + '…' : words[0];
}
