# NutriApp

Plataforma de saúde e nutrição com gamificação, monitoramento clínico em tempo real e controle de consultas. Desenvolvida com React Native (Expo SDK 54) e Supabase como backend.

---

## 🔑 Acessos para Avaliação

Credenciais de teste para o professor validar cada perfil de permissão (RBAC):

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Paciente** | `vali597@uorak.com` | `asdasdqwe` |
| **Nutricionista** | `zaida2711@uorak.com` | `asdasdqwe` |
| **Admin** | `asd@asd.com` | `asd` |

---

## Integrantes

| Nome | RM |
|------|----|
| Edson Leonardo | RM 553737 |
| Gustavo Bezerra Assumção | RM 553076 |
| Jó Sales | RM 552679 |
| Miguel Garcez de Carvalho | RM 553768 |
| Vinicius Souza e Silva | RM 552781 |

**Turma:** 3ESPR · FIAP · Sprint 3 + Sprint 4 · 2026

---
### Video de demonstração

https://youtu.be/NwxQx9X8AxA?si=VyvlnHA5xhtWSzjB
 
---

## Instalação

```bash
npm install
```

---

## Execução

```bash
npm start
```

O Expo Developer Tools abre no terminal. Em seguida:

| Plataforma | Ação |
|------------|------|
| Android (emulador ou dispositivo) | Pressione `a` |
| iOS (simulador — requer macOS) | Pressione `i` |
| Navegador (web) | Pressione `w` |
| Expo Go (dispositivo físico) | Escaneie o QR code |

Scripts alternativos:

