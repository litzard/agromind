# 🚀 Agromind Mobile v1.1 - ESP32 Connectivity

## ✨ Nuevas Funcionalidades

### 1. Pantalla de Conexión ESP32
- **Archivo:** `mobile/app/connect-esp32.tsx`
- **Features:**
  - Formulario de configuración WiFi (SSID, Password, Server URL)
  - Proceso de 3 pasos con indicadores visuales
  - Prueba automática de conexión (WiFi → Servidor → Sensores)
  - Instrucciones claras para configurar el ESP32
  - Pantalla de éxito con estadísticas

### 2. Servicio de Comunicación ESP32
- **Archivo:** `mobile/services/esp32Service.ts`
- **Funcionalidades:**
  - Polling automático de datos cada 5 segundos
  - Control de bomba (`togglePump`)
  - Estado de conexión (`getConnectionStatus`)
  - Historial de sensores (preparado para futuro)
  - Health check del servidor

### 3. Dashboard con Datos en Tiempo Real
- **Archivo:** `mobile/app/(tabs)/index.tsx`
- **Mejoras:**
  - Polling automático al entrar a una zona
  - Indicador de conexión "ESP32 ONLINE/OFFLINE"
  - Actualización de sensores sin refrescar
  - Limpieza automática al cambiar de zona

### 4. Backend - Endpoints IoT Actualizados
- **Archivo:** `backend/src/routes/iot.ts`
- **Endpoints:**
  - `POST /api/iot/sensor-data` - Recibe datos del ESP32
  - `GET /api/iot/commands/:zoneId` - Comandos para ESP32
  - `POST /api/iot/heartbeat/:zoneId` - Mantener conexión
  - `GET /api/iot/health` - Health check
  - `GET /api/iot/connection-status/:zoneId` - Estado de conexión

### 5. Integración con Flujo de Zonas
- **Archivo:** `mobile/app/add-zone.tsx`
- **Mejora:**
  - Al crear zona, pregunta si quiere conectar ESP32
  - Navegación automática a pantalla de conexión
  - Paso del zoneId como parámetro

## 📱 Flujo de Usuario

```
1. Usuario crea nueva zona
   ↓
2. Alert: "¿Deseas conectar un dispositivo ESP32 ahora?"
   ↓
   ├─ "Ahora No" → Vuelve al dashboard
   └─ "Conectar ESP32" → Pantalla de conexión
       ↓
3. Ingresa WiFi SSID y Password
   ↓
4. App muestra URL del servidor automáticamente
   ↓
5. Alert con instrucciones y configuración para copiar
   ↓
6. Usuario sube código al ESP32
   ↓
7. Prueba automática de conexión:
   - ✓ WiFi conectado
   - ✓ Servidor accesible
   - ✓ Sensores funcionando
   ↓
8. Pantalla de éxito → "Ir al Dashboard"
   ↓
9. Dashboard muestra datos en tiempo real
```

## 🎨 UI/UX Implementada

### Pantalla de Conexión
- **3 pasos visuales:** Configurar → Probar → Listo
- **Cards elegantes** con gradientes y sombras
- **Iconos animados** para cada paso
- **Inputs temáticos** (oscuro/claro)
- **Info box** con tips útiles
- **Botones con iconos** y estados activos

### Dashboard Updates
- **Indicador de conexión** con dot animado
- **Colores dinámicos:** Verde (ONLINE) / Rojo (OFFLINE)
- **Texto actualizado:** "ESP32 ONLINE/OFFLINE"

## 🔧 Configuración Técnica

### Mobile App
```typescript
// Iniciar polling al entrar a zona
useEffect(() => {
  if (!activeZone) return;
  
  esp32Service.startPolling(activeZone.id, (sensorData) => {
    setZones(prev => prev.map(z => 
      z.id === activeZone.id 
        ? { ...z, sensors: { ...z.sensors, ...sensorData } }
        : z
    ));
  }, 5000); // 5 segundos

  return () => {
    esp32Service.stopPolling(activeZone.id);
  };
}, [activeZone?.id]);
```

### Backend
```typescript
// Recibir datos del ESP32
POST /api/iot/sensor-data
Body: {
  zoneId: 1,
  sensors: {
    temperature: 25.3,
    soilMoisture: 45.2,
    waterLevel: 78.5,
    lightLevel: 62.0,
    pumpStatus: false
  }
}

// Responder con comandos
Response: {
  success: true,
  commands: {
    pumpState: false,
    autoMode: true,
    moistureThreshold: 30,
    wateringDuration: 10
  }
}
```

