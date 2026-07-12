# IsLuny Works ❄️

**IsLuny Works** é a plataforma corporativa integrada de gestão interna da **IsLuny Org**. O sistema foi concebido sob conceitos de arquitetura limpa (Clean Architecture), modularidade e escalabilidade, estruturado de modo a funcionar como um ERP interno capaz de receber novos módulos de forma incremental (Projetos, Tarefas, Financeiro, Patrimônio, Documentos, etc.) sem impactos estruturais nas regras de negócio existentes.

Atualmente, a plataforma conta com o módulo ativo de **Recursos Humanos (Controle de Ponto Eletrônico e Espelho de Ponto)**, suportado por um painel de controle administrativo completo, relatórios de auditoria e gráficos analíticos.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16+** (com App Router)
- **React 19**
- **TypeScript**
- **Styled Components** (SSR-friendly com coleta dinâmica de CSS)
- **Recharts** (Gráficos corporativos interativos e responsivos)
- **React Hook Form** + **Zod** (Validação de formulários fortemente tipada)
- **TanStack Query (React Query)** (Gerenciamento de cache e requisições assíncronas)
- **Axios** (Cliente HTTP)

### Backend
- **Next.js Route Handlers** (API EndpointsREST)
- **NextAuth.js** (Autenticação baseada em sessões JWT seguras)
- **Prisma ORM** + **PostgreSQL** (com suporte a Driver Adapters via `pg` e `@prisma/adapter-pg`)
- **bcrypt** (Hash criptográfico para senhas)

---

## 📁 Estrutura de Diretórios e Modularidade

A organização do projeto separa responsabilidades de forma que novos recursos ou módulos possam ser implementados adicionando componentes atômicos e novos casos de uso:

```text
src/
├── app/                  # Next.js App Router (UI Pages & APIs)
│   ├── api/              # Endpoints da API REST
│   │   ├── auth/         # Autenticação (NextAuth)
│   │   ├── clock/        # Métricas de ponto (histórico e registros)
│   │   ├── dashboard/    # Endpoints agregados para os gráficos
│   │   └── ...           # CRUDs (users, roles, permissions)
│   ├── clock/            # Módulo RH: Registrar Ponto
│   ├── dashboard/        # Painel Geral Corporativo (IsLuny Works)
│   │   └── components/   # Widgets e Gráficos Recharts do Dashboard
│   │       ├── StatisticsCards.tsx   # KPI Cards (Gerais e Ponto)
│   │       ├── HoursChart.tsx        # Área: Horas trabalhadas (30 dias)
│   │       ├── ClockChart.tsx        # Barras: Batidas por dia (30 dias)
│   │       ├── RolesChart.tsx        # Pizza: Distribuição por cargo
│   │       ├── UsersGrowthChart.tsx  # Linhas: Crescimento acumulado de usuários
│   │       ├── TopUsersHoursChart.tsx# Barras Horizontais: Top worked hours (7/30/90d)
│   │       └── ActivityTimeline.tsx  # Timeline: Log de auditoria (AuditLog)
│   └── ...               # Demais telas da plataforma
├── components/           # Componentes reutilizáveis do Design System
├── hooks/                # Hooks customizados (usePermission)
├── layouts/              # Layouts estruturais (DashboardLayout recolhível)
├── repositories/         # Infraestrutura de dados (Consultas ao Banco via Prisma)
├── useCases/             # Camada de domínio (Regras de negócio isoladas)
└── utils/                # RBAC helpers e formatação de datas
```

---

## ❄️ Nova Interface e Layout Evolved

- **Sidebar Recolhível**: O menu lateral pode ser recolhido de `260px` para `70px` (com estado persistido no `localStorage`), ocultando textos e exibindo apenas ícones de atalho em formato de emojis legíveis.
- **Estrutura por Módulos**: A navegação foi reorganizada em seções corporativas preparando o terreno para futuros ERPs:
  - **Gestão**: Colaboradores, Cargos, Permissões.
  - **Recursos Humanos**: Controle de Ponto, Relatórios.
  - **Configurações**: (Administrativo Geral).
- **Dashboard Evolved**: Apresenta 9 KPI Cards agregados e 6 visualizações de dados interativas com suporte a layouts responsivos (Desktop de 2/3 colunas e Mobile de 1 coluna).

---

## ⚙️ Variáveis de Ambiente (`.env`)

Renomeie `.env.example` para `.env` e configure conforme necessário:

```env
DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/clock_system?schema=public"

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=clock_system

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="e9729b8c6fa33c64c7857be91307b22a"

NODE_ENV=development
```

---

## 🚀 Execução com Docker (Recomendado)

Inicie toda a infraestrutura com apenas um comando:

```bash
docker compose up --build
```

Isso compilará a imagem usando o **multi-stage build** otimizado (standalone build do Next.js), aguardará o banco de dados estar saudável (`healthcheck`), aplicará as migrações estruturais do Prisma, executará as sementes (seed) de permissões e usuários, e disponibilizará o sistema.

Acesse o sistema em: [http://localhost:3000](http://localhost:3000)

### Credenciais do Administrador Geral (Seed):
- **E-mail**: `admin@example.com`
- **Senha**: `admin123`

---

## 💻 Execução Local (Sem Docker)

1. Instale as dependências:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Configure a URL do PostgreSQL em seu `.env` local.
3. Aplique as migrações e rode as sementes:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📊 Endpoints de Agregação da API do Dashboard

O Dashboard consome dados estruturados e pré-agregados por meio de endpoints dedicados para maximizar a performance:
- `/api/dashboard/stats` - Retorna os dados para os 9 KPI Cards.
- `/api/dashboard/charts` - Retorna séries cronológicas combinadas (batidas de ponto por dia, horas totais por dia e curva acumulada de crescimento de usuários) e distribuição por cargos.
- `/api/dashboard/top-users?days=X` - Retorna os colaboradores com mais horas trabalhadas filtradas no período informado (7, 30 ou 90 dias).
- `/api/dashboard/activity` - Retorna os últimos logs do `AuditLog` formatados e em ordem cronológica reversa para alimentar a timeline.
