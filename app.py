"""
app.py — Servidor Flask para la demo de Programación Web Responsive
Optimizado para procesadores Celeron (ligero, sin dependencias pesadas)
"""

from flask import Flask, render_template, jsonify, request, Response
import time
import json
import random

# Configuración de carpetas para Debian
app = Flask(__name__, 
            static_folder="static", 
            template_folder="templates")

# Estado global de métricas
metrics_store = {
    "lcp": 0,
    "cls": 0,
    "inp": 0,
    "latency_ms": 0,
    "device_ip": "127.0.0.1",
    "timestamp": None,
    "signal_count": 0,
}

@app.route('/')
def index():
    """Sirve la interfaz principal"""
    return render_template('index.html')

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Endpoint para que el frontend haga polling de los datos"""
    return jsonify(metrics_store)

@app.route('/update-metrics', methods=['POST'])
def update_metrics():
    """Recibe métricas reales desde dispositivos (móviles vía Tailscale)"""
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data received"}), 400
    
    metrics_store["lcp"] = data.get("lcp", metrics_store["lcp"])
    metrics_store["cls"] = data.get("cls", metrics_store["cls"])
    metrics_store["inp"] = data.get("inp", metrics_store["inp"])
    metrics_store["latency_ms"] = data.get("latency", 0)
    metrics_store["device_ip"] = request.remote_addr
    metrics_store["timestamp"] = time.strftime('%H:%M:%S')
    metrics_store["signal_count"] += 1
    
    return jsonify({"status": "success", "received": metrics_store})

@app.route('/simulate', methods=['POST'])
def simulate():
    """Genera datos aleatorios para demostraciones"""
    metrics_store["lcp"] = round(random.uniform(0.5, 4.0), 2)
    metrics_store["cls"] = round(random.uniform(0, 0.5), 3)
    metrics_store["inp"] = random.randint(50, 500)
    metrics_store["latency_ms"] = random.randint(10, 150)
    metrics_store["timestamp"] = time.strftime('%H:%M:%S')
    metrics_store["signal_count"] += 1
    
    return jsonify({"status": "simulated", "data": metrics_store})

if __name__ == '__main__':
    # Escucha en todas las interfaces para permitir acceso desde la red local/Tailscale
    print("══════════════════════════════════════════════════")
    print("  Servidor Responsive Demo iniciado")
    print("  http://localhost:5000")
    print("  Endpoint POST: /update-metrics")
    print("  Simulador:      POST /simulate")
    print("══════════════════════════════════════════════════")
    app.run(host='0.0.0.0', port=5000, debug=False)
