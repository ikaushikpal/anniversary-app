export const TIMEZONE_IST = "Asia/Kolkata";

/**
 * Returns current date/time string formatted as YYYY-MM-DD in IST (Asia/Kolkata)
 */
export function getISTDateString(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE_IST,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  } catch {
    const d = new Date(date.getTime() + 5.5 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Parses date string (e.g. "2025-11-01") explicitly as midnight in IST (UTC+5:30)
 */
export function parseISTDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00+05:30`);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return new Date(`${str}+05:30`);
  }
  return new Date(str);
}

/**
 * Gets the current hour (0-23) in IST (Asia/Kolkata)
 */
export function getISTHour() {
  try {
    const istTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_IST,
      hour: "numeric",
      hour12: false
    }).format(new Date());
    return parseInt(istTimeStr, 10);
  } catch {
    const d = new Date();
    const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60;
    return Math.floor((utcHours + 5.5) % 24);
  }
}

/**
 * Calculates time difference from start date (in IST) to now
 */
export function calculateTimeTogether(startDate) {
  const start = parseISTDate(startDate);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - start.getTime());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}
