#pragma once
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include "config.h"
#include "wifi_manager.h"
#include "auth.h"

// ======================
// SENSOR E ENVIO DE TEMPERATURA
// ======================

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void initSensor() {
    sensors.begin();
    Serial.println("✅ Sensor DS18B20 inicializado.");
}

// Lê a temperatura atual do sensor.
// Retorna DEVICE_DISCONNECTED_C se o sensor não for encontrado.
float readTemperature() {
    sensors.requestTemperatures();
    return sensors.getTempCByIndex(0);
}

// Envia a leitura para o backend com autenticação HMAC-SHA256.
// O backend deve:
//  1. Receber os headers X-Chip-Id e X-Device-Signature
//  2. Buscar o secret cadastrado para o chipId
//  3. Recomputar HMAC-SHA256(secret, body) e comparar com a assinatura
//  4. Rejeitar com 401 se a assinatura não bater
void sendTemperature(float tempC) {
    if (!ensureWiFi()) return;

    String chipId = getChipId();

    // Monta o payload
    String jsonData = "{";
    jsonData += "\"chipId\":\"" + chipId + "\",";
    jsonData += "\"temp\":" + String(tempC, 2);
    jsonData += "}";

    // Gera assinatura HMAC-SHA256 do payload com o secret do dispositivo
    String signature = hmacSHA256(DEVICE_SECRET, chipId);

    WiFiClient client;
    // Use client.setCACert(root_ca_cert) em produção
    

    HTTPClient http;
    if (!http.begin(client, ENDPOINT_TEMP)) {
        Serial.println("❌ Não foi possível iniciar HTTPClient para envio de temperatura.");
        return;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Chip-Id", chipId);
    http.addHeader("X-Device-Signature", signature);

    int httpCode = http.POST(jsonData);

    if (httpCode > 0) {
        Serial.printf("📤 Temperatura enviada! HTTP %d\n", httpCode);
        if (httpCode != 200 && httpCode != 201) {
            Serial.printf("⚠️ Resposta inesperada: %s\n", http.getString().c_str());
        }
    } else {
        Serial.printf("❌ Erro ao enviar temperatura: %d\n", httpCode);
    }

    http.end();
}
