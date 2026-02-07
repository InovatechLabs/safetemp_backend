export const notificationsPaths = {
  "/api/notifications/list": {
    get: {
      tags: ["Notificações"],
      summary: "Listar notificações do usuário autenticado",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lista de notificações (máx. 30)",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NotificationListResponse",
              },
            },
          },
        },
        401: {
          description: "Usuário não autenticado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnauthorizedResponse",
              },
            },
          },
        },
        500: {
          description: "Erro ao buscar notificações",
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

  "/api/notifications/read": {
    patch: {
      tags: ["Notificações"],
      summary: "Marcar todas as notificações do usuário como lidas",
      security: [{ bearerAuth: [] }],
      responses: {
        204: {
          description: "Notificações marcadas como lidas com sucesso",
        },
        401: {
          description: "Usuário não autenticado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnauthorizedResponse",
              },
            },
          },
        },
        500: {
          description: "Erro ao atualizar notificações",
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
};
