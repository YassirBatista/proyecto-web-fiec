/* ═══════════════════════════════════════════════════════
   script.js — Lógica interactiva y telemetría en tiempo real
═══════════════════════════════════════════════════════ */

"use strict";

/* ══════════════════════════════════
   1. DETECCIÓN DE VIEWPORT
══════════════════════════════════ */
const VW = document.getElementById("vp-vw");
const VH = document.getElementById("vp-vh");
const BP = document.getElementById("vp-bp");
const OR = document.getElementById("vp-or");
const bpSegs = document.querySelectorAll(".bp-seg");
const deviceCards = document.querySelectorAll(".device-card");

const breakpoints = [
  { name: "xs",  min: 0,   max: 479,  label: "< 480px",  icon: "📱" },
  { name: "sm",  min: 480, max: 767,  label: "480–768px", icon: "📱" },
  { name: "md",  min: 768, max: 1023, label: "768–1024px",icon: "📟" },
  { name: "lg",  min: 1024,max: 1279, label: "1024–1280px",icon:"💻" },
  { name: "xl",  min: 1280,max: 99999,label: "> 1280px",  icon: "🖥️" },
];

function getCurrentBP(w) {
  return breakpoints.find(b => w >= b.min && w <= b.max) || breakpoints[0];
}

function updateViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bp = getCurrentBP(w);

  if (VW) VW.textContent = w + "px";
  if (VH) VH.textContent = h + "px";
  if (BP) BP.textContent = bp.label;
  if (OR) OR.textContent = w > h ? "Horizontal (landscape)" : "Vertical (portrait)";

  // Barra de breakpoints
  bpSegs.forEach((seg, i) => {
    seg.classList.toggle("active", breakpoints[i].name === bp.name);
  });

  // Tarjetas de dispositivo
  deviceCards.forEach(card => {
    card.classList.toggle("active-bp", card.dataset.bp === bp.name);
  });
}

window.addEventListener("resize", updateViewport);
updateViewport();

/* ══════════════════════════════════
   2. DEMO CLAMP + CALC
══════════════════════════════════ */
const clampSlider  = document.getElementById("clamp-slider");
const clampTarget  = document.getElementById("clamp-target");
const clampDisplay = document.getElementById("clamp-display");
const calcBar      = document.getElementById("calc-bar");
const calcDisplay  = document.getElementById("calc-display");

if (clampSlider) {
  clampSlider.addEventListener("input", () => {
    const val = parseInt(clampSlider.value);
    // Simula clamp(0.875rem, 2.5vw + 0.5rem, 2rem)
    const remPx  = 16;
    const min    = 0.875 * remPx;
    const max    = 2 * remPx;
    const pref   = (2.5 / 100) * val + 0.5 * remPx;
    const result = Math.min(max, Math.max(min, pref));
    if (clampTarget)  clampTarget.style.fontSize = result + "px";
    if (clampDisplay) clampDisplay.textContent   = result.toFixed(1) + "px";
  });
}

const calcSlider  = document.getElementById("calc-slider");
const plainBar    = document.getElementById("plain-bar");
const pctDisplay  = document.getElementById("pct-display");

if (calcSlider) {
  function updateCalcDemo() {
    const val = parseInt(calcSlider.value);

    // Barra sin calc: solo el porcentaje puro
    if (plainBar)    plainBar.style.width     = val + "%";
    if (pctDisplay)  pctDisplay.textContent   = val + "%";

    // Barra con calc: mismo % pero restando 2rem fijos
    if (calcBar)     calcBar.style.width      = `calc(${val}% - 2rem)`;
    if (calcDisplay) calcDisplay.textContent  = `calc(${val}% - 2rem)`;
  }
  calcSlider.addEventListener("input", updateCalcDemo);
  updateCalcDemo(); // estado inicial
}

/* ══════════════════════════════════
   3. GAUGES — CORE WEB VITALS
══════════════════════════════════ */

const GAUGE_CONFIG = {
  lcp: {
    el:       "gauge-lcp",
    fillEl:   "fill-lcp",
    valEl:    "val-lcp",
    statusEl: "status-lcp",
    unit:     "ms",
    max:      4000,
    thresholds: [2500, 4000], // good < 2500, med < 4000, bad >= 4000
    color:    { good: "#b8ff57", medium: "#ffbb00", bad: "#ff3f6c" },
  },
  cls: {
    el:       "gauge-cls",
    fillEl:   "fill-cls",
    valEl:    "val-cls",
    statusEl: "status-cls",
    unit:     "",
    max:      0.5,
    thresholds: [0.1, 0.25],
    color:    { good: "#b8ff57", medium: "#ffbb00", bad: "#ff3f6c" },
  },
  inp: {
    el:       "gauge-inp",
    fillEl:   "fill-inp",
    valEl:    "val-inp",
    statusEl: "status-inp",
    unit:     "ms",
    max:      500,
    thresholds: [200, 500],
    color:    { good: "#b8ff57", medium: "#ffbb00", bad: "#ff3f6c" },
  },
};