```bash
npm run android   # Android direto
npm run ios       # iOS direto (macOS)
npm run web       # Navegador
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [npm](https://www.npmjs.com/) 9 ou superior
- [Expo Go](https://expo.dev/go) no celular (para testar em dispositivo físico)

---

## Variáveis de Ambiente

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

> Credenciais disponíveis no painel do Supabase em **Project Settings → API**.

---

## Executar Testes

```bash
npx jest
```

---

## Visão Geral

O NutriApp conecta três perfis em uma única plataforma clínica multitenant:

| Perfil | Responsabilidade |
|--------|-----------------|
| **Administrador** | Gerencia a clínica, aprova nutricionistas, acessa auditoria completa |
| **Nutricionista** | Acompanha pacientes, cria planos alimentares, monitora engajamento |
| **Paciente** | Registra refeições e água, acompanha evolução, compete no ranking |

Cada perfil acessa um conjunto exclusivo de telas, definido por RBAC em duas camadas: navegação frontend e Row Level Security no banco de dados.

---

## Funcionalidades

### Autenticação

**Tela:** `LoginScreen` · **Hook:** `useAuth`

O login é feito com e-mail e senha via Supabase Auth. Ao entrar, o hook `useAuth` busca o perfil do usuário na tabela `profiles` (incluindo o vínculo com a clínica), armazena o ID no interceptor HTTP e redireciona automaticamente para as telas corretas com base no `role` — tudo via `AuthGate` no layout raiz.

A sessão JWT é persistida pelo cliente Supabase em AsyncStorage, então o usuário continua autenticado mesmo após fechar o app. Um listener `onAuthStateChange` revalida a sessão ao reabrir. O último e-mail utilizado é salvo em `nutriapp_preferences` via `useAppPreferences` e pré-preenchido automaticamente no próximo acesso.

Validações da tela:
- E-mail e senha obrigatórios antes de submeter
- Botão desabilitado durante o request (evita cliques duplos)
- Mensagem de erro clara em caso de credenciais inválidas

---

### Perfil do Usuário

**Tela:** `ProfileScreen` · **Hook:** `useProfileUpdate`

Tela unificada para todos os roles. Exibe avatar com iniciais, badge colorido do role, dados de acesso (e-mail, CRM/CRN para nutricionistas) e seção de identificação pessoal editável (nome, CPF, telefone).

Comportamentos notáveis:
- CPF é bloqueado para edição assim que definido (nunca pode ser alterado)
- CRM/CRN é sempre somente leitura (dado pelo admin ao convidar)
- Nutricionistas têm o CRM/CRN buscado dinamicamente de `nutritionist_details`
- Pacientes visualizam pontos de gamificação no card de status; outros roles veem o nome da clínica
- Máscara de CPF (000.000.000-00) e telefone ((00) 00000-0000) aplicadas em tempo real

---

### Convites e Onboarding

**Tela:** `AcceptInviteScreen` · **Hook:** `useInviteUser` · **Backend:** Edge Function `invite-user`

O cadastro de novos usuários é feito **por convite**, nunca por auto-registro:

1. Admin convida nutricionistas; nutricionista convida pacientes (FAB nas respectivas listas, com validação de nome + e-mail + CRM/CRN quando aplicável).
2. O hook `useInviteUser` chama a **Edge Function `invite-user`** (`supabase/functions/invite-user`, runtime Deno). Ela usa a `service_role` key (no servidor, nunca exposta no app) para criar o usuário, definir `role`/`clinic_id`/CRM-CRN e disparar o e-mail de convite com link mágico.
3. O convidado abre o link → `AcceptInviteScreen` troca o código por sessão (`exchangeCodeForSession`/`setSession`) e exige a criação de senha (mínimo 8 caracteres, confirmação).
4. Concluído, o usuário já entra autenticado no app com o role correto.

---

### Home do Paciente

**Tela:** `HomeScreen (patient)` · **Hooks:** `useTodayLogs`, `useGamification`

Painel diário com quatro métricas em tempo real:

| Métrica | Fonte |
|---------|-------|
| Calorias consumidas | Soma de `meal_logs` do dia (categoria MEAL) |
| Litros de água | Soma de `meal_logs` do dia (categoria WATER, unidade MILLILITERS) |
| Pontos do dia | `gamification_stats.points` |
| Streak atual | `gamification_stats.streak_days` |

A barra de progresso calórico é calculada contra a meta diária do plano. Animações nativas via Reanimated (escala nos botões de ação). Dados atualizados em tempo real por subscription Supabase Realtime na tabela `meal_logs`.

---

### Registro de Refeições

**Hook:** `useLogMeal` · integrado na tela de Nutrição

Dois fluxos distintos de registro:

**1. Registro de item do plano** (`log_meal_from_plan`): o paciente confirma ou ajusta quantidade/unidade/calorias de um item prescrito pelo nutricionista. Retorna `xp_earned` e `adherence_pct` (percentual de adesão ao plano).

**2. Registro livre** (`log_free_meal`): o paciente registra uma refeição fora do plano, informando nome, quantidade, unidade e calorias estimadas.

Ambos os fluxos são chamadas RPC no Supabase e retornam `log_id` + XP ganho. O estado `isLogging` desabilita o botão durante o request.

---

### Registro de Água

**Hook:** `useLogWater`

Chama a RPC `log_water_intake(p_amount_ml)` e retorna `log_id`, `xp_earned` e `total_ml` acumulado no dia. A barra de progresso na Home é atualizada instantaneamente via Realtime.

---

### Acompanhamento de Progresso

**Hook:** `useProgressMetrics`

Carrega os últimos 7 dias de `meal_logs` e agrega por data:

- Calorias totais consumidas (categoria MEAL)
- Mililitros de água ingeridos (categoria WATER + unidade MILLILITERS)
- Quantidade de refeições registradas
- Quantidade de exercícios registrados

Os dados alimentam gráficos de evolução semanal. Subscription Realtime mantém os gráficos sincronizados sem necessidade de pull-to-refresh manual.

---

### Plano Nutricional

**Tela:** `MealPlanEditorScreen` (nutricionista) / `PlanDetailScreen` (paciente) · **Hooks:** `useMealPlan`, `usePlanDetail`, `usePlanPermissions`

O módulo de plano nutricional tem comportamento diferente por role:

**Nutricionista (edição completa):**
- Criar plano com título, data de início, data de fim e observações
- Adicionar, editar e excluir itens por refeição (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia, pré-treino)
- Cada item tem: nome do alimento, quantidade prescrita, unidade e calorias
- Badge de adesão por item: verde (≥80%), amarelo (≥50%), vermelho (<50%)
- Confirmação Alert antes de excluir itens

**Paciente (visualização + registro):**
- Visualiza os itens prescritos agrupados por refeição
- Registra consumo real (pode ajustar quantidade)
- Acompanha calorias consumidas vs. meta do plano

Os dados são gerenciados pela RPC `get_patient_plan_summary` e funções auxiliares `create_meal_plan`, `upsert_meal_plan_item`, `delete_meal_plan_item`.

---

### Lista de Pacientes (Nutricionista)

**Tela:** `NutritionistPatientsScreen` · **Hook:** `useClinicPatients`

FlatList de pacientes vinculados à clínica, cada linha exibindo:
- Nome do paciente
- Streak de dias consecutivos (ícone de chama)
- Pontos totais
- XP acumulado
- Nível (badge colorido: roxo ≥10, azul ≥5, verde abaixo)

O hook calcula automaticamente `lowEngagement`: pacientes com streak ≤ 2 dias ou pontos < 100. Um badge de alerta no topo da tela exibe a contagem. FAB no canto inferior permite convidar novos pacientes por e-mail com validação de nome + e-mail antes de enviar.

Dados sincronizados via Realtime observando `profiles` (role PATIENT) e `gamification_stats`.

---

### Ranking Gamificado

**Tela:** `RankingScreen` · **Hook:** `useGamificationRanking`

Exibe top 10 pacientes da clínica com layout em três camadas:

- **Pódio (1º-3º):** blocos de altura proporcional à posição, medalhas emoji, avatar com iniciais, nível e XP
- **Destaques (4º-5º):** cards horizontais com todos os indicadores
- **Lista (6º-10º):** linhas compactas com posição, nome, nível, pontos e streak

Dados carregados via RPC `get_gamification_ranking(limit)`. Subscription em `gamification_stats` atualiza o ranking em tempo real quando qualquer paciente ganha XP.

---

### Dashboard do Administrador

**Tela:** `DashboardScreen` · **Hook:** `useDashboardStats`

Quatro contadores carregados em paralelo via `Promise.all`:

| Contador | Consulta |
|----------|----------|
| Total de pacientes | `profiles` WHERE role = PATIENT AND clinic_id |
| Total de nutricionistas | `profiles` WHERE role = NUTRITIONIST AND clinic_id |
| Consultas hoje | `appointments` WHERE data = hoje AND status ≠ CANCELLED |
| Nutricionistas pendentes | `nutritionist_details` WHERE status = PENDING |

Subscription Realtime em `profiles`, `appointments` e `nutritionist_details` mantém os números atualizados. Seções adicionais: consultas acontecendo agora, próxima consulta, ações rápidas (contextuais por role) e card de aprovações pendentes.

---

### Gerenciamento de Nutricionistas (Admin)

**Tela:** `AdminNutritionistsScreen` · **Hook:** `useNutritionists`

Lista todos os nutricionistas da clínica com status de aprovação (APPROVED, PENDING, REJECTED) e CRM/CRN. FAB para convidar novo nutricionista por e-mail, exigindo nome + e-mail + CRM/CRN.

O hook observa mudanças em `profiles` e `nutritionist_details` simultaneamente via dois canais Realtime, garantindo que aprovações refletem imediatamente na lista.

---

### Logs de Auditoria

**Tela:** `AuditLogsScreen` · **Hook:** `useAuditLogs`

Acesso exclusivo do ADMIN. Lista os últimos 50 registros da tabela `audit.unified_logs` (schema separado do `public`), cada entrada contendo:

- Timestamp formatado (data e hora)
- Tabela afetada (`table_name`)
- Operação: INSERT (verde), UPDATE (azul), DELETE (vermelho)
- Role do executor (`actor_role`)

Toque em qualquer entrada abre modal com JSON formatado dos dados `old_data` e `new_data`. Subscription INSERT em `unified_logs` adiciona novos eventos sem necessidade de refresh. Pull-to-refresh disponível.

---

### Configurações da Clínica

**Tela:** `ClinicSettingsScreen` · **Hook:** `useClinicManagement`

Permite ao ADMIN editar nome e telefone da clínica com máscara de telefone em tempo real. Link direto para logs de auditoria. Seção de localização reservada para implementação futura (renderizada desabilitada). Validação obrigatória de nome antes de salvar.

---

### Agenda

**Tela:** `ScheduleScreen` · **Hook:** `useAppointments`

Três modos de visualização (ADMIN e NUTRITIONIST têm acesso a todos; PATIENT somente mensal):

| Modo | Layout |
|------|--------|
| **Diário** | Timeline de 7h às 20h com slots por hora. "Livre" quando sem consulta |
| **Semanal** | Grid de 7 dias com cards de consultas empilhados por dia |
| **Mensal** | Calendário completo com dots indicando dias com consultas |

Navegação por período com `movePeriod(+1/-1)`. Dia atual destacado. `AppointmentCard` exibe paciente/nutricionista, horário, duração e status com cor.

---

## Sprint 4 — IoT + Câmera

### SmartBottle IoT (Rastreamento Automático de Hidratação)

**Tela:** Integrado em `HomeScreen` (paciente) · **Hook:** `useSmartBottle`, `useDeviceStatus`

Conexão MQTT sobre WebSocket para garrafa inteligente. O paciente conecta a garrafa via botão "Conectar" na Home. A partir disso, cada vez que a garrafa detecta consumo de água (>0 mL, ≤2000 mL), publica um payload JSON no tópico `nutriapp/v1/{patientId}/water`:

```json
{ "amountMl": 250, "deviceId": "bottle-001", "timestamp": "2025-06-11T10:30:00Z" }
```

O app consome via hook `useSmartBottle`:
1. Valida o payload (`parseSmartBottlePayload` — JSON, amountMl número, 0 < amountMl ≤ 2000)
2. Insere em `meal_logs` com `source='IOT'`, `category='WATER'`
3. Emite broadcast Supabase Realtime no canal `device-status:{patientId}` com `{ isOnline: true, lastSeen }`
4. Nutricionista recebe badge "💧 Garrafa online" no card do paciente (via `useDeviceStatus`)

Broker público: `wss://broker.emqx.io:8084/mqtt` (app) / `mqtt://broker.emqx.io:1883` (simulador Node.js)

