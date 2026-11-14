import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { DEMO_TICKET_CODES } from '@/config/demo'
import { getErrorMessage, services } from '@/services'
import type { CheckInStatus } from '@/types'
import { CameraScanner } from './CameraScanner'
import { ScanResultBanner, ScanResultCard } from './ScanResultCard'

/** Short buzz for a valid ticket, longer pattern for a problem (where supported). */
function vibrateFor(status: CheckInStatus) {
  if (!('vibrate' in navigator)) return
  navigator.vibrate(status === 'valid' ? 80 : [200, 100, 200])
}

const sampleCodes = [
  { label: 'Valid', code: DEMO_TICKET_CODES.ready3 },
  { label: 'Used', code: DEMO_TICKET_CODES.used },
  { label: 'Fake', code: 'TX-FAKE0000CODE' },
]

export default function ScanPage() {
  const [code, setCode] = useState('')

  const checkInMutation = useMutation({
    mutationFn: (ticketCode: string) => services.tickets.checkIn(ticketCode),
    onSuccess: (result) => vibrateFor(result.status),
  })

  function submit(ticketCode: string) {
    const trimmed = ticketCode.trim().toUpperCase()
    if (!trimmed) return
    setCode(trimmed)
    checkInMutation.mutate(trimmed)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(code)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Scan tickets" description="Check in guests at the gate." />

      <CameraScanner
        onDetected={submit}
        overlay={checkInMutation.isSuccess && <ScanResultBanner status={checkInMutation.data.status} />}
      />

      <div className="mt-5 flex items-center gap-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
        <span className="h-px flex-1 bg-ink-200" />
        or enter the code
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2" noValidate>
        <TextField
          label="Ticket code"
          className="flex-1"
          placeholder="TX-XXXXXXXXXXXX"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <Button type="submit" isLoading={checkInMutation.isPending} disabled={!code.trim()}>
          Check in
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span>Demo codes:</span>
        {sampleCodes.map((sample) => (
          <button
            key={sample.code}
            type="button"
            onClick={() => submit(sample.code)}
            className="rounded-full bg-white/90 px-3.5 py-2 font-semibold text-ink-700 shadow-soft ring-1 ring-ink-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-500/25"
          >
            {sample.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {checkInMutation.isError && <ErrorAlert>{getErrorMessage(checkInMutation.error)}</ErrorAlert>}
        {checkInMutation.isSuccess && (
          <ScanResultCard result={checkInMutation.data} code={checkInMutation.variables} />
        )}
      </div>
    </div>
  )
}
