#pragma once
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ======================
// DISPLAY LCD I2C
// ======================
LiquidCrystal_I2C lcd(0x27, 16, 2);

void initDisplay() {
    Wire.begin(21, 22); 
    
    lcd.init();
    lcd.backlight();
    lcd.clear();
    
    lcd.setCursor(0, 0);
    lcd.print("SafeTemp Monitor");
    lcd.setCursor(0, 1);
    lcd.print("Iniciando...");
    
    Serial.println("📺 Display inicializado.");
}
void showStatus(String message, int line = 1) {
    lcd.setCursor(0, line);
    lcd.print("                ");
    lcd.setCursor(0, line);
    lcd.print(message);
}

void updateDisplayTemp(float tempC, bool sentOk) {
    lcd.clear();
    
    // Linha 0: Mostra a temperatura
    lcd.setCursor(0, 0);
    if (tempC <= -100.0) {
        lcd.print("Erro no Sensor!");
    } else {
        lcd.print("Temp: ");
        lcd.print(tempC, 1);
        lcd.print(" C");
    }

    // Linha 1: Mostra o status do envio
    lcd.setCursor(0, 1);
    if (sentOk) {
        lcd.print("Enviado OK!");
    } else {
        lcd.print("Erro no Envio!");
    }
}