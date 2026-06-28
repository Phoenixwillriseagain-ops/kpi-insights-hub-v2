// Pulse - KPI & Breaches Analyzer v2
// Static KPI dashboard for SLA breach tracking

let kpiDefs = [];
let services = [];
let metricsDaily = [];
let breaches = [];
let slaTrendChart = null;

// Base path for repo-rooted data files
const BASE_PATH = '/kpi-insights-hub-v2/data';

// ------------------------------
// Data Loading
// ------------------------------

async function loadData() {
  try {
    const [kpisResp, servicesResp, metricsResp, breachesResp] = await Promise.all([
      fetch(`${BASE_PATH}/kpis.json`),
      fetch(`${BASE_PATH}/services.json`),
      fetch(`${BASE_PATH}/metrics_daily.json`),
      fetch(`${BASE_PATH}/breaches.json`)
    ]);

    const kpisJson = await kpisResp.json();
    const servicesJson = await servicesResp.json();
    const metricsJson = await metricsResp.json();
    const breachesJson = await breachesResp.json();

    kpiDefs = kpisJson.kpis;
    services = servicesJson.services;
    metricsDaily = metricsJson.metrics_daily;
    breaches = breachesJson.breaches;
  } catch (err) {
    console.error('Error loading data:', err);
    document.getElementById('kpiGrid').innerHTML =
      '<div class="loading-placeholder">Error loading data. Check console.</div>';
  }
}

// ------------------------------
// Filter Management
// ------------------------------

function initFilters() {
  const serviceSelect = document.getElementById('serviceFilter');
  serviceSelect.innerHTML = '<option value="">All services</option>' +
    services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  document.querySelectorAll('.status-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      renderAll();
    });
  });

  ['serviceFilter', 'phaseFilter', 'dateFilter'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderAll);
  });

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }
}

// ------------------------------
// Filter State
// ------------------------------

function getFilterState() {
  const serviceId = document.getElementById('serviceFilter').value;
  const phase = document.getElementById('phaseFilter').value;
  const dateRange = document.getElementById('dateFilter').value;
  const activeStatuses = Array.from(document.querySelectorAll('.status-chip.active'))
    .map(chip => chip.dataset.status);
  return { serviceId, phase, dateRange, activeStatuses };
}

