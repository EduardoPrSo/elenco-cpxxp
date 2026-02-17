# Sistema de Formulários com Discord Auth

Sistema completo de formulários com autenticação Discord, controle de acesso por roles e armazenamento em NeonDB (PostgreSQL).

## 🚀 Funcionalidades

- ✅ Autenticação via Discord (OAuth)
- ✅ Sistema de permissões (USER, READER, ADMIN)
- ✅ Formulários dinâmicos configuráveis
- ✅ Suporte a múltiplos tipos de campo (texto, textarea, radio, checkbox, select)
- ✅ Painel administrativo para gerenciar usuários e perguntas
- ✅ Visualização de respostas (apenas READER e ADMIN)
- ✅ Banco de dados PostgreSQL (NeonDB)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Discord Developers](https://discord.com/developers/applications)
- Conta no [NeonDB](https://neon.tech)

## 🔧 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Discord OAuth

1. Acesse [Discord Developers](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá em **OAuth2** > **General**
4. Adicione a redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copie o **Client ID** e **Client Secret**

### 3. Configurar NeonDB

1. Acesse [NeonDB](https://neon.tech) e crie uma conta
2. Crie um novo projeto
3. Copie a **Connection String** (PostgreSQL)

### 4. Configurar variáveis de ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# Database - Cole sua connection string do NeonDB
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth - Gere um secret seguro
NEXTAUTH_SECRET="cole-aqui-um-secret-aleatorio-seguro"
NEXTAUTH_URL="http://localhost:3000"

# Discord OAuth
DISCORD_CLIENT_ID="seu-client-id-do-discord"
DISCORD_CLIENT_SECRET="seu-client-secret-do-discord"

# Admin Discord IDs (separados por vírgula)
ADMIN_DISCORD_IDS="seu-discord-id-aqui"
```

**Para gerar o NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Para obter seu Discord ID:**
1. Ative o modo desenvolvedor no Discord (Configurações > Avançado > Modo Desenvolvedor)
2. Clique com botão direito no seu nome e selecione "Copiar ID"

### 5. Configurar o banco de dados

Execute as migrations do Prisma:

```bash
npx prisma migrate dev --name init
```

Gere o Prisma Client:

```bash
npx prisma generate
```

### 6. Executar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📚 Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # Rotas de autenticação
│   │   ├── admin/
│   │   │   ├── users/              # Gerenciar usuários
│   │   │   └── questions/          # Gerenciar perguntas
│   │   └── form/
│   │       ├── submit/             # Enviar respostas
│   │       └── responses/          # Ver respostas
│   ├── admin/                      # Página de admin
│   ├── dashboard/                  # Dashboard principal
│   ├── formulario/                 # Página do formulário
│   ├── respostas/                  # Visualizar respostas
│   └── login/                      # Página de login
├── components/
│   └── Navigation.tsx              # Componente de navegação
├── lib/
│   ├── auth.ts                     # Configuração NextAuth
│   ├── auth-utils.ts               # Utilitários de autenticação
│   └── prisma.ts                   # Cliente Prisma
├── prisma/
│   └── schema.prisma               # Schema do banco
└── types/
    └── next-auth.d.ts              # Tipos TypeScript
```

## 👥 Roles e Permissões

### USER (Padrão)
- Preencher formulário
- Ver próprias respostas

### READER
- Todas as permissões de USER
- Visualizar respostas de todos os usuários

### ADMIN
- Todas as permissões de READER
- Gerenciar usuários (alterar roles)
- Gerenciar perguntas do formulário
- Adicionar, editar e remover perguntas
- Configurar tipos de campo

## 🎨 Tipos de Campo Suportados

- **TEXT**: Campo de texto curto
- **TEXTAREA**: Campo de texto longo (múltiplas linhas)
- **RADIO**: Múltipla escolha (seleciona uma opção)
- **CHECKBOX**: Múltipla escolha (seleciona várias opções)
- **SELECT**: Lista suspensa

## 🔐 Segurança

- Autenticação via OAuth2 (Discord)
- Verificação de permissões em todas as rotas API
- Proteção de rotas sensíveis
- Validação de dados no servidor
- SQL Injection protection via Prisma
- CSRF protection via NextAuth

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start

# Abrir Prisma Studio (GUI do banco)
npx prisma studio

# Reset do banco de dados
npx prisma migrate reset

# Criar nova migration
npx prisma migrate dev --name nome_da_migration
```

## 📝 Como Usar

### Para Usuários Normais
1. Faça login com Discord
2. Acesse a aba "Formulário"
3. Preencha as respostas
4. Clique em "Enviar Respostas"

### Para Leitores
1. Faça login com Discord
2. Acesse a aba "Respostas" para ver todas as submissões

### Para Administradores
1. Faça login com Discord
2. Acesse a aba "Admin"
3. Gerencie usuários:
   - Altere roles de USER para READER ou vice-versa
4. Gerencie perguntas:
   - Adicione novas perguntas
   - Edite perguntas existentes
   - Configure tipos de campo
   - Adicione opções para múltipla escolha

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js 14+:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📄 Licença

MIT

