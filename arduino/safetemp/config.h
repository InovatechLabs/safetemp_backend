#pragma once

// ======================
// CONFIGURAÇÕES DO PORTAL CATIVO (AP)
// ======================
#define AP_SSID_PREFIX   "SafeTemp_Setup_"
#define CAPTIVE_PORTAL_IP IPAddress(192, 168, 4, 1)

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
#define ENDPOINT_PROVISION   API_BASE_URL "device/activate"

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
