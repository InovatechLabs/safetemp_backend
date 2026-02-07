export const usersSchemas = {
  RegisterUserInput: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: {
        type: "string",
        example: "João Silva",
      },
      email: {
        type: "string",
        format: "email",
        example: "joao@email.com",
      },
      password: {
        type: "string",
        format: "password",
        example: "Senha@123",
      },
    },
  },

  RegisterUserResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      newUser: {
        type: "object",
        properties: {
          id: {
            type: "number",
            example: 1,
          },
          name: {
            type: "string",
            example: "João Silva",
          },
          email: {
            type: "string",
            example: "joao@email.com",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-02-07T18:30:00Z",
          },
        },
      },
    },
  },

  LoginInput: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "joao@email.com",
      },
      password: {
        type: "string",
        format: "password",
        example: "Senha@123",
      },
      token2FA: {
        type: "string",
        example: "123456",
        description: "Código 2FA, obrigatório se o usuário tiver 2FA ativo",
      },
    },
  },

  LoginSuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      token: {
        type: "string",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },

  LoginRequires2FAResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Código 2FA necessário.",
      },
      requires2FA: {
        type: "boolean",
        example: true,
      },
      tempToken: {
        type: "string",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },
};
