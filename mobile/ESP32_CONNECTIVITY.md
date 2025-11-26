# 📱 Conectividad ESP32 en Agromind Mobile

## 🎯 Funcionalidades Implementadas

### 1. **Flujo de Conexión ESP32**
- **Pantalla:** `/connect-esp32.tsx`
- **Características:**
  - Configuración WiFi del ESP32
  - Prueba de conexión automática (WiFi, Servidor, Sensores)
  - Integración con flujo de creación de zonas
  - Indicadores visuales de progreso (3 pasos)

### 2. **Servicio ESP32 en Tiempo Real**
- **Archivo:** `/services/esp32Service.ts`
- **Funcionalidades:**
  - `startPolling()` - Inicia actualización automática cada 5 segundos
  - `stopPolling()` - Detiene el polling al salir de pantalla
  - `togglePump()` - Control manual de la bomba
  - `getConnectionStatus()` - Estado de conexión del ESP32
  - `getSensorHistory()` - Historial de lecturas

### 3. **Dashboard con Datos en Tiempo Real**
- **Archivo:** `/app/(tabs)/index.tsx`
- **Cambios:**
  - Polling automático de datos ESP32 cada 5 segundos
  - Indicador de conexión "ESP32 ONLINE/OFFLINE"
  - Actualización automática de sensores sin refrescar
  - Integración con `esp32Service`

## 🔄 Flujo de Usuario

```
1. Usuario crea nueva zona
   ↓
2. App pregunta: "¿Deseas conectar ESP32?"
   ↓
3. Usuario ingresa credenciales WiFi
   ↓
4. App muestra instrucciones de configuración
   ↓
5. Usuario sube código al ESP32
   ↓
6. App prueba conexión automáticamente
   ↓
7. Dashboard muestra datos en tiempo real
```

## 📡 Arquitectura de Comunicación

### Mobile App → Backend
- **Polling cada 5 segundos** desde dashboard
- Endpoint: `GET /zones/detail/:zoneId`
- Servicio: `esp32Service.startPolling()`

### ESP32 → Backend
- **POST cada 10 segundos** con datos de sensores
- Endpoint: `POST /api/iot/sensor-data`
- Formato JSON con zoneId y sensors

### Backend → Mobile App
- Respuesta incluye datos actualizados
- Estado de conexión (ONLINE/OFFLINE)
- Última actualización timestamp

## 🎨 Componentes UI

### ConnectESP32Screen
**Ubicación:** `/app/connect-esp32.tsx`

**Props:**
- `zoneId` - ID de la zona (URL param)

**Estados:**
- Step 1: Configuración WiFi (SSID, Password, Server URL)
- Step 2: Probando conexión (WiFi → Servidor → Sensores)
- Step 3: Conexión exitosa con estadísticas

**Navegación:**
- Se accede desde `add-zone` después de crear zona
- Al finalizar, navega a dashboard: `router.replace('/(tabs)')`

### ESP32Service
**Ubicación:** `/services/esp32Service.ts`

**Métodos principales:**

```typescript
// Iniciar polling de datos
startPolling(zoneId: number, callback: Function, intervalMs = 5000)

// Detener polling
stopPolling(zoneId: number)

// Control de bomba
togglePump(zoneId: number, state: boolean): Promise<boolean>

// Estado de conexión
getConnectionStatus(zoneId: number): Promise<ESP32ConnectionStatus>

// Historial (futuro)
getSensorHistory(zoneId: number, hours: number): Promise<ESP32SensorData[]>
```

## 📊 Estructura de Datos

### ESP32SensorData
```typescript
interface ESP32SensorData {
  temperature: number;
  soilMoisture: number;
  waterLevel: number;
  lightLevel: number;
  pumpStatus: boolean;
}
```

### ESP32ConnectionStatus
```typescript
interface ESP32ConnectionStatus {
  connected: boolean;
  lastUpdate: string;
  signalStrength?: number; // futuro
}
```

## 🔧 Configuración

### 1. URL del Servidor
La app obtiene automáticamente la IP del servidor desde `API_CONFIG.BASE_URL`:

```typescript
// mobile/constants/api.ts
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:3000'
};
```

### 2. Intervalo de Polling
Por defecto: **5000ms (5 segundos)**

Modificar en dashboard:
```typescript
esp32Service.startPolling(activeZone.id, callback, 5000); // <-- cambiar aquí
```

### 3. Timeout de Conexión
El ESP32 se considera OFFLINE si no envía datos en **30 segundos**.

Configurar en backend: `/backend/src/routes/iot.ts`

