import { describe, expect, it } from 'vitest';
import { statusFromDlc } from '../src/lib/dlc';

describe('statusFromDlc', () => {
  it('returns OK when far from dlc', () => {
    const now = new Date('2026-03-01T08:00:00.000Z');
    const dlc = new Date('2026-03-10T00:00:00.000Z');
    expect(statusFromDlc(dlc, 2, now)).toBe('OK');
  });

  it('returns SOON inside threshold', () => {
    const now = new Date('2026-03-08T08:00:00.000Z');
    const dlc = new Date('2026-03-10T00:00:00.000Z');
    expect(statusFromDlc(dlc, 2, now)).toBe('SOON');
  });

  it('returns EXPIRED after dlc date', () => {
    const now = new Date('2026-03-12T08:00:00.000Z');
    const dlc = new Date('2026-03-10T00:00:00.000Z');
    expect(statusFromDlc(dlc, 2, now)).toBe('EXPIRED');
  });
});
