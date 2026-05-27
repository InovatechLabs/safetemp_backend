#pragma once
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFi.h>
#include "credentials.h"
#include "provisioning.h"
#include "auth.h"
#include "display.h"

// ======================
// PORTAL CATIVO (WEB SERVER)
// ======================

WebServer server(80);
DNSServer dnsServer;

// HTML da página de configuração
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeTemp | Configuração</title>
 <style>
   :root {
      /* NOVA IDENTIDADE: Roxo com detalhes Laranja */
      --primary: #7c3aed; /* Roxo vibrante startup */
      --primary-hover: #6d28d9;
      --accent: #f97316; /* Laranja detalhes */
      --bg-gradient: linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%);
      
      --surface: #ffffff;
      --text: #1f2937;
      --text-light: #6b7280;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-gradient);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: var(--surface);
      width: 100%;
      max-width: 400px;
      padding: 40px 30px;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.02);
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: var(--primary);
      border-radius: 16px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .logo svg { width: 32px; height: 32px; fill: white; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    p { color: var(--text-light); font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
    .input-group { margin-bottom: 20px; text-align: left; }
    label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.2s;
      background: #f9fafb;
      outline: none;
    }
    input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    button {
      width: 100%;
      background: var(--primary);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 10px;
    }
    button:hover { background: var(--primary-hover); transform: translateY(-1px); }
    button:active { transform: translateY(1px); }
  </style>
</head>
<body>
  <div class="card">
   <div class="logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    </div>
    <h1>Configuração de Hardware</h1>
    <p>Conecte seu equipamento à rede local e valide sua licença.</p>
    
    <form action="/save" method="post">
      <div class="input-group">
        <label>Nome da Rede Wi-Fi</label>
        <input type="text" name="ssid" placeholder="Ex: Minha Casa" required>
      </div>
      <div class="input-group">
        <label>Senha do Wi-Fi</label>
        <input type="password" name="password" placeholder="••••••••">
      </div>
      <div class="input-group">
        <label>Chave de Ativação</label>
        <input type="text" name="token" placeholder="Sua chave de ativação" required>
      </div>
      <button type="submit">Autenticar e Conectar</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

void handleRoot() {
    server.send(200, "text/html", INDEX_HTML);
}

void handleSave() {
    String ssid = server.arg("ssid");
    String pass = server.arg("password");
    String token = server.arg("token");

    server.send(200, "text/html", "<h2>Conectando e Validando Token...</h2><p>O dispositivo vai reiniciar em instantes.</p>");
    
    showStatus("Ativando...", 1);
    Serial.printf("\nTentando conectar no SSID do cliente: %s\n", ssid.c_str());

    // 1. Tenta conectar na rede do cliente temporariamente
    WiFi.begin(ssid.c_str(), pass.c_str());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi local conectado! Validando Token na API...");
        showStatus("Validando Token...", 1);
        
        // 2. Chama a API para validar o token e obter o Secret
        String secret = activateDeviceOnBackend(token);
        
        if (secret != "") {
            // 3. Sucesso! Salva tudo e reinicia.
            saveCredentials(ssid, pass, secret);
            showStatus("Ativado! Reboot", 1);
            delay(2000);
            ESP.restart();
        } else {
            Serial.println("Falha na ativação. Token inválido ou erro de servidor.");
            showStatus("Erro de Token!", 1);
            delay(3000);
            ESP.restart(); // Reinicia em modo AP novamente para o usuário tentar de novo
        }
    } else {
        Serial.println("\nSenha do Wi-Fi incorreta ou rede indisponível.");
        showStatus("Erro no Wi-Fi", 1);
        delay(3000);
        ESP.restart();
    }
}

void startCaptivePortal() {
    String chipId = getChipId();
    String apName = String(AP_SSID_PREFIX) + chipId.substring(6); // Ex: SafeTemp_Setup_A1B2C3

    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(CAPTIVE_PORTAL_IP, CAPTIVE_PORTAL_IP, IPAddress(255, 255, 255, 0));
    WiFi.softAP(apName.c_str());

    dnsServer.start(53, "*", CAPTIVE_PORTAL_IP); // Captura todo o tráfego DNS

    server.on("/", handleRoot);
    server.on("/save", HTTP_POST, handleSave);
    
    // Redireciona qualquer outra página para o Root (Captive Portal)
    server.onNotFound([]() {
        server.sendHeader("Location", String("http://") + CAPTIVE_PORTAL_IP.toString(), true);
        server.send(302, "text/plain", "");
    });

    server.begin();
    
    Serial.println("\n==================================");
    Serial.println("📡 MODO CONFIGURAÇÃO ATIVADO");
    Serial.printf("Rede: %s\n", apName.c_str());
    Serial.printf("IP: %s\n", CAPTIVE_PORTAL_IP.toString().c_str());
    Serial.println("==================================");
    
    showStatus("Modo Config AP");

    // Loop infinito mantendo o portal cativo aberto
    while (true) {
        dnsServer.processNextRequest();
        server.handleClient();
        delay(10);
    }
}