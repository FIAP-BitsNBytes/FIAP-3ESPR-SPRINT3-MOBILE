// Mock AsyncStorage before importing any module that uses it
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/shared/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

import { parseSmartBottlePayload } from '../useSmartBottle';

describe('parseSmartBottlePayload', () => {
  it('should return null for invalid JSON', () => {
    const result = parseSmartBottlePayload('not json');
    expect(result).toBeNull();
  });

  it('should return null for JSON without amountMl', () => {
    const result = parseSmartBottlePayload(JSON.stringify({ deviceId: 'dev-1' }));
    expect(result).toBeNull();
  });

  it('should return null when amountMl is not a number', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 'not-a-number', deviceId: 'dev-1' })
    );
    expect(result).toBeNull();
  });

  it('should return null when amountMl equals 0 (boundary)', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 0, deviceId: 'dev-1' })
    );
    expect(result).toBeNull();
  });

  it('should return null when amountMl is negative', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: -1, deviceId: 'dev-1' })
    );
    expect(result).toBeNull();
  });

  it('should return null when amountMl exceeds 2000 (boundary)', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 2001, deviceId: 'dev-1' })
    );
    expect(result).toBeNull();
  });

  it('should return payload for valid amountMl = 1 (minimum valid)', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 1, deviceId: 'dev-1', timestamp: '2025-06-11T10:00:00Z' })
    );
    expect(result).not.toBeNull();
    expect(result?.amountMl).toBe(1);
    expect(result?.deviceId).toBe('dev-1');
    expect(result?.timestamp).toBe('2025-06-11T10:00:00Z');
  });

  it('should return payload for valid amountMl = 2000 (maximum valid)', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 2000, deviceId: 'dev-1', timestamp: '2025-06-11T10:00:00Z' })
    );
    expect(result).not.toBeNull();
    expect(result?.amountMl).toBe(2000);
    expect(result?.deviceId).toBe('dev-1');
    expect(result?.timestamp).toBe('2025-06-11T10:00:00Z');
  });

  it('should return payload with provided deviceId and timestamp', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({
        amountMl: 250,
        deviceId: 'smart-bottle-001',
        timestamp: '2025-06-11T10:30:00Z',
      })
    );
    expect(result).not.toBeNull();
    expect(result?.amountMl).toBe(250);
    expect(result?.deviceId).toBe('smart-bottle-001');
    expect(result?.timestamp).toBe('2025-06-11T10:30:00Z');
  });

  it('should return deviceId as "unknown" when not provided', () => {
    const result = parseSmartBottlePayload(
      JSON.stringify({ amountMl: 150, timestamp: '2025-06-11T10:00:00Z' })
    );
    expect(result).not.toBeNull();
    expect(result?.deviceId).toBe('unknown');
    expect(result?.amountMl).toBe(150);
  });

  it('should use current timestamp when not provided', () => {
    const beforeCall = new Date();
    const result = parseSmartBottlePayload(JSON.stringify({ amountMl: 500, deviceId: 'dev-1' }));
    const afterCall = new Date();

    expect(result).not.toBeNull();
    expect(result?.timestamp).toBeDefined();
    const resultTime = new Date(result?.timestamp || '').getTime();
    expect(resultTime).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(resultTime).toBeLessThanOrEqual(afterCall.getTime());
  });
});
