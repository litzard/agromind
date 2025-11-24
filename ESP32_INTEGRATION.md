# 📡 Integración ESP32 con Agromind

## 🔧 Endpoints API para ESP32

### 1. **Enviar Datos de Sensores** (POST)
```
POST http://192.168.1.66:5000/api/iot/sensor-data/:zoneId
Content-Type: application/json

{
  "soilMoisture": 45.2,      // % (0-100)
  "temperature": 24.5,        // °C
  "humidity": 60.8,           // % (0-100)
  "lightLevel": 85,           // % (0-100)
  "tankLevel": 75.5           // % (0-100)
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos actualizados",
  "sensors": { /* todos los sensores actualizados */ }
}
```

---

### 2. **Obtener Comandos** (GET)
```
GET http://192.168.1.66:5000/api/iot/commands/:zoneId
```

**Respuesta:**
```json
{
  "zoneId": "1",
  "pump": "ON",              // "ON" | "OFF" | "LOCKED"
  "autoMode": true,
  "moistureThreshold": 30,
  "wateringDuration": 10
}
```

**Valores de `pump`:**
- `"ON"` → Encender bomba ahora
- `"OFF"` → Apagar bomba
- `"LOCKED"` → Bomba bloqueada (tanque vacío)

---

### 3. **Heartbeat** (POST)
```
POST http://192.168.1.66:5000/api/iot/heartbeat/:zoneId
```

Mantiene la zona en estado `ONLINE`. Llamar cada 10-15 segundos.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 🤖 Simulador de Datos (Para Pruebas)

### Iniciar simulación:
```bash
POST http://192.168.1.66:5000/api/simulator/start/1
```

### Detener simulación:
```bash
POST http://192.168.1.66:5000/api/simulator/stop/1
```

### Ver simulaciones activas:
```bash
GET http://192.168.1.66:5000/api/simulator/status
```

**El simulador actualiza datos cada 2 segundos:**
- Temperatura: variación leve ±0.5°C
- Humedad ambiente: variación ±2%
- Luz: aumenta en día (6am-6pm), baja en noche
- Si bomba ON → humedad suelo +3%, tanque -0.8%
- Si bomba OFF → humedad suelo -0.2% (secado natural)
- Control automático: enciende bomba si humedad < umbral

---

## 🔄 Flujo de Trabajo ESP32

```
┌──────────────┐
│   ESP32      │
└──────┬───────┘
       │
       │ 1️⃣ Enviar datos sensores (cada 2-3 seg)
       ├──────────────> POST /api/iot/sensor-data/:zoneId
       │
       │ 2️⃣ Obtener comandos (cada 1-2 seg)
       ├──────────────> GET /api/iot/commands/:zoneId
       │
       │ 3️⃣ Ejecutar comando bomba
       ├──────────────> Encender/apagar relé según "pump"
       │
       │ 4️⃣ Heartbeat (cada 10-15 seg)
       └──────────────> POST /api/iot/heartbeat/:zoneId
```

---

## 💡 Lógica de Control Automático (Backend)

```javascript
// El backend decide automáticamente cuándo regar:
if (autoMode && soilMoisture < moistureThreshold) {
  pump = "ON";  // Activar riego
}

if (autoMode && soilMoisture > (moistureThreshold + 25)) {
  pump = "OFF"; // Detener riego (histéresis)
}

if (tankLevel <= 5) {
  pump = "LOCKED"; // Bloquear bomba (tanque vacío)
}
```

**Histéresis:** Se añade 25% al umbral antes de apagar para evitar ciclos ON/OFF rápidos.

---

## 📊 Estructura de Datos en PostgreSQL

### Modelo Zone:
```typescript
{
  id: number,
  name: string,
  type: "Outdoor" | "Indoor" | "Greenhouse",
  userId: number,
  
  sensors: {            // JSONB
    soilMoisture: number,
    tankLevel: number,
    temperature: number,
    humidity: number,
    lightLevel: number
  },
  
  status: {             // JSONB
    pump: "ON" | "OFF" | "LOCKED",
    connection: "ONLINE" | "OFFLINE",
    lastWatered: string,
    lastSeen?: string
  },
  
  config: {             // JSONB
    moistureThreshold: number,
    wateringDuration: number,
    autoMode: boolean,
    respectRainForecast: boolean,
    useWeatherApi: boolean
  }
}
```

