/**
 * Unit tests for utility functions
 */

import { generateId, isValidId, isValidUrl, isValidEmail, getUrlPartitionKey } from './utils';

describe('generateId', () => {
  it('generates ID of specified length', () => {
    const id = generateId(4);
    expect(id).toHaveLength(4);
  });

  it('generates ID with default length of 4', () => {
    const id = generateId();
    expect(id).toHaveLength(4);
  });

  it('generates base62 characters only', () => {
    const id = generateId(10);
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId(4));
    }
    // With 62^4 = 14.7M possibilities, 100 IDs should be unique
    expect(ids.size).toBe(100);
  });
});

describe('isValidId', () => {
  it('accepts valid base62 IDs', () => {
    expect(isValidId('abc')).toBe(true);
    expect(isValidId('ABC')).toBe(true);
    expect(isValidId('123')).toBe(true);
    expect(isValidId('aB1')).toBe(true);
    expect(isValidId('PRtj')).toBe(true);
  });

  it('rejects empty IDs', () => {
    expect(isValidId('')).toBe(false);
  });

  it('rejects IDs longer than 10 chars', () => {
    expect(isValidId('12345678901')).toBe(false);
  });

  it('rejects IDs with special characters', () => {
    expect(isValidId('abc-def')).toBe(false);
    expect(isValidId('abc_def')).toBe(false);
    expect(isValidId('abc.def')).toBe(false);
    expect(isValidId('abc def')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts valid HTTP URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
  });

  it('accepts valid HTTPS URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.co.uk')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('getUrlPartitionKey', () => {
  it('returns first 2 chars for IDs >= 2 chars', () => {
    expect(getUrlPartitionKey('abcd')).toBe('ab');
    expect(getUrlPartitionKey('PRtj')).toBe('PR');
  });

  it('returns full ID for single-char IDs', () => {
    expect(getUrlPartitionKey('a')).toBe('a');
  });
});
