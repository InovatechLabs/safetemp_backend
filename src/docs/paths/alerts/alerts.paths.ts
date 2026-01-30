export const alertsPaths = {
  "/api/alerts/register-alert": {
    post: {
      tags: ["Alertas"],
      summary: "Cadastrar novo alerta de temperatura",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RegisterAlertInput",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Alerta criado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Alert",
              },
            },
          },
        },
        400: { description: "Dados inválidos" },
        401: { description: "Usuário não autenticado" },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/alerts/save-token": {
    post: {
      tags: ["Alertas"],
      summary: "Salvar token de push do usuário",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SaveTokenInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Token salvo com sucesso",
        },
        400: { description: "Token ausente" },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/alerts/list": {
    get: {
      tags: ["Alertas"],
      summary: "Listar alertas do usuário autenticado",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lista de alertas",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AlertListResponse",
              },
            },
          },
        },
        401: { description: "Usuário não autenticado" },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/alerts/listall": {
    get: {
      tags: ["Alertas"],
      summary: "Listar todos os alertas (admin/debug)",
      responses: {
        200: {
          description: "Lista completa de alertas",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AlertListResponse",
              },
            },
          },
        },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/alerts/delete/{id}": {
    delete: {
      tags: ["Alertas"],
      summary: "Excluir alerta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", example: 3 },
        },
      ],
      responses: {
        200: {
          description: "Alerta excluído",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        404: { description: "Alerta não encontrado" },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/alerts/disable/{id}": {
    patch: {
      tags: ["Alertas"],
      summary: "Desativar alerta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", example: 3 },
        },
      ],
      responses: {
        200: {
          description: "Alerta desativado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        404: { description: "Alerta não encontrado" },
      },
    },
  },

  "/api/alerts/enable/{id}": {
    patch: {
      tags: ["Alertas"],
      summary: "Ativar alerta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", example: 3 },
        },
      ],
      responses: {
        200: {
          description: "Alerta ativado",
        },
        404: { description: "Alerta não encontrado" },
      },
    },
  },

  "/api/alerts/editname/{id}": {
    patch: {
      tags: ["Alertas"],
      summary: "Editar nome do alerta",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", example: 3 },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/EditAlertNameInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Nome atualizado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: { description: "Nome inválido" },
        404: { description: "Alerta não encontrado" },
      },
    },
  },
};