## 🚀 Próximas Mejoras (Futuro)

### Fase 2: WiFi Provisioning
- [ ] Configurar WiFi del ESP32 desde la app vía BLE
- [ ] No requerir subir código manualmente
- [ ] Modo AP del ESP32 para configuración inicial

### Fase 3: WebSockets
- [ ] Reemplazar polling con WebSocket connection
- [ ] Datos en tiempo real sin delay
- [ ] Notificaciones push instantáneas

### Fase 4: Gestión Avanzada
- [ ] Múltiples ESP32 por zona
- [ ] Actualización OTA de firmware
- [ ] Estadísticas de señal WiFi
- [ ] Histórico de conexión/desconexión
- [ ] Gráficas de sensores en tiempo real

### Fase 5: Alertas
- [ ] Notificación cuando ESP32 se desconecta
- [ ] Alerta si sensor falla
- [ ] Aviso de tanque vacío
- [ ] Recordatorio de mantenimiento

## 📱 Screens Modificadas

### 1. `/app/add-zone.tsx`
**Cambios:**
- Después de crear zona, pregunta si quiere conectar ESP32
- Botón "Conectar ESP32" redirige a `/connect-esp32?zoneId={id}`
- Botón "Ahora No" regresa al dashboard

### 2. `/app/(tabs)/index.tsx`
**Cambios:**
- Import: `import esp32Service from '../../services/esp32Service'`
- useEffect con `esp32Service.startPolling()` al cambiar zona
- Cleanup con `esp32Service.stopPolling()` al desmontar
- Indicador de conexión actualizado: "ESP32 ONLINE/OFFLINE"
- Color dinámico del dot: verde (ONLINE) / rojo (OFFLINE)

## 🧪 Testing

### Probar Conexión ESP32

1. **Sin ESP32 físico (Simulación):**
   ```bash
   # En backend
   POST http://localhost:3000/api/simulator/start/1
   ```

2. **Con ESP32 físico:**
   - Subir código `/esp32/agromind_sensor.ino`
   - Configurar WiFi, server URL, zoneId
   - Verificar en Serial Monitor: "✅ Datos enviados"
   - En app: Ver "ESP32 ONLINE" y sensores actualizándose

3. **Probar Desconexión:**
   - Apagar ESP32
   - Esperar 30 segundos
   - App debe mostrar "ESP32 OFFLINE"

### Logs de Depuración

**Mobile (expo):**
```javascript
console.log(`📡 Polling iniciado para zona ${zoneId} cada ${intervalMs}ms`);
console.log(`🛑 Polling detenido para zona ${zoneId}`);
```

**Backend:**
```javascript
console.log(`📡 Datos recibidos de ESP32 - Zona ${zoneId}:`, sensors);
```

**ESP32 (Serial Monitor):**
```
✅ WiFi conectado
📡 Enviando datos...
✅ Datos enviados correctamente
💧 Comando recibido: pumpState=false
```

## 📝 Checklist de Implementación

### ✅ Completado (Mobile v1.1)
- [x] Pantalla de conexión ESP32 (`connect-esp32.tsx`)
- [x] Servicio de polling (`esp32Service.ts`)
- [x] Integración con dashboard (polling automático)
- [x] Indicador de conexión ONLINE/OFFLINE
- [x] Flujo desde creación de zona
- [x] Backend: endpoint `/api/iot/sensor-data`
- [x] Backend: actualización estado de conexión
- [x] Documentación completa

### 🔄 Pendiente (Futuras versiones)
- [ ] WiFi provisioning vía BLE
- [ ] WebSockets en lugar de polling
- [ ] Notificaciones push
- [ ] Gráficas de histórico
- [ ] Actualización OTA
- [ ] Gestión de múltiples dispositivos

## 🎓 Cómo Usar

### Para el Desarrollador:
1. Asegurar que backend esté corriendo en puerto 3000
2. Actualizar `API_CONFIG.BASE_URL` con IP del servidor
3. Crear una zona en la app
4. Elegir "Conectar ESP32"
5. Seguir instrucciones en pantalla

### Para el Usuario Final:
1. Crear nueva zona
2. Tocar "Conectar ESP32"
3. Ingresar datos de WiFi
4. Copiar configuración
5. Pegar en Arduino IDE
6. Subir código al ESP32
7. Probar conexión
8. ¡Listo! Ver datos en tiempo real

---

**Versión Mobile:** 1.1  
**Fecha:** 24 de noviembre, 2025  
**Estado:** ✅ Conectividad ESP32 Implementada