**Setup do Simulador:**
```bash
cd scripts/iot-simulator
npm install
node simulator.js --patient <uuid> [--interval 8]
```

**Permissões:** Nenhuma (MQTT via WebSocket)

### Foto de Refeição (Câmera/Galeria Nativa)

**Telas:** `FreeMealModal` (refeição livre) e `LogItemModal` (prova de item do plano) — ambos em `NutritionScreen`/`PlanDetailScreen` · **Hook:** `useImagePicker`

A foto está disponível em **dois fluxos**:
- **Refeição livre** (`FreeMealModal`): foto anexada a uma refeição registrada fora do plano.
- **Prova de item do plano** (`LogItemModal`): ao confirmar o consumo de um item prescrito, o paciente pode anexar uma foto como comprovação. O `path` é gravado em `meal_logs.photo_path` por um `update` pós-RPC (`usePlanMutations.logItem`); as RPCs `get_today_plan` e `get_patient_plan_summary` retornam `photo_path` para exibir a thumbnail.

Dois botões: "📷 Câmera" (captura) e "🖼 Galeria" (seleção). O app solicita permissão (Android/iOS), abre a picker nativa (expo-image-picker), comprime a imagem a 60% de qualidade e faz upload para Supabase Storage (bucket privado `meal-photos`).

