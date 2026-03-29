#pragma once
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"
#include "wifi_manager.h"
#include <WiFiClientSecure.h>

#define OFFLINE_MAX_RECORDS 1440
#define BATCH_SIZE 50

Preferences prefs;

// ======================
// STRUCT DO REGISTRO
// ======================
struct TempRecord {
    float value;
    char timestamp[25];
};

// ======================
// HELPERS NVS
// ======================
void bufferBegin(bool readOnly = false) {
    prefs.begin("offline", readOnly);
}

void bufferEnd() {
    prefs.end();
}

int getHead() { return prefs.getInt("head", 0); }
int getTail() { return prefs.getInt("tail", 0); }
int getCount() { return prefs.getInt("count", 0); }

void setHead(int v) { prefs.putInt("head", v); }
void setTail(int v) { prefs.putInt("tail", v); }
void setCount(int v) { prefs.putInt("count", v); }

// ======================
// SALVAR NO BUFFER
// ======================
void bufferSave(float value) {
    bufferBegin(false);

    int head = getHead();
    int tail = getTail();
    int count = getCount();

    // timestamp
    time_t now;
    time(&now);

    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);

    char timestamp[25];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

    // salva registro
    String key = "rec_" + String(head);

    TempRecord rec;
    rec.value = value;
    strncpy(rec.timestamp, timestamp, sizeof(rec.timestamp));

    prefs.putBytes(key.c_str(), &rec, sizeof(rec));

    // atualiza head
    head = (head + 1) % OFFLINE_MAX_RECORDS;

    if (count < OFFLINE_MAX_RECORDS) {
        count++;
    } else {
        // buffer cheio → avança tail (overwrite)
        tail = (tail + 1) % OFFLINE_MAX_RECORDS;
    }

    setHead(head);
    setTail(tail);
    setCount(count);

    bufferEnd();

    Serial.printf("[BUFFER] Salvo: %.2f°C (%d itens)\n", value, count);
}

// ======================
// FLUSH (ENVIO)
// ======================
void bufferFlush() {
    if (!ensureWiFi()) return;

    bufferBegin(true);

    int count = getCount();
    int tail = getTail();

    String chipId = getChipId();

    if (count == 0) {
        bufferEnd();
        return;
    }

    bufferEnd();

    Serial.printf("[BUFFER] Enviando %d registros...\n", count);

    while (count > 0) {
        int batchCount = min(BATCH_SIZE, count);
        String payloadToSign = chipId;

        DynamicJsonDocument doc(1024 + batchCount * 64);
        doc["chipId"] = chipId;
        JsonArray records = doc.createNestedArray("records");

        bufferBegin(true);

      for (int i = 0; i < batchCount; i++) {
    String key = "rec_" + String((tail + i) % OFFLINE_MAX_RECORDS);

    TempRecord rec;
    prefs.getBytes(key.c_str(), &rec, sizeof(rec));

    String formattedVal = String(rec.value, 2);

    JsonObject obj = records.createNestedObject();
    obj["value"] = formattedVal;
    obj["timestamp"] = rec.timestamp;

    payloadToSign += "|" + formattedVal + "|" + String(rec.timestamp);

}
        bufferEnd();

        String payload;
        serializeJson(doc, payload);
        String signature = hmacSHA256(DEVICE_SECRET, payloadToSign);

        WiFiClientSecure client;
        client.setInsecure();

        HTTPClient http;

        if (!http.begin(client, ENDPOINT_BATCH)) {
            Serial.println("[BUFFER] Falha HTTP begin");
            return;
        }

        http.addHeader("Content-Type", "application/json");
        http.addHeader("X-Chip-Id", chipId);
        http.addHeader("X-Device-Signature", signature);

        int code = http.POST(payload);

        if (code == 200 || code == 201) {
            Serial.printf("[BUFFER] Batch OK (%d itens)\n", batchCount);

            // atualiza tail e count (remove enviados)
            bufferBegin(false);

            int newTail = (tail + batchCount) % OFFLINE_MAX_RECORDS;
            int newCount = getCount() - batchCount;

            setTail(newTail);
            setCount(newCount);

            bufferEnd();

            tail = newTail;
            count = newCount;
        } else {
            Serial.printf("[BUFFER] Erro HTTP %d\n", code);
            http.end();
            return;
        }

        http.end();
    }

    Serial.println("[BUFFER] Flush completo!");
}