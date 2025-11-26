/*
 * AgroMind - Sistema de Riego Inteligente
 * ESP32 Sensor Node (ESP-IDF)
 *
 * Componentes:
 * - DHT11 (Temperatura y Humedad Ambiental) -> GPIO4
 * - Sensor de Humedad de Suelo -> GPIO34 (ADC1_CH6)
 * - LDR (Sensor de Luz) -> GPIO35 (ADC1_CH7)
 * - Sensor Ultrasónico HC-SR04 -> GPIO18 (TRIG), GPIO19 (ECHO)
 * - Relé (Control de Bomba) -> GPIO5
 */

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"
#include "rom/ets_sys.h"
#include "esp_timer.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "cJSON.h"

static const char *TAG = "AGROMIND";

// ==================== CONFIGURACIÓN WIFI ====================
#define WIFI_SSID "Medina 2.0"
#define WIFI_PASS "Amorcito"
#define WIFI_MAXIMUM_RETRY 5

// ==================== CONFIGURACIÓN API ====================
#define SERVER_URL "https://agromind-5hb1.onrender.com/api/iot/sensor-data"
#define ZONE_ID 1

// ==================== PINES ====================
#define RELAY_PIN GPIO_NUM_25
#define DHT_PIN GPIO_NUM_4
#define TRIG_PIN GPIO_NUM_18
#define ECHO_PIN GPIO_NUM_19
#define SOIL_MOISTURE_ADC_CHANNEL ADC_CHANNEL_6  // GPIO34
#define LDR_ADC_CHANNEL ADC_CHANNEL_7            // GPIO35

#define DHT_LEVEL_TIMEOUT_US 2000

#define TANK_HEIGHT_CM 17.0f
#define SENSOR_TO_BOTTOM_DISTANCE_CM 17.0f

#define SOIL_MOISTURE_DRY_ADC 3200.0f   // aire (ajusta con tu lectura en seco)
#define SOIL_MOISTURE_WET_ADC 700.0f    // saturado (ajusta con tu lectura en agua)

// ==================== VARIABLES GLOBALES ====================
static adc_oneshot_unit_handle_t adc1_handle;
static adc_cali_handle_t adc1_cali_handle = NULL;
static bool wifi_connected = false;
static bool pump_state = false;
static int retry_num = 0;
static float last_temperature_c = 0.0f;
static float last_ambient_humidity = 0.0f;
static bool auto_mode_enabled = false;
static float configured_moisture_threshold = 30.0f;
static uint32_t configured_watering_duration = 10;
static bool auto_watering_active = false;
static TickType_t auto_watering_deadline = 0;
static float last_soil_moisture = 0.0f;
static float last_tank_level = 0.0f;

static const float MOISTURE_HYSTERESIS = 5.0f;
static const float MIN_TANK_PERCENTAGE = 5.0f;


// ==================== UTILIDADES ====================

