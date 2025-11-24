# 🧪 Guía de Pruebas - Sistema IoT Agromind

## 📋 Antes de Comenzar

1. Asegúrate de que el backend esté corriendo:
```bash
cd backend
npm run dev
```

2. El servidor debe estar en: `http://192.168.1.66:5000`

---

## 🔬 Pruebas del Simulador

### 1️⃣ Iniciar simulación para Zona 1
```bash
curl -X POST http://192.168.1.66:5000/api/simulator/start/1
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Simulación iniciada para zona 1"
}
```

**Lo que hace:**
- Actualiza sensores cada 2 segundos
- Simula control automático de riego
- Secado natural de suelo (-0.2% cada 2s)
- Si bomba ON: humedad +3%, tanque -0.8%
- Bloquea bomba si tanque < 5%

---

### 2️⃣ Ver simulaciones activas
```bash
curl http://192.168.1.66:5000/api/simulator/status
```

**Resultado esperado:**
```json
{
  "active": [1],
  "count": 1
}
```

---

### 3️⃣ Ver cambios en tiempo real

**Opción A: En la app móvil**
1. Abre Agromind en tu teléfono
2. Verás los valores actualizándose cada 3 segundos automáticamente

**Opción B: En el navegador**
1. Abre http://localhost:5173 (frontend web)
2. Verás los valores actualizándose cada 3 segundos automáticamente

**Opción C: Consultar API directamente**
```bash
# Ejecutar en loop
while true; do
  curl -s http://192.168.1.66:5000/api/zones/1 | grep -A5 '"sensors"'
  sleep 2
done
```

---

### 4️⃣ Detener simulación
```bash
curl -X POST http://192.168.1.66:5000/api/simulator/stop/1
```

---

## 🤖 Pruebas de Endpoints IoT (Simular ESP32)

### 1️⃣ Enviar datos de sensores
```bash
curl -X POST http://192.168.1.66:5000/api/iot/sensor-data/1 \
  -H "Content-Type: application/json" \
  -d '{
    "soilMoisture": 35.5,
    "temperature": 26.2,
    "humidity": 65.8,
    "lightLevel": 88,
    "tankLevel": 60.5
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Datos actualizados",
  "sensors": {
    "soilMoisture": 35.5,
    "temperature": 26.2,
    "humidity": 65.8,
    "lightLevel": 88,
    "tankLevel": 60.5
  }
}
```

---

### 2️⃣ Obtener comandos para ESP32
```bash
curl http://192.168.1.66:5000/api/iot/commands/1
```

**Resultado esperado:**
```json
{
  "zoneId": "1",
  "pump": "OFF",
  "autoMode": true,
  "moistureThreshold": 30,
  "wateringDuration": 10
}
```

**Valores de pump:**
- `"ON"` → ESP32 debe encender relé
- `"OFF"` → ESP32 debe apagar relé
- `"LOCKED"` → ESP32 debe apagar relé y mostrar alarma

---

### 3️⃣ Heartbeat (mantener conexión)
```bash
curl -X POST http://192.168.1.66:5000/api/iot/heartbeat/1
```

**Resultado esperado:**
```json
{
  "success": true
}
```

Esto marca la zona como `ONLINE`. Si no se envía heartbeat por >30 segundos, la zona debe marcarse como `OFFLINE`.

---

## 🎮 Pruebas de Control Manual

### 1️⃣ Encender bomba manualmente
```bash
curl -X POST http://192.168.1.66:5000/api/zones/1/pump \
  -H "Content-Type: application/json" \
  -d '{"action": "ON"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "pump": "ON"
}
```

---

### 2️⃣ Apagar bomba manualmente
```bash
curl -X POST http://192.168.1.66:5000/api/zones/1/pump \
  -H "Content-Type: application/json" \
  -d '{"action": "OFF"}'
```

---

### 3️⃣ Intentar encender con tanque vacío (debe fallar)
```bash
# Primero vaciar tanque
curl -X POST http://192.168.1.66:5000/api/iot/sensor-data/1 \
  -H "Content-Type: application/json" \
  -d '{"tankLevel": 3}'

# Intentar encender bomba
curl -X POST http://192.168.1.66:5000/api/zones/1/pump \
  -H "Content-Type: application/json" \
  -d '{"action": "ON"}'
```

**Resultado esperado:**
```json
{
  "error": "Nivel de tanque muy bajo",
  "tankLevel": 3
}
```

---

## 🧪 Prueba del Sistema Completo

### Escenario 1: Riego Automático Activado

1️⃣ **Configurar modo automático ON**
```bash
curl -X PUT http://192.168.1.66:5000/api/zones/1 \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "autoMode": true,
      "moistureThreshold": 40,
      "wateringDuration": 10,
      "respectRainForecast": true,
      "useWeatherApi": true
    }
  }'
```

2️⃣ **Iniciar simulación**
```bash
curl -X POST http://192.168.1.66:5000/api/simulator/start/1
```

3️⃣ **Observar en consola del backend:**
- Cuando `soilMoisture < 40%` → Verás: "💧 Zona 1: Riego automático iniciado"
- Cuando `soilMoisture > 65%` (40 + 25) → Verás: "✅ Zona 1: Riego automático detenido"

