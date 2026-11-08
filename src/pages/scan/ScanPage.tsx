import { useMutation } from '@tanstack/react-query'
import { ScanLine } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { DEMO_TICKET_CODES } from '@/config/demo'
import { getErrorMessage, services } from '@/services'
import { ScanResultCard } from './ScanResultCard'

const sampleCodes = [
  { label: 'Valid', code: DEMO_TICKET_CODES.ready3 },
  { label: 'Used', code: DEMO_TICKET_CODES.used },
  { label: 'Fake', code: 'TX-FAKE0000CODE' },
]

export default function ScanPage() {
  const [code, setCode] = useState('')

  const checkInMutation = useMutation({
    mutationFn: (ticketCode: string) => services.tickets.checkIn(ticketCode),
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
    <>
      <PageHeader title="Scan tickets" description="Check in guests at the gate." />

      {/* Camera scanning arrives in a later step; manual entry works today. */}
      <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
        <ScanLine className="size-14" aria-hidden />
        <p className="mt-2 text-sm">Camera scanner coming soon</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2" noValidate>
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

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Demo codes:</span>
        {sampleCodes.map((sample) => (
          <button
            key={sample.code}
            type="button"
            onClick={() => submit(sample.code)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-brand-500"
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
    </>
  )
}