const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54
const ARC_FRACTION  = 0.75; // 270° arc

function getCategory(value, thresholds) {
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "medium";
  return "bad";
}

function setGauge(key, value) {
  const cfg  = GAUGE_CONFIG[key];
  const fill = document.getElementById(cfg.fillEl);
  const valEl = document.getElementById(cfg.valEl);
  const statusEl = document.getElementById(cfg.statusEl);
  const card = document.getElementById(cfg.el);
  if (!fill || !valEl) return;

  const pct  = Math.min(1, value / cfg.max);
  const dash = CIRCUMFERENCE * ARC_FRACTION;
  const offset = dash - pct * dash;

  const cat   = getCategory(value, cfg.thresholds);
  const color = cfg.color[cat];

  fill.style.strokeDasharray  = `${dash} ${CIRCUMFERENCE}`;
  fill.style.strokeDashoffset = offset;
  fill.style.stroke = color;

  // Mostrar valor
  const display = cfg.unit === "ms"
    ? (value >= 1000 ? (value / 1000).toFixed(2) + "s" : Math.round(value) + "ms")
    : value.toFixed(3);
  valEl.textContent = display;

  // Estado
  const labels = { good: "Bueno ✓", medium: "Mejorable", bad: "Deficiente ✗" };
  const classes = { good: "status-good", medium: "status-medium", bad: "status-bad" };
  if (statusEl) {
    statusEl.textContent = labels[cat];
    statusEl.className   = "gauge-status " + classes[cat];
  }

  if (card) {
    card.style.setProperty("--glow-color", color);
    card.style.borderColor = color + "60";
  }
}

function resetGauges() {
  ["lcp","cls","inp"].forEach(key => {
    const cfg = GAUGE_CONFIG[key];
    const fill = document.getElementById(cfg.fillEl);
    const valEl = document.getElementById(cfg.valEl);
    const statusEl = document.getElementById(cfg.statusEl);
    if (fill) {
      fill.style.strokeDashoffset = CIRCUMFERENCE * ARC_FRACTION;
    }
    if (valEl)    valEl.textContent = "—";
    if (statusEl) { statusEl.textContent = "Esperando..."; statusEl.className = "gauge-status status-wait"; }
  });
}

/* ══════════════════════════════════
   4. MONITOR DE LATENCIA
══════════════════════════════════ */
let signalHistory = [];
const MAX_HISTORY = 20;

const latencyNumber = document.getElementById("latency-number");
const latencyUnit   = document.getElementById("latency-unit");
const latencySig    = document.getElementById("latency-signal");
const latencyFill   = document.getElementById("lat-fill-current");
const latencyAvgFill= document.getElementById("lat-fill-avg");
const latencyMinFill= document.getElementById("lat-fill-min");
const latencyAvgVal = document.getElementById("lat-val-avg");
const latencyMinVal = document.getElementById("lat-val-min");
const latencyCurrVal= document.getElementById("lat-val-curr");
const liveDot       = document.getElementById("live-dot");
const eventLog      = document.getElementById("event-log");
const sigCount      = document.getElementById("sig-count");
const deviceIp      = document.getElementById("device-ip");

function msToColor(ms) {
  if (ms < 50)  return "#b8ff57";
  if (ms < 150) return "#ffbb00";
  return "#ff3f6c";
}

function updateLatencyUI(data) {
  const ms = data.latency_ms;
  signalHistory.push(ms || 0);
  if (signalHistory.length > MAX_HISTORY) signalHistory.shift();

  const avg = signalHistory.reduce((a,b) => a+b, 0) / signalHistory.length;
  const min = Math.min(...signalHistory);

  const displayMs = ms !== null ? ms : 0;
  const color = msToColor(displayMs);

  if (latencyNumber) {
    latencyNumber.textContent = displayMs;
    latencyNumber.style.color = color;
  }

  // Barras (max visual = 300ms)
  const fillPct = v => Math.min(100, (v / 300) * 100) + "%";
  if (latencyFill)    { latencyFill.style.width    = fillPct(displayMs); latencyFill.style.background = color; }
  if (latencyAvgFill) { latencyAvgFill.style.width = fillPct(avg); }
  if (latencyMinFill) { latencyMinFill.style.width = fillPct(min); }
  if (latencyAvgVal)  latencyAvgVal.textContent  = avg.toFixed(0) + "ms";
  if (latencyMinVal)  latencyMinVal.textContent  = min.toFixed(0) + "ms";
  if (latencyCurrVal) latencyCurrVal.textContent = displayMs + "ms";

  // Dot
  if (liveDot) { liveDot.classList.remove("inactive"); }

  // Contador y IP
  if (sigCount)  sigCount.textContent  = data.signal_count;
  if (deviceIp)  deviceIp.textContent  = data.device_ip || "—";

  // Log
  addLogEntry(data);
}