function getFilteredBreaches(filters) {
  return breaches.filter(b => {
    if (filters.serviceId && b.service_id !== filters.serviceId) return false;
    if (filters.phase && b.phase !== filters.phase) return false;
    if (filters.activeStatuses.length) {
      const status = b.severity === 'High' ? 'breach' :
                     b.severity === 'Medium' ? 'warning' : 'good';
      return filters.activeStatuses.includes(status);
    }
    return true;

  function renderKpiCards(filters) {
  const grid = document.getElementById('kpiGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Get latest values per KPI
  const byKpi = {};
  metricsDaily.forEach(m => {
    if (filters.serviceId && m.service_id !== filters.serviceId) return;
    byKpi[m.kpi_id] = m;
  });


    function renderSummary(filters) {
  const list = document.getElementById('summaryList');
  if (!list) return;
  list.innerHTML = '';

  const filteredBreaches = getFilteredBreaches(filters);

  const totalBreaches = filteredBreaches.length;
  const highBreaches = filteredBreaches.filter(b => b.severity === 'High').length;
  const mediumBreaches = filteredBreaches.filter(b => b.severity === 'Medium').length;
  const lowBreaches = filteredBreaches.filter(b => b.severity === 'Low').length;
  const impactedServices = new Set(filteredBreaches.map(b => b.service_id)).size;
  const openBreaches = filteredBreaches.filter(b => b.status === 'Open').length;


      function renderBreaches(filters) {
  const list = document.getElementById('breachList');
  if (!list) return;
  list.innerHTML = '';

  const filtered = getFilteredBreaches(filters);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="loading-placeholder">No breaches found for current filters.</div>';
    document.getElementById('breachMeta').textContent = 'No breaches';
    return;
  }

  filtered.slice(0, 20).forEach(b => {
    const service = services.find(s => s.id === b.service_id);
    const title = `${b.id} · ${service ? service.name : b.service_id}`;
    const meta = `${b.phase} · ${b.kpi_id} · ${b.timestamp}`;

    const card = document.createElement('article');

    function renderSlaChart(filters) {
  const canvas = document.getElementById('slaTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const kpiId = 'sla_compliance';
  let data = metricsDaily.filter(m => m.kpi_id === kpiId);
  if (filters.serviceId) {
    data = data.filter(m => m.service_id === filters.serviceId);
  }
  data.sort((a, b) => a.date.localeCompare(b.date));

  const labels = data.map(m => m.date);
  const values = data.map(m => m.value);

  const chartData = {
    labels,
    datasets: [{
      label: 'SLA compliance (%)',
      data: values,
      borderColor: '#39b5ff',
      backgroundColor: 'rgba(57, 181, 255, 0.18)',
      tension: 0.25,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#8a98b5' },
        grid: { color: 'rgba(255,255,255,0.04)' }
      },
      x: {
        ticks: { color: '#8a98b5' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { labels: { color: '#f7f9fc' } }
    }
  };

      function renderAll() {
  const filters = getFilterState();
  renderKpiCards(filters);
  renderSummary(filters);
  renderBreaches(filters);
  renderSlaChart(filters);
}

// ------------------------------
// Init
// ------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initFilters();
  renderAll();
});

  if (slaTrendChart) {
    slaTrendChart.data = chartData;
    slaTrendChart.options = chartOptions;
    slaTrendChart.update();
  } else {
    slaTrendChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
    });
  }

  const chartMeta = document.getElementById('chartMeta');
  chartMeta.textContent = `${labels.length} points · ${filters.serviceId ? 'Scoped to service' : 'All services'}`;
}
    card.className = 'breach-card';
    card.innerHTML = `
      <div class="breach-main">
        <div class="breach-title">${title}</div>
        <div class="breach-meta">${meta}</div>
      </div>
      <div class="breach-badges">
        <span class="breach-badge severity-${b.severity.toLowerCase()}">${b.severity}</span>
        <span class="breach-badge">${b.status}</span>
      </div>
    `;
    list.appendChild(card);
  });

  document.getElementById('breachMeta').textContent = `${filtered.length} breaches · filtered`;
}
  const items = [
    { label: 'Total breaches', value: totalBreaches },
    { label: 'High severity', value: highBreaches },
    { label: 'Medium severity', value: mediumBreaches },
    { label: 'Low severity', value: lowBreaches },
    { label: 'Open breaches', value: openBreaches },
    { label: 'Services impacted', value: impactedServices }
  ];

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'summary-item';
    li.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
    list.appendChild(li);
  });
}
  kpiDefs.forEach(kpi => {
    const metric = byKpi[kpi.id];
    const value = metric ? metric.value : null;
    const status = classifyKpiStatus(kpi, value);
    const delta = metric ? metric.value - (metric.prev_value || value) : null;
    const deltaSign = delta > 0 ? '+' : '';

    const card = document.createElement('article');
    card.className = 'kpi-card';
    card.innerHTML = `
      <div class="kpi-title">${kpi.name}</div>
      <div class="kpi-value-row">
        <span class="kpi-value">${value != null ? value.toFixed(1) : '—'}</span>
        <span class="kpi-unit">${kpi.unit}</span>
      </div>
      <div class="kpi-footer">
        <span class="kpi-chip ${status || ''}">
          ${status === 'good' ? 'Good' : status === 'warning' ? 'Needs improvement' : status === 'breach' ? 'Breach' : 'No data'}
        </span>
        <span class="kpi-meta">
          ${delta != null ? deltaSign + delta.toFixed(1) + ' ' + kpi.unit : ''}
        </span>
      </div>
    `;
    grid.appendChild(card);
  });
}
  });
}

// ------------------------------
// KPI Card Rendering
// ------------------------------

function classifyKpiStatus(kpiDef, value) {
  if (value == null) return null;
  if (kpiDef.direction === 'higher_is_better') {
    if (value >= kpiDef.target) return 'good';
    if (value >= kpiDef.warning) return 'warning';
    return 'breach';
  } else {
    if (value <= kpiDef.target) return 'good';
    if (value <= kpiDef.warning) return 'warning';
    return 'breach';
  }
}
