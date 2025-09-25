#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time.h>

// Credenciais Wi-Fi e horário
const char* ssid = "LAB 108";
const char* password = "fatec258";
const char* ntpServer = "pool.ntp.org";

const long gmtOffset_sec = -10800; // GMT-3
const int daylightOffset_sec = 0;

// URL da API
const char* serverUrl = "https://safetemp-backend.onrender.com/api/data/registertemp";

// Pino do DS18B20
#define ONE_WIRE_BUS 4  

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  sensors.begin();

  // Conectar no Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi conectado!");
  Serial.println(WiFi.localIP());

  // Configura NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void loop() {

  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("Erro: Sensor não encontrado!");
  } else {
    Serial.print("🌡️ Temperatura: ");
    Serial.print(tempC);
    Serial.println(" °C");

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;

      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      // Criar chipId de 12 dígitos hex
      uint64_t chipid = ESP.getEfuseMac();
      char chipIdStr[13];
      sprintf(chipIdStr, "%012llX", chipid);

      // JSON correto com temp como número
      String postData = "{";
      postData += "\"chipId\":\"" + String(chipIdStr) + "\",";
      postData += "\"temp\":" + String(tempC, 2); // 2 casas decimais
      postData += "}";

      int httpResponseCode = http.POST(postData);

      if (httpResponseCode > 0) {
        Serial.println("✅ Dados enviados com sucesso!");
        Serial.println("Resposta do servidor:");
        Serial.println(http.getString());
      } else {
        Serial.print("❌ Erro ao enviar: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    }
  }

  delay(10000); // 10 segundos
}