static float map_value(float x, float in_min, float in_max, float out_min, float out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

static float constrain_value(float x, float min_val, float max_val) {
    if (x < min_val) {
        return min_val;
    }
    if (x > max_val) {
        return max_val;
    }
    return x;
}

static bool wait_for_level(gpio_num_t pin, int level, uint32_t timeout_us) {
    int64_t start = esp_timer_get_time();
    while (gpio_get_level(pin) != level) {
        if ((esp_timer_get_time() - start) > timeout_us) {
            return false;
        }
    }
    return true;
}

static bool read_dht11(float *temperature, float *humidity) {
    uint8_t data[5] = {0};

    gpio_set_direction(DHT_PIN, GPIO_MODE_OUTPUT);
    gpio_set_level(DHT_PIN, 1);
    ets_delay_us(1000);
    gpio_set_level(DHT_PIN, 0);
    ets_delay_us(20000);
    gpio_set_level(DHT_PIN, 1);
    ets_delay_us(30);
    gpio_set_direction(DHT_PIN, GPIO_MODE_INPUT);
    gpio_set_pull_mode(DHT_PIN, GPIO_PULLUP_ONLY);

    if (!wait_for_level(DHT_PIN, 0, DHT_LEVEL_TIMEOUT_US)) {
        ESP_LOGW(TAG, "DHT11 timeout esperando LOW inicial");
        return false;
    }
    if (!wait_for_level(DHT_PIN, 1, DHT_LEVEL_TIMEOUT_US)) {
        ESP_LOGW(TAG, "DHT11 timeout esperando HIGH inicial");
        return false;
    }
    if (!wait_for_level(DHT_PIN, 0, DHT_LEVEL_TIMEOUT_US)) {
        ESP_LOGW(TAG, "DHT11 timeout esperando inicio de datos");
        return false;
    }

    for (int i = 0; i < 40; ++i) {
        if (!wait_for_level(DHT_PIN, 1, DHT_LEVEL_TIMEOUT_US)) {
            ESP_LOGW(TAG, "DHT11 timeout esperando HIGH bit %d", i);
            return false;
        }
        int64_t start = esp_timer_get_time();
        if (!wait_for_level(DHT_PIN, 0, DHT_LEVEL_TIMEOUT_US)) {
            ESP_LOGW(TAG, "DHT11 timeout esperando LOW bit %d", i);
            return false;
        }
        int64_t duration = esp_timer_get_time() - start;
        int byte_index = i / 8;
        data[byte_index] <<= 1;
        if (duration > 40) {
            data[byte_index] |= 1;
        }
    }

    uint8_t checksum = data[0] + data[1] + data[2] + data[3];
    if ((checksum & 0xFF) != data[4]) {
        ESP_LOGW(TAG, "DHT11 checksum inválido (%u != %u)", checksum & 0xFF, data[4]);
        return false;
    }

    if (humidity != NULL) {
        *humidity = data[0] + data[1] * 0.1f;
    }
    if (temperature != NULL) {
        float temp = (data[2] & 0x7F) + data[3] * 0.1f;
        if (data[2] & 0x80) {
            temp = -temp;
        }
        *temperature = temp;
    }

    if (temperature != NULL && humidity != NULL) {
        ESP_LOGI(TAG, "DHT11 -> Temp: %.1f°C | Humedad: %.1f%%", *temperature, *humidity);
    }

    return true;
}

static void refresh_dht_measurement(void) {
    float temperature = 0.0f;
    float humidity = 0.0f;
    bool success = false;

    for (int attempt = 0; attempt < 3 && !success; ++attempt) {
        if (read_dht11(&temperature, &humidity)) {
            success = true;
            break;
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }

    if (success) {
        last_temperature_c = temperature;
        last_ambient_humidity = humidity;
    } else {
        ESP_LOGW(TAG, "DHT11 sin lectura válida tras reintentos, usando último valor");
    }
}

// ==================== FUNCIONES DE SENSORES ====================

static float read_soil_moisture(void) {
    int adc_raw = 0;
    ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, SOIL_MOISTURE_ADC_CHANNEL, &adc_raw));

    int voltage_mv = 0;
    if (adc1_cali_handle != NULL) {
        adc_cali_raw_to_voltage(adc1_cali_handle, adc_raw, &voltage_mv);
    }

    float percentage = map_value((float)adc_raw,
                                 SOIL_MOISTURE_WET_ADC,
                                 SOIL_MOISTURE_DRY_ADC,
                                 100.0f,
                                 0.0f);
    percentage = constrain_value(percentage, 0.0f, 100.0f);

    ESP_LOGI(TAG, "Humedad Suelo - Raw: %d | Voltaje: %d mV | %.1f%%",
             adc_raw, voltage_mv, percentage);

    return percentage;
}

