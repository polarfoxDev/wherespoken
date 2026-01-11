export const APP_NAME = 'WhereSpoken';
export const FIRST_RIDDLE_DATE_ISO = '2026-01-11';

/**
 * Get the riddle index (1-based) for a given date
 */
export function getRiddleIndex(dateISO: string): number {
  const firstDate = new Date(FIRST_RIDDLE_DATE_ISO);
  const targetDate = new Date(dateISO);
  const diffTime = targetDate.getTime() - firstDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 1-based index
}

/**
 * Get today's riddle index
 */
export function getTodayRiddleIndex(): number {
  const today = new Date().toISOString().substring(0, 10);
  return getRiddleIndex(today);
}
