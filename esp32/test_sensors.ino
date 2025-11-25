/*
 * AgroMind - Script de Prueba de Sensores
 * Usar este código para probar cada sensor individualmente
 */

#include <DHT.h>

// ==================== PINES ====================
#define RELAY_PIN 5
#define DHT_PIN 4
#define TRIG_PIN 18
#define ECHO_PIN 19
#define SOIL_MOISTURE_PIN 34
#define LDR_PIN 35

// ==================== CONFIGURACIÓN ====================
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n========================================");
  Serial.println("  AgroMind - Script de Prueba");
  Serial.println("========================================\n");
  
  // Configurar pines
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  digitalWrite(RELAY_PIN, LOW);
  dht.begin();
  
  Serial.println("Sistema inicializado\n");
  Serial.println("Comandos disponibles:");
  Serial.println("  1 - Probar DHT11 (Temperatura)");
  Serial.println("  2 - Probar Humedad de Suelo");
  Serial.println("  3 - Probar Sensor de Luz (LDR)");
  Serial.println("  4 - Probar Ultrasónico (Nivel Agua)");
  Serial.println("  5 - Encender Bomba");
  Serial.println("  6 - Apagar Bomba");
  Serial.println("  7 - Prueba Completa de Todos los Sensores");
  Serial.println("  8 - Calibración Humedad de Suelo");
  Serial.println("  9 - Calibración LDR");
  Serial.println("\nIngresa un número (1-9):\n");
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();
    Serial.print("\n> Comando recibido: ");
    Serial.println(command);
    Serial.println("----------------------------");
    
    switch(command) {
      case '1':
        testDHT11();
        break;
      case '2':
        testSoilMoisture();
        break;
      case '3':
        testLDR();
        break;
      case '4':
        testUltrasonic();
        break;
      case '5':
        turnPumpOn();
        break;
      case '6':
        turnPumpOff();
        break;
      case '7':
        testAllSensors();
        break;
      case '8':
        calibrateSoilMoisture();
        break;
      case '9':
        calibrateLDR();
        break;
      default:
        Serial.println("Comando no reconocido");
        break;
    }
    
    Serial.println("----------------------------\n");
    Serial.println("Listo para siguiente comando...\n");
  }
}

// ==================== FUNCIONES DE PRUEBA ====================

void testDHT11() {
  Serial.println("📊 Probando DHT11...\n");
  
  for(int i = 0; i < 5; i++) {
    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    Serial.print("Lectura ");
    Serial.print(i + 1);
    Serial.print(": ");
    
    if (isnan(temp) || isnan(humidity)) {
      Serial.println("❌ Error leyendo DHT11");
    } else {
      Serial.print("Temperatura: ");
      Serial.print(temp);
      Serial.print(" °C | Humedad Ambiental: ");
      Serial.print(humidity);
      Serial.println(" %");
    }
    
    delay(2000);
  }
  
  Serial.println("\n✓ Prueba DHT11 completada");
}

void testSoilMoisture() {
  Serial.println("💧 Probando Sensor de Humedad de Suelo...\n");
  
  for(int i = 0; i < 10; i++) {
    int rawValue = analogRead(SOIL_MOISTURE_PIN);
    float percentage = map(rawValue, 4095, 1000, 0, 100);
    percentage = constrain(percentage, 0, 100);
    
    Serial.print("Lectura ");
    Serial.print(i + 1);
    Serial.print(": Raw = ");
    Serial.print(rawValue);
    Serial.print(" | Porcentaje = ");
    Serial.print(percentage);
    Serial.println(" %");
    
    delay(1000);
  }
  
  Serial.println("\n✓ Prueba Humedad de Suelo completada");
}

void testLDR() {
  Serial.println("☀️ Probando Sensor de Luz (LDR)...\n");
  
  for(int i = 0; i < 10; i++) {
    int rawValue = analogRead(LDR_PIN);
    float percentage = map(rawValue, 0, 4095, 0, 100);
    percentage = constrain(percentage, 0, 100);
    
    Serial.print("Lectura ");
    Serial.print(i + 1);
    Serial.print(": Raw = ");
    Serial.print(rawValue);
    Serial.print(" | Luz = ");
    Serial.print(percentage);
    Serial.print(" % | Estado: ");
    
    if(percentage < 20) Serial.println("Oscuro");
    else if(percentage < 60) Serial.println("Luz Media");
    else Serial.println("Luz Alta");
    
    delay(1000);
  }
  
  Serial.println("\n✓ Prueba LDR completada");
}

void testUltrasonic() {
  Serial.println("📏 Probando Sensor Ultrasónico...\n");
  
  for(int i = 0; i < 10; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    
    Serial.print("Lectura ");
    Serial.print(i + 1);
    Serial.print(": ");
    
    if (duration == 0) {
      Serial.println("❌ Timeout - Sin respuesta");
    } else {
      float distance = duration * 0.0343 / 2;
      Serial.print("Distancia: ");
      Serial.print(distance);
      Serial.println(" cm");
    }
    
    delay(1000);
  }
  
  Serial.println("\n✓ Prueba Ultrasónico completada");
}

void turnPumpOn() {
  Serial.println("💦 Encendiendo Bomba...");
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("✓ Bomba ENCENDIDA");
  Serial.println("⚠️ CUIDADO: Apágala cuando termines de probar");
}

