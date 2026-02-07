export const twoFASchemas = {
  Enable2FAResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Segredo gerado com sucesso.",
      },
      otpauth_url: {
        type: "string",
        example: "otpauth://totp/SafeTemp:user@email.com?secret=XXXX&issuer=SafeTemp",
      },
      secret: {
        type: "string",
        example: "JBSWY3DPEHPK3PXP",
      },
      backupCode: {
        type: "string",
        example: "A9F3K2L8",
      },
    },
  },

  Verify2FAInput: {
    type: "object",
    required: ["token2FA"],
    properties: {
      token2FA: {
        type: "string",
        example: "123456",
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

  VerifyLogin2FAInput: {
    type: "object",
    required: ["token2FA", "tempToken"],
    properties: {
      token2FA: {
        type: "string",
        example: "123456",
      },
      tempToken: {
        type: "string",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },

  VerifyLogin2FAResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Login bem-sucedido",
      },
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

  VerifyBackupCodeInput: {
    type: "object",
    required: ["backupCode"],
    properties: {
      backupCode: {
        type: "string",
        example: "A9F3K2L8",
      },
    },
  },

  VerifyBackupCodeResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Login bem-sucedido",
      },
      success: {
        type: "boolean",
        example: true,
      },
      fromBackupVerify: {
        type: "boolean",
        example: true,
      },
      token: {
        type: "string",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },

  GetBackupCodeResponse: {
    type: "object",
    properties: {
      backupCode: {
        type: "string",
        example: "A9F3K2L8",
      },
      is2FAEnabled: {
        type: "boolean",
        example: true,
      },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Erro interno do servidor",
      },
    },
  },
};