## 📊 Datos en Tiempo Real

### Frecuencias
- **Mobile → Backend:** Polling cada 5 segundos
- **ESP32 → Backend:** POST cada 10 segundos
- **Timeout OFFLINE:** 30 segundos sin datos

### Estados de Conexión
- **ONLINE:** ESP32 enviando datos normalmente
- **OFFLINE:** Más de 30 segundos sin recibir datos

### Sensores Actualizados
- Temperatura (°C)
- Humedad del suelo (%)
- Nivel de agua/tanque (%)
- Nivel de luz (%)
- Estado de bomba (ON/OFF)

## 📁 Archivos Nuevos

```
mobile/
├── app/
│   └── connect-esp32.tsx          ✨ Pantalla de conexión ESP32
├── services/
│   └── esp32Service.ts            ✨ Servicio de comunicación
└── ESP32_CONNECTIVITY.md          ✨ Documentación completa

backend/
└── src/
    └── routes/
        └── iot.ts                 🔄 Actualizado con nuevos endpoints
```

## 📝 Archivos Modificados

```
mobile/
├── app/
│   ├── add-zone.tsx              🔄 Alert para conectar ESP32
│   └── (tabs)/
│       └── index.tsx              🔄 Polling de datos en tiempo real

ESP32_INTEGRATION.md               🔄 Actualizado formato de datos
```

## 🧪 Cómo Probar

### 1. Sin Hardware (Simulador)
```bash
# Backend
cd backend
npm start

# En otra terminal
curl -X POST http://localhost:3000/api/simulator/start/1

# La app empezará a recibir datos simulados
```

### 2. Con ESP32 Real
```bash
# 1. Abrir Arduino IDE
# 2. Abrir esp32/agromind_sensor.ino
# 3. Modificar configuración:
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* serverUrl = "http://192.168.1.X:3000/api/iot/sensor-data";
const int zoneId = 1;

# 4. Subir al ESP32
# 5. Abrir Serial Monitor (115200 baud)
# 6. Ver logs: "✅ Datos enviados"
# 7. En app: Ver "ESP32 ONLINE" y datos actualizándose
```

### 3. Probar Desconexión
```bash
# Apagar ESP32 o desconectar WiFi
# Esperar 30 segundos
# App debe mostrar: "ESP32 OFFLINE" con dot rojo
```

## 🎯 Próximos Pasos (Futuro)

### Fase 2: WiFi Provisioning
- Configurar ESP32 desde la app vía Bluetooth
- No requerir Arduino IDE
- Modo AP del ESP32 para setup inicial

### Fase 3: WebSockets
- Reemplazar polling con conexión persistente
- Datos verdaderamente en tiempo real
- Menor consumo de batería

### Fase 4: Notificaciones
- Push notifications cuando ESP32 se desconecta
- Alertas de sensores críticos
- Recordatorios de mantenimiento

### Fase 5: Analíticas
- Gráficas de histórico de sensores
- Estadísticas de uso de agua
- Predicciones con ML

## 📖 Documentación

- **Mobile:** `mobile/ESP32_CONNECTIVITY.md` - Guía completa de la app
- **Hardware:** `esp32/README.md` - Instalación y cableado del ESP32
- **API:** `ESP32_INTEGRATION.md` - Endpoints y protocolo de comunicación

## ✅ Checklist de Implementación

- [x] Pantalla de conexión ESP32 con 3 pasos
- [x] Servicio de polling en tiempo real
- [x] Integración con dashboard
- [x] Indicador de conexión ONLINE/OFFLINE
- [x] Backend: endpoint `/api/iot/sensor-data` actualizado
- [x] Backend: lógica de estado de conexión
- [x] Flujo desde creación de zona
- [x] Documentación completa
- [x] Testing: 0 errores TypeScript

## 🎉 Resultado Final

**Mobile App:**
- ✅ Pantalla de conexión profesional
- ✅ Datos en tiempo real (5 seg)
- ✅ Indicadores de conexión
- ✅ UX fluida y clara

**Backend:**
- ✅ Endpoints IoT completos
- ✅ Lógica de conexión robusta
- ✅ Comandos para ESP32

**Integración:**
- ✅ Comunicación bidireccional
- ✅ Auto-refresco de sensores
- ✅ Detección de desconexión

---

**Versión:** Mobile v1.1  
**Fecha:** 24 de noviembre, 2025  
**Estado:** ✅ ESP32 Connectivity COMPLETA  
**Errores:** 0  
**Listo para:** Testing con hardware real
