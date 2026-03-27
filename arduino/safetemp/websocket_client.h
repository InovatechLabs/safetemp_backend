#pragma once
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"

WebSocketsClient wsClient;
bool wsConnected = false;

// Callback chamado em todo evento WebSocket
void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {

    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("WebSocket conectado ao backend!");
      break;

    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("WebSocket desconectado. Tentando reconectar...");
      break;

    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.printf("📩 Mensagem recebida: %s\n", msg.c_str());

      DynamicJsonDocument doc(256);
      if (deserializeJson(doc, msg)) break;

      const char* msgType = doc["type"];

      if (strcmp(msgType, "command") == 0) {
        const char* command = doc["command"];

        if (strcmp(command, "read_now") == 0) {
          Serial.println("⚡ Comando recebido: leitura imediata.");
          // A flag é checada no loop principal para forçar envio

        } else if (strcmp(command, "restart") == 0) {
          Serial.println("🔄 Comando recebido: reiniciando...");
          delay(500);
          ESP.restart();
        }
      }

      if (strcmp(msgType, "ack") == 0) {
        Serial.printf("Registro confirmado pelo servidor. ID: %d\n", (int)doc["id"]);
      }

      break;
    }

    case WStype_ERROR:
      Serial.println("Erro no WebSocket.");
      break;

    default:
      break;
  }
}

void initWebSocket() {
  String chipId   = getChipId();
  // Assinatura de autenticação: HMAC-SHA256(secret, chipId)
  String signature = hmacSHA256(DEVICE_SECRET, chipId);

  // Monta a URL de conexão com os parâmetros de autenticação
  String path = "/ws?type=device&chipId=" + chipId + "&signature=" + signature;

  // Em produção: wsClient.beginSSL("safetemp-api.onrender.com", 443, path.c_str());
  wsClient.begin("192.168.15.4", 3000, path.c_str());
  wsClient.onEvent(onWebSocketEvent);
  wsClient.setReconnectInterval(5000); // tenta reconectar a cada 5s automaticamente

  Serial.println("🔌 Iniciando conexão WebSocket...");
}

// Envia leitura de temperatura via WebSocket
void sendTemperatureWS(float tempC) {
  if (!wsConnected) {
    Serial.println("WebSocket desconectado — temperatura não enviada.");
    return;
  }

  DynamicJsonDocument doc(128);
  doc["type"]  = "temperature";
  doc["value"] = tempC;

  String payload;
  serializeJson(doc, payload);
  wsClient.sendTXT(payload);
  Serial.printf("Temperatura enviada via WS: %.2f°C\n", tempC);
}