void turnPumpOff() {
  Serial.println("🛑 Apagando Bomba...");
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("✓ Bomba APAGADA");
}

void testAllSensors() {
  Serial.println("🔄 Prueba Completa de Todos los Sensores\n");
  Serial.println("===========================================");
  
  // DHT11
  Serial.println("\n1️⃣ DHT11:");
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (!isnan(temp) && !isnan(humidity)) {
    Serial.print("   ✓ Temperatura: ");
    Serial.print(temp);
    Serial.println(" °C");
    Serial.print("   ✓ Humedad Ambiental: ");
    Serial.print(humidity);
    Serial.println(" %");
  } else {
    Serial.println("   ❌ Error leyendo DHT11");
  }
  
  delay(2000);
  
  // Humedad Suelo
  Serial.println("\n2️⃣ Humedad de Suelo:");
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  float soilPct = map(soilRaw, 4095, 1000, 0, 100);
  soilPct = constrain(soilPct, 0, 100);
  Serial.print("   ✓ Raw: ");
  Serial.print(soilRaw);
  Serial.print(" | Humedad: ");
  Serial.print(soilPct);
  Serial.println(" %");
  
  delay(1000);
  
  // LDR
  Serial.println("\n3️⃣ Sensor de Luz:");
  int ldrRaw = analogRead(LDR_PIN);
  float ldrPct = map(ldrRaw, 0, 4095, 0, 100);
  ldrPct = constrain(ldrPct, 0, 100);
  Serial.print("   ✓ Raw: ");
  Serial.print(ldrRaw);
  Serial.print(" | Luz: ");
  Serial.print(ldrPct);
  Serial.println(" %");
  
  delay(1000);
  
  // Ultrasónico
  Serial.println("\n4️⃣ Ultrasónico:");
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  if (duration > 0) {
    float distance = duration * 0.0343 / 2;
    Serial.print("   ✓ Distancia: ");
    Serial.print(distance);
    Serial.println(" cm");
  } else {
    Serial.println("   ❌ Sin respuesta");
  }
  
  delay(1000);
  
  // Relé
  Serial.println("\n5️⃣ Relé/Bomba:");
  Serial.println("   ℹ️ Probando encendido (2 segundos)...");
  digitalWrite(RELAY_PIN, HIGH);
  delay(2000);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("   ✓ Relé funciona correctamente");
  
  Serial.println("\n===========================================");
  Serial.println("✓ Prueba completa finalizada");
}

void calibrateSoilMoisture() {
  Serial.println("🔧 CALIBRACIÓN - Humedad de Suelo\n");
  Serial.println("Paso 1: Mantén el sensor AL AIRE (seco)");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  
  while(Serial.available() == 0) {
    delay(100);
  }
  while(Serial.available() > 0) Serial.read();
  
  delay(1000);
  int drySum = 0;
  for(int i = 0; i < 10; i++) {
    drySum += analogRead(SOIL_MOISTURE_PIN);
    delay(100);
  }
  int dryValue = drySum / 10;
  
  Serial.print("\n✓ Valor SECO: ");
  Serial.println(dryValue);
  
  Serial.println("\nPaso 2: Sumerge el sensor en AGUA");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  
  while(Serial.available() == 0) {
    delay(100);
  }
  while(Serial.available() > 0) Serial.read();
  
  delay(1000);
  int wetSum = 0;
  for(int i = 0; i < 10; i++) {
    wetSum += analogRead(SOIL_MOISTURE_PIN);
    delay(100);
  }
  int wetValue = wetSum / 10;
  
  Serial.print("\n✓ Valor HÚMEDO: ");
  Serial.println(wetValue);
  
  Serial.println("\n📝 USAR ESTOS VALORES EN EL CÓDIGO:");
  Serial.println("float percentage = map(rawValue, " + String(dryValue) + ", " + String(wetValue) + ", 0, 100);");
  Serial.println("\n✓ Calibración completada");
}

void calibrateLDR() {
  Serial.println("🔧 CALIBRACIÓN - Sensor de Luz (LDR)\n");
  Serial.println("Paso 1: Cubre completamente el sensor (oscuridad total)");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  
  while(Serial.available() == 0) {
    delay(100);
  }
  while(Serial.available() > 0) Serial.read();
  
  delay(1000);
  int darkSum = 0;
  for(int i = 0; i < 10; i++) {
    darkSum += analogRead(LDR_PIN);
    delay(100);
  }
  int darkValue = darkSum / 10;
  
  Serial.print("\n✓ Valor OSCURO: ");
  Serial.println(darkValue);
  
  Serial.println("\nPaso 2: Expón el sensor a LUZ DIRECTA (lámpara o sol)");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  
  while(Serial.available() == 0) {
    delay(100);
  }
  while(Serial.available() > 0) Serial.read();
  
  delay(1000);
  int lightSum = 0;
  for(int i = 0; i < 10; i++) {
    lightSum += analogRead(LDR_PIN);
    delay(100);
  }
  int lightValue = lightSum / 10;
  
  Serial.print("\n✓ Valor LUZ: ");
  Serial.println(lightValue);
  
  Serial.println("\n📝 Valores actuales por defecto:");
  Serial.println("float percentage = map(rawValue, 0, 4095, 0, 100);");
  Serial.println("\nSi los valores están muy diferentes, considerar ajustar el mapeo.");
  Serial.println("\n✓ Calibración completada");
}
