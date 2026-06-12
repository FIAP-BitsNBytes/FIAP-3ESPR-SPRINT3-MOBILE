import { renderHook, act } from '@testing-library/react-native';
import { useImagePicker } from '../useImagePicker';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

describe('useImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with asset null and status idle', () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.asset).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('should set status to denied when camera permission is denied', async () => {
    const { result } = renderHook(() => useImagePicker());

    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    await act(async () => {
      await result.current.pickFromCamera();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.asset).toBeNull();
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('should set status to denied when gallery permission is denied', async () => {
    const { result } = renderHook(() => useImagePicker());

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    await act(async () => {
      await result.current.pickFromGallery();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.asset).toBeNull();
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('should set status to granted and keep asset null when user cancels camera', async () => {
    const { result } = renderHook(() => useImagePicker());

    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });

    await act(async () => {
      await result.current.pickFromCamera();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.asset).toBeNull();
  });

  it('should set asset when gallery image is selected with granted permission', async () => {
    const { result } = renderHook(() => useImagePicker());

    const mockAsset = {
      uri: 'file:///path/to/image.jpg',
      width: 800,
      height: 600,
      fileName: 'image.jpg',
    };

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    await act(async () => {
      await result.current.pickFromGallery();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.asset).not.toBeNull();
    expect(result.current.asset?.uri).toBe('file:///path/to/image.jpg');
    expect(result.current.asset?.width).toBe(800);
    expect(result.current.asset?.height).toBe(600);
  });

  it('should clear asset and reset status to idle after clearAsset', async () => {
    const { result } = renderHook(() => useImagePicker());

    const mockAsset = {
      uri: 'file:///path/to/image.jpg',
      width: 800,
      height: 600,
      fileName: 'image.jpg',
    };

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    await act(async () => {
      await result.current.pickFromGallery();
    });

    expect(result.current.asset).not.toBeNull();
    expect(result.current.status).toBe('granted');

    act(() => {
      result.current.clearAsset();
    });

    expect(result.current.asset).toBeNull();
    expect(result.current.status).toBe('idle');
  });
});
