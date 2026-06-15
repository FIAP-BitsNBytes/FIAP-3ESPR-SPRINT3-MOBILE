import { supabase } from './client';

const BUCKET = 'meal-photos';

/** Extensão a partir do MIME (bucket só aceita jpeg/png/webp). */
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const FETCH_TIMEOUT_MS = 15000;

/**
 * Lê a imagem da URI como Blob. Em alguns ambientes (web) o `fetch` de uma
 * blob:/data: URL pode nunca resolver — o AbortController garante que a
 * Promise sempre termina (sucesso, erro ou timeout) e o spinner não trava.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(uri, { signal: controller.signal });
    if (!response.ok) throw new Error(`Falha ao ler a imagem (HTTP ${response.status}).`);
    return await response.blob();
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadMealPhoto(
  patientId: string,
  uri: string,
): Promise<{ path: string } | { error: string }> {
  let blob: Blob;
  try {
    blob = await uriToBlob(uri);
  } catch (e) {
    // `name === 'AbortError'` cobre tanto DOMException (browser) quanto Error
    // (Hermes/RN). Evita `instanceof DOMException`, que pode nem existir nativo.
    const name = typeof e === 'object' && e !== null && 'name' in e ? (e as { name?: unknown }).name : undefined;
    const aborted = name === 'AbortError';
    return {
      error: aborted
        ? 'Tempo esgotado ao processar a imagem. Tente outra foto.'
        : e instanceof Error ? e.message : 'Não foi possível ler a imagem.',
    };
  }

  if (blob.size === 0) return { error: 'Imagem vazia ou inválida.' };

  // A extensão deve vir do MIME, não da URI: em blob:/data: URLs (web) a uri
  // não tem extensão e parsear por "." gerava nomes inválidos como
  // "<ts>.blob:http://localhost...". Default jpg quando o tipo é desconhecido.
  const contentType = blob.type || 'image/jpeg';
  const ext = EXT_BY_MIME[contentType] ?? 'jpg';
  const filePath = `${patientId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType,
      upsert: false,
    });

  if (error) return { error: error.message };
  return { path: filePath };
}

export async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
