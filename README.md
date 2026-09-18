# 💰 Fluxo de Caixa & Gestão Financeira com Painel Administrativo (SaaS)

Sistema web completo, moderno e responsivo para **Controle Financeiro Pessoal / Empresarial** e **Painel Administrativo Master (RBAC Multi-Tenant)**. Desenvolvido com arquitetura desacoplada, backend seguro, tipagem estrita com TypeScript e banco de dados relacional.

---

## 🚀 Tecnologias Utilizadas

### **Frontend**
- **React 18** com **TypeScript** e **Vite** (build ultrarrápido).
- **Tailwind CSS** para estilização moderna, limpa e responsiva (Desktop, Tablet e Mobile).
- **Lucide React** para ícones modernos e consistentes.
- **Chart.js** & **React-Chartjs-2** para gráficos interativos (Donut, Linhas, Barras).
- **React Router Dom v6** para roteamento SPA protegido por guardas de acesso.

### **Backend**
- **Node.js** com **Express** e **TypeScript**.
- **Prisma ORM** para modelagem relacional de dados e migrations.
- **SQLite** como banco de dados embutido (fácil portabilidade para PostgreSQL ou MySQL).
- **Zod** para validação robusta de esquemas e payloads.
- **JWT (JSON Web Token)** & **Bcrypt.js** para autenticação criptografada e controle de sessões.
- **ExcelJS** & **PDFKit** para exportação de relatórios profissionais em `.xlsx`, `.csv` e `.pdf`.

---

## 🌟 Funcionalidades Principais

### 1. Módulo Financeiro Pessoal & Empresarial
- 📊 **Dashboard Completo:** Saldo atual, saldo previsto, total de entradas/saídas, valores a receber e contas pendentes/vencidas em tempo real.
- 📉 **6 Gráficos Interativos:** Entradas vs Saídas mensais, gastos por categoria (donut), evolução do saldo, fixos vs variáveis, pagos vs pendentes e distribuição de recebíveis.
- 💸 **Lançamentos Financeiros:** CRUD completo com filtros dinâmicos por período, tipo, categoria, status e forma de pagamento (PIX, Cartão, Boleto, etc.).
- 🔴 **Contas a Pagar:** Gestão de compromissos com liquidação em 1 clique e alertas automáticos de vencimento.
- 🟢 **Contas a Receber:** Controle de devedores e valores futuros com baixa e sincronização automática com o saldo de caixa.
- 🔄 **Gastos Fixos & Recorrentes:** Automação de contas mensais e gerador de lançamentos em lote com 1 clique.
- 🛒 **Gastos Variáveis:** Controle detalhado do consumo diário com cálculo automático de ticket médio.
- 📅 **Calendário Financeiro:** Visão mensal interativa estilo grade com marcação visual de vencimentos e recebimentos.
- 📑 **Relatórios & Exportação:** Análise inteligente de fluxo de caixa, comparativo com mês anterior e exportação para Excel (`.xlsx`), CSV e PDF.

### 2. Painel Administrativo Master (Enterprise RBAC)
- 🛡️ **Controle de Acessos Baseado em Papéis (RBAC):** Níveis `SUPER_ADMIN`, `ADMIN`, `CLIENT_ADMIN` e `USER`.
- 👥 **Gestão de Usuários:** Listagem com filtros por status, perfil, empresa vinculada e último login (hoje, 7d, 30d, inativos há +30d ou nunca acessaram).
- 🔒 **Segurança Ativa:** Bloqueio imediato com justificativa, redefinição segura de senhas temporárias e encerramento forçado de sessões.
- 🏢 **Multi-Empresas (Clientes):** Vínculo de usuários por empresa com bloqueio em cascata (ao suspender uma empresa, todos os seus usuários perdem o acesso na hora).
- 📜 **Logs de Auditoria Imutáveis:** Rastreabilidade completa de quem executou cada ação administrativa, horário, IP de origem e payload formatado em JSON.
- 🌐 **Sessões em Tempo Real:** Monitoramento de conexões ativas com opção de derrubar sessão específica ou todas as sessões de um usuário.
- ✉️ **Sistema de Convites:** Emissão de tokens de ativação para colaboradores cadastrarem suas próprias senhas via link seguro (`/convite/:token`).

---

## 📋 Pré-requisitos

Para rodar o projeto localmente, você precisa ter instalado:
- **Node.js** (versão 18 ou superior - recomendado v20+)
- **npm** (incluso com o Node.js) ou **yarn**
- **Git**

---

## 💻 Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/p3ruan0/controle-financeiro.git
cd controle-financeiro
```

### 2. Instalar as Dependências
Instale as dependências do backend e do frontend:

```bash
# Na pasta raiz do projeto:
npm run install:all

# Ou manualmente em cada pasta:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo de variáveis de ambiente no backend:

