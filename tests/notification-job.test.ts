import { describe, expect, it } from 'vitest';
import { classifyNotification } from '../src/lib/notification-job';

describe('classifyNotification', () => {
  it('matches pre-alert day', () => {
    expect(classifyNotification(2, 2)).toBe('PRE_ALERT');
  });

  it('matches day zero', () => {
    expect(classifyNotification(0, 2)).toBe('D_DAY');
  });

  it('matches day minus one as expired alert', () => {
    expect(classifyNotification(-1, 2)).toBe('EXPIRED');
  });

  it('returns null outside expected windows', () => {
    expect(classifyNotification(5, 2)).toBeNull();
  });
});
