#pragma once
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"
#include "offline_buffer.h"
#include "temperature.h"

WebSocketsClient wsClient;
bool wsConnected = false;

String chipId   = getChipId();


void remoteLog(String level, String message) {
  StaticJsonDocument<200> doc;
    doc["type"] = "system_log";
    doc["level"] = level;
    doc["message"] = message;
    doc["chipId"] = chipId; 

    String output;
    serializeJson(doc, output);

    wsClient.sendTXT(output);
}

// Callback chamado em todo evento WebSocket
void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {

    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("WebSocket conectado ao backend!");
      remoteLog("INFO", "Conexão estabelecida");
      break;

    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("WebSocket desconectado. Tentando reconectar...");
      break;

    case WStype_TEXT: {
      String msg = String((char*)payload);

      DynamicJsonDocument doc(512);
      if (deserializeJson(doc, msg)) break;

      const char* msgType = doc["type"];

      if (strcmp(msgType, "command") == 0) {
        const char* command = doc["command"];

      if (strcmp(command, "read_now") == 0) {

          float currentTemp = readTemperature(); 
          String logMsg = "Leitura forçada: " + String(currentTemp, 2) + "°C";

          remoteLog("INFO", logMsg); 
        }

        else if (strcmp(command, "restart") == 0) {
          Serial.println("🔄 Comando recebido: reiniciando...");
          delay(500);
          ESP.restart();
        }
        else if (strcmp(command, "system_info") == 0) {
          long uptime = millis() / 1000;
          int rssi = WiFi.RSSI();
          size_t ram = ESP.getFreeHeap() / 1024;
          
          String info = "Uptime: " + String(uptime) + "s | WiFi: " + String(rssi) + "dBm | RAM: " + String(ram) + "KB";
          remoteLog("INFO", "[SYSTEM] " + info);
        }
        else if (strcmp(command, "force_flush") == 0) {
          remoteLog("WARN", "Solicitando descarregamento forçado do buffer NVS...");
          bufferFlush(); 
        }
        else if (strcmp(command, "ping") == 0) {
          remoteLog("INFO", "Pong!");
        }
        else if (strcmp(command, "mem_map") == 0) {
          size_t freeHeap = ESP.getFreeHeap() / 1024;
          size_t minFreeHeap = ESP.getMinFreeHeap() / 1024; // Menor valor de RAM livre desde o boot
          size_t maxAlloc = ESP.getMaxAllocHeap() / 1024; // Maior bloco contínuo livre

          String msg = "RAM Livre: " + String(freeHeap) + "KB | Mínima Histórica: " + String(minFreeHeap) + "KB | Maior Bloco: " + String(maxAlloc) + "KB";
          remoteLog("INFO", "[MEM] " + msg);
        }
        else if (strcmp(command, "wifi_scan") == 0) {
          remoteLog("INFO", "Iniciando varredura de redes... (Aguarde)");
          int n = WiFi.scanNetworks();
    
            if (n == 0) {
            remoteLog("WARN", "Nenhuma rede Wi-Fi encontrada.");
        } else {
        String result = "Redes encontradas: ";
        for (int i = 0; i < n; ++i) {
            result += WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + "dBm)";
            if (i < n - 1) result += " | ";
        }
        remoteLog("INFO", "[WIFI] " + result);
        }
        WiFi.scanDelete(); // Limpa a memória do scan
      }
      else if (strcmp(command, "chip_info") == 0) {
        String msg = "Modelo: ESP32 | Cores: " + String(ESP.getChipCores()) + 
                 " | Rev: " + String(ESP.getChipRevision()) + 
                 " | CPU: " + String(ESP.getCpuFreqMHz()) + "MHz";
        remoteLog("INFO", "[CHIP] " + msg);
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
  // Assinatura de autenticação: HMAC-SHA256(secret, chipId)
  String signature = hmacSHA256(DEVICE_SECRET, chipId);

  // Monta a URL de conexão com os parâmetros de autenticação
  String path = "/ws?type=device&chipId=" + chipId + "&signature=" + signature;

  // Em produção: wsClient.beginSSL("safetemp-api.onrender.com", 443, path.c_str());
  wsClient.begin("192.168.15.7", 3000, path.c_str());
  wsClient.onEvent(onWebSocketEvent);
  wsClient.setReconnectInterval(3000); // tenta reconectar a cada 5s automaticamente

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