Fluxo:
1. Usuário clica câmera/galeria em `FreeMealModal`
2. `useImagePicker.pickFromCamera()` ou `pickFromGallery()` — solicita permissão
3. Se concedida, lança picker nativa
4. Usuário captura/seleciona imagem → `ImageAsset { uri, width, height }`
5. Clica "Registrar" → `uploadMealPhoto(patientId, uri)`
6. Fetch blob, upload com Supabase Storage
7. Retorna `path: 'patientId/timestamp.jpg'`
8. RPC `log_free_meal` com `photo_path`
9. `MealItemRow` exibe thumbnail via `getSignedPhotoUrl(path)` — signed URL válida 1 hora

**Permissões (iOS/Android):**
- Camera: `NSCameraUsageDescription` (iOS) / `android.permission.CAMERA` (Android)
- Photo Library: `NSPhotoLibraryUsageDescription` (iOS) / `android.permission.READ_EXTERNAL_STORAGE` (Android)

### Testes Inclusos

**4a. `useSmartBottle.payload.test.ts`** — 11 testes da função `parseSmartBottlePayload`
- JSON inválido, tipos incorretos, boundaries (0, -1, 2001), defaults (deviceId, timestamp)

**4b. `useImagePicker.test.ts`** — 6 testes do hook
- Estados iniciais, permissão denied, camera/gallery picker, clearAsset

**4c. `storage.test.ts`** — 4 testes das funções de armazenamento
- Upload success/failure, getSignedPhotoUrl success/failure

**4d. `mqttClient.test.ts`** — 13 testes do wrapper MQTT (paho-mqtt mockado)
- Parse da URL do broker, ciclo de status (connecting → connected / error / disconnected), useSSL, subscribe com QoS 0, chegada de mensagens, disconnect resiliente

Resultado: **123 testes passando em 17 suites** (suíte completa do projeto, incluindo Sprints 3 e 4)

---

### Roteiro do Vídeo de Demonstração

Sequência sugerida (~4 min) cobrindo todos os critérios da rubrica:

1. **Login** (30s) — autenticação do paciente; mostrar sessão persistida (fechar e reabrir o app sem novo login).
2. **SmartBottle IoT** (60s) — na tela Alimentação, conectar a garrafa (card SmartBottle); em outro terminal, rodar `node scripts/iot-simulator/simulator.js --patient <uuid>`; mostrar a barra de água subindo sozinha (sem refresh) e o indicador "via SmartBottle (IoT)".
3. **Realtime nutricionista** (45s) — em outra janela/aba, logar como nutricionista e abrir o detalhe do paciente; mostrar badge "💧 Garrafa online" aparecendo ao vivo e o consumo de água atualizando.
4. **Câmera/galeria** (60s) — registrar refeição livre com foto: negar a permissão da câmera (mostrar mensagem de orientação + fallback galeria), depois conceder e capturar; mostrar thumbnail no log do paciente e no detalhe do nutricionista.
5. **Estados de UI** (30s) — exibir loading/empty/error em telas (ex.: modo avião para erro, lista vazia).
6. **Encerramento** (15s) — visão do Supabase: linhas `source='IOT'` em `meal_logs` e bucket privado `meal-photos`.

---

### Gamificação (transversal)

**Hook:** `useGamification` (shared)

Sistema integrado a múltiplas telas:

| Componente | Onde aparece |
|-----------|-------------|
| `LevelCard` | Home do paciente, Perfil |
| `StreakBadge` | Lista de pacientes, Ranking |
| `XPProgressBar` | Home do paciente |

O hook carrega `points`, `level`, `experience`, `streak_days` de `gamification_stats` e calcula `nextLevelExperience` pela fórmula de progressão de nível. Subscription Realtime atualiza em tempo real ao registrar refeições ou água.

---

## Arquitetura

O projeto segue **Feature-First + Domain-Driven Design (DDD)**.