static float read_light_level(void) {
    int adc_raw = 0;
    ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, LDR_ADC_CHANNEL, &adc_raw));

    int voltage_mv = 0;
    if (adc1_cali_handle != NULL) {
        adc_cali_raw_to_voltage(adc1_cali_handle, adc_raw, &voltage_mv);
    }

    float percentage = map_value((float)adc_raw, 0.0f, 4095.0f, 0.0f, 100.0f);
    percentage = constrain_value(percentage, 0.0f, 100.0f);

    ESP_LOGI(TAG, "Luz - Raw: %d | Voltaje: %d mV | %.1f%%",
             adc_raw, voltage_mv, percentage);

    return percentage;
}

static float read_water_level(void) {
    gpio_set_level(TRIG_PIN, 0);
    ets_delay_us(2);
    gpio_set_level(TRIG_PIN, 1);
    ets_delay_us(10);
    gpio_set_level(TRIG_PIN, 0);

    const int64_t timeout_us = 30000;
    int64_t start_wait = esp_timer_get_time();
    while (gpio_get_level(ECHO_PIN) == 0) {
        if (esp_timer_get_time() - start_wait > timeout_us) {
            ESP_LOGW(TAG, "Timeout esperando echo HIGH");
            return 0.0f;
        }
    }

    int64_t start_time = esp_timer_get_time();
    while (gpio_get_level(ECHO_PIN) == 1) {
        if (esp_timer_get_time() - start_time > timeout_us) {
            ESP_LOGW(TAG, "Timeout midiendo eco");
            break;
        }
    }

    int64_t duration = esp_timer_get_time() - start_time;
    float distance_cm = (duration * 0.0343f) / 2.0f;  // velocidad sonido
    distance_cm = constrain_value(distance_cm, 0.0f, SENSOR_TO_BOTTOM_DISTANCE_CM);
    float water_height = SENSOR_TO_BOTTOM_DISTANCE_CM - distance_cm;
    float percentage = (water_height / TANK_HEIGHT_CM) * 100.0f;
    percentage = constrain_value(percentage, 0.0f, 100.0f);

    ESP_LOGI(TAG, "Nivel Agua - Distancia: %.1f cm | Altura: %.1f cm | %.1f%%",
             distance_cm, water_height, percentage);

    return percentage;
}

// ==================== CONTROL DE BOMBA ====================
// NOTA: Muchos módulos de relé son "active-low" (se activan con 0)
// Si tu relé se enciende cuando debería estar apagado, cambia la lógica aquí

static void set_pump_state(bool state) {
    pump_state = state;
    // Relé active-low: 0 = encendido, 1 = apagado
    gpio_set_level(RELAY_PIN, state ? 0 : 1);
    ESP_LOGI(TAG, "Bomba %s (GPIO=%d)", state ? "ENCENDIDA" : "APAGADA", state ? 0 : 1);
}

static void update_configuration_from_commands(cJSON *commands) {
    if (commands == NULL) {
        return;
    }

    bool previous_auto_mode = auto_mode_enabled;
    bool config_changed = false;

    cJSON *auto_mode_item = cJSON_GetObjectItem(commands, "autoMode");
    if (auto_mode_item && cJSON_IsBool(auto_mode_item)) {
        bool new_auto_mode = cJSON_IsTrue(auto_mode_item);
        if (new_auto_mode != auto_mode_enabled) {
            auto_mode_enabled = new_auto_mode;
            config_changed = true;
        }
    }

    if (previous_auto_mode && !auto_mode_enabled && auto_watering_active) {
        auto_watering_active = false;
        if (pump_state) {
            set_pump_state(false);
            ESP_LOGI(TAG, "Modo auto desactivado, bomba apagada");
        }
    }

    cJSON *threshold_item = cJSON_GetObjectItem(commands, "moistureThreshold");
    if (threshold_item && cJSON_IsNumber(threshold_item)) {
        float new_threshold = (float)cJSON_GetNumberValue(threshold_item);
        if (new_threshold > 0.0f && new_threshold != configured_moisture_threshold) {
            configured_moisture_threshold = new_threshold;
            config_changed = true;
        }
    }

    cJSON *duration_item = cJSON_GetObjectItem(commands, "wateringDuration");
    if (duration_item && cJSON_IsNumber(duration_item)) {
        double raw_duration = cJSON_GetNumberValue(duration_item);
        uint32_t new_duration = raw_duration < 1.0 ? 1U : (uint32_t)raw_duration;
        if (new_duration != configured_watering_duration) {
            configured_watering_duration = new_duration;
            config_changed = true;
        }
    }

    if (config_changed) {
        ESP_LOGI(TAG, "Config zona -> auto:%s umbral:%.1f%% dur:%us",
                 auto_mode_enabled ? "ON" : "OFF",
                 configured_moisture_threshold,
                 configured_watering_duration);
    }
}

