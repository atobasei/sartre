// Display formatting. Kept dependency-free; uses the viewer's locale for numbers.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const monthName = (month: number) => MONTHS[month]!;
export const monthShort = (month: number) => MONTHS[month]!.slice(0, 3);

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${monthShort(d.getMonth())} ${d.getDate()}`;
}

export function formatDate(iso: string, now = new Date()): string {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() ? formatDay(iso) : `${formatDay(iso)}, ${d.getFullYear()}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

export const authorLine = (authors: readonly { name: string }[]) => authors.map((a) => a.name).join(', ');
