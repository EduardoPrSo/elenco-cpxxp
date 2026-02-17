# 📊 Estrutura de Dados

## Modelos do Banco de Dados

### User (Usuário)
Armazena informações dos usuários autenticados.

```typescript
{
  id: string           // ID único
  name: string         // Nome do usuário
  email: string        // Email (opcional)
  image: string        // URL da foto do perfil
  discordId: string    // ID único do Discord
  role: Role          // USER | READER | ADMIN
  createdAt: DateTime
  updatedAt: DateTime
}
```

### FormQuestion (Pergunta do Formulário)
Define as perguntas do formulário.

```typescript
{
  id: string
  question: string           // Texto da pergunta
  type: QuestionType        // TEXT | TEXTAREA | RADIO | CHECKBOX | SELECT
  required: boolean         // Campo obrigatório?
  order: number            // Ordem de exibição
  options: QuestionOption[] // Opções (para RADIO, CHECKBOX, SELECT)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### QuestionOption (Opção de Pergunta)
Opções para perguntas de múltipla escolha.

```typescript
{
  id: string
  value: string      // Valor armazenado
  label: string      // Texto exibido
  questionId: string // Referência à pergunta
}
```

### FormResponse (Resposta do Formulário)
Armazena as respostas dos usuários.

```typescript
{
  id: string
  userId: string     // Quem respondeu
  questionId: string // Qual pergunta
  answer: string     // Resposta (texto ou valores separados por vírgula)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Tipos de Campo

### TEXT
- Input de texto simples
- Uma linha
- Ideal para: nome, email, etc.

### TEXTAREA
- Input de texto com múltiplas linhas
- Ideal para: descrições, comentários

### RADIO
- Múltipla escolha (seleciona apenas uma)
- Requer options
- Ideal para: escolha única entre várias opções

### CHECKBOX
- Múltipla escolha (seleciona várias)
- Requer options
- Respostas armazenadas como: "valor1,valor2,valor3"
- Ideal para: múltiplas seleções

### SELECT
- Lista suspensa (dropdown)
- Requer options
- Ideal para: listas longas de opções

## Roles e Permissões

### USER (Padrão)
```typescript
Permissões:
- Preencher formulário ✓
- Ver próprias respostas ✓
- Ver respostas de outros ✗
- Gerenciar perguntas ✗
- Gerenciar usuários ✗
```

### READER
```typescript
Permissões:
- Preencher formulário ✓
- Ver próprias respostas ✓
- Ver respostas de outros ✓
- Gerenciar perguntas ✗
- Gerenciar usuários ✗
```

### ADMIN
```typescript
Permissões:
- Preencher formulário ✓
- Ver próprias respostas ✓
- Ver respostas de outros ✓
- Gerenciar perguntas ✓
- Gerenciar usuários ✓
```

## Rotas da API

### Autenticação
```
GET/POST /api/auth/[...nextauth]
```

### Usuários (Admin)
```
GET    /api/admin/users          # Listar usuários
PATCH  /api/admin/users          # Atualizar role
```

### Perguntas (Admin)
```
GET    /api/admin/questions      # Listar perguntas
POST   /api/admin/questions      # Criar pergunta
PATCH  /api/admin/questions      # Atualizar pergunta
DELETE /api/admin/questions?id=  # Deletar pergunta
```

### Formulário
```
POST   /api/form/submit          # Enviar respostas
GET    /api/form/submit          # Buscar próprias respostas
```

### Respostas (Reader/Admin)
```
GET    /api/form/responses       # Ver todas as respostas
```

## Exemplos de Uso

### Criar Pergunta de Texto
```json
{
  "question": "Qual é o seu nome?",
  "type": "TEXT",
  "required": true
}
```

### Criar Pergunta de Múltipla Escolha
```json
{
  "question": "Qual é sua cor favorita?",
  "type": "RADIO",
  "required": true,
  "options": [
    { "value": "red", "label": "Vermelho" },
    { "value": "blue", "label": "Azul" },
    { "value": "green", "label": "Verde" }
  ]
}
```

### Enviar Respostas
```json
{
  "responses": [
    {
      "questionId": "clx123...",
      "answer": "João Silva"
    },
    {
      "questionId": "clx456...",
      "answer": "red"
    }
  ]
}
```

### Atualizar Role de Usuário
```json
{
  "userId": "clx789...",
  "role": "READER"
}
```