```
Expo Router (File-based routing)
        │
        ├── AuthGate (redireciona por role ao iniciar)
        │
        ├── (auth)/login         → LoginScreen
        └── (tabs)/              → Tab bar dinâmica por role (RBAC)
              ├── PATIENT       → Home, Nutrição, Progresso, Agenda, Perfil
              ├── NUTRITIONIST  → Home, Pacientes, Ranking, Nutrição, Perfil
              └── ADMIN         → Dashboard, Nutricionistas, Auditoria, Clínica, Perfil
```

### Fluxo de Dados

```
Supabase Auth
      │
      ▼
useAuth (hook) ──► AuthContext ──► Screens
      │
      ▼
Supabase DB (PostgreSQL + RLS)
      │
      ▼
Feature Hooks ──► Components ──► UI
      │
      ▼
Supabase Realtime (subscriptions em tempo real)
```

---

## Estrutura de Pastas

```
.
├── assets/
│   ├── fonts/                    # Fontes customizadas
│   └── images/                   # Ícones e splash screen
│
├── src/
│   ├── app/                      # Expo Router — rotas (páginas)
│   │   ├── _layout.tsx           # Root layout + AuthGate
│   │   ├── (auth)/               # Rotas de autenticação
│   │   │   └── login.tsx
│   │   ├── (tabs)/               # Navegação principal (tab bar)
│   │   │   ├── _layout.tsx       # Layout com tabs por role
│   │   │   ├── home.tsx
│   │   │   ├── nutrition.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── schedule.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── ranking.tsx
│   │   │   ├── nutritionists.tsx
│   │   │   ├── clinic-audit.tsx
│   │   │   └── clinic-settings.tsx
│   │   ├── accept-invite.tsx     # Aceite de convite por link
│   │   ├── meal-plan.tsx         # Editor de plano alimentar
│   │   ├── nutritionist-patients.tsx
│   │   └── patient-progress.tsx
│   │
│   ├── features/                 # Módulos de domínio
│   │   ├── auth/
│   │   │   ├── context/          # AuthContext (Provider global)
│   │   │   ├── domain/           # Tipos: User, AuthState, UserRole
│   │   │   ├── hooks/            # useAuth, useProfileUpdate
│   │   │   └── screens/          # LoginScreen, ProfileScreen, AcceptInviteScreen
│   │   │
│   │   ├── admin/
│   │   │   ├── components/       # DashboardHeader, QuickActionGrid, etc.
│   │   │   ├── domain/           # Tipos admin e dashboard
│   │   │   ├── hooks/            # useDashboardStats, useNutritionists, useAuditLogs
│   │   │   └── screens/          # DashboardScreen, AuditLogsScreen, etc.
│   │   │
│   │   ├── nutritionist/
│   │   │   ├── domain/           # Tipos do nutricionista
│   │   │   ├── hooks/            # useClinicPatients, useGamificationRanking, useMealPlan
│   │   │   └── screens/          # PatientsScreen, RankingScreen, MealPlanEditorScreen
│   │   │
│   │   ├── patient/
│   │   │   ├── domain/           # Tipos do paciente
│   │   │   ├── hooks/            # useProgressMetrics, useTodayLogs, useLogMeal, useLogWater
│   │   │   └── screens/          # HomeScreen, NutritionScreen, ProgressScreen
│   │   │
│   │   ├── calendar/
│   │   │   ├── domain/           # Appointment, Meal, MealPlan
│   │   │   ├── hooks/            # useAppointments
│   │   │   └── screens/          # ScheduleScreen
│   │   │
│   │   └── nutrition/            # Módulo compartilhado de plano nutricional
│   │       ├── components/       # MealSection, LogItemModal, UpsertItemModal, etc.
│   │       ├── context/          # PlanDetailContext
│   │       ├── hooks/            # usePlanDetail, usePlanPermissions
│   │       ├── screens/          # PlanDetailScreen
│   │       └── types.ts          # Tipos do domínio nutricional
│   │
│   └── shared/                   # Infraestrutura e componentes globais
│       ├── components/
│       │   ├── gamification/     # LevelCard, StreakBadge, XPProgressBar
│       │   ├── ui/               # StatCard, PatientCard, AppointmentCard, InlineStatus
│       │   └── PersistentTabBar.tsx
│       ├── domain/
│       │   └── gamification.ts   # GamificationState, Badge, tipos de XP
│       ├── hooks/
│       │   ├── useGamification.ts
│       │   ├── useInviteUser.ts
│       │   └── useAppPreferences.ts  # AsyncStorage para preferências do usuário
│       ├── infrastructure/
│       │   └── supabase/
│       │       ├── client.ts          # Supabase client (AsyncStorage + interceptor)
│       │       ├── database.types.ts  # Tipos gerados do schema PostgreSQL
│       │       └── interceptor.ts     # Injeta X-User-Id nos headers de cada requisição
│       ├── navigation/
│       │   └── tabs.ts           # Mapeamento role → tabs (RBAC)
│       ├── theme/
│       │   ├── tokens.ts         # colors, spacing, radius, fontSize, shadow, timing
│       │   ├── appStyles.ts      # StyleSheet global reutilizável
│       │   └── index.ts
│       └── utils/
│           ├── date.ts           # Formatação de datas
│           ├── format.ts         # Formatação de valores numéricos
│           └── realtime.ts       # Nomes únicos de canal Supabase Realtime
│
├── supabase/
│   ├── migrations/               # 41 arquivos SQL (schema + RLS + triggers)
│   └── functions/
│       └── invite-user/          # Edge Function (Deno) — convite de usuários
│
├── .env.example                  # Template de variáveis de ambiente
├── app.json                      # Configuração Expo
├── package.json
└── tsconfig.json                 # TypeScript strict mode
```

