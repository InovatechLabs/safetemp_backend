# 🛠️ Documentação de Services

Os Services contêm a lógica de negócio central do SafeTemp, isolando o processamento de dados dos Controllers e Schedulers.

## AlertService (`alertService.ts`)

Responsável por monitorar as variações de temperatura e gerenciar o ciclo de vida das notificações enviadas aos usuários.

### Métodos Principais

#### `verificarAlertas()`
Função central orquestradora que realiza a varredura de limites térmicos.

- **Fluxo de Operação:**
  1. **Coleta de Dados:** Busca o registro de temperatura mais recente no banco de dados.
  2. **Filtragem de Alertas:** Recupera todos os alertas ativos (`ativo: true`) que estejam dentro da janela horária permitida (`hora_inicio` e `hora_fim`).
  3. **Validação de Limite:** Compara a temperatura atual com os limites `temperatura_min` e `temperatura_max` de cada alerta.
  4. **Gerenciamento de Estado (Debounce):** Utiliza a flag `notificacaoAtiva` para evitar o envio repetitivo de mensagens enquanto a temperatura permanecer fora do limite.
  5. **Notificação em Lote:** Dispara notificações Push via Expo SDK para os tokens cadastrados.
  6. **Persistência de Histórico:** Registra cada ocorrência na tabela `Notification` para consulta futura no App.

- **Tecnologias Utilizadas:** - `expo-server-sdk` para mensageria.
  - `PrismaClient` para operações atômicas e consultas complexas.

### Regras de Negócio Importantes
- **Normalização:** O serviço detecta automaticamente quando a temperatura retorna à faixa ideal e envia uma notificação de "Temperatura Normalizada", resetando o estado do alerta no banco de dados.
- **Tratamento de Erros:** Possui blocos `try/catch` independentes para o envio de mensagens, atualizações de DB e registro de histórico, garantindo que uma falha no envio do push não interrompa a persistência dos dados.


## DataService (`dataService.ts`)

O `DataService` é responsável pela extração e processamento estatístico primário dos dados brutos coletados pelos sensores.

### Métodos Principais

#### `getLastHourData()`
Extrai o conjunto de dados referente à última hora de operação para alimentação de relatórios automáticos.

- **Fluxo de Operação:**
  1. **Cálculo de Janela:** Define dinamicamente o intervalo de tempo entre o momento atual e exatos 60 minutos atrás.
  2. **Query de Séries Temporais:** Realiza uma busca no banco de dados filtrando por `timestamp` dentro da janela calculada, ordenando do registro mais antigo para o mais recente.
  3. **Processamento Estatístico:** Isola os valores numéricos e aciona a utilitária `calcStats` para gerar métricas como média, desvios e variância.
- **Retorno:** Entrega um objeto contendo o array completo de `records` e o objeto `statistics` processado.

---

## ReportService (`reportService.ts`)

Responsável pela camada de exportação e materialização dos dados em documentos oficiais (PDF).

### Métodos Principais

#### `generateReportPDF(report)`
Transforma dados JSON e análises de IA em um documento PDF formatado e pronto para compartilhamento.

- **Fluxo de Operação:**
  1. **Inicialização do Motor:** Lança uma instância do `Puppeteer` em modo *headless* (sem interface gráfica) com otimizações de performance para ambientes de servidor (desativação de GPU e sandbox).
  2. **Injeção de Template:** Carrega o `reportTemplate`, injetando os dados do relatório no esqueleto HTML/CSS.
  3. **Renderização de DOM:** Define o conteúdo da página e aguarda o carregamento completo dos estilos (`domcontentloaded`).
  4. **Materialização em PDF:** Gera o binário do arquivo utilizando o padrão A4 com suporte a cores e fundos (printBackground).
  5. **Gestão de Recursos:** Garante o encerramento do processo do navegador no bloco `finally`, prevenindo vazamentos de memória no servidor.

### Dependências Técnicas
- **Puppeteer:** Utilizado para a conversão de alta fidelidade de HTML para PDF.
- **ReportTemplate:** Utilitário que padroniza a identidade visual científica do SafeTemp em todos os documentos gerados.
