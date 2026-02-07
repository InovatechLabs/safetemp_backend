# ⏲️ Documentação de Schedulers

Os Schedulers são responsáveis por executar tarefas automáticas baseadas em tempo (Cron Jobs), permitindo que o SafeTemp realize monitoramentos e gere documentos sem intervenção humana.

## Report Scheduler (`reportScheduler.ts`)

Este scheduler gerencia o ciclo de vida da geração de relatórios automáticos, consolidando dados brutos em análises científicas inteligentes.

### Definição do Job
- **Frequência:** Configurado para rodar a cada hora (`cron.schedule("0 * * * *", generateReports)`).
- **Dependências:** - `DataService`: Para extração de dados da última hora.
  - `Python API`: Para processamento de linguagem natural (IA).
  - `Prisma`: Para persistência do relatório gerado.

### Fluxo de Execução

O método principal `generateReports()` segue os seguintes passos:

1. **Recuperação de Dados:** Chama o `getLastHourData()` do `DataService`. Se não houver registros de temperatura no último período de 60 minutos, o job é interrompido para evitar relatórios vazios.
2. **Integração com Microserviço:** Envia o array de registros e as estatísticas pré-calculadas para o endpoint `/gerar-report` da API Python.
3. **Validação de Resposta:** Verifica a integridade da comunicação com o microserviço. Em caso de erro na API Python, uma exceção é lançada e registrada nos logs do servidor.
4. **Persistência de Dados:**
   - Cria um novo registro na tabela `Relatorios`.
   - Armazena o conteúdo textual da IA, o JSON de estatísticas resumidas e o `chipId` de origem.
5. **Log de Auditoria:** Registra no console o sucesso da operação, incluindo o ID do relatório criado.

### Tratamento de Erros e Segurança
- **Variáveis de Ambiente:** O scheduler valida obrigatoriamente a existência de `PYTHON_API_URL` e `BACKEND_URL` ao iniciar. Se ausentes, o sistema impede a execução para evitar falhas silenciosas.
- **Resiliência:** O uso de blocos `try/catch` garante que falhas pontuais na rede ou na API de IA não derrubem o servidor principal, apenas registrando o erro para manutenção.

### Exemplo de Configuração (no `index.ts`)
```typescript
import { generateReports } from './scheduler/reportScheduler';
import cron from 'node-cron';

// Agendamento para cada hora cheia
cron.schedule('0 * * * *', () => {
    console.log('[CRON] Iniciando rotina de relatórios...');
    generateReports();
});
```
