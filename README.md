# Órion Cash

Sistema web de gestão financeira para empresas de transporte de passageiros: controle da frota, dos contratos com clientes (como prefeituras) e de todas as receitas e despesas, com um painel que mostra a saúde financeira do negócio.

**Demo:** https://orion-cash-web.vercel.app
Acesso de demonstração: `demo@orioncash.com` / `OrionDemo2026`

<!-- TODO: adicionar capturas de tela -->
<!-- ![Dashboard](docs/dashboard.png) -->

## Funcionalidades

- **Dashboard**: saldo, valores a receber, situação da frota, gráfico dos últimos 6 meses e últimas transações.
- **Financeiro**: lançamento de receitas e despesas com status (pendente, pago, cancelado), categorias e subcategorias, e vínculo opcional a um veículo ou contrato.
- **Contratos**: cadastro de clientes com validação de CNPJ e geração do faturamento mensal. O valor total é dividido pelos meses de vigência sem perder centavos (a última parcela absorve o arredondamento), e o faturamento de um mesmo mês nunca é gerado em duplicidade.
- **Frota**: cadastro de veículos com status (ativo, em manutenção, vendido) e capacidade de passageiros.
- **Notificações** de atividades no sistema.
- **Autenticação e permissões**: login com JWT, perfis de acesso (ADMIN, SOCIO, VISUALIZADOR) e recuperação de senha por e-mail.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts, Lucide |
| Backend | Node.js, Express, TypeScript, TypeORM |
| Banco de dados | PostgreSQL (Supabase) em produção, SQLite no desenvolvimento local |
| Hospedagem | Vercel (frontend e API como função serverless) |
| Segurança | bcrypt, JWT, Helmet, CORS configurável por ambiente |
| E-mail | Nodemailer (Gmail com senha de app) |

## Arquitetura

```
órion/
├── API/                     # Backend REST
│   └── src/
│       ├── routes/          # Definição das rotas e middlewares de cada recurso
│       ├── controllers/     # Recebem a requisição e devolvem a resposta HTTP
│       ├── services/        # Regras de negócio
│       ├── models/          # Entidades do TypeORM
│       ├── database/        # Conexão (Postgres/SQLite) e migrations
│       ├── middlewares/     # Autenticação (JWT) e autorização por cargo
│       ├── errors/          # AppError: erros de negócio com status HTTP
│       └── utils/           # Datas e cálculos monetários
└── Frontend/                # Aplicação Next.js
    └── src/
        ├── app/             # Páginas (login, dashboard, financeiro, contratos, frota)
        ├── components/      # Layout com menu, perfil e notificações
        └── lib/             # Configuração da URL da API
```

Algumas decisões de projeto:

- **Camadas separadas** (rotas → controllers → services): as regras de negócio ficam nos services, independentes do Express.
- **Tratamento de erros centralizado**: os services lançam `AppError` com o status adequado (400, 403, 404...). Qualquer outro erro vira um 500 genérico, para que detalhes internos nunca cheguem ao cliente.
- **Datas sem fuso**: datas `AAAA-MM-DD` são tratadas como meia-noite local, o que evita o problema clássico de um contrato "voltar um dia" no banco por causa do UTC-3.
- **Dinheiro em centavos** nos cálculos de parcelas, para não acumular erros de ponto flutuante.
- **Exclusão lógica** (soft delete) de usuários, veículos e contratos, preservando o histórico financeiro.
- **Proteção contra enumeração de e-mails**: a recuperação de senha responde da mesma forma para e-mails existentes e inexistentes, e usa um token aleatório que expira em 1 hora.
- **Banco em produção com menor privilégio**: a API acessa o Postgres com um usuário próprio, dono apenas do schema `orion`, que fica fora da API REST pública da Supabase. O schema evolui só por migrations versionadas.
- **Pronta para serverless**: a conexão com o banco é aberta na primeira requisição e reaproveitada pelas seguintes, com pool pequeno e o pooler de conexões da Supabase.

## Como rodar localmente

Pré-requisito: Node.js 20 ou superior.

### 1. API

```bash
cd API
npm install
cp .env.example .env   # preencha JWT_SECRET (instruções no próprio arquivo)
npm run dev            # http://localhost:3030
```

O banco SQLite é criado automaticamente no primeiro start, já com as categorias padrão.

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

### 3. Primeiro acesso

Com o banco vazio, o primeiro cadastro de usuário é liberado e essa conta vira **ADMIN** automaticamente. A partir daí, só administradores cadastram novos usuários.

```bash
curl -X POST http://localhost:3030/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Admin","email":"admin@exemplo.com","senha":"uma-senha-forte"}'
```

Depois é só entrar em http://localhost:3000/login com esse e-mail e senha.

## Deploy

O frontend e a API são dois projetos na Vercel, a partir das pastas `Frontend/` e `API/`. A API roda como função serverless em São Paulo (`gru1`, ver `API/vercel.json`), perto do banco.

Variáveis de ambiente da API em produção:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do Postgres (pooler da Supabase, porta 6543) |
| `JWT_SECRET` | Chave longa e aleatória para assinar os tokens |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL do frontend |
| `FRONTEND_URL` | URL do frontend (link do e-mail de recuperação) |
| `EMAIL` / `SENHAEMAIL` | Opcional: conta Gmail para a recuperação de senha |

No frontend, `NEXT_PUBLIC_API_URL` aponta para a URL da API.

Para aplicar migrations no banco de produção: `DATABASE_URL=... npm run migration:run` (na pasta `API`).

## Endpoints da API

Todas as rotas, exceto login, recuperação de senha e o primeiro cadastro, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/sessao/login` | Login; devolve o token JWT |
| POST | `/recuperar-senha` | Envia o link de redefinição por e-mail |
| POST | `/redefinir-senha` | Define a nova senha a partir do token |
| POST | `/usuarios` | Cria usuário (ADMIN, ou livre se for o primeiro) |
| GET | `/usuarios` | Lista usuários (ADMIN) |
| PUT | `/usuarios/:id` | Edita o próprio perfil (ou qualquer um, se ADMIN) |
| GET | `/dashboard` | Indicadores do painel |
| GET, POST, PUT, DELETE | `/transacoes` | Receitas e despesas |
| GET, POST, DELETE | `/categorias` | Categorias e subcategorias |
| GET, POST, DELETE | `/contratos` | Contratos |
| POST | `/contratos/faturamento` | Gera as faturas do mês corrente |
| GET, POST, PUT, DELETE | `/veiculos` | Frota |
| GET | `/notificacoes` | Notificações |
| PUT | `/notificacoes/lidas` | Marca as notificações como lidas |

## Próximos passos

- Testes automatizados dos services (autenticação, contratos e faturamento)
- Divisão das páginas maiores do frontend em componentes

## Autor

Isaac de Carvalho Guimarães
www.linkedin.com/in/isaac-guimaraes-dev
https://github.com/Isaac-Guimaraes
