# ServCand

Sistema Multi-Empresa para Gestão de Funcionários com Automação Instagram e Gamificação.

## 🚀 Início Rápido

### Requisitos
- Docker e Docker Compose
- Node.js 20+

### Executar com Docker

```bash
# Clonar/navegar para o projeto
cd servcand

# Copiar variáveis de ambiente
cp .env.example .env

# Subir os containers
docker-compose up -d

# Aguardar inicialização e acessar:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Swagger: http://localhost:3000/api/docs
```

### Credenciais Iniciais

| Usuário | E-mail | Senha |
|---------|--------|-------|
| Super Admin | admin@servcand.com | Admin@123 |
| Admin Empresa | admin@empresaexemplo.com | Empresa@123 |

## 📁 Estrutura do Projeto

```
servcand/
├── docker-compose.yml          # Orquestração Docker
├── .env.example               # Variáveis de ambiente
├── packages/
│   ├── backend/               # NestJS API
│   │   ├── src/
│   │   │   ├── modules/       # Módulos de negócio
│   │   │   │   ├── auth/      # Autenticação JWT
│   │   │   │   ├── companies/ # Multi-empresa
│   │   │   │   ├── users/     # Usuários
│   │   │   │   ├── persons/   # Funcionários
│   │   │   │   ├── profiles/  # Perfis/Permissões
│   │   │   │   ├── regions/   # Regiões/Bairros
│   │   │   │   ├── leadership/# Lideranças
│   │   │   │   ├── missions/  # Missões Semanais
│   │   │   │   ├── instagram/ # Automação Instagram
│   │   │   │   ├── salary/    # Salários/Pagamentos
│   │   │   │   └── parameters/# Parametrização
│   │   │   ├── common/        # Guards, Decorators, Filters
│   │   │   └── prisma/        # Prisma Service
│   │   └── prisma/
│   │       ├── schema.prisma  # Schema do banco
│   │       └── seed.ts        # Dados iniciais
│   └── frontend/              # React + Vite
│       └── src/
│           ├── pages/         # Páginas
│           ├── components/    # Componentes
│           ├── contexts/      # Context API
│           └── services/      # API Services
```

## 🏗️ Arquitetura

### Backend (NestJS + Prisma)
- **Multi-tenant**: Dados isolados por empresa via `companyId`
- **RBAC**: Perfis e permissões granulares por empresa
- **JWT Auth**: Access token + Refresh token
- **Swagger**: Documentação automática em `/api/docs`

### Banco de Dados
- **PostgreSQL 15** com Prisma ORM
- Migrações automáticas no startup
- Seed com dados iniciais

### Frontend (React + Vite)
- Design System premium dark theme
- React Query para gerenciamento de estado servidor
- Roteamento com React Router v6
- Controle de acesso baseado em permissões

## 📊 Sistema de Gamificação

| Regra | Valor |
|-------|-------|
| Salário Mensal | R$ 1.000,00 |
| Disponível por Semana | R$ 250,00 |
| Semanas por Mês | 4 |
| Bônus por Nível | +10% |
| Pontos para Nível | 100 pts |

### Missões Instagram
- 📸 **Publicar Foto**: 25 pontos (obrigatória)
- 🏷️ **Marcar Empresa**: 25 pontos (obrigatória)
- 💬 **Comentar**: 25 pontos (obrigatória)
- 🔁 **Compartilhar**: 25 pontos

## 🔌 Integração Instagram

O sistema usa o **Meta Webhook** para monitoramento automático:

1. Configure as variáveis no `.env`:
   ```
   META_APP_ID=seu-app-id
   META_APP_SECRET=seu-secret
   META_WEBHOOK_VERIFY_TOKEN=seu-token
   META_ACCESS_TOKEN=seu-access-token
   ```

2. Configure o webhook no Meta Dashboard apontando para:
   `https://seu-dominio.com/api/instagram/webhook`

3. O sistema valida automaticamente publicações, marcações, comentários e compartilhamentos.

## 👥 Perfis do Sistema

| Perfil | Descrição |
|--------|-----------|
| SUPER_ADMIN | Acesso total a todas as empresas |
| COMPANY_ADMIN | Admin da empresa |
| LEADER | Liderança regional |
| EMPLOYEE | Funcionário |

## 🛠️ Desenvolvimento Local

```bash
# Backend
cd packages/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend
cd packages/frontend
npm install
npm run dev
```
# servcand-instagram
