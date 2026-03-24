
/**
 * Returns a date string in YYYY-MM-DD format based on local time.
 * This avoids UTC-related date shifts.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns a date string in YYYY-MM-DD format for yesterday based on local time.
 */
export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};
