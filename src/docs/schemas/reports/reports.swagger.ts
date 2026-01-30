export const reportsSchemas = {
  Report: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 12,
      },
      criado_em: {
        type: "string",
        format: "date-time",
        example: "2026-01-30T10:15:00Z",
      },
      resumo: {
        type: "string",
        description: "Resumo estatístico serializado em JSON",
        example:
          '{"media":26.4,"min":22.1,"max":31.8,"std":1.9,"registros":243}',
      },
      relatorio: {
        type: "string",
        example: "O presente relatório apresenta os dados coletados no intervalo..."
      },
      data: {
        type: "string",
        example: "2026-01-30T21:00:02.456Z"
      },
    },
  },

  ReportsListResponse: {
    type: "array",
    items: {
      $ref: "#/components/schemas/Report",
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        type: "string",
        example: "Erro interno do servidor",
      },
      message: {
        type: "string",
        example: "Relatório não encontrado",
      },
    },
  },
};
