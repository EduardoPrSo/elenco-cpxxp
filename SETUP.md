# 🚀 Guia Rápido de Configuração

## Passos essenciais para colocar o projeto funcionando:

### 1. Configure o arquivo .env

Edite o arquivo `.env` na raiz do projeto com suas credenciais:

```env
DATABASE_URL="sua-connection-string-do-neondb"
NEXTAUTH_SECRET="gere-um-secret-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
DISCORD_CLIENT_ID="seu-client-id"
DISCORD_CLIENT_SECRET="seu-client-secret"
ADMIN_DISCORD_IDS="seu-discord-id"
```

### 2. Como obter as credenciais:

#### NeonDB (Banco de Dados):
1. Acesse https://neon.tech
2. Crie uma conta e um novo projeto
3. Copie a connection string (PostgreSQL)

#### Discord OAuth:
1. Acesse https://discord.com/developers/applications
2. Clique em "New Application"
3. Na aba OAuth2:
   - Copie o Client ID
   - Copie o Client Secret
   - Adicione redirect URL: `http://localhost:3000/api/auth/callback/discord`

#### NEXTAUTH_SECRET:
Execute no terminal:
```bash
openssl rand -base64 32
```

#### Seu Discord ID:
1. Abra o Discord
2. Vá em Configurações > Avançado
3. Ative "Modo Desenvolvedor"
4. Clique com botão direito no seu nome
5. Selecione "Copiar ID"

### 3. Configure o banco de dados

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Rode o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## ✅ Checklist de Configuração

- [ ] Arquivo .env configurado com todas as variáveis
- [ ] NeonDB criado e connection string copiada
- [ ] Discord App criada com OAuth configurado
- [ ] NEXTAUTH_SECRET gerado
- [ ] Seu Discord ID adicionado como ADMIN
- [ ] Prisma migrations executadas
- [ ] Projeto rodando em http://localhost:3000

---

## 🆘 Problemas Comuns

### Erro de conexão com banco
- Verifique se a DATABASE_URL está correta
- Certifique-se de que o projeto NeonDB está ativo

### Erro de autenticação Discord
- Verifique se o Client ID e Secret estão corretos
- Confirme que a redirect URL está configurada no Discord

### Não consigo acessar painel admin
- Verifique se seu Discord ID está em ADMIN_DISCORD_IDS
- Faça logout e login novamente

---

## 📱 Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Entrar com Discord"
3. Autorize o aplicativo
4. Você será redirecionado para o dashboard
5. Como admin, acesse a aba "Admin" para:
   - Adicionar perguntas ao formulário
   - Gerenciar permissões de usuários
