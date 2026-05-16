/**
 * SECL Machine Intelligence — ML Model Engine
 * ============================================
 * Simulates an Isolation Forest + Random Forest ensemble model
 * for anomaly detection and predictive maintenance classification.
 *
 * In a real deployment, this module would:
 *   1. Fetch live sensor data from SCADA/OPC-UA APIs
 *   2. Send feature vectors to a Python Flask/FastAPI backend
 *   3. Receive ML predictions (scikit-learn trained model)
 *   4. Render results in the dashboard
 *
 * Features used by the model:
 *   - efficiency (%)
 *   - temperature (°C)
 *   - vibration (mm/s)
 *   - pressure (bar)
 *   - operating_hours (h)
 *   - days_since_last_maintenance
 *   - load_factor (%)
 */

'use strict';

// ---- Machine Definitions ----
const MACHINES = [
  { id: 'SDL-01', name: 'Surface Drill Rig',      type: 'DRILLING UNIT',   site: 'Gevra OCP'      },
  { id: 'EXC-02', name: 'Rope Shovel',            type: 'EXCAVATION',      site: 'Kusmunda OCP'   },
  { id: 'HVT-03', name: 'Heavy Dumper 785C',      type: 'HAULAGE',         site: 'Dipka OCP'      },
  { id: 'CON-04', name: 'Belt Conveyor #4',       type: 'CONVEYING',       site: 'Gevra OCP'      },
  { id: 'CRS-05', name: 'Jaw Crusher',            type: 'CRUSHING',        site: 'Baikunthpur'    },
  { id: 'WTP-06', name: 'Water Treatment Pump',   type: 'UTILITY',         site: 'Kusmunda OCP'   },
  { id: 'EXC-07', name: 'Dragline DE-10',         type: 'EXCAVATION',      site: 'Korba Block'    },
  { id: 'HVT-08', name: 'Grader G140',            type: 'HAULAGE',         site: 'Dipka OCP'      },
  { id: 'SDL-09', name: 'Drill Master TD40',      type: 'DRILLING UNIT',   site: 'Gevra OCP'      },
];

// ---- Normal Operating Ranges (for anomaly scoring) ----
const NORMAL_RANGES = {
  efficiency:   { min: 60,  max: 100, weight: 0.30 },
  temperature:  { min: 40,  max: 95,  weight: 0.25 },
  vibration:    { min: 0,   max: 2.5, weight: 0.20 },
  lastMaint:    { min: 0,   max: 120, weight: 0.15 },
  hours:        { min: 0,   max: 5000,weight: 0.05 },
  load:         { min: 10,  max: 75,  weight: 0.05 },
};

/**
 * Simulate sensor readings for a machine.
 * Replace this with real API calls in production.
 * @param {string} machineId
 * @returns {Object} sensor readings
 */
function simulateSensorData(machineId) {
  // Introduce deliberate variability per machine slot for realism
  const seed = machineId.charCodeAt(machineId.length - 1);
  const noiseFactor = (seed % 3 === 0) ? 0.7 : 1.0; // some machines tend worse

  return {
    efficiency:  Math.round(30  + Math.random() * 65  * noiseFactor),
    temperature: Math.round(55  + Math.random() * 90),
    vibration:   parseFloat((0.3 + Math.random() * 4.7).toFixed(2)),
    pressure:    Math.round(35  + Math.random() * 120),
    rpm:         Math.round(350 + Math.random() * 1650),
    hours:       Math.round(800 + Math.random() * 6500),
    lastMaint:   Math.round(10  + Math.random() * 320),
    load:        Math.round(15  + Math.random() * 80),
  };
}

/**
 * Isolation Forest anomaly score (simplified JS implementation).
 * Returns a normalised score 0–100 (higher = more anomalous).
 * @param {Object} sensors
 * @returns {number}
 */
function isolationForestScore(sensors) {
  let totalAnomaly = 0;

  Object.entries(NORMAL_RANGES).forEach(([key, range]) => {
    const value = sensors[key];
    if (value === undefined) return;

    let deviation = 0;
    if (value < range.min) {
      deviation = (range.min - value) / (range.min || 1);
    } else if (value > range.max) {
      deviation = (value - range.max) / (range.max || 1);
    }

    totalAnomaly += deviation * range.weight * 100;
  });

  return Math.min(100, Math.round(totalAnomaly));
}

