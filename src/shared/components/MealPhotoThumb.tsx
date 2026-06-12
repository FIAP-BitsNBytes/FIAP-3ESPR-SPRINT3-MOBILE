import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getSignedPhotoUrl } from '@/shared/infrastructure/supabase/storage';
import { colors, radius } from '@/shared/theme';

interface MealPhotoThumbProps {
  /** Storage path returned by uploadMealPhoto (e.g. "<patientId>/<timestamp>.jpg"). */
  photoPath: string;
  /** Side length in dp. Defaults to 60. */
  size?: number;
}

/**
 * Renders a square thumbnail for a meal-log photo stored in the `meal-photos` bucket.
 * Fetches a 1-hour signed URL on mount (and when `photoPath` changes) and shows a
 * placeholder while the URL is loading.
 */
export function MealPhotoThumb({ photoPath, size = 60 }: MealPhotoThumbProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSignedPhotoUrl(photoPath).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => { active = false; };
  }, [photoPath]);

  const boxStyle = { width: size, height: size, borderRadius: radius.sm };

  if (!url) return <View style={[boxStyle, styles.placeholder]} />;
  return <Image source={{ uri: url }} style={boxStyle} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.surfaceHigh },
});
