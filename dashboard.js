/**
 * SECL Machine Intelligence — Dashboard Controller
 * =================================================
 * Handles all UI rendering, chart management, interactions,
 * and live-update loop for the SECL monitoring dashboard.
 */

'use strict';

// ---- State ----
let machineData      = [];
let selectedMachine  = null;
let trendChart       = null;
let tickInterval     = null;

// ---- Utility helpers ----
function effColor(eff) {
  if (eff >= 75) return '#2ea85a';
  if (eff >= 55) return '#e8a020';
  return '#e04040';
}

function randomTime() {
  const h = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${h}:${m}`;
}

function updateTimestamp() {
  const el = document.getElementById('ts');
  if (!el) return;
  el.textContent = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ---- KPI Bar ----
function renderKPIs() {
  const online    = machineData.filter(m => m.prediction.badge !== 'danger').length;
  const avgEff    = Math.round(machineData.reduce((a, m) => a + m.efficiency, 0) / machineData.length);
  const needMaint = machineData.filter(m => m.prediction.badge !== 'ok').length;
  const critical  = machineData.filter(m => m.prediction.badge === 'danger').length;

  document.getElementById('kpi-online').textContent = `${online}/9`;
  document.getElementById('kpi-eff').textContent    = `${avgEff}%`;
  document.getElementById('kpi-maint').textContent  = `${needMaint} Units`;
  document.getElementById('kpi-fault').textContent  = critical;
}

// ---- Machine Cards ----
function renderMachineCard(m) {
  const ec = effColor(m.efficiency);
  const p  = m.prediction;

  const sparkBars = m.trend.map(v => {
    const h = Math.max(3, Math.round((v / 100) * 26));
    return `<div class="spark-bar" style="height:${h}px;background:${effColor(v)};opacity:0.75"></div>`;
  }).join('');

  const cardClass = ['machine-card', p.badge === 'danger' ? 'danger' : p.badge === 'warn' ? 'warn' : ''].join(' ').trim();

  return `
    <div class="${cardClass}" id="card-${m.id}" onclick="selectMachine('${m.id}')" role="button"
         tabindex="0" aria-label="Inspect ${m.name}" onkeydown="if(event.key==='Enter')selectMachine('${m.id}')">
      <div class="machine-header">
        <div>
          <div class="machine-name">${m.name}</div>
          <div class="machine-type">${m.id} &middot; ${m.type}</div>
        </div>
        <div class="badge badge-${p.badge}">
          ${p.badge === 'ok' ? 'OK' : p.badge === 'warn' ? 'WARN' : 'CRIT'}
        </div>
      </div>

      <div class="eff-bar-wrap">
        <div class="eff-bar-label">
          <span>Efficiency</span>
          <span style="color:${ec};font-family:var(--font-mono)">${m.efficiency}%</span>
        </div>
        <div class="eff-bar-track">
          <div class="eff-bar-fill" style="width:${m.efficiency}%;background:${ec}"></div>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-item">
          <div class="metric-val">${m.temperature}°C</div>
          <div class="metric-lbl">Temp</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${m.vibration}</div>
          <div class="metric-lbl">Vib mm/s</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${m.load}%</div>
          <div class="metric-lbl">Load</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${m.lastMaint}d</div>
          <div class="metric-lbl">Last Maint</div>
        </div>
      </div>

      <div class="sparkline">${sparkBars}</div>
      <div class="site-label">${m.site}</div>
    </div>`;
}

function renderMachines() {
  const grid = document.getElementById('machines-grid');
  grid.innerHTML = machineData.map(renderMachineCard).join('');
}

// ---- Detail Panel ----
function selectMachine(id) {
  selectedMachine = id;

  document.querySelectorAll('.machine-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('card-' + id);
  if (card) card.classList.add('selected');

  const m = machineData.find(x => x.id === id);
  if (!m) return;

  const panel = document.getElementById('detail-panel');
  panel.classList.add('visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // ---- Name ----
  const nameEl = document.getElementById('detail-name');
  nameEl.innerHTML = `${m.name} (${m.id}) — ${m.site} <span style="color:var(--text3)"></span>`;

  // ---- Gauge ----
  const arc    = document.getElementById('gauge-arc');
  const filled = Math.round((m.efficiency / 100) * 220);
  arc.setAttribute('stroke-dasharray', `${filled} ${220 - filled}`);
  arc.setAttribute('stroke', effColor(m.efficiency));

  const gv = document.getElementById('gauge-val');
  gv.textContent   = m.efficiency + '%';
  gv.style.color   = effColor(m.efficiency);

  // ---- Detail Metrics ----
  document.getElementById('detail-metrics').innerHTML = `
    <div class="dm-card">
      <div class="dm-val">${m.temperature}°C</div>
      <div class="dm-lbl">Temperature</div>
    </div>
    <div class="dm-card">
      <div class="dm-val">${m.vibration}<small> mm/s</small></div>
      <div class="dm-lbl">Vibration</div>
    </div>
    <div class="dm-card">
      <div class="dm-val">${m.rpm.toLocaleString()}</div>
      <div class="dm-lbl">RPM</div>
    </div>
    <div class="dm-card">
      <div class="dm-val">${m.pressure}<small> bar</small></div>
      <div class="dm-lbl">Pressure</div>
    </div>
    <div class="dm-card">
      <div class="dm-val">${m.hours.toLocaleString()}<small>h</small></div>
      <div class="dm-lbl">Operating Hours</div>
    </div>
    <div class="dm-card">
      <div class="dm-val">${m.load}%</div>
      <div class="dm-lbl">Load Factor</div>
    </div>
  `;

  // ---- ML Output ----
  renderMLOutput(m);

  // ---- Trend Chart ----
  updateTrendChart(m);
}

function renderMLOutput(m) {
  const p = m.prediction;
  const decColor = p.badge === 'ok' ? '#2ea85a' : p.badge === 'warn' ? '#f09050' : '#f06060';

  const reasonText = p.reasons.length
    ? 'Detected factors: ' + p.reasons.join(' &middot; ')
    : 'No anomalies detected. All parameters within normal operating range.';

  document.getElementById('ml-output').innerHTML = `
    <div class="ml-header">
      <i class="fa fa-microchip ml-icon" aria-hidden="true"></i>
      <span class="ml-label">ML Prediction — Isolation Forest + Random Forest Ensemble</span>
    </div>
    <div class="ml-decision" style="color:${decColor}">${p.decision}</div>
    <div class="ml-reason">${reasonText}</div>
    <div class="ml-confidence">
      <span class="conf-label">MODEL CONFIDENCE</span>
      <div class="conf-bar">
        <div class="conf-fill" style="width:${p.confidence}%;background:${decColor}"></div>
      </div>
      <span class="conf-val" style="color:${decColor}">${p.confidence}%</span>
    </div>
    <div class="ml-footer">
      RISK SCORE: ${p.riskScore}/100 &middot;
      ISOLATION SCORE: ${p.isoScore}/100 &middot;
      MODEL v2.4 &middot;
      FEATURES: TEMP · VIBRATION · EFFICIENCY · HOURS · MAINTENANCE INTERVAL · LOAD · PRESSURE
    </div>`;
}

// ---- Trend Chart ----
function updateTrendChart(m) {
  const labels = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
  const colors = m.trend.map(v => effColor(v));

  if (trendChart) { trendChart.destroy(); trendChart = null; }

  const ctx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Efficiency %',
        data: m.trend,
        borderColor: '#e8a020',
        backgroundColor: 'rgba(232,160,32,0.07)',
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Efficiency: ${ctx.parsed.y}%`,
          }
        }
      },
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#706850', font: { size: 10, family: "'Source Code Pro'" } },
        },
        y: {
          min: 0, max: 100,
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#706850', font: { size: 10 },
            callback: v => v + '%',
          }
        }
      }
    }
  });
}

