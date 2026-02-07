# 🛡️ Documentação de Middlewares

Os Middlewares funcionam como camadas de interceptação nas requisições HTTP, garantindo que as regras de segurança e integridade sejam aplicadas antes que a requisição chegue aos Controllers.

## Auth Middleware (`auth.ts`)

Responsável por validar a identidade do usuário através de tokens de acesso, protegendo rotas que exigem autenticação.

### Funcionamento Geral

O middleware intercepta a requisição, extrai o token do cabeçalho `Authorization` e verifica sua validade utilizando a biblioteca `jsonwebtoken` e a chave secreta definida no ambiente (`JWT_SECRET`).

### Componentes Técnicos

#### Interface `AuthenticatedRequest`
Estende a interface `Request` padrão do Express para incluir o objeto `user`.
- **Propriedade:** `user?: { id: number }`
- **Objetivo:** Permitir que os controllers subsequentes saibam qual usuário está realizando a operação sem precisar decodificar o token novamente.

#### Função `authenticate`
O método principal que valida o fluxo de acesso.

1. **Extração do Header:** Verifica a presença do cabeçalho `Authorization`. É obrigatório que o token siga o padrão **Bearer Schema** (`Bearer <token>`).
2. **Decodificação:** Utiliza `jwt.verify()` para transformar a string criptografada em um objeto contendo o ID do usuário.
3. **Injeção de Contexto:** Caso o token seja válido, o ID decodificado é anexado ao objeto `req.user`.
4. **Continuidade:** Chama a função `next()` para permitir que a requisição prossiga para a próxima etapa (outro middleware ou controller).

### Tratamento de Erros

O middleware possui um tratamento granular para diferentes falhas de autenticação, retornando sempre o status **401 (Unauthorized)**:

| Erro Detectado | Mensagem de Resposta | Causa Provável |
| :--- | :--- | :--- |
| Ausência de Header | "Token não fornecido ou malformado" | Usuário não enviou o cabeçalho Authorization. |
| `TokenExpiredError` | "Token expirado." | O tempo de vida do JWT (exp) foi atingido. |
| `JsonWebTokenError` | "Token inválido." | Assinatura corrompida ou chave secreta incorreta. |
| Usuário Inexistente | "Usuário não encontrado." | O ID contido no token não é válido. |

### Exemplo de Uso nas Rotas
```typescript
import { authenticate } from '../middlewares/auth';
import { Router } from 'express';

const router = Router();

// Esta rota agora está protegida
router.get('/perfil', authenticate, (req, res) => {
    // req.user.id está disponível aqui
});
```
