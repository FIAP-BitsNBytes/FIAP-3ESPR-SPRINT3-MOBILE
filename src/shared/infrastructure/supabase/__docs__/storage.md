# Supabase Storage — Meal Photos

## Resumo

Módulo de infraestrutura para gerenciar o upload e download de fotos de refeições no bucket `meal-photos` do Supabase Storage.

## Funções

### `uploadMealPhoto(patientId: string, uri: string)`

Faz upload de uma imagem local para o bucket `meal-photos`.

**Parâmetros:**
- `patientId` — ID do paciente (usado como diretório no bucket)
- `uri` — URI local da imagem (ex: `file://...` ou `data://...`)

**Retorna:**
- `{ path: string }` — Caminho do arquivo no bucket (ex: `patient-id/1718000000.jpg`)
- `{ error: string }` — Mensagem de erro se o upload falhar

**Fluxo:**
1. Faz fetch da URI local como blob
2. Extrai extensão do arquivo
3. Gera nome único baseado em timestamp
4. Faz upload com tipo MIME detectado

### `getSignedPhotoUrl(path: string)`

Gera uma URL assinada (válida por 1 hora) para acessar a foto no bucket.

**Parâmetros:**
- `path` — Caminho da imagem (ex: `patient-id/1718000000.jpg`)

**Retorna:**
- `string | null` — URL assinada, ou `null` se falhar

## Bucket Configuration

- **Nome:** `meal-photos`
- **Permissões RLS:**
  - Usuários podem fazer upload em `{patient_id}/*`
  - URLs assinadas são usadas para acesso público temporário

## Integrações

- Chamado por `FreeMealModal` após seleção de imagem
- URL assinada usada em `NutritionScreen` para exibir thumbnails
- Caminho armazenado em `meal_logs.photo_path`
