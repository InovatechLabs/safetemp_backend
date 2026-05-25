#pragma once
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include "config.h"
#include "wifi_manager.h"
#include "auth.h"
#include <WiFiClientSecure.h>

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
bool sendTemperature(float tempC) {
    if (!ensureWiFi()) return false;

    String chipId = getChipId();
    float tempRounded = round(tempC * 100.0) / 100.0;

    String payloadToSign = chipId + "|" + String(tempRounded, 2);

    String jsonData = "{";
    jsonData += "\"chipId\":\"" + chipId + "\",";
    jsonData += "\"temp\":" + String(tempRounded, 2);
    jsonData += "}";

    String signature = hmacSHA256(DEVICE_SECRET, payloadToSign);

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;

    if (!http.begin(client, ENDPOINT_TEMP)) {
        Serial.println("❌ Falha ao iniciar HTTPClient.");
        return false;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Chip-Id", chipId);
    http.addHeader("X-Device-Signature", signature);

    int httpCode = http.POST(jsonData);

    if (httpCode == 201) {
        Serial.println("✅ Temperatura enviada com sucesso (201).");
        http.end();
        return true;
    }
    if (httpCode == 400) {
        Serial.printf("Bad Request (400): %s\n", http.getString().c_str());
    } else if (httpCode == 401) {
        Serial.println("Não autorizado (401) — falha na autenticação.");
    } else if (httpCode == 500) {
        Serial.println("Erro interno do servidor (500).");
    }
    else if (httpCode <= 0) {
        Serial.printf("❌ Erro de conexão SSL/HTTPS: %s\n", http.errorToString(httpCode).c_str());
    }
    else {
        Serial.printf("⚠️ Status inesperado (%d): %s\n",
                      httpCode,
                      http.getString().c_str());
    }

    http.end();
    return false;
}
