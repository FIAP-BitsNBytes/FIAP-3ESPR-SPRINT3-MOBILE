import { supabase } from './client';

const BUCKET = 'meal-photos';

export async function uploadMealPhoto(
  patientId: string,
  uri: string,
): Promise<{ path: string } | { error: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${patientId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || 'image/jpeg',
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
