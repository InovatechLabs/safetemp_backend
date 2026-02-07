# 🌡️ SafeTemp API

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Groq](https://img.shields.io/badge/IA_Groq-f55036?style=for-the-badge&logo=openai&logoColor=white)

## 📌 Visão Geral

O **SafeTemp** foi concebido para mitigar um problema crítico na **FATEC Jacareí**: a perda de dados experimentais em estufas devido a falhas de energia ou instabilidades ambientais. 

O projeto evoluiu de um simples monitor para um ecossistema completo de gestão térmica científica, garantindo integridade de dados e análises inteligentes via IA.

---

## 🚀 Funcionalidades Principais

- [x] **Persistência Contínua:** Registro de dados em tempo real com tolerância a falhas.
- [x] **Monitoramento Remoto:** Acesso via Mobile App (React Native).
- [x] **Inteligência Artificial:** Geração de laudos e comparativos automáticos via LLM (Groq/Llama 3).
- [x] **Segurança Avançada:** Autenticação JWT com suporte a **2FA (Two-Factor Authentication)**.
- [x] **Alertas Inteligentes:** Notificações Push baseadas em regras configuráveis de temperatura.
- [x] **Jobs de Background:** Schedulers para relatórios periódicos e limpeza de sistema.

---

## 🏗️ Arquitetura do Sistema

O sistema opera em uma estrutura de três camadas interdependentes:

1.  **Camada IoT:** Hardware baseado em **ESP32** para coleta e envio de telemetria.
2.  **Core API (Node.js):** Orquestrador principal (auth, persistência, regras de negócio).
3.  **IA Service (Python):** Microserviço especializado em processamento de linguagem natural e estatística avançada.
4.  **Client (Mobile):** Interface de usuário para gerenciamento e visualização.

> **Nota de Comunicação:** Toda a troca de dados entre camadas é realizada via protocolos **REST/HTTP**.

---

## 🛠️ Stack Tecnológica

### Backend & Persistência
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **ORM:** Prisma
- **Banco de Dados:** PostgreSQL (Hospedado via Supabase)
- **Documentação:** Swagger / OpenAPI

### Serviço de Inteligência (IA)
- **Linguagem:** Python 3.x
- **Framework:** FastAPI
- **Modelos LLM:** Groq (Llama 3.3 70B)

---

## 📂 Estrutura do Projeto

```bash
.
├── arduino/              # Firmware C++ para ESP32
├── prisma/               # Schema e Migrations do banco
├── src/
│   ├── controllers/      # Lógica de entrada das rotas
│   ├── docs/             # Documentação conceitual extra
│   ├── jobs/             # Schedulers (node-cron)
│   ├── middlewares/      # Auth e Validações
│   ├── services/         # Regras de negócio e integrações (Python API)
│   ├── utils/            # Helpers e formatadores
│   ├── index.ts          # Entry point da aplicação
│   └── swagger.ts        # Configuração da Doc de rotas
└── README.md
```

## 📘 Documentação da API

O SafeTemp utiliza **Swagger/OpenAPI** para documentar e facilitar os testes das rotas HTTP.

- **Interface Swagger:** Disponível em `GET /api/docs` quando o servidor está rodando.

> **⚠️ Observação:** O Swagger cobre os endpoints REST. Para detalhes sobre a lógica interna de **Services, Middlewares, Jobs e Schedulers**, consulte a documentação conceitual em `/src/documentation` (em constante atualização).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (Versão LTS recomendada)
- **npm** ou **yarn**
- Instância de banco de dados **PostgreSQL** (ou conta no Supabase)

## Instalação

### Clone o repositório
```bash
git clone https://github.com/InovatechLabs/safetemp_backend.git
```

### Instale as dependências do projeto
```bash
npm install
```

### Configure o .env local seguindo o arquivo .env.example
```bash
DATABASE_URL=string_de_conexao
PORT=3000
BACKEND_URL=http://localhost:3000
PYTHON_API_URL=url_para_servico_python
JWT_SECRET=jwt_secret
JWT_TEMP_SECRET=jwt_temp_secret
```
### Execução
```bash
ts-node src/index.ts (supondo que você esteja na raiz do projeto ao executar o comando)
```
