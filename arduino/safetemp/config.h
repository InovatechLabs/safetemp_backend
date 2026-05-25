#pragma once

// ======================
// WI-FI
// ======================
#define WIFI_SSID        "wifi_ssid"
#define WIFI_PASSWORD    "wifi_password"
#define WIFI_MAX_RETRIES 20

// ======================
// NTP
// ======================
#define NTP_SERVER          "pool.ntp.org"
#define GMT_OFFSET_SEC      0   // UTC +0
#define DAYLIGHT_OFFSET_SEC 0

// ======================
// ENDPOINTS DA API
// ======================
#define API_BASE_URL         "https://safetemp-api.onrender.com/api/"
#define ENDPOINT_TEMP        API_BASE_URL "data/registertemp"
#define ENDPOINT_OTA_VERSION API_BASE_URL "firmware/version"
#define ENDPOINT_BATCH       API_BASE_URL "data/registertemp/batch"

// ======================
// AUTENTICAÇÃO
// ======================
// Chave secreta compartilhada entre o dispositivo e o backend.
// Gerada no backend no momento do cadastro do dispositivo e gravada
// aqui antes do flash. Nunca exponha este valor publicamente.
#define DEVICE_SECRET "device_secret"

// ======================
// PINOS
// ======================
#define ONE_WIRE_BUS 4

// ======================
// INTERVALOS
// ======================
#define TEMP_INTERVAL_MS    (1UL  * 60UL * 1000UL)  // 5 minutos
#define UPDATE_INTERVAL_MS  (3UL  * 60UL * 60UL * 1000UL)  // 3 horas

// ======================
// VERSÃO PADRÃO (fallback se NVS estiver vazia)
// ======================
#define FIRMWARE_VERSION_DEFAULT "1.0.2"
