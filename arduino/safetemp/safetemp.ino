#include <Preferences.h>
#include <time.h>
#include "config.h"
#include "wifi_manager.h"
#include "auth.h"
#include "temperature.h"
#include "ota.h"
#include "display.h"
#include "websocket_client.h"
#include "offline_buffer.h"

// ======================
// ESTADO GLOBAL
// ======================
Preferences preferences;
String firmwareVersion;

unsigned long lastTempSend   = 0;
unsigned long lastUpdateCheck = 0;

extern bool pendingFlush;

// ======================
// SETUP
// ======================
void setup() {
    Serial.begin(115200);
    delay(100);
    esp_reset_reason_t reason = esp_reset_reason();
    Serial.printf("🔁 Motivo do reinício: %d\n", reason);

    initDisplay();

    showStatus("Identificando sensor...");
    initSensor();

    showStatus("Conectando WiFi...");
    connectWiFi();
    showStatus("WiFi online!");
    delay(1000);

    // Sincroniza o relógio com NTP
    showStatus("Sync. Relogio...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    Serial.println("🕐 Aguardando sincronização NTP...");
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 5000)) {
        Serial.println("⚠️ Falha ao sincronizar NTP.");
    } else {
        Serial.println("✅ NTP sincronizado.");
    }

    // Carrega versão salva na NVS 
    preferences.begin("firmware", false);
    firmwareVersion = preferences.getString("version", FIRMWARE_VERSION_DEFAULT);
    Serial.printf("📦 Versão atual: %s\n", firmwareVersion.c_str());

    // Verifica atualizações no boot
    showStatus("Buscando Update");
    checkForFirmwareUpdate();
    lastUpdateCheck = millis();

    showStatus("Conectando WS...");
    initWebSocket(); 

    showStatus("Sistema Pronto!");
    delay(1500);
    lastTempSend = 0;
}

// ======================
// LOOP PRINCIPAL
// ======================
void loop() {
    wsClient.loop();

    unsigned long now = millis();

    // — Envio periódico de temperatura —
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        
        static int lastMinute = -1;
        if (timeinfo.tm_min != lastMinute) {
            lastMinute = timeinfo.tm_min; 

            float tempC = readTemperature();

            if (tempC == DEVICE_DISCONNECTED_C) {
                Serial.println("⚠️ Sensor não encontrado!");
                updateDisplayTemp(-127.0, false); 
                remoteLog("ERROR", "Sensor de temperatura desconectado.");
            } else {
                Serial.printf("🌡️ [%02d:%02d:00] Temperatura: %.2f °C\n", 
                              timeinfo.tm_hour, timeinfo.tm_min, tempC);
                
                remoteLog("INFO", "Leitura agendada realizada.");

                if (WiFi.status() == WL_CONNECTED) {
                    bool success = sendTemperature(tempC); 
                    if (success) {
                        updateDisplayTemp(tempC, true);
                    } else {
                        bufferSave(tempC);
                        updateDisplayTemp(tempC, false);
                    }
                } else {
                    Serial.println("Offline: Salvando no buffer...");
                    bufferSave(tempC);
                    showStatus("Modo Offline"); 
                    updateDisplayTemp(tempC, false);
                }
            }
        }
    }

    if (pendingFlush && WiFi.status() == WL_CONNECTED) {
    pendingFlush = false;
    bufferFlush();
}

    // — Verificação periódica de OTA —
    if (now - lastUpdateCheck >= UPDATE_INTERVAL_MS) {
        Serial.println("\n⏰ Verificando nova versão de firmware...");
        checkForFirmwareUpdate();
        lastUpdateCheck = millis();
    }

    // Sem delay fixo — o loop roda livre e o controle de tempo é feito por millis()
    // Pequeno yield para não bloquear o watchdog do ESP32
    delay(10);
}
