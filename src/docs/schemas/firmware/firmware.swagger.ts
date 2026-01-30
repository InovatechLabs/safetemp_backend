export const firmwareSchemas = {
  FirmwareVersionResponse: {
    type: "object",
    properties: {
      version: {
        type: "string",
        example: "1.2.3"
      },
      file: {
        type: "string",
        example: "estufa-v1.2.3.bin"
      },
      hash: {
        type: "string",
        example: "a1b2c3d4e5f6..."
      },
      size: {
        type: "integer",
        example: 1048576
      },
      url: {
        type: "string",
        example: "https://safetemp-backend.onrender.com/api/firmware/download/firmware_v1.2.3.bin"
      },
      lastModified: {
        type: "string",
        format: "date-time",
        example: "2026-01-30T10:15:00Z"
      }
    }
  }
};


/**
 * @openapi
 * tags:
 *   - name: Firmware
 *     description: Atualização OTA e versionamento do firmware do ESP32
 */

/**
 * @openapi
 * /firmware/version:
 *   get:
 *     summary: Obtém informações da versão mais recente do firmware
 *     description: >
 *       Retorna metadados do firmware mais recente disponível no servidor.
 *       Esta rota é utilizada pelo ESP32 para verificar atualizações OTA,
 *       mas também pode ser consumida por desenvolvedores para auditoria
 *       e controle de versões.
 *     tags:
 *       - Firmware
 *     responses:
 *       200:
 *         description: Informações do firmware retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: Versão do firmware extraída do nome do arquivo
 *                   example: 1.2.3
 *                 file:
 *                   type: string
 *                   description: Nome do arquivo de firmware
 *                   example: firmware_v1.2.3.bin
 *                 hash:
 *                   type: string
 *                   description: Hash SHA-256 do firmware para verificação de integridade
 *                   example: a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
 *                 size:
 *                   type: number
 *                   description: Tamanho do arquivo em bytes
 *                   example: 1048576
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: URL para download do firmware
 *                   example: https://api.exemplo.com/firmware/download/firmware_v1.2.3.bin
 *                 lastModified:
 *                   type: string
 *                   format: date-time
 *                   description: Data da última modificação do firmware
 *                   example: 2026-01-30T13:22:10Z
 *       404:
 *         description: Nenhum firmware encontrado no servidor
 *       500:
 *         description: Erro interno ao processar a versão do firmware
 */


/**
 * @openapi
 * /firmware/download/{file}:
 *   get:
 *     summary: Realiza o download do firmware binário
 *     description: >
 *       Retorna o arquivo de firmware (.bin) para atualização OTA do ESP32.
 *       Esta rota fornece o conteúdo binário bruto e não retorna JSON.
 *     tags:
 *       - Firmware
 *     parameters:
 *       - in: path
 *         name: file
 *         required: true
 *         description: Nome do arquivo de firmware a ser baixado
 *         schema:
 *           type: string
 *           example: estufa-v1.0.2.bin
 *     responses:
 *       200:
 *         description: Firmware enviado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Arquivo de firmware não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Arquivo não encontrado.
 *       500:
 *         description: Erro interno ao enviar o firmware
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro interno do servidor
 */