---

## Controle de Acesso (RBAC)

### Camada 1 — Navegação (Frontend)

| Role | Abas disponíveis |
|------|-----------------|
| `PATIENT` | Home, Nutrição, Progresso, Agenda, Perfil |
| `NUTRITIONIST` | Home, Pacientes, Ranking, Nutrição, Perfil |
| `ADMIN` | Dashboard, Nutricionistas, Auditoria, Clínica, Perfil |

### Camada 2 — Banco de Dados (Row Level Security)

Modelo de **carteira por nutricionista** (migration `20260611150000`): o vínculo paciente→nutricionista vive em `patient_details.nutritionist_id` (definido no convite) e é a base de todas as políticas clínicas, via helpers `SECURITY DEFINER` (`is_my_patient`, `get_my_nutritionist`, `clinic_has_medical_consent`).

| Tabela | Admin (clínica) | Nutricionista | Paciente |
|--------|-----------------|---------------|---------|
| `profiles` | Leitura da clínica toda | **Só os próprios pacientes** | **Só o próprio nutricionista** + próprio perfil |
| `meal_plans` / `meal_plan_items` | — | CRUD **só dos próprios pacientes** | Leitura do próprio |
| `meal_logs` | Só com consentimento† | Leitura **só dos próprios pacientes** | CRUD próprio |
| `evolution_logs` | Só com consentimento† | CRUD **só dos próprios pacientes** | Leitura próprio |
| `appointments` | Leitura da clínica (operacional) | CRUD **só da própria agenda** | Leitura próprio |
| `gamification_stats` | Leitura da clínica (não-médico) | **Só os próprios pacientes** | Próprio |
| Storage `meal-photos` | — | Fotos **só dos próprios pacientes** | Própria pasta (`{uid}/`) |
| `audit.unified_logs` | Leitura total | — | — |
| `clinics` | CRUD | Leitura | — |
| `nutritionist_details` | CRUD | Próprio | — |

† **Consentimento:** `patient_details.clinic_access_granted` (default `false`). O nutricionista responsável pode autorizar a clínica a ler os dados clínicos de um paciente específico. Sem essa permissão, admin **nunca** acessa dado médico.

O **ranking gamificado** continua quantificando a clínica inteira via RPC `get_gamification_ranking` (`SECURITY DEFINER`, escopo por clínica) — expõe apenas nome + pontos/nível/streak, nenhum dado clínico.

---

## Persistência Local (AsyncStorage)

| Chave | Conteúdo | Quando atualizado |
|-------|----------|------------------|
| `supabase.auth.token` | Sessão JWT completa (gerenciado pelo Supabase client) | Login / refresh automático |
| `nutriapp_user_id` | ID do usuário autenticado | Login / logout |
| `nutriapp_preferences` | `{ lastEmail, notificationsEnabled }` | Login bem-sucedido |

Os dados persistem após o fechamento do app e são restaurados automaticamente na próxima abertura.

