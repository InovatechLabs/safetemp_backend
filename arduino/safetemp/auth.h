#pragma once
#include <Arduino.h>
#include <mbedtls/md.h>

// ======================
// AUTENTICAÇÃO HMAC-SHA256
// ======================
// Gera uma assinatura HMAC-SHA256 do payload usando o DEVICE_SECRET
// O backend valida essa assinatura em toda requisição antes de processar
// os dados
//
// Header enviado:  X-Device-Signature: <hex(HMAC-SHA256(secret, payload))>
// Header enviado:  X-Chip-Id: <chipId>
// ======================

String hmacSHA256(const String& secret, const String& message) {
    byte hmacResult[32];

    mbedtls_md_context_t ctx;
    mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
    mbedtls_md_hmac_starts(&ctx,
        (const unsigned char*)secret.c_str(), secret.length());
    mbedtls_md_hmac_update(&ctx,
        (const unsigned char*)message.c_str(), message.length());
    mbedtls_md_hmac_finish(&ctx, hmacResult);
    mbedtls_md_free(&ctx);

    String result = "";
    for (int i = 0; i < 32; i++) {
        if (hmacResult[i] < 0x10) result += "0";
        result += String(hmacResult[i], HEX);
    }
    return result;
}

// Retorna o chipId como string hex de 12 caracteres
String getChipId() {
    uint64_t chipid = ESP.getEfuseMac();
    char chipIdStr[13];
    sprintf(chipIdStr, "%012llX", chipid);
    return String(chipIdStr);
}
