# AgroMind - ESP32 Sensor Node

Sistema de monitoreo y control de riego inteligente con ESP32.

## 📦 Componentes Necesarios

| Componente | Pin ESP32 | Descripción |
|------------|-----------|-------------|
| DHT11 | D4 | Sensor de temperatura y humedad ambiental |
| Sensor Humedad Suelo | D34 | Sensor analógico de humedad del suelo |
| LDR | D35 | Sensor de luz ambiental |
| Ultrasónico HC-SR04 (Trig) | D18 | Medidor de nivel de agua - Trigger |
| Ultrasónico HC-SR04 (Echo) | D19 | Medidor de nivel de agua - Echo |
| Relé | D5 | Control de bomba de agua |
| Bomba de Agua | Relé | Bomba controlada por el relé |
| ESP32 | - | Microcontrolador principal |

## 🔧 Diagrama de Conexiones

```
ESP32           Componente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D4    ──────►  DHT11 (Data)
D5    ──────►  Relé (IN)
D18   ──────►  HC-SR04 (Trig)
D19   ──────►  HC-SR04 (Echo)
D34   ──────►  Sensor Humedad Suelo (A0)
D35   ──────►  LDR + Resistencia 10kΩ
3.3V  ──────►  DHT11 (VCC), HC-SR04 (VCC)
5V    ──────►  Relé (VCC)
GND   ──────►  Todos los GND
```

### Notas de Conexión:

**DHT11:**
- VCC → 3.3V ESP32
- Data → D4
- GND → GND

**Sensor de Humedad de Suelo:**
- VCC → 3.3V
- A0 → D34 (GPIO34)
- GND → GND

**LDR (Fotoresistor):**
```
3.3V ─── LDR ─── D35 (GPIO35)
                  │
               10kΩ
                  │
                 GND
```

**HC-SR04 (Ultrasónico):**
- VCC → 3.3V (o 5V con divisor de voltaje en Echo)
- Trig → D18
- Echo → D19 (usar resistencias divisoras 1kΩ/2kΩ si usas 5V)
- GND → GND

**Módulo Relé:**
- VCC → 5V
- GND → GND
- IN → D5
- NO (Normalmente Abierto) → Bomba
- COM → Fuente de poder de la bomba

## 📚 Librerías Necesarias

Instalar en Arduino IDE:

1. **DHT sensor library** by Adafruit
   ```
   Tools > Manage Libraries > Buscar "DHT sensor library"
   ```

2. **Adafruit Unified Sensor** (dependencia de DHT)
   ```
   Se instala automáticamente con DHT library
   ```

3. **ArduinoJson** by Benoit Blanchon
   ```
   Tools > Manage Libraries > Buscar "ArduinoJson"
   Versión recomendada: 6.x
   ```

4. **WiFi** (incluida en ESP32 core)
5. **HTTPClient** (incluida en ESP32 core)

## ⚙️ Configuración

### 1. Configurar WiFi

Edita estas líneas en `agromind_sensor.ino`:

```cpp
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";
```

### 2. Configurar Servidor API

Cambia la URL del servidor (usa la IP de tu PC donde corre el backend):

```cpp
const char* serverUrl = "http://192.168.1.100:3000/api/iot/sensor-data";
const int zoneId = 1;  // ID de la zona que controla este ESP32
```

**Cómo obtener tu IP:**
- Windows: `ipconfig` en CMD
- Mac/Linux: `ifconfig` en Terminal
- Buscar la IP de tu adaptador WiFi/Ethernet

### 3. Calibrar Sensores

#### Sensor de Humedad de Suelo:
```cpp
// En la función readSoilMoisture(), ajustar estos valores:
float percentage = map(rawValue, 4095, 1000, 0, 100);
//                               ^^^^  ^^^^
//                               Seco  Húmedo

// Calibración recomendada:
// 1. Sensor al aire (seco) → anotar valor raw → usar como primer número
// 2. Sensor en agua → anotar valor raw → usar como segundo número
```

#### Sensor de Nivel de Agua:
```cpp
// Ajustar según tu tanque:
const float TANK_HEIGHT = 100.0;  // Altura total del tanque en cm
const float TANK_MAX_DISTANCE = 5.0;  // Distancia sensor-agua cuando lleno
```

**Calibración:**
1. Medir la altura total del tanque
2. Llenar el tanque al máximo
3. Medir distancia del sensor al agua con tanque lleno
4. Actualizar valores en el código

#### LDR (Sensor de Luz):
```cpp
// En readLightLevel(), ajustar valores según tu LDR:
float percentage = map(rawValue, 0, 4095, 0, 100);

// Probar en diferentes condiciones:
// - Oscuridad total
// - Luz ambiente
// - Luz directa
// Y ajustar el mapeo si es necesario
```

