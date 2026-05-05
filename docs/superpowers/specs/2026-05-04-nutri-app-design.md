# Design Spec - NutriApp (Expo Web)

**Data:** 2026-05-04  
**Tema:** Aplicativo de Nutrição com Gamificação e Calendário  
**Arquitetura:** Feature-First + DDD  
**Tecnologia:** Expo SDK (React Native for Web) + TypeScript + Expo Router

## 1. Visão Geral
Plataforma de nutrição voltada para a Web, integrando três perfis de usuário (Paciente, Nutricionista/Médico e Admin). O foco é a gestão de saúde através de um calendário interativo e engajamento via gamificação.

## 2. Perfis de Usuário (Domínio)
- **Paciente (User):** Visualiza dieta, marca consultas no calendário e recebe recompensas (gamificação) ao cumprir metas.
- **Nutricionista/Médico:** Gerencia pacientes, define planos alimentares e acompanha a evolução.
- **Admin:** Gerencia o cadastro e status de nutricionistas (sem acesso a dados sensíveis de pacientes).

## 3. Arquitetura de Pastas (`src/`)

### `features/`
- `auth/`: Login e controle de acesso por perfil.
- `calendar/`: Gestão de agendamentos e visualização de dieta temporal.
- `gamification/`: Sistema de pontos, metas e conquistas para pacientes.
- `patient-management/`: Dashboard do nutricionista para gerir usuários.
- `admin-panel/`: Interface de gestão de profissionais.

### `shared/`
- `components/`: UI Kit (Buttons, Cards, Inputs, Layouts Responsivos).
- `domain/`: Interfaces globais, Value Objects e regras de negócio transversais.
- `infrastructure/`: Configuração de API (Axios/Fetch), Storage e Auth Providers.
- `hooks/`: `useMediaQuery` (essencial para Web), `useAuth`.
- `theme/`: Design Tokens (Cores, Tipografia, Espaçamento).

## 4. Requisitos Web Críticos
- **Responsividade:** Layout adaptável para telas desktop (Dashboard) e mobile.
- **Roteamento:** URLs limpas via Expo Router (ex: `/dashboard`, `/calendar/2026-05-04`).
- **Performance:** Carregamento otimizado de assets.

## 5. Próximos Passos
1. Implementar estrutura de pastas.
2. Configurar Expo Router para suporte Web.
3. Criar Feature de Autenticação como base.
