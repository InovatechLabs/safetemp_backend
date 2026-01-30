export const reportsPaths = {
  "/api/reports/list": {
    get: {
      tags: ["Relatórios"],
      summary: "Lista todos os relatórios",
      responses: {
        200: {
          description: "Lista de relatórios",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReportsListResponse",
              },
            },
          },
        },
        500: {
          description: "Erro interno",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/reports/today": {
    get: {
      tags: ["Relatórios"],
      summary: "Lista relatórios gerados hoje",
      responses: {
        200: {
          description: "Relatórios de hoje",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReportsListResponse",
              },
            },
          },
        },
        500: {
          description: "Erro interno",
        },
      },
    },
  },

  "/api/reports/per-day": {
    get: {
      tags: ["Relatórios"],
      summary: "Lista relatórios por data",
      parameters: [
        {
          name: "data",
          in: "query",
          required: true,
          description: "Data no formato YYYY-MM-DD",
          schema: {
            type: "string",
            example: "2026-01-30",
          },
        },
      ],
      responses: {
        200: {
          description: "Relatórios da data informada",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReportsListResponse",
              },
            },
          },
        },
        400: {
          description: "Data inválida",
        },
        500: {
          description: "Erro interno",
        },
      },
    },
  },

  "/api/reports/interval": {
    get: {
      tags: ["Relatórios"],
      summary: "Lista relatórios por intervalo de datas",
      parameters: [
        {
          name: "inicio",
          in: "query",
          required: true,
          schema: { type: "string", example: "2026-01-25" },
        },
        {
          name: "fim",
          in: "query",
          required: true,
          schema: { type: "string", example: "2026-01-30" },
        },
      ],
      responses: {
        200: {
          description: "Relatórios do intervalo",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReportsListResponse",
              },
            },
          },
        },
        400: {
          description: "Datas inválidas",
        },
        500: {
          description: "Erro interno",
        },
      },
    },
  },

  "/api/reports/reportpdf/{id}": {
    get: {
      tags: ["Relatórios"],
      summary: "Exporta relatório em PDF",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
            example: 12,
          },
        },
      ],
      responses: {
        200: {
          description: "PDF do relatório",
          content: {
            "application/pdf": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        400: {
          description: "ID inválido",
        },
        404: {
          description: "Relatório não encontrado",
        },
        500: {
          description: "Erro ao gerar PDF",
        },
      },
    },
  },
};