static void apply_auto_mode_logic(void) {
    // Si el modo automático está desactivado, asegurarse de que la bomba esté apagada
    // (a menos que haya un comando manual activo)
    if (!auto_mode_enabled) {
        if (auto_watering_active) {
            auto_watering_active = false;
            if (pump_state) {
                set_pump_state(false);
                ESP_LOGI(TAG, "Modo auto desactivado - bomba apagada");
            }
        }
        return;
    }

    if (last_tank_level <= 0.0f && last_soil_moisture <= 0.0f) {
        return;  // aún no hay lecturas recientes
    }

    // Si el tanque está muy bajo, apagar la bomba
    if (last_tank_level <= MIN_TANK_PERCENTAGE) {
        if (pump_state) {
            set_pump_state(false);
        }
        if (auto_watering_active) {
            auto_watering_active = false;
            ESP_LOGW(TAG, "Auto-riego cancelado: tanque en %.1f%%", last_tank_level);
        }
        return;
    }

    TickType_t now = xTaskGetTickCount();

    // Si hay auto-riego activo, verificar si debe terminar
    if (auto_watering_active) {
        bool recovered = last_soil_moisture >= (configured_moisture_threshold + MOISTURE_HYSTERESIS);
        bool expired = now >= auto_watering_deadline;

        if (recovered || expired) {
            auto_watering_active = false;
            set_pump_state(false);
            ESP_LOGI(TAG, "Auto-riego completado (%s)",
                     recovered ? "umbral alcanzado" : "tiempo agotado");
        }
        return;
    }

    // Si la bomba está encendida pero NO hay auto-riego activo,
    // es un estado manual - no interferir
    if (pump_state) {
        return;
    }

    // Verificar si debe iniciar auto-riego (humedad bajo el umbral)
    if (last_soil_moisture > 0.0f && last_soil_moisture < configured_moisture_threshold) {
        auto_watering_active = true;
        uint32_t duration_ms = configured_watering_duration * 1000U;
        auto_watering_deadline = now + pdMS_TO_TICKS(duration_ms);
        set_pump_state(true);
        ESP_LOGI(TAG, "Auto-riego iniciado: humedad %.1f%% < %.1f%%",
                 last_soil_moisture, configured_moisture_threshold);
    }
}

// ==================== COMUNICACIÓN API ====================

