export const twoFAPaths = {
  "/api/2fa/enable-2fa": {
    post: {
      tags: ["2FA"],
      summary: "Gerar segredo e QR Code para ativação do 2FA",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Segredo 2FA gerado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Enable2FAResponse",
              },
            },
          },
        },
        401: { description: "Usuário não autenticado" },
        404: { description: "Usuário não encontrado" },
        500: {
          description: "Erro ao ativar 2FA",
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

  "/api/2fa/verify-2fa": {
    post: {
      tags: ["2FA"],
      summary: "Confirmar ativação do 2FA",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Verify2FAInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "2FA configurado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: { description: "2FA não configurado ou token ausente" },
        401: { description: "Código 2FA inválido" },
        500: {
          description: "Erro ao validar 2FA",
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

  "/api/2fa/verify-login-code": {
    post: {
      tags: ["2FA"],
      summary: "Validar código 2FA durante login",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/VerifyLogin2FAInput",
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
                $ref: "#/components/schemas/VerifyLogin2FAResponse",
              },
            },
          },
        },
        401: { description: "Token temporário inválido ou código incorreto" },
        400: { description: "2FA não configurado" },
        500: {
          description: "Erro ao verificar código 2FA",
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

  "/api/2fa/verify-backup-code": {
    post: {
      tags: ["2FA"],
      summary: "Validar código de backup do 2FA",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/VerifyBackupCodeInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login realizado com código de backup",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/VerifyBackupCodeResponse",
              },
            },
          },
        },
        404: { description: "Código de backup inválido" },
        401: { description: "Usuário não autenticado" },
        500: {
          description: "Erro ao verificar backup code",
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

  "/api/2fa/disable-2fa": {
    patch: {
      tags: ["2FA"],
      summary: "Desativar autenticação em dois fatores",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Verify2FAInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "2FA desativado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: { description: "2FA não está ativado" },
        401: { description: "Código 2FA inválido" },
        404: { description: "Usuário não encontrado" },
        500: {
          description: "Erro ao desativar 2FA",
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

  "/api/2fa/get-backup-code": {
    get: {
      tags: ["2FA"],
      summary: "Obter código de backup do 2FA",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Código de backup retornado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GetBackupCodeResponse",
              },
            },
          },
        },
        400: { description: "2FA não está ativo ou código não gerado" },
        401: { description: "Não autorizado" },
        404: { description: "Usuário não encontrado" },
        500: {
          description: "Erro ao buscar código de backup",
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
