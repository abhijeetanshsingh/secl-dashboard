# SECL Machine Intelligence Dashboard

> **ML-powered machine efficiency monitoring & predictive maintenance system**
> Built for **South Eastern Coalfields Limited (SECL)** — a Coal India subsidiary.

![SECL Dashboard Preview](assets/preview.png)

---

## Features

- **Real-time machine monitoring** — 9 heavy machines across SECL mine sites (Gevra, Kusmunda, Dipka, Baikunthpur, Korba)
- **ML Prediction Engine** — Isolation Forest (anomaly detection) + Random Forest (maintenance classification) ensemble
- **Efficiency scoring** — live gauge, trend chart, and sparklines per machine
- **Maintenance alerts** — three-tier system: OK / Schedule Soon / Immediate Action
- **Anomaly log** — auto-generated fault log with severity levels
- **Responsive design** — works on desktop, tablet, and mobile

---

## Machine Fleet

| ID     | Name                  | Type           | Site            |
|--------|-----------------------|----------------|-----------------|
| SDL-01 | Surface Drill Rig     | DRILLING UNIT  | Gevra OCP       |
| EXC-02 | Rope Shovel           | EXCAVATION     | Kusmunda OCP    |
| HVT-03 | Heavy Dumper 785C     | HAULAGE        | Dipka OCP       |
| CON-04 | Belt Conveyor #4      | CONVEYING      | Gevra OCP       |
| CRS-05 | Jaw Crusher           | CRUSHING       | Baikunthpur     |
| WTP-06 | Water Treatment Pump  | UTILITY        | Kusmunda OCP    |
| EXC-07 | Dragline DE-10        | EXCAVATION     | Korba Block     |
| HVT-08 | Grader G140           | HAULAGE        | Dipka OCP       |
| SDL-09 | Drill Master TD40     | DRILLING UNIT  | Gevra OCP       |

---

## ML Model

The dashboard uses a simulated **Isolation Forest + Random Forest ensemble**:

| Feature                  | Weight |
|--------------------------|--------|
| Efficiency (%)           | 30%    |
| Temperature (°C)         | 25%    |
| Vibration (mm/s)         | 20%    |
| Maintenance interval (d) | 15%    |
| Operating hours          | 5%     |
| Load factor (%)          | 5%     |

**Decision classes:**
- `OPERATING NORMALLY` — Risk score < 35
- `SCHEDULE MAINTENANCE SOON` — Risk score 35–59
- `IMMEDIATE MAINTENANCE REQUIRED` — Risk score ≥ 60

---

## Project Structure

```
secl-dashboard/
├── index.html          # Main dashboard page
├── css/
│   └── style.css       # All styles (dark industrial theme)
├── js/
│   ├── ml-model.js     # ML model engine (Isolation Forest + RF logic)
│   └── dashboard.js    # UI controller, chart rendering, interactions
├── assets/
│   └── favicon.svg     # SECL favicon
└── README.md
```

---

## Getting Started

### Option 1 — Open directly (no server needed)

```bash
git clone https://github.com/YOUR_USERNAME/secl-dashboard.git
cd secl-dashboard
# Just open index.html in your browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

### Option 2 — Local dev server (recommended)

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve .

# Then open: http://localhost:8080
```

---

## Deploying with GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select `Deploy from a branch`
4. Choose `main` branch and `/ (root)` folder
5. Click **Save**
6. Your dashboard will be live at:
   `https://YOUR_USERNAME.github.io/secl-dashboard/`

---

## Connecting to Real Sensor Data

To connect this to live SCADA / OPC-UA sensor feeds, replace the `simulateSensorData()` function in `js/ml-model.js`:

```javascript
// Replace this in ml-model.js:
async function simulateSensorData(machineId) {
  const response = await fetch(`https://your-api.secl.gov.in/sensors/${machineId}`);
  const data = await response.json();
  return {
    efficiency:  data.efficiency_pct,
    temperature: data.temp_celsius,
    vibration:   data.vibration_mms,
    pressure:    data.pressure_bar,
    rpm:         data.shaft_rpm,
    hours:       data.operating_hours,
    lastMaint:   data.days_since_maintenance,
    load:        data.load_factor_pct,
  };
}
```

For production ML, train a scikit-learn model on historical SECL maintenance records and deploy via a **Python Flask/FastAPI backend**, then call `/api/predict` from the dashboard.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Vanilla HTML5 / CSS3 / JavaScript |
| Charts     | Chart.js 4.4                      |
| Icons      | Font Awesome 6                    |
| Fonts      | Google Fonts (Rajdhani, IBM Plex) |
| ML Logic   | Custom JS (Isolation Forest + RF) |
| Hosting    | GitHub Pages (static)             |

---

## License

MIT — free to use and modify for SECL / Coal India internal use.

---

*Developed for SECL — South Eastern Coalfields Limited, Bilaspur, Chhattisgarh.*
*A subsidiary of Coal India Limited (CIL), Ministry of Coal, Government of India.*