function addLogEntry(data) {
  if (!eventLog) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const t = new Date();
  const ts = t.toTimeString().slice(0, 8);
  entry.innerHTML = `
    <span class="log-time">${ts}</span>
    <span class="log-ip">${data.device_ip || "—"}</span>
    <span>LCP:${data.lcp ? Math.round(data.lcp)+"ms" : "?"} CLS:${data.cls ?? "?"} INP:${data.inp ? Math.round(data.inp)+"ms" : "?"} | Latencia: ${data.latency_ms ?? "?"}ms</span>
  `;
  eventLog.prepend(entry);
  // Máx 10 entradas
  while (eventLog.children.length > 10) eventLog.removeChild(eventLog.lastChild);
}

/* ══════════════════════════════════
   5. POLLING AL SERVIDOR
══════════════════════════════════ */
let lastSignalCount = -1;
let pollInterval    = null;
const POLL_MS       = 2000;

async function pollMetrics() {
  try {
    const res  = await fetch("/metrics");
    const data = await res.json();

    if (data.signal_count !== lastSignalCount && data.timestamp !== null) {
      lastSignalCount = data.signal_count;

      // Actualizar gauges
      if (data.lcp !== null) setGauge("lcp", data.lcp);
      if (data.cls !== null) setGauge("cls", data.cls);
      if (data.inp !== null) setGauge("inp", data.inp);

      // Monitor de latencia
      updateLatencyUI(data);
    }
  } catch (e) {
    // Servidor no disponible (modo estático)
  }
}

function startPolling() {
  pollMetrics();
  pollInterval = setInterval(pollMetrics, POLL_MS);
}

// Iniciar solo si hay endpoint disponible
(async () => {
  try {
    await fetch("/metrics");
    startPolling();
  } catch {
    // Sin backend: modo standalone
    if (liveDot) liveDot.classList.add("inactive");
  }
})();

/* ══════════════════════════════════
   6. SIMULADOR (sin backend)
══════════════════════════════════ */
window.simulateMetrics = async function() {
  // Intentar llamar al backend
  try {
    const res  = await fetch("/simulate", { method: "POST" });
    const data = await res.json();
    if (data.data) {
      const d = data.data;
      if (d.lcp) setGauge("lcp", d.lcp);
      if (d.cls !== null) setGauge("cls", d.cls);
      if (d.inp) setGauge("inp", d.inp);
      updateLatencyUI(d);
    }
  } catch {
    // Simulación local sin backend
    const lcp = Math.random() * 3500 + 500;
    const cls = Math.random() * 0.3;
    const inp = Math.random() * 350 + 50;
    const lat = Math.random() * 180 + 10;
    setGauge("lcp", lcp);
    setGauge("cls", cls);
    setGauge("inp", inp);
    updateLatencyUI({
      lcp, cls, inp,
      latency_ms: lat,
      device_ip: "simulado",
      signal_count: (signalHistory.length + 1),
      timestamp: Date.now() / 1000,
    });
  }
};

window.resetMetrics = function() {
  signalHistory = [];
  lastSignalCount = -1;
  resetGauges();
  if (latencyNumber)  latencyNumber.textContent = "—";
  if (latencyFill)    latencyFill.style.width    = "0%";
  if (latencyAvgFill) latencyAvgFill.style.width = "0%";
  if (latencyMinFill) latencyMinFill.style.width = "0%";
  if (latencyAvgVal)  latencyAvgVal.textContent  = "—";
  if (latencyMinVal)  latencyMinVal.textContent  = "—";
  if (latencyCurrVal) latencyCurrVal.textContent = "—";
  if (sigCount)       sigCount.textContent = "0";
  if (deviceIp)       deviceIp.textContent = "—";
  if (eventLog)       eventLog.innerHTML   = "";
  if (liveDot)        liveDot.classList.add("inactive");
};

/* ══════════════════════════════════
   7. INTERSECTION OBSERVER — REVEAL
══════════════════════════════════ */
const revealEls = document.querySelectorAll(".reveal");
const observer  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));

/* ══════════════════════════════════
   8. NAV ACTIVO
══════════════════════════════════ */
const navLinks   = document.querySelectorAll("nav a");
const sections   = document.querySelectorAll("section[id]");

const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
      });
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });

sections.forEach(s => sectionObs.observe(s));