// ---- Anomaly Log ----
function renderAnomalyLog() {
  const anomalies = [];

  machineData.forEach(m => {
    const p = m.prediction;
    if (p.badge === 'danger') {
      anomalies.push({
        cls:  'critical',
        text: `<strong>${m.name}</strong>: ${p.reasons[0] || 'Critical anomaly detected'}`,
        time: randomTime(),
      });
    } else if (p.badge === 'warn') {
      anomalies.push({
        cls:  'warning',
        text: `<strong>${m.name}</strong>: ${p.reasons[0] || 'Performance degraded'}`,
        time: randomTime(),
      });
    }
  });

  // Extra sensor-level flags
  machineData.forEach(m => {
    if (m.temperature > 105 && m.prediction.badge === 'ok') {
      anomalies.push({
        cls:  'warning',
        text: `${m.id}: Temperature approaching operational limit (${m.temperature}°C)`,
        time: randomTime(),
      });
    }
  });

  if (anomalies.length === 0) {
    anomalies.push({
      cls:  'info',
      text: 'All systems nominal. No anomalies detected across the fleet.',
      time: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    });
  }

  const log = document.getElementById('anomaly-log');
  log.innerHTML = anomalies.slice(0, 7).map(a => `
    <div class="anomaly-item ${a.cls}">
      <div class="anomaly-dot ${a.cls}"></div>
      <div class="anomaly-text">${a.text}</div>
      <div class="anomaly-time">${a.time}</div>
    </div>`).join('');
}

// ---- Public actions (called from HTML) ----
window.refreshData = function () {
  machineData = window.MLModel.generateAllMachineData();
  renderMachines();
  renderKPIs();
  renderAnomalyLog();
  updateTimestamp();

  if (selectedMachine) {
    const m = machineData.find(x => x.id === selectedMachine);
    if (m) selectMachine(m.id);
  }
};

window.runFullPrediction = function () {
  window.refreshData();
  const critical = machineData.filter(m => m.prediction.badge === 'danger');
  if (critical.length > 0)      { selectMachine(critical[0].id); return; }
  const warn = machineData.filter(m => m.prediction.badge === 'warn');
  if (warn.length > 0)          { selectMachine(warn[0].id); return; }
  selectMachine(machineData[0].id);
};

window.selectMachine = selectMachine;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  window.refreshData();
  tickInterval = setInterval(updateTimestamp, 1000);

  // Auto-select worst machine on load
  setTimeout(() => {
    const worst = machineData.sort((a, b) => b.prediction.riskScore - a.prediction.riskScore)[0];
    if (worst) selectMachine(worst.id);
    // Restore original sort order
    machineData = window.MLModel.MACHINES.map(def => machineData.find(m => m.id === def.id));
  }, 200);
});
