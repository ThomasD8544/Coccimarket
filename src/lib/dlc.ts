import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export type DlcStatus = 'OK' | 'SOON' | 'EXPIRED';

export function parseDateInParis(dateInput: string) {
  return fromZonedTime(`${dateInput}T00:00:00`, 'Europe/Paris');
}

export function statusFromDlc(dlcDate: Date, alertDaysBefore: number, now = new Date()): DlcStatus {
  const parisNow = toZonedTime(now, 'Europe/Paris');
  const parisDlc = toZonedTime(dlcDate, 'Europe/Paris');

  const today = startOfDay(parisNow);
  const dlcDay = startOfDay(parisDlc);
  const diff = differenceInCalendarDays(dlcDay, today);

  if (diff < 0) return 'EXPIRED';
  if (diff <= alertDaysBefore) return 'SOON';
  return 'OK';
}

export function notificationTypeFromDate(dlcDate: Date, alertDaysBefore: number, now = new Date()) {
  const parisNow = toZonedTime(now, 'Europe/Paris');
  const today = startOfDay(parisNow);
  const dlcDay = startOfDay(toZonedTime(dlcDate, 'Europe/Paris'));
  const diff = differenceInCalendarDays(dlcDay, today);

  if (diff === alertDaysBefore) return 'PRE_ALERT';
  if (diff === 0) return 'D_DAY';
  if (diff < 0) {
    const firstExpiredDay = startOfDay(addDays(today, -1));
    if (dlcDay.getTime() === firstExpiredDay.getTime()) return 'EXPIRED';
  }
  return null;
}
