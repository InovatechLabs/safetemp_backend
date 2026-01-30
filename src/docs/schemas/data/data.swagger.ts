export const dataSchemas = {
    BatchTemperatureInput: {
    type: "object",
    required: ["chipId", "records"],
    properties: {
      chipId: {
        type: "string",
        example: "4KCS03LSRF9"
      },
      records: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["value", "timestamp"],
          properties: {
            value: {
              type: "number",
              example: 26.5
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-01-30T13:45:00Z"
            }
          }
        }
      }
    }
  },
  TemperatureInput: {
    type: "object",
    required: ["chipId", "temp"],
    properties: {
      chipId: {
        type: "string",
        example: "4KCS03LSRF9",
      },
      temp: {
        type: "number",
        example: 23.4,
      },
      timestamp: {
        type: "string",
        format: "date-time",
        example: "2026-01-30T14:32:00Z",
        description: "Opcional. Ignorado pelo servidor.",
      },
    },
  },
  
  BatchUploadResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Sincronização concluída. 120 registros salvos."
      }
    }
  },
    TemperatureStatistics: {
    type: "object",
    properties: {
      media: {
        type: "number",
        example: 26.43,
      },
      mediaNoOutlier: {
        type: "number",
        example: 26.43,
      },
      mediana: {
        type: "number",
        example: 26.36,
      },
      medianaNoOutlier: {
        type: "number",
        example: 26.36,
      },
      minimo: {
        type: "number",
        example: 21.1,
      },
      maximo: {
        type: "number",
        example: 31.8,
      },
    },
  },
    TemperatureHistoryResponse: {
    type: "object",
    properties: {
      records: {
        type: "array",
        items: {
          $ref: "#/components/schemas/TemperatureRecord",
        },
      },
      statistics: {
        $ref: "#/components/schemas/TemperatureStatistics",
      },
    },
  },
 HistoryWithStatsResponse: {
    type: "object",
    properties: {
      records: {
        type: "array",
        items: {
          $ref: "#/components/schemas/TemperatureRecord"
        }
      },
      statistics: {
        $ref: "#/components/schemas/HistoryStatistics",
        nullable: true
      }
    },
    example: {
      records: [
        {
          chipId: "4KCS03LSRF9",
          temp: 26.4,
          timestamp: "2026-01-30T12:30:00Z"
        }
      ],
      statistics: {
        media: 26.43,
        mediana: 26.36,
        totalRecords: 180
      }
    }
  },
  TemperatureRecord: {
    type: "object",
    required: ["chipId", "temp", "timestamp"],
    properties: {
      chipId: {
        type: "string",
        example: "4KCS03LSRF9"
      },
      temp: {
        type: "number",
        format: "float",
        example: 26.4
      },
      timestamp: {
        type: "string",
        format: "date-time",
        example: "2026-01-26T14:32:00Z"
      }
    }
  },

  HistoryStatistics: {
    type: "object",
    properties: {
      media: {
        type: "number",
        example: 26.25
      },
      mediana: {
        type: "number",
        example: 26.3
      },
      totalRecords: {
        type: "integer",
        example: 243
      }
    }
  },

  HistoryResponse: {
    type: "object",
    properties: {
      records: {
        type: "array",
        items: {
          $ref: "#/components/schemas/TemperatureRecord"
        }
      },
      statistics: {
        $ref: "#/components/schemas/HistoryStatistics"
      }
    }
  }
};



/**
 * @openapi
 * tags:
 *   - name: Temperatura
 *     description: Registro e consulta de dados de temperatura coletados pelo ESP32
 */

/**
 * @openapi
 * /data/registertemp:
 *   post:
 *     summary: Registra uma nova leitura de temperatura
 *     description: >
 *       Registra uma nova leitura enviada por um dispositivo ESP32.
 *       O timestamp enviado é ignorado, pois o servidor utiliza a data/hora UTC atual.
 *     tags:
 *       - Temperatura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chipId
 *               - temp
 *             properties:
 *               chipId:
 *                 type: string
 *                 description: Identificador único do dispositivo (MAC ou ID lógico)
 *                 example: 4KCS03LSRF9
 *               temp:
 *                 type: number
 *                 description: Valor da temperatura em graus Celsius
 *                 example: 23.4
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: >
 *                   Data/hora da leitura (opcional). Caso enviado,
 *                   será ignorado e substituído pelo horário UTC do servidor.
 *                 example: 2026-01-30T14:32:00Z
 *     responses:
 *       201:
 *         description: Temperatura registrada com sucesso
 *       400:
 *         description: Dados obrigatórios não informados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Todos dados são necessários.
 *       401:
 *         description: Dispositivo não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dispositivo não autorizado.
 *       500:
 *         description: Erro interno do servidor
 */


/**
 * @openapi
 * /data/lastdata:
 *   get:
 *     summary: Retorna o último registro de temperatura
 *     description: >
 *       Retorna o registro mais recente de temperatura armazenado no banco de dados.
 *     tags:
 *       - Temperatura
 *     responses:
 *       200:
 *         description: Último registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lastRecord:
 *                   type: object
 *                   description: Registro mais recente de temperatura
 *       500:
 *         description: Erro ao coletar o último dado
 */


/**
 * @openapi
 * /data/history:
 *   get:
 *     summary: Consulta histórico de temperaturas
 *     description: >
 *       Retorna o histórico de temperaturas com base em um intervalo de datas.
 *       Pode ser consultado informando uma data específica (YYYY-MM-DD)
 *       ou um intervalo utilizando start e end em formato ISO UTC.
 *     tags:
 *       - Temperatura
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         description: Data específica para consulta (formato YYYY-MM-DD)
 *         schema:
 *           type: string
 *           example: 2026-01-30
 *       - in: query
 *         name: start
 *         required: false
 *         description: Data/hora inicial do intervalo (ISO UTC)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-01-30T00:00:00Z
 *       - in: query
 *         name: end
 *         required: false
 *         description: Data/hora final do intervalo (ISO UTC)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-01-30T23:59:59Z
 *     responses:
 *       200:
 *         description: Dados retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   description: Lista de registros encontrados
 *                   items:
 *                     type: object
 *                 statistics:
 *                   type: object
 *                   description: Estatísticas calculadas sobre os valores retornados
 *       400:
 *         description: Parâmetros de consulta inválidos ou ausentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Por favor, informe os parâmetros para consulta.
 *       500:
 *         description: Erro interno do servidor
 */