static esp_err_t http_event_handler(esp_http_client_event_t *evt) {
    static char response_buffer[512];
    static int response_len = 0;

    switch (evt->event_id) {
        case HTTP_EVENT_ON_DATA:
            if (!esp_http_client_is_chunked_response(evt->client)) {
                if ((response_len + evt->data_len) < (int)sizeof(response_buffer)) {
                    memcpy(response_buffer + response_len, evt->data, evt->data_len);
                    response_len += evt->data_len;
                    response_buffer[response_len] = '\0';
                }
            }
            break;
        case HTTP_EVENT_ON_FINISH:
            if (response_len > 0) {
                ESP_LOGI(TAG, "Respuesta: %s", response_buffer);
                cJSON *root = cJSON_Parse(response_buffer);
                if (root != NULL) {

                    cJSON *commands = cJSON_GetObjectItem(root, "commands");
                    if (commands && cJSON_IsObject(commands)) {
                        // Primero actualizar configuración
                        update_configuration_from_commands(commands);
                        
                        // Verificar si el tanque está bloqueado
                        cJSON *tank_locked = cJSON_GetObjectItem(commands, "tankLocked");
                        bool is_tank_locked = tank_locked && cJSON_IsTrue(tank_locked);
                        
                        if (is_tank_locked) {
                            // Tanque bloqueado - apagar bomba si está encendida
                            if (pump_state) {
                                set_pump_state(false);
                                auto_watering_active = false;
                                ESP_LOGW(TAG, "Tanque bloqueado por servidor, bomba apagada");
                            }
                        } else {
                            // Solo procesar comando de bomba si viene explícito (comando manual)
                            cJSON *pump_state_obj = cJSON_GetObjectItem(commands, "pumpState");
                            if (pump_state_obj && !cJSON_IsNull(pump_state_obj) && cJSON_IsBool(pump_state_obj)) {
                                bool requested_state = cJSON_IsTrue(pump_state_obj);
                                if (requested_state != pump_state) {
                                    set_pump_state(requested_state);
                                    // Si es comando manual, cancelar auto-watering
                                    auto_watering_active = false;
                                    ESP_LOGI(TAG, "Comando manual recibido: bomba %s", requested_state ? "ON" : "OFF");
                                }
                            }
                            // Si pumpState es null, el firmware mantiene control (auto-mode decide)
                        }
                    }

                    // Fallback para compatibilidad con respuestas antiguas
                    if (!cJSON_HasObjectItem(root, "commands")) {
                        cJSON *pump_cmd = cJSON_GetObjectItem(root, "pumpCommand");
                        if (pump_cmd && cJSON_IsBool(pump_cmd)) {
                            bool requested_state = cJSON_IsTrue(pump_cmd);
                            if (requested_state != pump_state) {
                                set_pump_state(requested_state);
                                auto_watering_active = false;
                            }
                        }
                    }

                    // Aplicar lógica de auto-mode DESPUÉS de procesar comandos
                    apply_auto_mode_logic();

                    cJSON_Delete(root);
                }
                response_len = 0;
            }
            break;
        default:
            break;
    }

    return ESP_OK;
}

static void send_sensor_data(void) {
    if (!wifi_connected) {
        ESP_LOGW(TAG, "WiFi no conectado");
        return;
    }

    cJSON *root = cJSON_CreateObject();
    cJSON_AddNumberToObject(root, "zoneId", ZONE_ID);

    refresh_dht_measurement();
    float temperature_c = last_temperature_c;
    float ambient_humidity = last_ambient_humidity;
    float soil_moisture = read_soil_moisture();
    float water_level = read_water_level();
    float light_level = read_light_level();

    last_soil_moisture = soil_moisture;
    last_tank_level = water_level;

    apply_auto_mode_logic();

    cJSON *sensors = cJSON_CreateObject();
    cJSON_AddNumberToObject(sensors, "temperature", temperature_c);
    cJSON_AddNumberToObject(sensors, "ambientHumidity", ambient_humidity);
    cJSON_AddNumberToObject(sensors, "soilMoisture", soil_moisture);
    cJSON_AddNumberToObject(sensors, "waterLevel", water_level);
    cJSON_AddNumberToObject(sensors, "lightLevel", light_level);
    cJSON_AddBoolToObject(sensors, "pumpStatus", pump_state);
    cJSON_AddItemToObject(root, "sensors", sensors);

    char *payload = cJSON_PrintUnformatted(root);
    ESP_LOGI(TAG, "Enviando payload: %s", payload);

    esp_http_client_config_t config = {};
    config.url = SERVER_URL;
    config.event_handler = http_event_handler;
    config.method = HTTP_METHOD_POST;
    config.transport_type = HTTP_TRANSPORT_OVER_SSL;
    config.crt_bundle_attach = esp_crt_bundle_attach;

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, payload, strlen(payload));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP Status = %d, content_length = %lld",
                 esp_http_client_get_status_code(client),
                 esp_http_client_get_content_length(client));
    } else {
        ESP_LOGE(TAG, "HTTP POST falló: %s", esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    cJSON_Delete(root);
    free(payload);
}

// ==================== CONFIGURACIÓN WIFI ====================

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (retry_num < WIFI_MAXIMUM_RETRY) {
            esp_wifi_connect();
            retry_num++;
            ESP_LOGW(TAG, "Reintentando conexión WiFi (%d)", retry_num);
        } else {
            ESP_LOGE(TAG, "No se pudo conectar a WiFi");
        }
        wifi_connected = false;
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "IP obtenida: " IPSTR, IP2STR(&event->ip_info.ip));
        retry_num = 0;
        wifi_connected = true;
    }
}

