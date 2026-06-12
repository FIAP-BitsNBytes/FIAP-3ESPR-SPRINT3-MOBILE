import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export type PickerStatus = 'idle' | 'denied' | 'granted';

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
}

export interface UseImagePickerReturn {
  asset: ImageAsset | null;
  status: PickerStatus;
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  clearAsset: () => void;
}

export function useImagePicker(): UseImagePickerReturn {
  const [asset, setAsset] = useState<ImageAsset | null>(null);
  const [status, setStatus] = useState<PickerStatus>('idle');

  const pickFromCamera = async () => {
    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      setStatus('denied');
      return;
    }
    setStatus('granted');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setAsset({ uri: a.uri, width: a.width, height: a.height, fileName: a.fileName ?? undefined });
    }
  };

  const pickFromGallery = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      setStatus('denied');
      return;
    }
    setStatus('granted');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setAsset({ uri: a.uri, width: a.width, height: a.height, fileName: a.fileName ?? undefined });
    }
  };

  const clearAsset = () => {
    setAsset(null);
    setStatus('idle');
  };

  return { asset, status, pickFromCamera, pickFromGallery, clearAsset };
}
