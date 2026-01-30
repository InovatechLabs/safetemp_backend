export const dataPaths = {
  "/api/data/registertemp": {
    post: {
      tags: ["Data"],
      summary: "Registrar temperatura",
      description:
        "Registra uma nova leitura de temperatura enviada por um dispositivo ESP32 autorizado.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/TemperatureInput"
            }
          }
        }
      },
      responses: {
        201: {
          description: "Temperatura registrada com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TemperatureRecord"
              }
            }
          }
        },
        400: {
          description: "Dados obrigatórios ausentes ou inválidos"
        },
        401: {
          description: "Dispositivo não autorizado"
        },
        500: {
          description: "Erro interno do servidor"
        }
      }
    }
  },

  "/api/data/lastdata": {
    get: {
      tags: ["Data"],
      summary: "Obter última temperatura registrada",
      description:
        "Retorna o último registro de temperatura armazenado no banco de dados.",
      responses: {
        200: {
          description: "Último registro encontrado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  lastRecord: {
                    $ref: "#/components/schemas/TemperatureRecord"
                  }
                }
              }
            }
          }
        },
        500: {
          description: "Erro ao buscar último registro"
        }
      }
    }
  },
"/api/data/batch-upload": {
  post: {
    tags: ["Data"],
    summary: "Registrar múltiplas temperaturas (batch)",
    description:
      "Registra múltiplas leituras de temperatura enviadas em lote por um dispositivo ESP32 autorizado.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/BatchTemperatureInput"
          }
        }
      }
    },
    responses: {
      201: {
        description: "Lote processado com sucesso",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/BatchUploadResponse"
            }
          }
        }
      },
      400: {
        description: "Formato inválido ou lista vazia"
      },
      401: {
        description: "Dispositivo não autorizado"
      },
      500: {
        description: "Erro interno ao salvar lote"
      }
    }
  }
},
"/api/data/history6h": {
  get: {
    tags: ["Data"],
    summary: "Histórico das últimas 6 horas",
    description:
      "Retorna registros de temperatura das últimas 6 horas considerando ajuste de timezone do servidor.",
    responses: {
      200: {
        description: "Histórico das últimas 6 horas",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/HistoryWithStatsResponse"
            }
          }
        }
      },
      500: {
        description: "Erro ao buscar últimos dados"
      }
    }
  }
},
"/api/data/history1h": {
  get: {
    tags: ["Data"],
    summary: "Histórico da última 1 hora",
    description:
      "Retorna registros de temperatura da última 1 hora. Caso não existam dados, retorna lista vazia e estatísticas nulas.",
    responses: {
      200: {
        description: "Histórico da última hora",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/HistoryWithStatsResponse"
            },
            example: {
              records: [],
              statistics: null
            }
          }
        }
      },
      500: {
        description: "Erro ao buscar últimos dados"
      }
    }
  }
},
 "/api/data/history": {
    get: {
      tags: ["Data"],
      summary: "Consulta histórico de temperaturas",
      description: `
Retorna registros de temperatura e estatísticas calculadas.

A consulta pode ser feita de duas formas:
- Informando um dia específico (date)
- Informando um intervalo de datas (start e end)
      `,
      parameters: [
        {
          name: "date",
          in: "query",
          required: true,
          description: "Data específica para consulta (YYYY-MM-DD)",
          schema: {
            type: "string",
            example: "2026-01-30",
          },
        },
        {
          name: "start",
          in: "query",
          required: false,
          description: "Data/hora inicial do intervalo",
          schema: {
            type: "string",
            format: "date-time",
            example: "2026-01-30",
          },
        },
        {
          name: "end",
          in: "query",
          required: false,
          description: "Data/hora final do intervalo",
          schema: {
            type: "string",
            format: "date-time",
            example: "2026-01-30",
          },
        },
      ],
      responses: {
        200: {
          description: "Consulta realizada com sucesso",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    $ref: "#/components/schemas/TemperatureHistoryResponse",
                  },
                  {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Nenhum dado encontrado.",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Parâmetros inválidos ou ausentes",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Por favor, informe os parâmetros para consulta.",
                  },
                },
              },
            },
          },
        },
        500: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Erro interno do servidor.",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
"/api/data/exportcsv": {
  get: {
    tags: ["Data"],
    summary: "Exportar dados em CSV",
    description:
      "Exporta dados de temperatura ou resumo de relatórios em formato CSV, dependendo dos parâmetros informados.",
    parameters: [
      {
        name: "type",
        in: "query",
        description: "Tipo de exportação",
        required: false,
        schema: {
          type: "string",
          enum: ["temperatura", "relatorios"],
          example: "temperatura"
        }
      },
      {
        name: "data",
        in: "query",
        description:
          "Data no formato YYYY-MM-DD (obrigatória para exportação de temperatura)",
        required: false,
        schema: {
          type: "string",
          example: "2026-01-30"
        }
      },
      {
        name: "id",
        in: "query",
        description:
          "ID do relatório (obrigatório quando type = relatorios)",
        required: false,
        schema: {
          type: "integer",
          example: 12
        }
      }
    ],
    responses: {
      200: {
        description: "Arquivo CSV gerado com sucesso",
        content: {
          "text/csv": {
            schema: {
              type: "string",
              format: "binary"
            }
          }
        }
      },
      400: {
        description: "Parâmetros inválidos ou ausentes"
      },
      404: {
        description: "Dados não encontrados"
      },
      500: {
        description: "Erro interno na exportação CSV"
      }
    }
  },
}
}
