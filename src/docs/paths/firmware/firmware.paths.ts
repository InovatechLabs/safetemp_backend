export const firmwarePaths = {
  "/api/firmware/version": {
    get: {
      tags: ["Firmware"],
      summary: "Obter versão atual do firmware",
      description:
        "Retorna informações do firmware mais recente disponível para atualização OTA do ESP32.",
      responses: {
        200: {
          description: "Informações do firmware retornadas com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FirmwareVersionResponse"
              }
            }
          }
        },
        404: {
          description: "Nenhum arquivo de firmware encontrado"
        },
        500: {
          description: "Erro interno do servidor"
        }
      }
    }
  },

  "/api/firmware/download/{file}": {
    get: {
      tags: ["Firmware"],
      summary: "Download do firmware",
      description:
        "Realiza o download de um arquivo de firmware específico (.bin). Usado pelo ESP32 ou por desenvolvedores.",
      parameters: [
        {
          name: "file",
          in: "path",
          required: true,
          description: "Nome do arquivo de firmware",
          schema: {
            type: "string",
            example: "firmware_v1.2.3.bin"
          }
        }
      ],
      responses: {
        200: {
          description: "Arquivo de firmware enviado com sucesso",
          content: {
            "application/octet-stream": {
              schema: {
                type: "string",
                format: "binary"
              }
            }
          }
        },
        404: {
          description: "Arquivo não encontrado"
        },
        500: {
          description: "Erro interno do servidor"
        }
      }
    }
  }
};
