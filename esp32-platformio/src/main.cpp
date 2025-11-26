/*
 * AgroMind - Sistema de Riego Inteligente
 * ESP32 Sensor Node
 * 
 * Componentes:
 * - DHT11 (Temperatura y Humedad Ambiental) -> D4
 * - Sensor de Humedad de Suelo -> D34 (Analógico)
 * - LDR (Sensor de Luz) -> D35 (Analógico)
 * - Sensor Ultrasónico HC-SR04 (Nivel de Agua) -> D18 (Trig), D19 (Echo)
 * - Relé (Control de Bomba) -> D5
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== CONFIGURACIÓN WIFI ====================
const char* ssid = "Medina 2.0";           // Cambiar por tu SSID
const char* password = "Amorcito";   // Cambiar por tu contraseña

// ==================== CONFIGURACIÓN API ====================
const char* serverUrl = "http://agromind-5hb1.onrender.com/api/iot/sensor-data";  // Backend desplegado en Render
const int zoneId = 1;  // ID de la zona que este ESP32 controla

// ==================== PINES ====================
#define RELAY_PIN 5          // D5 - Control de Bomba
#define DHT_PIN 4            // D4 - DHT11
#define TRIG_PIN 18          // D18 - Ultrasónico Trigger
#define ECHO_PIN 19          // D19 - Ultrasónico Echo
#define SOIL_MOISTURE_PIN 34 // D34 - Humedad de Suelo (Analógico)
#define LDR_PIN 35           // D35 - LDR Sensor de Luz (Analógico)

// ==================== CONFIGURACIÓN DHT ====================
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// ==================== CONFIGURACIÓN TANQUE ====================
const float TANK_HEIGHT = 100.0;  // Altura del tanque en cm (ajustar según tu tanque)
const float TANK_MAX_DISTANCE = 5.0;  // Distancia mínima del sensor al agua cuando está lleno (cm)

// ==================== VARIABLES GLOBALES ====================
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 10000;  // Enviar datos cada 10 segundos
bool pumpState = false;

// Variables para modo automático (recibidas del servidor)
bool autoModeEnabled = false;
int moistureThreshold = 30;      // Umbral de humedad (%)
int wateringDuration = 10;       // Duración del riego (segundos)
bool tankLocked = false;         // Tanque vacío - bloquear bomba

// Variables para control de riego automático
unsigned long pumpStartTime = 0;
bool autoWateringActive = false;

// ==================== FUNCIONES DE SENSORES ====================

// Leer DHT11 (Temperatura)
float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Error leyendo temperatura del DHT11");
    return 0.0;
  }
  return temp;
}

// Leer DHT11 (Humedad Ambiental) 
float readAmbientHumidity() {
  float humidity = dht.readHumidity();
  if (isnan(humidity)) {
    Serial.println("Error leyendo humedad del DHT11");
    return 0.0;
  }
  return humidity;
}

// Leer Humedad del Suelo (Sensor Analógico)
float readSoilMoisture() {
  int rawValue = analogRead(SOIL_MOISTURE_PIN);
  // Convertir valor analógico (0-4095) a porcentaje (0-100%)
  // Valores típicos: Seco=3000-4095, Húmedo=1000-2000, Agua=0-1000
  // Ajustar según calibración de tu sensor
  float percentage = map(rawValue, 4095, 1000, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  Serial.print("Humedad Suelo - Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Porcentaje: ");
  Serial.println(percentage);
  
  return percentage;
}

// Leer Nivel de Agua con Ultrasónico
float readWaterLevel() {
  // Enviar pulso trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Leer pulso echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout 30ms
  
  if (duration == 0) {
    Serial.println("Error: Timeout en sensor ultrasónico");
    return 0.0;
  }
  
  // Calcular distancia en cm (velocidad del sonido = 343 m/s)
  float distance = duration * 0.0343 / 2;
  
  // Calcular porcentaje de llenado
  float waterHeight = TANK_HEIGHT - distance + TANK_MAX_DISTANCE;
  float percentage = (waterHeight / TANK_HEIGHT) * 100.0;
  percentage = constrain(percentage, 0, 100);
  
  Serial.print("Nivel Agua - Distancia: ");
  Serial.print(distance);
  Serial.print(" cm | Porcentaje: ");
  Serial.println(percentage);
  
  return percentage;
}

// Leer Sensor de Luz (LDR)
float readLightLevel() {
  int rawValue = analogRead(LDR_PIN);
  // Convertir valor analógico (0-4095) a porcentaje de luz (0-100%)
  // Oscuridad=0-500, Luz ambiente=500-2000, Luz directa=2000-4095
  float percentage = map(rawValue, 0, 4095, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  Serial.print("Luz - Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Porcentaje: ");
  Serial.println(percentage);
  
  return percentage;
}

// ==================== CONTROL DE BOMBA ====================

void setPumpState(bool state) {
  // No encender si el tanque está bloqueado
  if (state && tankLocked) {
    Serial.println("⚠️ Bomba bloqueada: tanque vacío");
    return;
  }
  
  pumpState = state;
  digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  Serial.print("Bomba: ");
  Serial.println(state ? "ENCENDIDA" : "APAGADA");
  
  // Registrar tiempo de inicio para riego automático
  if (state && autoWateringActive) {
    pumpStartTime = millis();
  }
}

// Evaluar si debe activarse el riego automático
void evaluateAutoWatering(float soilMoisture) {
  if (!autoModeEnabled || tankLocked) {
    return;
  }
  
  // Si la humedad está por debajo del umbral y la bomba está apagada
  if (soilMoisture < moistureThreshold && !pumpState && !autoWateringActive) {
    Serial.println("\n🌱 === RIEGO AUTOMÁTICO ACTIVADO ===");
    Serial.print("Humedad actual: ");
    Serial.print(soilMoisture);
    Serial.print("% < Umbral: ");
    Serial.print(moistureThreshold);
    Serial.println("%");
    
    autoWateringActive = true;
    setPumpState(true);
  }
}

// Verificar si debe apagarse el riego automático (por tiempo)
void checkAutoWateringTimeout() {
  if (autoWateringActive && pumpState) {
    unsigned long elapsedTime = (millis() - pumpStartTime) / 1000;
    
    if (elapsedTime >= (unsigned long)wateringDuration) {
      Serial.println("\n⏱️ === RIEGO AUTOMÁTICO FINALIZADO ===");
      Serial.print("Duración: ");
      Serial.print(elapsedTime);
      Serial.println(" segundos");
      
      autoWateringActive = false;
      setPumpState(false);
    }
  }
}

// ==================== COMUNICACIÓN API ====================

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reconectando...");
    connectWiFi();
    return;
  }

  // Leer sensores
  float temperature = readTemperature();
  float soilMoisture = readSoilMoisture();
  float waterLevel = readWaterLevel();
  float lightLevel = readLightLevel();

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Crear JSON con datos de sensores
  StaticJsonDocument<512> doc;
  doc["zoneId"] = zoneId;
  
  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["temperature"] = temperature;
  sensors["soilMoisture"] = soilMoisture;
  sensors["waterLevel"] = waterLevel;
  sensors["lightLevel"] = lightLevel;
  sensors["pumpStatus"] = pumpState;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("\n=== Enviando datos al servidor ===");
  Serial.println(jsonData);
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Respuesta HTTP: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
    
    // Procesar respuesta del servidor
    if (httpResponseCode == 200) {
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        // Procesar comandos del servidor
        if (responseDoc.containsKey("commands")) {
          JsonObject commands = responseDoc["commands"];
          
          // Actualizar configuración de modo automático
          if (commands.containsKey("autoMode")) {
            bool newAutoMode = commands["autoMode"];
            if (newAutoMode != autoModeEnabled) {
              autoModeEnabled = newAutoMode;
              Serial.print("📋 Modo automático: ");
              Serial.println(autoModeEnabled ? "ACTIVADO" : "DESACTIVADO");
            }
          }
          
          // Actualizar umbral de humedad
          if (commands.containsKey("moistureThreshold")) {
            int newThreshold = commands["moistureThreshold"];
            if (newThreshold != moistureThreshold) {
              moistureThreshold = newThreshold;
              Serial.print("📋 Umbral de humedad: ");
              Serial.print(moistureThreshold);
              Serial.println("%");
            }
          }
          
          // Actualizar duración del riego
          if (commands.containsKey("wateringDuration")) {
            int newDuration = commands["wateringDuration"];
            if (newDuration != wateringDuration) {
              wateringDuration = newDuration;
              Serial.print("📋 Duración de riego: ");
              Serial.print(wateringDuration);
              Serial.println(" segundos");
            }
          }
          
          // Verificar bloqueo de tanque
          if (commands.containsKey("tankLocked")) {
            tankLocked = commands["tankLocked"];
            if (tankLocked && pumpState) {
              Serial.println("⚠️ Tanque vacío - apagando bomba");
              autoWateringActive = false;
              setPumpState(false);
            }
          }
          
          // Procesar comando manual de bomba (tiene prioridad sobre automático)
          if (commands.containsKey("pumpState") && !commands["pumpState"].isNull()) {
            bool manualPumpCommand = commands["pumpState"];
            Serial.print("🔧 Comando manual de bomba: ");
            Serial.println(manualPumpCommand ? "ENCENDER" : "APAGAR");
            
            // Cancelar riego automático si hay comando manual
            if (autoWateringActive && !manualPumpCommand) {
              autoWateringActive = false;
            }
            
            if (manualPumpCommand != pumpState) {
              setPumpState(manualPumpCommand);
            }
          }
        }
        
        // Compatibilidad con formato antiguo (pumpCommand)
        if (responseDoc.containsKey("pumpCommand")) {
          bool shouldPumpBeOn = responseDoc["pumpCommand"];
          if (shouldPumpBeOn != pumpState) {
            setPumpState(shouldPumpBeOn);
          }
        }
      }
    }
  } else {
    Serial.print("Error en POST: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  
  // Evaluar riego automático después de enviar datos
  evaluateAutoWatering(soilMoisture);
}

// ==================== CONFIGURACIÓN WIFI ====================

void connectWiFi() {
  Serial.println("\nConectando a WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ Error conectando a WiFi");
  }
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("    AgroMind - Sistema de Riego");
  Serial.println("         ESP32 Sensor Node");
  Serial.println("========================================\n");
  
  // Configurar pines
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  // Inicializar bomba apagada
  setPumpState(false);
  
  // Inicializar DHT11
  dht.begin();
  Serial.println("✓ DHT11 inicializado");
  
  // Conectar a WiFi
  connectWiFi();
  
  Serial.println("\n✓ Sistema listo\n");
  
  // Lectura inicial de sensores
  Serial.println("=== Lectura inicial de sensores ===");
  Serial.print("Temperatura: ");
  Serial.print(readTemperature());
  Serial.println(" °C");
  
  Serial.print("Humedad Suelo: ");
  Serial.print(readSoilMoisture());
  Serial.println(" %");
  
  Serial.print("Nivel Agua: ");
  Serial.print(readWaterLevel());
  Serial.println(" %");
  
  Serial.print("Luz: ");
  Serial.print(readLightLevel());
  Serial.println(" %");
  Serial.println("===================================\n");
}

// ==================== LOOP ====================

void loop() {
  unsigned long currentTime = millis();
  
  // Enviar datos cada 10 segundos
  if (currentTime - lastSendTime >= sendInterval) {
    sendSensorData();
    lastSendTime = currentTime;
  }
  
  // Verificar timeout de riego automático (cada 100ms)
  checkAutoWateringTimeout();
  
  // Verificar conexión WiFi cada 30 segundos
  static unsigned long lastWiFiCheck = 0;
  if (currentTime - lastWiFiCheck >= 30000) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi desconectado, reconectando...");
      connectWiFi();
    }
    lastWiFiCheck = currentTime;
  }
  
  delay(100);
}
