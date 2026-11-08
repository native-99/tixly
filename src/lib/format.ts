const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** 250000 → "Rp 250.000" */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

/** "Sat, 29 Nov 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** "16:00" */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

/** "Sat, 29 Nov 2026 · 16:00" */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

/** Short parts for a calendar-style date chip. */
export function dateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso)
  return {
    day: String(date.getDate()),
    month: date.toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
  }
}

/** 125000 ms → "02:05" */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
