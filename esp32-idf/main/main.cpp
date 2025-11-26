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
#include "cJSON.h"

static const char *TAG = "AGROMIND";

// ==================== CONFIGURACIÓN WIFI ====================
#define WIFI_SSID "Medina 2.0"
#define WIFI_PASS "Amorcito"
#define WIFI_MAXIMUM_RETRY 5

// ==================== CONFIGURACIÓN API ====================
#define SERVER_URL "http://agromind-5hb1.onrender.com/api/iot/sensor-data"
#define ZONE_ID 1

// ==================== PINES ====================
#define RELAY_PIN GPIO_NUM_25
#define DHT_PIN GPIO_NUM_4
#define TRIG_PIN GPIO_NUM_18
#define ECHO_PIN GPIO_NUM_19
#define SOIL_MOISTURE_ADC_CHANNEL ADC_CHANNEL_6  // GPIO34
#define LDR_ADC_CHANNEL ADC_CHANNEL_7            // GPIO35

// ==================== CONFIGURACIÓN TANQUE ====================
#define TANK_HEIGHT_CM 100.0f
#define TANK_MAX_DISTANCE_CM 5.0f

// ==================== VARIABLES GLOBALES ====================
static adc_oneshot_unit_handle_t adc1_handle;
static adc_cali_handle_t adc1_cali_handle = NULL;
static bool wifi_connected = false;
static bool pump_state = false;
static int retry_num = 0;

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

// ==================== FUNCIONES DE SENSORES ====================

static float read_temperature(void) {
    // TODO: implementar lectura real de DHT11. Valor simulado por ahora.
    return 25.0f;
}

static float read_ambient_humidity(void) {
    // TODO: implementar lectura real de DHT11. Valor simulado por ahora.
    return 60.0f;
}

static float read_soil_moisture(void) {
    int adc_raw = 0;
    ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, SOIL_MOISTURE_ADC_CHANNEL, &adc_raw));

    int voltage_mv = 0;
    if (adc1_cali_handle != NULL) {
        adc_cali_raw_to_voltage(adc1_cali_handle, adc_raw, &voltage_mv);
    }

    float percentage = map_value((float)adc_raw, 4095.0f, 1000.0f, 0.0f, 100.0f);
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
    float water_height = TANK_HEIGHT_CM - distance_cm + TANK_MAX_DISTANCE_CM;
    float percentage = (water_height / TANK_HEIGHT_CM) * 100.0f;
    percentage = constrain_value(percentage, 0.0f, 100.0f);

    ESP_LOGI(TAG, "Nivel Agua - Distancia: %.1f cm | %.1f%%",
             distance_cm, percentage);

    return percentage;
}

// ==================== CONTROL DE BOMBA ====================

static void set_pump_state(bool state) {
    pump_state = state;
    gpio_set_level(RELAY_PIN, state ? 1 : 0);
    ESP_LOGI(TAG, "Bomba %s", state ? "ENCENDIDA" : "APAGADA");
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
                    cJSON *pump_cmd = cJSON_GetObjectItem(root, "pumpCommand");
                    if (pump_cmd && cJSON_IsBool(pump_cmd)) {
                        bool requested_state = cJSON_IsTrue(pump_cmd);
                        if (requested_state != pump_state) {
                            set_pump_state(requested_state);
                        }
                    }
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

    cJSON *sensors = cJSON_CreateObject();
    cJSON_AddNumberToObject(sensors, "temperature", read_temperature());
    cJSON_AddNumberToObject(sensors, "ambientHumidity", read_ambient_humidity());
    cJSON_AddNumberToObject(sensors, "soilMoisture", read_soil_moisture());
    cJSON_AddNumberToObject(sensors, "waterLevel", read_water_level());
    cJSON_AddNumberToObject(sensors, "lightLevel", read_light_level());
    cJSON_AddBoolToObject(sensors, "pumpStatus", pump_state);
    cJSON_AddItemToObject(root, "sensors", sensors);

    char *payload = cJSON_PrintUnformatted(root);
    ESP_LOGI(TAG, "Enviando payload: %s", payload);

    esp_http_client_config_t config = {};
    config.url = SERVER_URL;
    config.event_handler = http_event_handler;
    config.method = HTTP_METHOD_POST;

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
    const TickType_t delay_ticks = pdMS_TO_TICKS(10000);
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