---

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [Expo](https://expo.dev/) | 54.0.33 | Framework React Native |
| [React Native](https://reactnative.dev/) | 0.81.5 | Interface nativa iOS/Android |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.2 | Tipagem estática (strict mode, zero `any`) |
| [Expo Router](https://expo.github.io/router/) | 6.0.23 | Navegação file-based com rotas tipadas |
| [Supabase JS](https://supabase.com/) | 2.105.3 | Auth, Database, Realtime, Edge Functions |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | 2.2.0 | Persistência local de sessão e preferências |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | 4.1.1 | Animações nativas |
| [Lucide React Native](https://lucide.dev/) | 1.14.0 | Biblioteca de ícones |
| [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context) | 5.6.0 | Safe areas iOS/Android |
| [paho-mqtt](https://www.eclipse.org/paho/clients/js/) | 1.1.0 | Conectividade MQTT (IoT SmartBottle) |
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | ~17.0.11 | Câmera e galeria nativa |
| [Jest](https://jestjs.io/) | 30.x | Testes unitários |

---

## Screenshots

### Autenticação

| Login | Sessão Persistida (AsyncStorage / LocalStorage) |
|:-----:|:-----------------------------------------------:|
| ![Login](assets/sprint%204/00%20-%20login%20v1.png) | ![Sessão persistida](assets/sprint%204/00%20-%20login%20v2%20-%20localstorage.png) |

### Paciente

| Dashboard | Dashboard (rolagem) | Agenda |
|:---------:|:-------------------:|:------:|
| ![Dashboard 1](assets/sprint%204/paci%20-%20dashboard%20v1.png) | ![Dashboard 2](assets/sprint%204/paci%20-%20dashboard%20v2.png) | ![Agenda](assets/sprint%204/paci%20-%20agenda.png) |

| Plano Alimentar | Registrar Refeição Definida | Foto da Refeição (Câmera/Galeria) |
|:---------------:|:---------------------------:|:---------------------------------:|
| ![Plano](assets/sprint%204/paci%20-%20plano%20alimentar.png) | ![Registrar definida 1](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20registrar%20refei%C3%A7%C3%A3o%20definida%20v1.png) | ![Registrar com foto](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20registrar%20refei%C3%A7%C3%A3o%20definida%20v2%20-%20foto.png) |

| Definida (confirmação) | Refeição Livre | Refeição Livre (registro) |
|:----------------------:|:--------------:|:-------------------------:|
| ![Registrar definida 3](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20registrar%20refei%C3%A7%C3%A3o%20definida%20v3.png) | ![Refeição livre](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20refei%C3%A7%C3%A3o%20livre.png) | ![Registrar livre](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20refei%C3%A7%C3%A3o%20livre%20-%20registrar%20refei%C3%A7%C3%A3o%20livre.png) |

| SmartBottle IoT (conectando) | Evolução (Gráficos) | Evolução (Detalhes) |
|:----------------------------:|:-------------------:|:-------------------:|
| ![IoT conectando](assets/sprint%204/paci%20-%20plano%20alimentar%20-%20refei%C3%A7%C3%A3o%20livre%20-%20IOT%20-%20tentando%20conectar.png) | ![Evolução 1](assets/sprint%204/paci%20-%20evolu%C3%A7%C3%A3o%20v1.png) | ![Evolução 2](assets/sprint%204/paci%20-%20evolu%C3%A7%C3%A3o%20v2.png) |

| Evolução (Resumo) | Perfil | Perfil (edição) |
|:-----------------:|:------:|:---------------:|
| ![Evolução 3](assets/sprint%204/paci%20-%20evolu%C3%A7%C3%A3o%20v3.png) | ![Perfil 1](assets/sprint%204/paci%20-%20perfil%20v1.png) | ![Perfil 2](assets/sprint%204/paci%20-%20perfil%20v2.png) |

### Nutricionista

| Dashboard | Dashboard (rolagem) | Ranking |
|:---------:|:-------------------:|:-------:|
| ![Dashboard 1](assets/sprint%204/nutri%20-%20dashboard%20v1.png) | ![Dashboard 2](assets/sprint%204/nutri%20-%20dashboard%20v2.png) | ![Ranking](assets/sprint%204/nutri%20-%20ranking.png) |

| Pacientes | Convidar Paciente | Plano Alimentar |
|:---------:|:-----------------:|:---------------:|
| ![Pacientes](assets/sprint%204/nutri%20-%20pacientes.png) | ![Convidar](assets/sprint%204/nutri%20-%20pacientes%20-%20convidar.png) | ![Plano](assets/sprint%204/nutri%20-%20pacientes%20-%20plano%20alimentar.png) |

| Novo Plano (refeição) | Editar Plano (refeição) | Evolução do Paciente |
|:---------------------:|:-----------------------:|:--------------------:|
| ![Novo plano](assets/sprint%204/nutri%20-%20pacientes%20-%20plano%20alimentar%20-%20novo%20plano%20-%20refei%C3%A7%C3%A3o.png) | ![Editar plano](assets/sprint%204/nutri%20-%20pacientes%20-%20plano%20alimentar%20-%20editar%20plano%20-%20refei%C3%A7%C3%A3o.png) | ![Evolução 1](assets/sprint%204/nutri%20-%20pacientes%20-%20evolu%C3%A7%C3%A3o%20v1.png) |

| Evolução (Gráficos) | Evolução (Detalhes) | Evolução (Histórico) |
|:-------------------:|:-------------------:|:--------------------:|
| ![Evolução 2](assets/sprint%204/nutri%20-%20pacientes%20-%20evolu%C3%A7%C3%A3o%20v2.png) | ![Evolução 3](assets/sprint%204/nutri%20-%20pacientes%20-%20evolu%C3%A7%C3%A3o%20v3.png) | ![Evolução 4](assets/sprint%204/nutri%20-%20pacientes%20-%20evolu%C3%A7%C3%A3o%20v4.png) |

| Agenda (Diária) | Agenda (Semanal) | Agenda (Mensal) |
|:---------------:|:----------------:|:---------------:|
| ![Agenda diária](assets/sprint%204/nutri-%20agenda%20-%20diaria%20v1.png) | ![Agenda semanal](assets/sprint%204/nutri-%20agenda%20-%20semanal%20v1.png) | ![Agenda mensal](assets/sprint%204/nutri-%20agenda%20-%20mensal.png) |

| Perfil | Perfil (edição) |
|:------:|:---------------:|
| ![Perfil 1](assets/sprint%204/nutri%20-%20perfil%20v1.png) | ![Perfil 2](assets/sprint%204/nutri%20-%20perfil%20v2.png) |

### Administrador

| Dashboard | Dashboard (rolagem) | Clínica |
|:---------:|:-------------------:|:-------:|
| ![Dashboard 1](assets/sprint%204/adm%20-%20dashboard%20v1.png) | ![Dashboard 2](assets/sprint%204/adm%20-%20dashboard%20v2.png) | ![Clínica](assets/sprint%204/adm%20-%20clinica.png) |

| Equipe (Nutricionistas) | Convidar Nutricionista | Detalhe do Nutricionista |
|:-----------------------:|:----------------------:|:------------------------:|
| ![Equipe](assets/sprint%204/adm%20-%20equipe.png) | ![Convidar nutri](assets/sprint%204/adm%20-%20equipe%20-%20convidadar%20nutri.png) | ![Detalhe nutri](assets/sprint%204/adm%20-%20equipe%20-%20detalhe%20do%20nutri.png) |

| Agenda (Diária) | Agenda (Semanal) | Agenda (Mensal) |
|:---------------:|:----------------:|:---------------:|
| ![Agenda diária](assets/sprint%204/adm%20-%20agenda%20-%20diario%20v1.png) | ![Agenda semanal](assets/sprint%204/adm%20-%20agenda%20-%20semanal%20v1.png) | ![Agenda mensal](assets/sprint%204/adm%20-%20agenda%20-%20mensal.png) |

| Perfil | Perfil (rolagem) | Perfil (edição) |
|:------:|:----------------:|:---------------:|
| ![Perfil 1](assets/sprint%204/adm%20-%20perfil%20v1.png) | ![Perfil 2](assets/sprint%204/adm%20-%20perfil%20v2.png) | ![Perfil 3](assets/sprint%204/adm%20-%20perfil%20v3%20-%20edi%C3%A7%C3%A3o.png) |

---

## Banco de Dados

O schema completo está em `supabase/migrations/` (41 arquivos SQL). Principais tabelas:

| Tabela | Descrição |
|--------|-----------|
| `clinics` | Clínicas cadastradas |
| `profiles` | Usuários (Admin, Nutricionista, Paciente) |
| `patient_details` | Vínculo paciente→nutricionista (`nutritionist_id`) e consentimento clínico (`clinic_access_granted`) — base do RBAC |
| `nutritionist_details` | CRM/CRN e status de aprovação |
| `appointments` | Consultas agendadas |
| `meal_plans` / `meal_plan_items` | Planos alimentares e seus itens |
| `meal_logs` | Registros de refeições **e** de água. Colunas: `category` (`MEAL`/`WATER`/...), `source` (`MANUAL`/`IOT`), `photo_path` |
| `evolution_logs` | Registros de evolução clínica do paciente |
| `gamification_stats` | Pontos, XP, level e streak |
| `audit.unified_logs` | Auditoria de todas as operações do sistema (schema `audit`) |
| `audit.transaction_logs` | Trilha de transações (schema `audit`) |
| `archive.meal_logs_history` | Histórico arquivado de `meal_logs` (schema `archive`) |

> **Observação:** não existem tabelas separadas para água (`water_logs`), conquistas (`badges`) ou fotos (`nutrition_photos`/`smart_bottle_logs`). Água e leituras IoT são registradas em `meal_logs` (diferenciadas por `category`/`source`) e as fotos vivem na coluna `meal_logs.photo_path` + bucket `meal-photos`. As tabelas `nutrition_photos`/`smart_bottle_logs` chegaram a ser criadas e foram removidas na migration `20260611140000_sprint4_drop_unused_tables.sql`.

---

## Limitações Conhecidas

- **Localização da clínica:** a seção em `ClinicSettingsScreen` está reservada para implementação futura (renderizada desabilitada).
- **SmartBottle:** o hardware é simulado via `scripts/iot-simulator` publicando no broker MQTT público (`broker.emqx.io`). Não há dispositivo físico provisionado.
- **Broker MQTT público:** sem autenticação/ACL — adequado para demonstração acadêmica, não para produção.
- **Edge Function `invite-user`:** roda em runtime Deno; os erros de typecheck em `supabase/functions/` (globais `Deno`, imports `esm.sh`) são esperados e não afetam o bundle do app (`src/`).
- **Screenshots:** a galeria ao final cobre todos os perfis e fluxos, incluindo Sprint 4 (SmartBottle/IoT e foto de refeição). A demonstração em movimento está no vídeo.

---

## Licença

Projeto acadêmico — FIAP · 3ESPR · Sprint 3 + Sprint 4 · 2026.
