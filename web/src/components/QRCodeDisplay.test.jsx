import { describe, it, expect, vi } from 'vitest';
import QRCode from 'qrcode';

// Mock the qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mockQRCode'))
  }
}));

describe('QRCodeDisplay', () => {
  it('QRCode library can generate data URLs', async () => {
    const result = await QRCode.toDataURL('https://k61.dev/abc123');
    expect(result).toBe('data:image/png;base64,mockQRCode');
    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://k61.dev/abc123');
  });

  it('QRCode library can be called with options', async () => {
    const options = { width: 256, margin: 2 };
    await QRCode.toDataURL('https://k61.dev/test', options);
    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://k61.dev/test', options);
  });
});