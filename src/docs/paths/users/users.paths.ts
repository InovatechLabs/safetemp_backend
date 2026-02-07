export const usersPaths = {
  "/api/users/register": {
    post: {
      tags: ["Users"],
      summary: "Registrar novo usuário",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RegisterUserInput",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Usuário registrado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterUserResponse",
              },
            },
          },
        },
        400: { description: "Credenciais inválidas ou e-mail já cadastrado" },
        500: { description: "Erro interno do servidor" },
      },
    },
  },

  "/api/users/login": {
    post: {
      tags: ["Users"],
      summary: "Autenticar usuário",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/LoginInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login realizado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginSuccessResponse",
              },
            },
          },
        },
        206: {
          description: "2FA requerido para concluir o login",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequires2FAResponse",
              },
            },
          },
        },
        400: { description: "Senha incorreta ou erro de validação" },
        401: { description: "Credenciais ausentes ou inválidas" },
        404: { description: "Usuário não encontrado" },
        500: { description: "Erro interno do servidor" },
      },
    },
  },
};
