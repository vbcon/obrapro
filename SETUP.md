# OBRAPRO - Guia de Configuração

## Pré-requisitos

- Node.js 18+ → https://nodejs.org/en/download
- Conta no Supabase → https://supabase.com (gratuito)

---

## 1. Instalar Node.js

Acesse https://nodejs.org, baixe a versão LTS e instale.

Verifique com:
```
node --version
npm --version
```

---

## 2. Configurar Supabase

1. Acesse https://supabase.com e crie um projeto
2. Anote a **URL** e a **anon key** (em Settings → API)
3. Vá em **SQL Editor** e execute o arquivo `supabase/schema.sql`

---

## 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

---

## 4. Instalar dependências e rodar

```bash
cd obrapro
npm install
npm run dev
```

Acesse http://localhost:3000

---

## 5. Criar primeiro usuário

Acesse http://localhost:3000/register e crie sua conta.

O trigger do Supabase criará automaticamente o perfil na tabela `perfis`.

---

## Estrutura do projeto

```
obrapro/
├── src/
│   ├── app/
│   │   ├── (auth)/login/       → Página de login
│   │   ├── (auth)/register/    → Página de cadastro
│   │   └── dashboard/          → Dashboard protegido
│   │       ├── obras/          → Gestão de obras
│   │       ├── cronograma/     → Cronograma e eventos
│   │       ├── compras/        → Pedidos de compra
│   │       └── whatsapp/       → Comunicação WhatsApp
│   ├── components/
│   │   └── layout/             → Sidebar e Header
│   └── lib/
│       ├── supabase/           → Clientes Supabase
│       └── types/              → Tipos TypeScript
└── supabase/
    └── schema.sql              → Schema completo do banco
```
