/**
 * Unit tests for API utilities
 */

import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './api';

describe('getErrorMessage', () => {
  it('returns string error directly', () => {
    expect(getErrorMessage({ error: 'Something went wrong' })).toBe('Something went wrong');
  });

  it('extracts message from error object', () => {
    expect(getErrorMessage({ error: { code: 'ERR', message: 'Detailed error' } })).toBe('Detailed error');
  });

  it('returns fallback when no error', () => {
    expect(getErrorMessage({}, 'Fallback message')).toBe('Fallback message');
  });

  it('returns default fallback when none provided', () => {
    expect(getErrorMessage({})).toBe('An error occurred');
  });

  it('handles null error object', () => {
    expect(getErrorMessage({ error: null })).toBe('An error occurred');
  });
});
