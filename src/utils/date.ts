/**
 * Formats a Date object or ISO string to local Brazilian date representation.
 * @example "12/07/2026"
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formats a Date object or ISO string to local Brazilian time representation.
 * @example "17:30"
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a Date object or ISO string to full date-time format.
 * @example "12/07/2026 17:30"
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return `${formatDate(d)} ${formatTime(d)}`;
}

/**
 * Formats working duration minutes to a standard readable string.
 * @example 125 -> "02h 05m"
 */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 0) return '00h 00m';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(remainingMinutes).padStart(2, '0');

  return `${hoursStr}h ${minutesStr}m`;
}