## 🚀 Instalación y Carga

### 1. Instalar Arduino IDE

Descargar de: https://www.arduino.cc/en/software

### 2. Agregar Soporte para ESP32

1. Abrir Arduino IDE
2. File > Preferences
3. En "Additional Board Manager URLs" agregar:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Tools > Board > Boards Manager
5. Buscar "esp32" e instalar "ESP32 by Espressif Systems"

### 3. Configurar Placa

1. Tools > Board > ESP32 Arduino > ESP32 Dev Module
2. Tools > Port > Seleccionar puerto COM de tu ESP32

### 4. Cargar el Código

1. Abrir `agromind_sensor.ino`
2. Configurar WiFi y servidor
3. Click en Upload (→)
4. Esperar a que compile y cargue

## 🔍 Monitor Serial

Para ver los datos en tiempo real:

1. Tools > Serial Monitor
2. Configurar baud rate a **115200**
3. Ver salida:

```
========================================
    AgroMind - Sistema de Riego
         ESP32 Sensor Node
========================================

✓ DHT11 inicializado
Conectando a WiFi...
✓ WiFi conectado
IP: 192.168.1.50

✓ Sistema listo

=== Lectura inicial de sensores ===
Temperatura: 25.3 °C
Humedad Suelo: 45.2 %
Nivel Agua: 78.5 %
Luz: 62.0 %
===================================

=== Enviando datos al servidor ===
{"zoneId":1,"sensors":{"temperature":25.3,"soilMoisture":45.2,"waterLevel":78.5,"lightLevel":62.0,"pumpStatus":false}}
Respuesta HTTP: 200
Bomba: APAGADA
```

## 📊 Datos Enviados

El ESP32 envía datos cada 10 segundos en formato JSON:

```json
{
  "zoneId": 1,
  "sensors": {
    "temperature": 25.3,
    "soilMoisture": 45.2,
    "waterLevel": 78.5,
    "lightLevel": 62.0,
    "pumpStatus": false
  }
}
```

## 🔄 Control de Bomba

El servidor puede controlar la bomba respondiendo con:

```json
{
  "success": true,
  "pumpCommand": true
}
```

El ESP32 automáticamente encenderá/apagará la bomba según el comando.

## 🐛 Solución de Problemas

### WiFi no conecta
- Verificar SSID y contraseña
- Verificar que ESP32 esté en rango del router
- Probar con red de 2.4GHz (ESP32 no soporta 5GHz)

### Sensor no responde
- Verificar conexiones (VCC, GND, Data)
- Verificar voltaje correcto (3.3V o 5V según sensor)
- Usar Serial Monitor para ver valores raw

### Error compilando
- Verificar que todas las librerías estén instaladas
- Verificar versión de Arduino IDE (1.8.19 o superior)
- Verificar soporte ESP32 instalado correctamente

### Bomba no funciona
- Verificar conexión del relé
- Verificar que relé tenga alimentación 5V
- Verificar que bomba esté conectada correctamente
- Algunos relés son activo-bajo (invertir HIGH/LOW en código)

### Valores de sensor incorrectos
- Calibrar sensores según instrucciones
- Verificar que no haya cables sueltos
- Verificar voltaje de alimentación estable

## 📝 Notas Importantes

⚠️ **Seguridad Eléctrica:**
- Nunca conectar bomba de alto voltaje directamente al ESP32
- Usar relé apropiado para el voltaje de tu bomba
- Aislar correctamente conexiones de alto voltaje
- No mezclar fuentes de poder sin común GND

⚠️ **Protección del ESP32:**
- No exceder 3.3V en pines GPIO
- Usar divisores de voltaje para sensores de 5V
- No conectar cargas mayores a 12mA directamente a GPIO

⚠️ **Sensor Ultrasónico:**
- Si usas 5V en HC-SR04, usar divisor de voltaje en pin Echo
- Distancia mínima: 2cm
- Distancia máxima: ~400cm

## 🔧 Mejoras Futuras

- [ ] Modo deep sleep para ahorro de energía
- [ ] Buffer de datos cuando WiFi no disponible
- [ ] OTA (Over-The-Air) updates
- [ ] Múltiples zonas con un solo ESP32
- [ ] Display LCD para información local
- [ ] Botón físico para control manual

## 📞 Soporte

Si tienes problemas:
1. Revisa el Monitor Serial para mensajes de error
2. Verifica las conexiones físicas
3. Calibra los sensores correctamente
4. Consulta la documentación del backend en `/backend/README.md`

## 📄 Licencia

Este proyecto es parte del sistema AgroMind de riego inteligente.
