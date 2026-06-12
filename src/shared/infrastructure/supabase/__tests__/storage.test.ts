import { uploadMealPhoto, getSignedPhotoUrl } from '../storage';
import { supabase } from '../client';

jest.mock('../client', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

global.fetch = jest.fn();

describe('uploadMealPhoto and getSignedPhotoUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload meal photo successfully and return path', async () => {
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    const mockUri = 'file:///path/to/image.jpg';

    (global.fetch as jest.Mock).mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    });

    const mockUpload = jest.fn().mockResolvedValue({
      data: { path: 'userId/timestamp.jpg' },
      error: null,
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: mockUpload,
    });

    const result = await uploadMealPhoto('userId', mockUri);

    expect(result).toEqual({ path: expect.stringContaining('userId/') });
    expect(mockUpload).toHaveBeenCalled();
  });

  it('should return error object when upload fails', async () => {
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    const mockUri = 'file:///path/to/image.jpg';

    (global.fetch as jest.Mock).mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    });

    const mockUpload = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Upload failed' },
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: mockUpload,
    });

    const result = await uploadMealPhoto('userId', mockUri);

    expect(result).toEqual({ error: 'Upload failed' });
  });

  it('should return signed URL when getSignedPhotoUrl succeeds', async () => {
    const mockSignedUrl = 'https://signed.url/path?token=abc123';

    const mockCreateSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: mockSignedUrl },
      error: null,
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrl: mockCreateSignedUrl,
    });

    const result = await getSignedPhotoUrl('userId/timestamp.jpg');

    expect(result).toBe(mockSignedUrl);
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('userId/timestamp.jpg', 3600);
  });

  it('should return null when getSignedPhotoUrl fails', async () => {
    const mockCreateSignedUrl = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Signed URL creation failed' },
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrl: mockCreateSignedUrl,
    });

    const result = await getSignedPhotoUrl('userId/timestamp.jpg');

    expect(result).toBeNull();
  });
});
