#pragma once
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"
#include "offline_buffer.h"
#include "temperature.h"
#include <WiFiClientSecure.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "credentials.h"
#include "esp_adc_cal.h"

WebSocketsClient wsClient;

bool wsConnected = false;
bool pendingFlush = false;

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
      delay(500);
      pendingFlush = true;
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
    unsigned long sentAt = doc["sentAt"] | 0;
    unsigned long rtt = sentAt > 0 ? (millis() - sentAt) : 0;
    
    String msg = "Latência: " + String(rtt) + "ms";
    remoteLog("INFO", msg);
}
else if (strcmp(command, "stack") == 0) {
    UBaseType_t stackRemaining = uxTaskGetStackHighWaterMark(NULL);
    
    String msg = "[STACK] Mínimo restante: " + String(stackRemaining * 4) + " bytes";
    
    // alerta se estiver abaixo de 1KB — risco de stack overflow
    if (stackRemaining * 4 < 1024) {
        msg += " ⚠️ CRITICO: risco de stack overflow!";
        remoteLog("WARN", msg);
    } else {
        remoteLog("INFO", msg);
    }
}
else if (strcmp(command, "net_info") == 0) {
    String ip = WiFi.localIP().toString();
    String gateway = WiFi.gatewayIP().toString();
    String subnet = WiFi.subnetMask().toString();
    String dns = WiFi.dnsIP().toString();
    int rssi = WiFi.RSSI();
    int channel = WiFi.channel();
    String bssid = WiFi.BSSIDstr();
    String ssid = WiFi.SSID();

    String signalQuality;
    if (rssi >= -50) signalQuality = "Excelente";
    else if (rssi >= -60) signalQuality = "Bom";
    else if (rssi >= -70) signalQuality = "Regular";
    else signalQuality = "Fraco";

    String msg = "[NET] SSID: " + ssid +
                 " | IP: " + ip +
                 " | Gateway: " + gateway +
                 " | Máscara: " + subnet +
                 " | DNS: " + dns +
                 " | Canal: " + String(channel) +
                 " | BSSID: " + bssid +
                 " | RSSI: " + String(rssi) + "dBm (" + signalQuality + ")";

    remoteLog("INFO", msg);
}

else if (strcmp(command, "voltage") == 0) {
    // Lê a tensão interna de referência do ESP32
    // esp_read_efuse_vref retorna a tensão de referência calibrada em mV
    uint32_t vref = 1100; // valor padrão se não houver calibração

    analogSetAttenuation(ADC_11db); // range 0-3.3V
    int raw = analogRead(34);
    
    float voltage = (raw / 4095.0) * 3300.0;

    esp_adc_cal_characteristics_t chars;
    esp_adc_cal_value_t cal = esp_adc_cal_characterize(
        ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, vref, &chars
    );
    
    uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(raw, &chars);
    
    String calType = (cal == ESP_ADC_CAL_VAL_EFUSE_VREF) ? "eFuse" : 
                     (cal == ESP_ADC_CAL_VAL_EFUSE_TP) ? "Two Point" : "Default";

    String msg = "[POWER] ADC raw: " + String(raw) + 
                 " | Tensão: " + String(voltage_mv) + "mV" +
                 " | Calibração: " + calType;

    // Alerta se tensão abaixo de 2800mV — brownout iminente
    if (voltage_mv < 2800) {
        msg += " ⚠️ TENSÃO BAIXA!";
        remoteLog("WARN", msg);
    } else {
        remoteLog("INFO", msg);
    }
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

  DeviceCredentials creds = loadCredentials();
  String signature = hmacSHA256(creds.deviceSecret, chipId);

  // Monta a URL de conexão com os parâmetros de autenticação
  String path = "/ws?type=device&chipId=" + chipId + "&signature=" + signature;

  wsClient.begin("192.168.15.10", 3000, path.c_str());
  
  wsClient.onEvent(onWebSocketEvent);
  wsClient.setReconnectInterval(10000); // tenta reconectar a cada 5s automaticamente

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