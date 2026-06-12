# Sprint 4 — SmartBottle IoT + Foto de Refeição

## Arquitetura

### Visão Geral

Integração IoT via MQTT (WebSocket) para rastreamento automático de hidratação + API nativa câmera/galeria para foto de refeições.

### Componentes

| Componente | Responsabilidade |
|---|---|
| `mqttClient.ts` | Factory para cliente MQTT (paho-mqtt), gerencia conexão WS |
| `useSmartBottle` | Lifecycle MQTT + validação de payload + insert em meal_logs |
| `useDeviceStatus` | Subscription broadcast Supabase para status da garrafa |
| `useImagePicker` | Permissões + câmera/galeria via expo-image-picker |
| `storage.ts` | Upload/download signed URLs para bucket meal-photos |
| `SmartBottleCard` | UI do card IoT (status, leituras, conectar/desconectar) |
| `FreeMealModal` | Modal com integração de foto (pick + preview + upload) |

## Fluxo de Dados

### IoT (MQTT → Supabase → UI)

```
Simulador Node (publish)
  ↓
MQTT Broker (emqx.io)
  ↓
App (useSmartBottle.handleMessage)
  ↓
Validação (parseSmartBottlePayload)
  ↓
INSERT meal_logs (source='IOT', category='WATER')
  ↓
Supabase Realtime (useTodayLogs subscription)
  ↓
UI re-render (waterMl atualizado)
  ↓
Nutricionista (useDeviceStatus broadcast listener)
  ↓
Badge "💧 Garrafa online"
```

### Foto de Refeição

```
Paciente (FreeMealModal)
  ↓
expo-image-picker (câmera ou galeria)
  ↓
Permissão concedida/negada
  ↓
ImageAsset { uri, width, height }
  ↓
uploadMealPhoto (fetch + Supabase Storage)
  ↓
path: 'patientId/timestamp.jpg'
  ↓
log_free_meal RPC + UPDATE photo_path
  ↓
MealItemRow thumbnail (getSignedPhotoUrl)
```

## Validação de Payload MQTT

### Função `parseSmartBottlePayload`

```typescript
export function parseSmartBottlePayload(
  payloadString: string,
): { amountMl: number; deviceId: string; timestamp: string } | null {
  // Testa:
  // 1. JSON válido
  // 2. Campo 'amountMl' presente e número
  // 3. 0 < amountMl <= 2000
  // 4. Usa deviceId ou 'unknown'
  // 5. Usa timestamp ou ISO now
}
```

Casos testados (em `useSmartBottle.payload.test.ts`):
- JSON inválido → null
- amountMl ausente → null
- amountMl não é número → null
- amountMl = 0, -1 (boundary) → null
- amountMl = 2001 (boundary) → null
- amountMl válido com/sem deviceId e timestamp → retorna objeto
- Valores padrão (deviceId='unknown', timestamp=now) → gerados corretamente

## Testes Jest

### 4a. useSmartBottle Payload Validation
**Arquivo**: `src/features/patient/hooks/__tests__/useSmartBottle.payload.test.ts`
- 11 testes covering JSON parsing, boundary conditions, defaults

### 4b. useImagePicker
**Arquivo**: `src/shared/hooks/__tests__/useImagePicker.test.ts`
- 6 testes covering permission flows, camera/gallery selection, clearAsset

### 4c. Storage (uploadMealPhoto, getSignedPhotoUrl)
**Arquivo**: `src/shared/infrastructure/supabase/__tests__/storage.test.ts`
- 4 testes covering upload success/failure, signed URL generation

## Verificação RLS

### `meal_logs`
- **INSERT**: `auth.uid() = patient_id` — paciente só insere próprios logs
- **SELECT**: paciente vê apenas seus logs; nutricionista vê logs de pacientes da mesma clínica (via clinic_members)

### `storage.objects` (bucket `meal-photos`)
- **INSERT**: `(storage.foldername(name))[1] = auth.uid()::text` — paciente só faz upload em sua pasta
- **SELECT (paciente)**: idem, só lê própria pasta
- **SELECT (nutricionista)**: `EXISTS (SELECT 1 FROM clinic_members WHERE ... patient_id = ...)` — só vê fotos de pacientes vinculados

## Setup do Simulador

```bash
cd scripts/iot-simulator
npm install
node simulator.js --patient <uuid-do-paciente> [--interval 8]
```

Broker público (acadêmico): 
- App: `wss://broker.emqx.io:8084/mqtt`
- Simulador: `mqtt://broker.emqx.io:1883`

## Checklist de Completude

- [x] Extract `parseSmartBottlePayload` function
- [x] Refactor `useSmartBottle.handleMessage` to use extracted function
- [x] Create 11 payload validation tests (coverage: JSON, types, boundaries, defaults)
- [x] Create 6 useImagePicker tests (permission flows, camera/gallery, clear)
- [x] Create 4 storage tests (upload success/failure, signed URL success/failure)
- [x] All 104 tests pass (baseline 93 + 11)
- [x] TSC: zero errors on application code
- [x] Audit doc: architecture, data flow, RLS verification, rubric mapping

## Próximas Etapas

1. README.md — Adicionar seção Sprint 4
2. Integração contínua — Vercel preview + staging environment
3. E2E tests — Playwright para fluxo completo IoT + foto
