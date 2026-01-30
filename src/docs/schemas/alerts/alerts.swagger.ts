export const alertsSchemas = {
  Alert: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 3,
      },
      user_id: {
        type: "integer",
        example: 1,
      },
      temperatura_min: {
        type: "number",
        nullable: true,
        example: 18,
      },
      temperatura_max: {
        type: "number",
        nullable: true,
        example: 30,
      },
      hora_inicio: {
        type: "string",
        format: "date-time",
        nullable: true,
        example: "2026-01-30T09:00:00Z",
      },
      hora_fim: {
        type: "string",
        format: "date-time",
        nullable: true,
        example: "2026-01-30T18:00:00Z",
      },
      ativo: {
        type: "boolean",
        example: true,
      },
      nome: {
        type: "string",
        nullable: true,
        example: "Experimento com Plantas",
      },
      nota: {
        type: "string",
        nullable: true,
        example: "Para verificar se a temperatura se mantém dentro do limite aceitável ",
      },
      criado_em: {
        type: "string",
        format: "date-time",
        example: "2026-01-29T13:45:00Z",
      },
    },
  },

  AlertListResponse: {
    type: "array",
    items: {
      $ref: "#/components/schemas/Alert",
    },
  },

  RegisterAlertInput: {
    type: "object",
    properties: {
      temperatura_min: {
        type: "number",
        example: 18,
      },
      temperatura_max: {
        type: "number",
        example: 30,
      },
      hora_inicio: {
        type: "string",
        example: "09:00",
      },
      hora_fim: {
        type: "string",
        example: "18:00",
      },
      nome: {
        type: "string",
        example: "Alerta principal",
      },
      nota: {
        type: "string",
        example: "Monitoramento durante o dia",
      },
    },
  },

  SaveTokenInput: {
    type: "object",
    required: ["expoPushToken"],
    properties: {
      expoPushToken: {
        type: "string",
        example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      },
    },
  },

  EditAlertNameInput: {
    type: "object",
    required: ["nome"],
    properties: {
      nome: {
        type: "string",
        example: "Novo nome do alerta",
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
