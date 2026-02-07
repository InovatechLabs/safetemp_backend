export const experimentosSchemas = {
  Experimento: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 5,
      },
      nome: {
        type: "string",
        example: "Experimento com Plantas",
      },
      objetivo: {
        type: "string",
        example: "Avaliar comportamento térmico em estufa",
      },
      temp_min_ideal: {
        type: "number",
        example: 18,
      },
      temp_max_ideal: {
        type: "number",
        example: 30,
      },
      ativo: {
        type: "boolean",
        example: true,
      },
      deviceId: {
        type: "string",
        example: "device-123",
      },
      data_inicio: {
        type: "string",
        format: "date-time",
        example: "2026-01-30T09:00:00Z",
      },
      data_fim: {
        type: "string",
        format: "date-time",
        nullable: true,
        example: "2026-01-30T18:00:00Z",
      },
      relatorio: {
        type: "string",
        nullable: true,
        example: "Relatório científico do experimento...",
      },
      responsavel: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          name: {
            type: "string",
            example: "João Silva",
          },
        },
      },
      dispositivo: {
        type: "object",
        nullable: true,
        properties: {
          mac_address: {
            type: "string",
            example: "AA:BB:CC:DD:EE:FF",
          },
        },
      },
    },
  },

  ExperimentoListResponse: {
    type: "array",
    items: {
      $ref: "#/components/schemas/Experimento",
    },
  },

  StartExperimentoInput: {
    type: "object",
    required: ["nome", "objetivo", "deviceId"],
    properties: {
      nome: {
        type: "string",
        example: "Experimento A",
      },
      objetivo: {
        type: "string",
        example: "Avaliar estabilidade térmica",
      },
      temp_min_ideal: {
        type: "number",
        example: 18,
      },
      temp_max_ideal: {
        type: "number",
        example: 30,
      },
      deviceId: {
        type: "string",
        example: "device-123",
      },
      data_fim: {
        type: "string",
        format: "date-time",
        nullable: true,
        example: "2026-02-01T18:00:00Z",
      },
    },
  },

  FinalizarExperimentoResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Experimento concluído e relatório gerado!",
      },
      relatorio: {
        type: "string",
        example: "Relatório científico do experimento...",
      },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        type: "string",
        example: "Erro interno do servidor",
      },
    },
  },

  MessageResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Operação realizada com sucesso.",
      },
    },
  },
};
