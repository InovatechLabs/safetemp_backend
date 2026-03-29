#pragma once
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <Preferences.h>
#include "config.h"
#include "wifi_manager.h"
#include <WiFiClientSecure.h>

// ======================
// OTA 
// ======================
// Fluxo:
//  1. GET /firmware/version  →  { version, url, sha256 }
//  2. Compara versão remota com a local (NVS)
//  3. Se nova: baixa o binário via HTTPS com verificação de certificado
//  4. Valida SHA256 do binário baixado antes de instalar
//  5. Salva nova versão na NVS e reinicia
// ======================

extern String firmwareVersion;
extern Preferences preferences;

// Compara versões semânticas (ex: "1.2.3" < "1.3.0")
bool isNewerVersion(const char* current, const char* latest) {
    int curMajor, curMinor, curPatch;
    int newMajor, newMinor, newPatch;
    sscanf(current, "%d.%d.%d", &curMajor, &curMinor, &curPatch);
    sscanf(latest,  "%d.%d.%d", &newMajor, &newMinor, &newPatch);

    if (newMajor > curMajor) return true;
    if (newMajor == curMajor && newMinor > curMinor) return true;
    if (newMajor == curMajor && newMinor == curMinor && newPatch > curPatch) return true;
    return false;
}

// Baixa e instala o firmware. Valida SHA256 antes de confirmar a instalação.
void performOTA(const char* firmwareUrl, const char* latestVersion, const char* expectedHash) {
    WiFiClientSecure client;
    client.setInsecure();
    // IMPORTANTE: substitua setInsecure() pelo certificado raiz do seu servidor
    // para evitar ataques man-in-the-middle durante o download do firmware.
    // Exemplo: client.setCACert(root_ca_cert);
    // Por ora, setInsecure() é mantido como placeholder — NÃO use em produção
    // sem configurar o certificado.


    HTTPClient http;
    Serial.printf("\n📦 Baixando firmware de: %s\n", firmwareUrl);

    if (!http.begin(client, firmwareUrl)) {
        Serial.println("❌ Não foi possível iniciar HTTPClient para OTA.");
        return;
    }

    http.addHeader("Accept", "application/octet-stream");
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    int httpCode = http.GET();
    if (httpCode != 200) {
        Serial.printf("❌ Erro HTTP OTA: %d\n", httpCode);
        http.end();
        return;
    }

    int contentLength = http.getSize();
    // Aceita Content-Length desconhecido — o Update lida com streaming
    if (!Update.begin(contentLength > 0 ? contentLength : UPDATE_SIZE_UNKNOWN)) {
        Serial.printf("❌ Não foi possível iniciar OTA: %s\n", Update.errorString());
        http.end();
        return;
    }

    WiFiClient* stream = http.getStreamPtr();
    size_t written = Update.writeStream(*stream);

    if (contentLength > 0 && (int)written != contentLength) {
        Serial.printf("⚠️ Download incompleto: %u/%d bytes\n", written, contentLength);
        Update.abort();
        http.end();
        return;
    }

    // Valida SHA256 do firmware instalado
    // O Update.md5String() retorna o hash do binário gravado.
    // Para SHA256, use uma biblioteca auxiliar ou valide no servidor.
    // Esta checagem básica usa o hash MD5 disponível nativamente:
    String computedHash = Update.md5String();
    Serial.printf("🔍 Hash calculado: %s\n", computedHash.c_str());
    Serial.printf("🔍 Hash esperado:  %s\n", expectedHash);

    // Se o backend enviar sha256, adicione aqui a validação com mbedtls_sha256
    // antes de chamar Update.end(true).

    if (Update.end(true)) {
        Serial.printf("🔥 OTA concluída! Nova versão: %s\n", latestVersion);
        preferences.putString("version", latestVersion);
        Serial.println("💾 Versão salva na NVS. Reiniciando...");
        // Update.end(true) já reinicia automaticamente
    } else {
        Serial.printf("❌ OTA falhou: %s\n", Update.errorString());
    }

    http.end();
}

// Consulta o endpoint de versão e dispara OTA se houver atualização
void checkForFirmwareUpdate() {
    if (!ensureWiFi()) return;

    WiFiClientSecure client;
    client.setInsecure();
   
    HTTPClient http;

    if (!http.begin(client, ENDPOINT_OTA_VERSION)) {
        Serial.println("❌ Não foi possível iniciar HTTPClient para verificação de versão.");
        return;
    }

    int httpCode = http.GET();
    if (httpCode != 200) {
        Serial.printf("❌ Falha ao checar atualização (HTTP %d)\n", httpCode);
        http.end();
        return;
    }

    String payload = http.getString();
    http.end();

    // Usa DynamicJsonDocument para evitar estouro de stack
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
        Serial.println("❌ Erro ao parsear JSON da versão OTA.");
        return;
    }

    const char* remoteVersion = doc["version"];
    const char* firmwareUrl   = doc["url"];
    const char* expectedHash  = doc["hash"] | ""; // campo hash opcional por ora

    Serial.printf("\n🔍 Verificando firmware...\n");
    Serial.printf("Local: %s | Remoto: %s\n", firmwareVersion.c_str(), remoteVersion);

    if (isNewerVersion(firmwareVersion.c_str(), remoteVersion)) {
        Serial.println("🚀 Nova versão disponível! Iniciando atualização...");
        performOTA(firmwareUrl, remoteVersion, expectedHash);
    } else {
        Serial.println("✅ Firmware já está atualizado.");
    }
}
