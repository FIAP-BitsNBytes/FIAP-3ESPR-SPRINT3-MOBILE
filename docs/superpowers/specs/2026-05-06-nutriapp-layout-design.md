# NutriApp — Layout Mobile Design Spec

**Data:** 2026-05-06
**Status:** Aprovado para implementação
**Autor:** Brainstorming Session

---

## Contexto

App de nutrição com gamificação para engajamento do usuário. Três roles distintos com navegações diferentes: PATIENT, NUTRITIONIST, ADMIN. A gamificação (XP, nível, streak, ranking) é central para o produto — deve ser visível e motivacional, não escondida.

---

## Design System

### Estilo
**Vibrant & Block-based** — bold, energético, geométrico, alto contraste. Referências: apps de fitness e saúde modernos (Noom, MyFitnessPal). Dark mode como padrão.

### Paleta de Cores

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#F97316` | Ações principais, active tab, XP bar |
| `secondary` | `#FB923C` | Destaques secundários |
| `success` | `#22C55E` | CTAs, metas atingidas, streak ativo |
| `background` | `#1F2937` | Fundo geral (dark mode) |
| `surface` | `#374151` | Cards, tab bar |
| `text` | `#F8FAFC` | Texto principal |
| `muted` | `#9CA3AF` | Texto secundário |

### Tipografia
- **Headings:** Barlow Condensed (400, 600, 700) — energético, atlético
- **Body:** Barlow (300, 400, 500) — legível, moderno
- Tamanho mínimo: 16px body mobile

### Efeitos & Motion
- Transições: 150–300ms
- Animações: apenas `transform` e `opacity` (performance)
- Respeitar `prefers-reduced-motion`
- Gaps entre seções: 48px+

---

## Arquitetura de Navegação

### Estrutura de Rotas (Expo Router)

```
src/app/
├── (auth)/
│   ├── _layout.tsx          — Stack sem header (telas públicas)
│   └── login.tsx            — Tela de login
└── (tabs)/
    ├── _layout.tsx          — Tab bar condicional por role
    ├── home.tsx             — Patient: dashboard gamificado
    ├── nutrition.tsx        — Patient: tabela de nutrição diária
    ├── patients.tsx         — Nutritionist: lista de pacientes
    ├── ranking.tsx          — Nutritionist: ranking de pacientes
    ├── nutritionists.tsx    — Admin: gestão de nutricionistas
    ├── schedule.tsx         — Shared: agenda (visão filtrada por role)
    └── profile.tsx          — Shared: perfil do usuário
```

### Tabs por Role

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|---|---|---|---|---|---|
| **PATIENT** | Home | Nutrição | Agenda | Perfil | — |
| **NUTRITIONIST** | Home | Pacientes | Ranking | Agenda | Perfil |
| **ADMIN** | Dashboard | Nutricionistas | Agenda | Perfil | — |

**Lógica:** `(tabs)/_layout.tsx` lê `role` via `useAuthContext()` e renderiza a configuração de tabs correspondente. Rotas de outras roles existem no sistema de arquivos mas não são expostas no tab bar do usuário atual.

### Fluxo de Auth
1. App abre → `AuthGate` em `_layout.tsx` raiz verifica sessão Supabase
2. Sem sessão → redirect para `/(auth)/login`
3. Login bem-sucedido → redirect para `/(tabs)` com tabs do role correto
4. Sessão persistida → vai direto para `/(tabs)`

---

## Telas por Role

### PATIENT

#### Home (Dashboard Gamificado)
- **Card de Nível:** badge do nível atual + título ("Guerreiro Nutricional"), barra de XP com progresso para próximo nível
- **Streak:** ícone de chama + contador de dias consecutivos, cor muda (cinza → laranja → verde) conforme sequência
- **Metas do Dia:** anel de progresso circular com % de calorias/macros atingidos
- **Ações Rápidas:** botão de registrar refeição, botão de ver evolução

#### Nutrição
- Tabela de refeições do dia (café, almoço, lanche, jantar)
- Totais de macronutrientes (proteína, carb, gordura, calorias)
- Histórico dos últimos 7 dias em gráfico de barras simples

#### Agenda
- Calendário mensal com marcadores de consultas
- Lista de próximas consultas com status (PENDING, CONFIRMED, CANCELLED)

#### Perfil
- Avatar + nome + role badge
- Dados: peso atual, altura, IMC, objetivo
- Histórico de evolução (gráfico de linha de peso)
- Botão de logout

---

### NUTRITIONIST

#### Home (Dashboard de Pacientes)
- Cards de resumo: total de pacientes, consultas hoje, alertas
- Lista dos 3 pacientes com menor engajamento (streak baixo) — ação de contato rápido

#### Pacientes
- Lista completa de pacientes vinculados
- Filtro por engajamento, data de cadastro, status
- Acesso ao perfil clínico de cada paciente

#### Ranking
- Ranking gamificado dos pacientes por pontos/XP
- Top 3 em destaque (pódio visual: 1º, 2º, 3º)
- Lista completa com avatar, nome, nível, streak e pontos

#### Agenda
- Calendário com todas as consultas do nutricionista
- Criação/edição de agendamentos
- Status dos agendamentos por cores

#### Perfil
- Dados profissionais: CRM/CRN, status de aprovação
- Botão de logout

---

### ADMIN

#### Dashboard
- Cards de métricas globais: total pacientes, total nutricionistas, consultas do dia
- Agenda geral de todos os nutricionistas (view read-only)

#### Nutricionistas
- Lista de nutricionistas com status (PENDING, APPROVED, REJECTED)
- Ação de aprovar/rejeitar novos cadastros
- Busca por nome ou CRM/CRN

#### Agenda
- Agenda consolidada de todos os nutricionistas
- Filtro por nutricionista
- View read-only (admin não agenda, só visualiza)

#### Perfil
- Dados do admin
- Botão de logout

---

## Componentes Compartilhados

| Componente | Localização | Uso |
|---|---|---|
| `RoleTabBar` | `src/shared/components/navigation/` | Tab bar com configuração condicional por role |
| `XPProgressBar` | `src/shared/components/gamification/` | Barra de XP laranja com label de nível |
| `StreakBadge` | `src/shared/components/gamification/` | Chama + contador de dias |
| `LevelCard` | `src/shared/components/gamification/` | Card com título de nível e progresso |
| `AppointmentCard` | `src/shared/components/appointments/` | Card de consulta com status colorido |
| `PatientCard` | `src/shared/components/patients/` | Card de paciente com avatar, nome, streak |
| `StatCard` | `src/shared/components/ui/` | Card numérico para dashboards |

---

## Regras de Acessibilidade

- Touch targets mínimos: 44×44px
- Contraste texto: mínimo 4.5:1
- Todos ícones com `accessibilityLabel`
- Estados de foco visíveis
- Ícones: Lucide React Native (SVG) — sem emojis como ícones

---

## Anti-patterns a Evitar

- Design estático sem feedback de interação
- Gamificação escondida (XP/streak não visível na home)
- Tab bar com mais de 5 itens
- Telas clínicas com visual "hospitalar" frio — manter energia do brand

---

## Próximo Passo

Invocar `writing-plans` para criar o plano de implementação com ordem de arquivos, interfaces e dependências.
