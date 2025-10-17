#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <Preferences.h>
#include <time.h>
#include <WiFiClientSecure.h>

// ======================
// 🔧 CONFIGURAÇÕES GERAIS
// ======================

// Wi-Fi
const char* ssid = "LAB 108";
const char* password = "fatec258";

// Servidor NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -10800; // GMT-3
const int daylightOffset_sec = 0;

// Endpoints da API
const char* tempServerUrl = "https://safetemp-backend.onrender.com/api/data/registertemp";
const char* firmwareVersionUrl = "https://safetemp-backend.onrender.com/api/firmware/version";

// Pino do sensor DS18B20
#define ONE_WIRE_BUS 4

// ======================
// 🧠 OBJETOS GLOBAIS
// ======================
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
Preferences preferences;
String firmwareVersion;

// Controle de verificação periódica
unsigned long lastUpdateCheck = 0;
const unsigned long updateInterval = 3UL * 60UL * 60UL * 1000UL; // 3 horas
unsigned long lastTempSend = 0;
const unsigned long tempInterval = 5UL * 60UL * 1000UL; // 5 minutos

// ======================
// 📦 FUNÇÕES AUXILIARES
// ======================

// Compara versões (ex: 1.2.3 < 1.3.0)
bool isNewerVersion(const char* current, const char* latest) {
  int curMajor, curMinor, curPatch;
  int newMajor, newMinor, newPatch;
  sscanf(current, "%d.%d.%d", &curMajor, &curMinor, &curPatch);
  sscanf(latest, "%d.%d.%d", &newMajor, &newMinor, &newPatch);

  if (newMajor > curMajor) return true;
  if (newMajor == curMajor && newMinor > curMinor) return true;
  if (newMajor == curMajor && newMinor == curMinor && newPatch > curPatch) return true;
  return false;
}

// ======================
// 🔄 FUNÇÃO DE ATUALIZAÇÃO OTA
// ======================
void performOTA(const char* firmwareUrl, const char* latestVersion) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  Serial.printf("\n📦 Baixando firmware de: %s\n", firmwareUrl);

  if (!http.begin(client, firmwareUrl)) {
    Serial.println("❌ Não foi possível iniciar HTTPClient!");
    return;
  }

http.addHeader("Accept", "application/octet-stream");

http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  int httpCode = http.GET();

  

  if (httpCode == 200) {
    int contentLength = http.getSize();

    if (!Update.begin(contentLength)) {
      Serial.println("❌ Não foi possível iniciar OTA.");
      http.end();
      return;
    }

    WiFiClient* stream = http.getStreamPtr();
    size_t written = Update.writeStream(*stream);

    if (written == contentLength) {
      Serial.println("✅ Firmware baixado com sucesso!");
    } else {
      Serial.printf("⚠️ Download incompleto: %d/%d bytes\n", written, contentLength);
    }

    if (Update.end(true)) { // true = reinicia automaticamente
      Serial.printf("🔥 Atualização OTA concluída! Nova versão: %s\n", latestVersion);
      preferences.putString("version", latestVersion);
      Serial.println("💾 Versão salva na NVS.");
    } else {
      Serial.printf("❌ OTA falhou: %s\n", Update.errorString());
    }
  } else {
    Serial.printf("❌ Erro HTTP OTA: %d\n", httpCode);
  }

  http.end();
}

// ======================
// 🧩 VERIFICAR NOVA VERSÃO
// ======================
void checkForFirmwareUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(firmwareVersionUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.println("❌ Erro ao parsear JSON da versão OTA!");
      http.end();
      return;
    }

    const char* remoteVersion = doc["version"];
    const char* firmwareUrl = doc["url"];

    Serial.printf("\n🔍 Verificando firmware...\n");
    Serial.printf("Local: %s | Remoto: %s\n", firmwareVersion.c_str(), remoteVersion);

    if (isNewerVersion(firmwareVersion.c_str(), remoteVersion)) {
      Serial.println("🚀 Nova versão disponível! Iniciando atualização...");
      performOTA(firmwareUrl, remoteVersion);
    } else {
      Serial.println("✅ Firmware já está atualizado.");
    }
  } else {
    Serial.printf("❌ Falha ao checar atualização (HTTP %d)\n", httpCode);
  }

  http.end();
}

// ======================
// 📡 ENVIAR TEMPERATURA
// ======================
void sendTemperature(float tempC) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(tempServerUrl);
    http.addHeader("Content-Type", "application/json");

    uint64_t chipid = ESP.getEfuseMac();
    char chipIdStr[13];
    sprintf(chipIdStr, "%012llX", chipid);

    String jsonData = "{";
    jsonData += "\"chipId\":\"" + String(chipIdStr) + "\",";
    jsonData += "\"temp\":" + String(tempC, 2);
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);

    if (httpResponseCode > 0) {
      Serial.println("📤 Dados enviados com sucesso!");
      Serial.println(http.getString());
    } else {
      Serial.printf("❌ Erro ao enviar dados: %d\n", httpResponseCode);
    }

    http.end();
  }
}

// ======================
// 🚀 SETUP
// ======================
void setup() {
  Serial.begin(115200);
  sensors.begin();

  // Conectar Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi conectado!");
  Serial.println(WiFi.localIP());

  // Configurar NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // Inicializar NVS
  preferences.begin("firmware", false);
  firmwareVersion = preferences.getString("version", "1.0.2");
  Serial.print("📦 Versão atual instalada: ");
  Serial.println(firmwareVersion);

  // Checar atualização no boot
  checkForFirmwareUpdate();
  lastUpdateCheck = millis();
  lastTempSend = millis();
}

// ======================
// ♻️ LOOP PRINCIPAL
// ======================
void loop() {
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("⚠️ Erro: Sensor não encontrado!");
  } else {
    Serial.printf("🌡️ Temperatura: %.2f °C\n", tempC);

    // Envio periódico de temperatura
    if (millis() - lastTempSend > tempInterval) {
      sendTemperature(tempC);
      lastTempSend = millis();
    }
  }

  // Verificação periódica de OTA
  if (millis() - lastUpdateCheck > updateInterval) {
    Serial.println("\n⏰ Verificando se há nova versão de firmware disponível...");
    checkForFirmwareUpdate();
    lastUpdateCheck = millis();
  }

  delay(1000); // pequeno delay para não travar o loop
}
