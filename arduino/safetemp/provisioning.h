#pragma once
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>
#include "config.h"
#include "auth.h"

// ======================
// FLUXO DE PROVISIONAMENTO
// ======================

String activateDeviceOnBackend(String activationToken) {
    String chipId = getChipId();
    
    Serial.println("Iniciando provisionamento no backend...");
    Serial.println("Token: " + activationToken);
    Serial.println("ChipID: " + chipId);

    WiFiClient client;

    HTTPClient http;
    if (!http.begin(client, ENDPOINT_PROVISION)) {
        Serial.println("Falha ao iniciar HTTPClient para ativação.");
        return "";
    }

    http.addHeader("Content-Type", "application/json");

    // Monta o payload
    DynamicJsonDocument doc(256);
    doc["chipId"] = chipId;
    doc["activationToken"] = activationToken;
    
    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);

    if (httpCode == 200 || httpCode == 201) {
        String response = http.getString();
        DynamicJsonDocument resDoc(512);
        deserializeJson(resDoc, response);
        
        String secret = resDoc["deviceSecret"].as<String>();
        Serial.println("Provisionamento bem-sucedido! Secret recebido.");
        http.end();
        return secret;
    } else {
        Serial.printf("Falha no provisionamento (HTTP %d): %s\n", httpCode, http.getString().c_str());
        http.end();
        return "";
    }
}