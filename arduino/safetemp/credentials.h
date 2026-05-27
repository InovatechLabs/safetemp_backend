#pragma once
#include <Preferences.h>
#include <Arduino.h>

extern Preferences prefs;

// ======================
// GERENCIADOR DE CREDENCIAIS (NVS)
// ======================

struct DeviceCredentials {
    String ssid;
    String password;
    String deviceSecret;
    bool isProvisioned;
};

DeviceCredentials loadCredentials() {
    DeviceCredentials creds;
    prefs.begin("credentials", true); // Abre em modo somente leitura
    
    creds.ssid = prefs.getString("ssid", "");
    creds.password = prefs.getString("password", "");
    creds.deviceSecret = prefs.getString("secret", "");
    creds.isProvisioned = (creds.ssid != "" && creds.deviceSecret != "");
    
    prefs.end();
    return creds;
}

void saveCredentials(String ssid, String password, String secret) {
    prefs.begin("credentials", false); // Abre em modo escrita
    prefs.putString("ssid", ssid);
    prefs.putString("password", password);
    prefs.putString("secret", secret);
    prefs.end();
    Serial.println("Credenciais salvas com sucesso na NVS!");
}

// Para testes: apagar tudo
void clearCredentials() {
    prefs.begin("credentials", false);
    prefs.clear();
    prefs.end();
    Serial.println("Credenciais apagadas!");
}