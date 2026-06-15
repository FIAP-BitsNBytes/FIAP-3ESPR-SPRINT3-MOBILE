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

/** Mock de Response com `ok`/`status` (a leitura agora valida response.ok). */
const mockFetchOk = (blob: Blob) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    blob: jest.fn().mockResolvedValue(blob),
  });
};

describe('uploadMealPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads the photo and returns the path under <patientId>/', async () => {
    mockFetchOk(new Blob(['fake-image-data'], { type: 'image/jpeg' }));
    const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'userId/123.jpg' }, error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'blob:http://localhost:8081/abc');

    expect(result).toEqual({ path: expect.stringMatching(/^userId\/\d+\.jpg$/) });
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it('derives the extension from the MIME type, not the URI (no blob: garbage)', async () => {
    mockFetchOk(new Blob(['x'], { type: 'image/png' }));
    const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    // URI sem extensão (blob URL) — não deve virar parte do nome do arquivo.
    const result = await uploadMealPhoto('userId', 'blob:http://localhost:8081/d2a3f858');

    expect(result).toEqual({ path: expect.stringMatching(/^userId\/\d+\.png$/) });
    const [filePath, , options] = mockUpload.mock.calls[0];
    expect(filePath).not.toContain('blob:');
    expect(filePath).toMatch(/\.png$/);
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });
  });

  it('falls back to jpg when the blob has no/unknown MIME type', async () => {
    mockFetchOk(new Blob(['x'], { type: '' }));
    const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'file:///tmp/x');

    expect(result).toEqual({ path: expect.stringMatching(/^userId\/\d+\.jpg$/) });
    const [, , options] = mockUpload.mock.calls[0];
    expect(options).toMatchObject({ contentType: 'image/jpeg' });
  });

  it('returns an error and does NOT upload when the blob is empty', async () => {
    mockFetchOk(new Blob([], { type: 'image/jpeg' }));
    const mockUpload = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'blob:http://localhost:8081/empty');

    expect(result).toEqual({ error: expect.stringContaining('vazia') });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('returns an error when the fetch response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, blob: jest.fn() });
    const mockUpload = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'blob:http://localhost:8081/gone');

    expect(result).toEqual({ error: expect.stringContaining('404') });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('returns a timeout error when the fetch is aborted (no infinite hang)', async () => {
    // Simula o AbortController disparando: fetch rejeita com AbortError.
    (global.fetch as jest.Mock).mockRejectedValue(
      new DOMException('The operation was aborted.', 'AbortError'),
    );
    const mockUpload = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'blob:http://localhost:8081/hang');

    expect(result).toEqual({ error: expect.stringContaining('Tempo esgotado') });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('returns the Supabase error message when the upload fails', async () => {
    mockFetchOk(new Blob(['x'], { type: 'image/jpeg' }));
    const mockUpload = jest.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const result = await uploadMealPhoto('userId', 'file:///tmp/x.jpg');

    expect(result).toEqual({ error: 'Upload failed' });
  });

  it('passes an AbortSignal to fetch so it can never hang forever', async () => {
    mockFetchOk(new Blob(['x'], { type: 'image/jpeg' }));
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'p' }, error: null }),
    });

    await uploadMealPhoto('userId', 'blob:http://localhost:8081/abc');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init).toHaveProperty('signal');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('getSignedPhotoUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the signed URL on success', async () => {
    const mockSignedUrl = 'https://signed.url/path?token=abc123';
    const mockCreateSignedUrl = jest.fn().mockResolvedValue({ data: { signedUrl: mockSignedUrl }, error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: mockCreateSignedUrl });

    const result = await getSignedPhotoUrl('userId/123.jpg');

    expect(result).toBe(mockSignedUrl);
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('userId/123.jpg', 3600);
  });

  it('returns null on failure', async () => {
    const mockCreateSignedUrl = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: mockCreateSignedUrl });

    const result = await getSignedPhotoUrl('userId/123.jpg');

    expect(result).toBeNull();
  });
});
