export const notificationsSchemas = {
  Notification: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 12,
      },
      user_id: {
        type: "integer",
        example: 1,
      },
      title: {
        type: "string",
        example: "Alerta de Temperatura",
      },
      body: {
        type: "string",
        example: "A temperatura ultrapassou o limite configurado.",
      },
      read: {
        type: "boolean",
        example: false,
      },
      sent_at: {
        type: "string",
        format: "date-time",
        example: "2026-01-30T14:20:00Z",
      },
    },
  },

  NotificationListResponse: {
    type: "array",
    items: {
      $ref: "#/components/schemas/Notification",
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        type: "string",
        example: "Erro ao buscar notificações.",
      },
    },
  },

  UnauthorizedResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Usuário não autenticado.",
      },
    },
  },
};