```bash
# Windows (PowerShell):
Copy-Item backend/.env.example backend/.env

# Linux / Mac:
cp backend/.env.example backend/.env
```

O arquivo `backend/.env` conterá as configurações padrão:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-jwt-super-segura-aqui"
```

### 4. Inicializar o Banco de Dados
Gere os modelos do Prisma e crie o banco de dados relacional:

```bash
cd backend
npx prisma db push
```

*(Opcional)* Crie o usuário administrador master inicial executando o seed:
```bash
node dist/seed-admin.js
# ou usando ts-node:
npx ts-node src/seed-admin.ts
```

### 5. Iniciar a Aplicação

#### **Opção A: Modo Produção Unificado (Recomendado)**
Compila o frontend e roda a aplicação completa e a API na porta `5000`:
```bash
# 1. Compilar frontend e backend
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

# 2. Iniciar o servidor unificado
cd backend
npm run start
```
Acesse no seu navegador: **`http://localhost:5000`**

#### **Opção B: Modo Desenvolvimento (Hot Reload)**
Execute os dois serviços em terminais separados:

- **Terminal 1 (Backend):**
  ```bash
  cd backend
  npm run dev
  ```
  *API rodando em `http://localhost:5000`*

- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```
  *Interface rodando em `http://localhost:5173` (com proxy automático para a porta 5000)*

---

## 🔑 Credenciais Padrão do Administrador Master

Ao rodar o seed do banco de dados, a seguinte conta com privilégios totais de `SUPER_ADMIN` é configurada:

- **URL de Acesso:** `http://localhost:5000/login`
- **E-mail:** `admin@fluxocaixa.com`
- **Senha:** `Admin@123456`

---

## 📁 Estrutura de Pastas do Projeto

```text
controle-financeiro/
├── .env.example               # Modelo de variáveis de ambiente
├── .gitignore                 # Regras de exclusão do controle de versão
├── README.md                  # Documentação completa do projeto
├── package.json               # Scripts auxiliares na raiz
│
├── backend/                   # API REST em Node.js + TypeScript
│   ├── .env.example           # Exemplo de configuração local do backend
│   ├── package.json           # Dependências do backend (Express, Prisma, Zod, etc.)
│   ├── tsconfig.json          # Configuração do TypeScript no backend
│   ├── prisma/
│   │   └── schema.prisma      # Esquema relacional das tabelas (Users, Transactions, Audit, etc.)
│   └── src/
│       ├── controllers/       # Regras de negócio (auth, admin, financeiro, relatórios)
│       ├── middleware/        # Autenticação JWT e RBAC (requireAdmin, requireSuperAdmin)
│       ├── routes/            # Definição das rotas REST (/api/...)
│       ├── utils/             # Formatadores, auditoria e geradores
│       ├── seed-admin.ts      # Script de inicialização do Super Admin
│       └── server.ts          # Inicialização do Express e static serving do frontend
│
└── frontend/                  # Aplicação Single Page Application (SPA) em React
    ├── index.html             # Ponto de entrada HTML
    ├── package.json           # Dependências do frontend (React, Tailwind, Lucide, Chart.js)
    ├── vite.config.ts         # Configuração do Vite e proxy reverso
    ├── tailwind.config.js     # Configuração do Tailwind CSS
    └── src/
        ├── components/        # Componentes compartilhados (Sidebar, Header, Modals)
        ├── contexts/          # Contexto de autenticação e sessão do usuário (AuthContext)
        ├── pages/             # Telas da aplicação (Dashboard, Lançamentos, etc.)
        │   ├── admin/         # Módulo exclusivo de Administração Master
        │   │   ├── AdminDashboard.tsx
        │   │   ├── AdminUsers.tsx
        │   │   ├── AdminCompanies.tsx
        │   │   ├── AdminAuditLogs.tsx
        │   │   ├── AdminSessions.tsx
        │   │   └── AdminInvitations.tsx
        │   └── AcceptInvitation.tsx  # Tela pública de ativação de convite
        ├── services/          # Cliente HTTP Axios configurado com interceptores
        ├── types.ts           # Definição de tipos e interfaces TypeScript
        └── utils/             # Formatadores monetários em R$ e datas brasileiras
```

---

## 🛡️ Boas Práticas & Segurança

1. **Nunca comite arquivos `.env`:** As credenciais e chaves JWT devem permanecer sempre locais ou em variáveis de ambiente do provedor de hospedagem.
2. **Soft Delete:** A exclusão de usuários na plataforma é lógica (`deletedAt`), garantindo que o histórico de movimentações financeiras e os logs de auditoria nunca fiquem órfãos.
3. **Senhas Criptografadas:** As senhas são protegidas com salt e hash via `bcrypt` (fator 10). Nenhuma senha em texto puro é armazenada ou exibida para administradores.

---

## 📄 Licença

Este projeto está sob a licença ISC. Desenvolvido para controle e gestão financeira com alto padrão de qualidade e escalabilidade.