static void wifi_init(void) {
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    wifi_config_t wifi_config = {};
    strncpy((char *)wifi_config.sta.ssid, WIFI_SSID, sizeof(wifi_config.sta.ssid));
    strncpy((char *)wifi_config.sta.password, WIFI_PASS, sizeof(wifi_config.sta.password));
    wifi_config.sta.ssid[sizeof(wifi_config.sta.ssid) - 1] = '\0';
    wifi_config.sta.password[sizeof(wifi_config.sta.password) - 1] = '\0';
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "Conectando a SSID: %s", WIFI_SSID);
}

// ==================== TAREA PRINCIPAL ====================

static void sensor_task(void *pvParameters) {
    const TickType_t delay_ticks = pdMS_TO_TICKS(1000);
    while (true) {
        send_sensor_data();
        vTaskDelay(delay_ticks);
    }
}

// ==================== APP MAIN ====================

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG, "    AgroMind - Sistema de Riego");
    ESP_LOGI(TAG, "         ESP32 Sensor Node");
    ESP_LOGI(TAG, "========================================");

    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    gpio_config_t io_conf = {};
    io_conf.intr_type = GPIO_INTR_DISABLE;
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pin_bit_mask = (1ULL << RELAY_PIN) | (1ULL << TRIG_PIN);
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&io_conf));

    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pin_bit_mask = (1ULL << ECHO_PIN);
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&io_conf));

    gpio_config_t dht_conf = {};
    dht_conf.intr_type = GPIO_INTR_DISABLE;
    dht_conf.mode = GPIO_MODE_OUTPUT_OD;
    dht_conf.pin_bit_mask = (1ULL << DHT_PIN);
    dht_conf.pull_up_en = GPIO_PULLUP_ENABLE;
    dht_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&dht_conf));
    gpio_set_level(DHT_PIN, 1);

    set_pump_state(false);

    adc_oneshot_unit_init_cfg_t init_config1 = {
        .unit_id = ADC_UNIT_1,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

    adc_oneshot_chan_cfg_t chan_config = {
        .atten = ADC_ATTEN_DB_12,
        .bitwidth = ADC_BITWIDTH_12,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, SOIL_MOISTURE_ADC_CHANNEL, &chan_config));
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, LDR_ADC_CHANNEL, &chan_config));

    adc_cali_line_fitting_config_t cali_config = {
        .unit_id = ADC_UNIT_1,
        .atten = ADC_ATTEN_DB_12,
        .bitwidth = ADC_BITWIDTH_12,
        .default_vref = 1100,
    };
    if (adc_cali_create_scheme_line_fitting(&cali_config, &adc1_cali_handle) == ESP_OK) {
        ESP_LOGI(TAG, "ADC calibrado correctamente");
    } else {
        ESP_LOGW(TAG, "No se pudo calibrar ADC, se usará valor bruto");
    }

    wifi_init();

    ESP_LOGI(TAG, "Sistema listo, iniciando tarea de sensores");
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
}
