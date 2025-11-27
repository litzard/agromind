/*
 * AgroMind ESP32 Configuration Template
 * 
 * INSTRUCCIONES:
 * 1. Copiar este archivo a config.h
 * 2. Completar con tus valores reales
 * 3. Nunca commitear config.h (está en .gitignore)
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== CONFIGURACIÓN WIFI ====================
// Cambiar por tu red WiFi (2.4GHz, ESP32 no soporta 5GHz)
#define WIFI_SSID "TU_WIFI_SSID"
#define WIFI_PASS "TU_WIFI_PASSWORD"

// ==================== CONFIGURACIÓN API ====================
// URL del backend (Render)
#define SERVER_URL "https://agromind-5hb1.onrender.com/api/iot/sensor-data"

// ==================== CALIBRACIÓN DEL TANQUE ====================
// Ajustar según las dimensiones de tu tanque de agua
#define TANK_HEIGHT_CM 17.0f                    // Altura total del tanque en cm
#define SENSOR_TO_BOTTOM_DISTANCE_CM 17.0f      // Distancia del sensor al fondo

// ==================== CALIBRACIÓN SENSOR DE HUMEDAD ====================
// Para calibrar:
// 1. Colocar sensor al aire (seco) -> anotar valor ADC
// 2. Sumergir sensor en agua -> anotar valor ADC
// 3. Actualizar valores aquí
#define SOIL_MOISTURE_DRY_ADC 3200.0f           // Valor ADC cuando está seco
#define SOIL_MOISTURE_WET_ADC 700.0f            // Valor ADC cuando está saturado

// ==================== CALIBRACIÓN LDR (SENSOR DE LUZ) ====================
// Para calibrar:
// 1. Cubrir LDR (oscuridad total) -> anotar valor ADC
// 2. Iluminar directamente con luz -> anotar valor ADC
// 3. Actualizar valores aquí
#define LDR_DARK_ADC 3500.0f                    // Valor ADC en oscuridad
#define LDR_BRIGHT_ADC 500.0f                   // Valor ADC con luz directa

#endif // CONFIG_H