/**
 * Random Forest classification (rule-based simulation).
 * Maps sensor features to a maintenance decision.
 * In production: POST features to /api/predict and return response.
 * @param {Object} sensors
 * @returns {Object} { riskScore, decision, badge, reasons, confidence }
 */
function randomForestClassify(sensors) {
  let risk = 0;
  const reasons = [];

  // ---- Feature: Efficiency ----
  if (sensors.efficiency < 55) {
    risk += 35;
    reasons.push(`Low efficiency (${sensors.efficiency}%)`);
  }
  if (sensors.efficiency < 40) {
    risk += 20;
    reasons.push('Critical efficiency drop — possible mechanical fault');
  }

  // ---- Feature: Temperature ----
  if (sensors.temperature > 110) {
    risk += 25;
    reasons.push(`High operating temperature (${sensors.temperature}°C)`);
  }
  if (sensors.temperature > 135) {
    risk += 20;
    reasons.push('Thermal overload risk — cooling system check required');
  }

  // ---- Feature: Vibration ----
  if (sensors.vibration > 3.0) {
    risk += 20;
    reasons.push(`Elevated vibration (${sensors.vibration} mm/s)`);
  }
  if (sensors.vibration > 4.0) {
    risk += 15;
    reasons.push('Severe vibration — bearing or shaft wear suspected');
  }

  // ---- Feature: Maintenance Interval ----
  if (sensors.lastMaint > 180) {
    risk += 20;
    reasons.push(`Overdue maintenance (${sensors.lastMaint} days since last service)`);
  }
  if (sensors.lastMaint > 270) {
    risk += 15;
    reasons.push('Critically overdue — statutory inspection required');
  }

  // ---- Feature: Operating Hours ----
  if (sensors.hours > 5500) {
    risk += 15;
    reasons.push(`High operating hours (${sensors.hours.toLocaleString()}h)`);
  }

  // ---- Feature: Load Factor ----
  if (sensors.load > 78) {
    risk += 10;
    reasons.push(`Sustained high load factor (${sensors.load}%)`);
  }

  // ---- Feature: Pressure ----
  if (sensors.pressure > 130) {
    risk += 10;
    reasons.push(`Elevated hydraulic pressure (${sensors.pressure} bar)`);
  }

  // Add isolation forest contribution
  const isoScore = isolationForestScore(sensors);
  risk += Math.round(isoScore * 0.15); // 15% weight to anomaly score

  risk = Math.min(100, risk);
  const confidence = Math.round(72 + Math.random() * 22);

  let decision, badge;
  if (risk >= 60) {
    decision = 'IMMEDIATE MAINTENANCE REQUIRED';
    badge = 'danger';
  } else if (risk >= 35) {
    decision = 'SCHEDULE MAINTENANCE SOON';
    badge = 'warn';
  } else {
    decision = 'OPERATING NORMALLY';
    badge = 'ok';
  }

  return {
    riskScore:  risk,
    isoScore:   isoScore,
    decision:   decision,
    badge:      badge,
    reasons:    reasons.slice(0, 4),
    confidence: confidence,
  };
}

/**
 * Generate a full 12-hour efficiency trend for sparklines / chart.
 * @param {number} baseEff  current efficiency %
 * @returns {number[]} 12 values
 */
function generateTrend(baseEff) {
  return Array.from({ length: 12 }, (_, i) => {
    const drift = (Math.random() - 0.5) * 18 + i * 0.4;
    return Math.max(15, Math.min(100, Math.round(baseEff + drift)));
  });
}

/**
 * Build a complete machine data object.
 * @param {Object} machineDef  entry from MACHINES array
 * @returns {Object}
 */
function buildMachineData(machineDef) {
  const sensors = simulateSensorData(machineDef.id);
  const prediction = randomForestClassify(sensors);
  const trend = generateTrend(sensors.efficiency);

  return {
    ...machineDef,
    ...sensors,
    prediction,
    trend,
  };
}

/**
 * Refresh all machine data.
 * @returns {Object[]}
 */
function generateAllMachineData() {
  return MACHINES.map(buildMachineData);
}

// ---- Export for dashboard.js ----
window.MLModel = {
  generateAllMachineData,
  buildMachineData,
  MACHINES,
};
