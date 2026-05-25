#pragma once
#include <WiFi.h>
#include "config.h"

// ======================
// GERENCIADOR WI-FI
// ======================

bool connectWiFi() {
    WiFi.disconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Conectando ao Wi-Fi");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < WIFI_MAX_RETRIES) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✅ Wi-Fi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }

    Serial.println("\n❌ Falha ao conectar ao Wi-Fi.");
    return false;
}

// Garante que o Wi-Fi está conectado, tentando reconectar se necessário.
// Deve ser chamado no início de qualquer função que faça requisições HTTP.
bool ensureWiFi() {
    if (WiFi.status() == WL_CONNECTED) return true;

    Serial.println("⚠️ Wi-Fi desconectado. Tentando reconectar...");
    return connectWiFi();
}
