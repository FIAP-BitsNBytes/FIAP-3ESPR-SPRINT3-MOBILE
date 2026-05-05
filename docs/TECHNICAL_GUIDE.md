# NutriApp - Guia de Implementação Tática

Este documento detalha como a arquitetura **Feature-First + DDD** será aplicada para atender aos requisitos de Nutrição, Calendário e Gamificação no contexto Web.

## 1. Princípios de Design

### Feature-First
Cada pasta em `src/features` é um módulo independente. 
- **O que entra:** Lógica que só serve para aquela funcionalidade.
- **O que sai:** Um componente de página ou um conjunto de componentes exportados via `index.ts`.
- **Regra de Ouro:** Uma feature não deve importar nada de dentro de outra feature diretamente. Se algo é compartilhado, move-se para `src/shared`.

### Domain-Driven Design (DDD)
Dentro de cada feature, a pasta `domain/` é a mais importante:
- **Entities:** Interfaces TypeScript que definem os dados (ex: `User`, `Appointment`, `Badge`).
- **Logic:** Funções puras que validam regras de negócio (ex: `isAppointmentValid`, `calculatePoints`).
- **Interfaces:** Contratos para os serviços que serão implementados na camada de `api`.

---

## 2. Detalhamento das Features

### 🔐 Auth (Autenticação)
- **Domínio:** Gerencia os perfis `PATIENT`, `NUTRITIONIST`, `ADMIN`.
- **Implementação:** Hook `useAuth` que provê o estado do usuário globalmente. Redirecionamento baseado em perfil (RBAC).

### 📅 Calendar (Gestão e Agendamento)
- **Domínio:** Entidades de `TimeSlot`, `Appointment` e `NutritionPlan`.
- **Web-First:** Implementar visualização de grade para desktop, permitindo arrastar ou clicar para agendar.
- **Integração:** O médico vê a agenda de todos os pacientes; o paciente vê apenas a sua.

### 🏆 Gamification (Engajamento do Paciente)
- **Domínio:** `Score`, `Level`, `Reward`.
- **Lógica:** O paciente ganha pontos ao marcar refeições como concluídas ou beber água.
- **Visual:** Progress bars e badges no dashboard do paciente.

### 👨‍⚕️ Patient Management (Dashboard do Nutricionista)
- **Foco:** CRUD de planos alimentares e visualização da evolução (gráficos).

### ⚙️ Admin Panel (Gestão de Profissionais)
- **Foco:** Listagem e ativação/desativação de contas de nutricionistas.

---

## 3. Shared (O Coração do Sistema)
- **UI Kit:** Botões, Cards e Modais que funcionam bem com hover (Web) e touch (Mobile).
- **Hooks:** `useMediaQuery` para esconder/mostrar elementos dependendo do tamanho da tela.
- **Infras:** Configuração de API com tratamento de erros global.

## 4. Como vamos construir
1. **Contratos:** Definir as interfaces em `domain/` antes de codar a UI.
2. **Mocking:** Usar dados estáticos iniciais para validar o fluxo Web.
3. **Responsividade:** Todo componente em `shared/` será testado para telas grandes e pequenas.
