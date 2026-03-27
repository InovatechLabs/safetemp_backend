#include <Preferences.h>
#include <time.h>
#include "config.h"
#include "wifi_manager.h"
#include "auth.h"
#include "temperature.h"
#include "ota.h"
#include <display.h>
#include "websocket_client.h"
#include "offline_buffer.h"

// ======================
// ESTADO GLOBAL
// ======================
Preferences preferences;
String firmwareVersion;

unsigned long lastTempSend   = 0;
unsigned long lastUpdateCheck = 0;

// ======================
// SETUP
// ======================
void setup() {
    Serial.begin(115200);

    initDisplay();

    showStatus("Identificando sensor...");
    initSensor();

    showStatus("Conectando WiFi...");
    connectWiFi();
    showStatus("WiFi online!");
    delay(1000);

    // Sincroniza o relógio com NTP
    showStatus("Sinc. Relogio...");
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
if (now - lastTempSend >= TEMP_INTERVAL_MS) {
    float tempC = readTemperature();

    if (tempC == DEVICE_DISCONNECTED_C) {
        Serial.println("⚠️ Sensor não encontrado!");
        updateDisplayTemp(-127.0, false); 
    } else {
        Serial.printf("🌡️ Temperatura: %.2f °C\n", tempC);

        if (WiFi.status() == WL_CONNECTED) {
            bool success = sendTemperature(tempC); 
            
            if (success) {
                updateDisplayTemp(tempC, true);
                bufferFlush(); 
            } else {
                bufferSave(tempC);
                updateDisplayTemp(tempC, false);
            }
        } else {
            Serial.println("Offline: Salvando no buffer...");
            bufferSave(tempC);
               
            showStatus("Modo Offline"); 
            delay(1000);
            updateDisplayTemp(tempC, false);
        }
    }
    lastTempSend = millis(); // atualiza após a operação para compensar o tempo de rede
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
