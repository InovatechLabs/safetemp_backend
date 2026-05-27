#pragma once
#include <WiFi.h>
#include "config.h"
#include "credentials.h"
#include "captive_portal.h"
#include "display.h"

// ======================
// GERENCIADOR WI-FI
// ======================

bool connectWiFi() {
    DeviceCredentials creds = loadCredentials();

    if (!creds.isProvisioned) {
        Serial.println("Credenciais não encontradas. Iniciando Captive Portal...");
        startCaptivePortal(); // Isso entra em loop infinito até ser provisionado
        return false;
    }

    WiFi.disconnect(true);
    WiFi.begin(creds.ssid.c_str(), creds.password.c_str());
    Serial.printf("Conectando ao Wi-Fi: %s", creds.ssid.c_str());

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }

    Serial.println("\nFalha ao conectar ao Wi-Fi salvo.");
    return false;
}

bool ensureWiFi() {
    if (WiFi.status() == WL_CONNECTED) return true;
    Serial.println("Wi-Fi desconectado. Tentando reconectar...");
    return connectWiFi();
}