4️⃣ **Verificar en app:**
- Ícono de bomba debe cambiar a verde cuando esté ON
- Badge "Regando ahora" debe aparecer
- Tanque debe bajar lentamente
- Humedad de suelo debe subir

---

### Escenario 2: Tanque Vacío

1️⃣ **Simular tanque vacío**
```bash
curl -X POST http://192.168.1.66:5000/api/iot/sensor-data/1 \
  -H "Content-Type: application/json" \
  -d '{"tankLevel": 2}'
```

2️⃣ **Verificar en consola:**
- Debe aparecer: "⚠️ Zona 1: Tanque vacío, bomba bloqueada"

3️⃣ **Verificar en app:**
- Bomba debe estar en rojo (LOCKED)
- Badge "Tanque vacío" debe aparecer
- Botón de riego manual debe estar deshabilitado

4️⃣ **Rellenar tanque**
```bash
curl -X POST http://192.168.1.66:5000/api/iot/sensor-data/1 \
  -H "Content-Type: application/json" \
  -d '{"tankLevel": 80}'
```

5️⃣ **Verificar desbloqueo:**
- Debe aparecer: "✅ Zona 1: Tanque recargado, bomba desbloqueada"

---

### Escenario 3: ESP32 Real (Futuro)

1️⃣ **En tu código ESP32, implementar loop:**
```cpp
void loop() {
  // 1. Leer sensores reales
  float soil = readSoilSensor();
  float temp = readTempSensor();
  float hum = readHumSensor();
  float light = readLightSensor();
  float tank = readTankSensor();
  
  // 2. Enviar a backend
  sendSensorData(soil, temp, hum, light, tank);
  
  // 3. Obtener comandos
  String pump = getCommands();
  
  // 4. Controlar relé
  if (pump == "ON") {
    digitalWrite(RELAY_PIN, HIGH);
  } else {
    digitalWrite(RELAY_PIN, LOW);
  }
  
  // 5. Heartbeat cada 10 ciclos
  if (loopCount % 10 == 0) {
    sendHeartbeat();
  }
  
  delay(2000); // 2 segundos entre lecturas
}
```

2️⃣ **Verificar en Serial Monitor:**
```
✅ WiFi conectado
✅ Datos enviados
💧 Bomba ENCENDIDA
✅ Datos enviados
💧 Bomba ENCENDIDA
✅ Datos enviados
⏸️ Bomba APAGADA
```

---

## ✅ Checklist de Validación

### Backend
- [ ] Servidor corriendo en puerto 5000
- [ ] Base de datos PostgreSQL conectada
- [ ] Simulador inicia correctamente
- [ ] Endpoints IoT responden correctamente
- [ ] Control automático funciona (enciende/apaga bomba)
- [ ] Bloqueo por tanque vacío funciona

### Frontend Web
- [ ] Datos se actualizan cada 3 segundos automáticamente
- [ ] Indicador de bomba cambia de color (verde=ON, gris=OFF, rojo=LOCKED)
- [ ] Valores de sensores cambian en tiempo real
- [ ] Botón de riego manual funciona

### Mobile
- [ ] Datos se actualizan cada 3 segundos automáticamente
- [ ] Animaciones funcionan correctamente
- [ ] Botón de riego manual funciona
- [ ] Alertas de tanque vacío aparecen

### ESP32 (Futuro)
- [ ] WiFi conectado
- [ ] Envío de datos cada 2-3 segundos
- [ ] Lectura de comandos cada 1-2 segundos
- [ ] Relé responde correctamente (ON/OFF/LOCKED)
- [ ] Heartbeat enviado cada 10-15 segundos

---

## 🐛 Troubleshooting

### Problema: La app no actualiza datos
**Solución:**
1. Verificar que el backend esté corriendo
2. Verificar la IP en `mobile/constants/api.ts` y `frontend/src/pages/Dashboard.tsx`
3. Verificar que el teléfono esté en la misma red WiFi

### Problema: Simulador no cambia valores
**Solución:**
1. Detener simulación: `POST /api/simulator/stop/1`
2. Reiniciar backend
3. Iniciar simulación nuevamente: `POST /api/simulator/start/1`

### Problema: Bomba no enciende en modo automático
**Solución:**
1. Verificar que `autoMode = true`
2. Verificar que `soilMoisture < moistureThreshold`
3. Verificar que `tankLevel > 5%`
4. Verificar logs en consola del backend

### Problema: ESP32 no envía datos
**Solución:**
1. Verificar WiFi conectado: `WiFi.status() == WL_CONNECTED`
2. Verificar IP del servidor en código ESP32
3. Verificar formato JSON (usar ArduinoJson)
4. Verificar Serial Monitor para errores HTTP

---

## 📊 Monitoreo en Tiempo Real

### Ver logs del backend:
```bash
cd backend
npm run dev
```

### Ver datos en loop (Linux/Mac):
```bash
watch -n 2 'curl -s http://192.168.1.66:5000/api/zones/1 | jq .'
```

### Ver datos en loop (Windows PowerShell):
```powershell
while ($true) {
  $response = Invoke-RestMethod -Uri "http://192.168.1.66:5000/api/zones/1"
  $response | ConvertTo-Json -Depth 5
  Start-Sleep -Seconds 2
}
```

---

¡Todo listo para probar el sistema IoT completo! 🚀
