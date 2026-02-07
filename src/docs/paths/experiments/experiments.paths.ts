export const experimentosPaths = {
  "/api/experiments/start": {
    post: {
      tags: ["Experimentos"],
      summary: "Iniciar um novo experimento",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/StartExperimentoInput",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Experimento iniciado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Experimento",
              },
            },
          },
        },
        400: { description: "Usuário não autenticado" },
        500: {
          description: "Erro ao iniciar o experimento",
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

  "/api/experiments/end/{id}": {
    patch: {
      tags: ["Experimentos"],
      summary: "Finalizar experimento ativo e gerar relatório",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
            example: 5,
          },
        },
      ],
      responses: {
        200: {
          description: "Experimento finalizado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FinalizarExperimentoResponse",
              },
            },
          },
        },
        404: { description: "Experimento não encontrado" },
        500: {
          description: "Erro ao processar laudo científico",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/experiments/active/{mac_address}": {
    get: {
      tags: ["Experimentos"],
      summary: "Buscar experimento ativo por dispositivo",
      parameters: [
        {
          name: "mac_address",
          in: "path",
          required: true,
          schema: {
            type: "string",
            example: "AA:BB:CC:DD:EE:FF",
          },
        },
      ],
      responses: {
        200: {
          description: "Experimento ativo encontrado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Experimento",
              },
            },
          },
        },
        500: {
          description: "Erro ao buscar experimento",
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

  "/api/experiments/list": {
    get: {
      tags: ["Experimentos"],
      summary: "Listar experimentos públicos finalizados",
      responses: {
        200: {
          description: "Lista de experimentos",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExperimentoListResponse",
              },
            },
          },
        },
        500: {
          description: "Erro ao carregar repositório",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/experiments/per-day": {
    get: {
      tags: ["Experimentos"],
      summary: "Buscar experimentos por data",
      parameters: [
        {
          name: "data",
          in: "query",
          required: true,
          schema: {
            type: "string",
            example: "2026-01-30",
          },
        },
      ],
      responses: {
        200: {
          description: "Lista de experimentos encontrados",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExperimentoListResponse",
              },
            },
          },
        },
        400: { description: "Data inválida ou ausente" },
        404: { description: "Nenhum experimento encontrado" },
        500: {
          description: "Erro interno do servidor",
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

  "/api/experiments/today": {
    get: {
      tags: ["Experimentos"],
      summary: "Listar experimentos iniciados hoje",
      responses: {
        200: {
          description: "Lista de experimentos de hoje",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExperimentoListResponse",
              },
            },
          },
        },
        404: { description: "Nenhum experimento encontrado hoje" },
        500: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
      },
    },
  },
};