---

## 🧪 Pruebas con cURL

```bash
# 1. Enviar datos de sensores
curl -X POST http://192.168.1.66:5000/api/iot/sensor-data/1 \
  -H "Content-Type: application/json" \
  -d '{"soilMoisture":45,"temperature":24,"humidity":60,"lightLevel":85,"tankLevel":75}'

# 2. Obtener comandos
curl http://192.168.1.66:5000/api/iot/commands/1

# 3. Heartbeat
curl -X POST http://192.168.1.66:5000/api/iot/heartbeat/1

# 4. Iniciar simulación
curl -X POST http://192.168.1.66:5000/api/simulator/start/1
```

---

## 🎯 Checklist para Integración

- [ ] ESP32 conectado a WiFi
- [ ] Sensores físicos conectados y calibrados
- [ ] Relé conectado a bomba de agua
- [ ] Probar envío de datos: `POST /api/iot/sensor-data/:zoneId`
- [ ] Probar recepción de comandos: `GET /api/iot/commands/:zoneId`
- [ ] Probar control de relé (ON/OFF/LOCKED)
- [ ] Implementar heartbeat cada 10-15 seg
- [ ] Verificar actualización en tiempo real en la app (3 seg polling)

---

## 🚀 Código Ejemplo Arduino/ESP32

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* serverUrl = "http://192.168.1.66:5000/api/iot";
const int zoneId = 1;
const int relayPin = 2; // GPIO2 para relé

void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi conectado");
}

void loop() {
  // 1. Leer sensores (reemplazar con valores reales)
  float soilMoisture = analogRead(34) / 4095.0 * 100; // A0
  float temperature = 24.5;  // Sensor DHT22
  float humidity = 60.0;     // Sensor DHT22
  float lightLevel = 85.0;   // Fotoresistencia
  float tankLevel = 75.0;    // Sensor ultrasónico HC-SR04
  
  // 2. Enviar datos al servidor
  sendSensorData(soilMoisture, temperature, humidity, lightLevel, tankLevel);
  
  // 3. Obtener comandos
  String pumpCommand = getCommands();
  
  // 4. Controlar relé
  if (pumpCommand == "ON") {
    digitalWrite(relayPin, HIGH);
    Serial.println("💧 Bomba ENCENDIDA");
  } else {
    digitalWrite(relayPin, LOW);
    Serial.println("⏸️ Bomba APAGADA");
  }
  
  delay(2000); // Esperar 2 segundos
}

void sendSensorData(float soil, float temp, float hum, float light, float tank) {
  HTTPClient http;
  String url = String(serverUrl) + "/sensor-data/" + String(zoneId);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["soilMoisture"] = soil;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["lightLevel"] = light;
  doc["tankLevel"] = tank;
  
  String json;
  serializeJson(doc, json);
  
  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.println("✅ Datos enviados");
  } else {
    Serial.println("❌ Error enviando datos");
  }
  
  http.end();
}

String getCommands() {
  HTTPClient http;
  String url = String(serverUrl) + "/commands/" + String(zoneId);
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<256> doc;
    deserializeJson(doc, payload);
    String pump = doc["pump"];
    http.end();
    return pump;
  }
  
  http.end();
  return "OFF";
}
```

---

## 📦 Librerías Arduino Necesarias

```
- ArduinoJson (by Benoit Blanchon)
- HTTPClient (incluida en ESP32)
- WiFi (incluida en ESP32)
```

---

## 🔐 Seguridad (Futuro)

- [ ] Implementar autenticación con API Key
- [ ] HTTPS en producción
- [ ] Rate limiting para prevenir spam
- [ ] Validación de rangos de sensores

---

## 📝 Notas Importantes

1. **Zona ID:** Reemplaza `:zoneId` con el ID de tu zona (1, 2, 3...)
2. **IP del servidor:** Cambia `192.168.1.66` si tu backend tiene otra IP
3. **Frecuencia:** Enviar datos cada 2-3 segundos es óptimo
4. **Polling app:** El frontend actualiza automáticamente cada 3 segundos

---

¡Todo listo para cuando construyas el ESP32! 🚀
