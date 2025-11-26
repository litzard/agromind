idf_component_register(SRCS "main.cpp"
                    INCLUDE_DIRS "."
                    REQUIRES esp_wifi esp_http_client esp_timer nvs_flash esp_netif driver esp_adc json)
