import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { emptyTicketType, type TicketTypeDraft, type TicketTypeErrors } from './formModel'

interface TicketTypesEditorProps {
  rows: TicketTypeDraft[]
  rowErrors: Record<string, TicketTypeErrors>
  listError?: string
  onChange(rows: TicketTypeDraft[]): void
}

export function TicketTypesEditor({ rows, rowErrors, listError, onChange }: TicketTypesEditorProps) {
  function updateRow(key: string, field: 'name' | 'price' | 'quota', value: string) {
    const next: TicketTypeDraft[] = []
    for (const row of rows) {
      next.push(row.key === key ? { ...row, [field]: value } : row)
    }
    onChange(next)
  }

  function removeRow(key: string) {
    onChange(rows.filter((row) => row.key !== key))
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const errors = rowErrors[row.key] ?? {}
        return (
          <div key={row.key} className="rounded-2xl border border-ink-100 bg-ink-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold tracking-widest text-ink-400 uppercase">
                Ticket {index + 1}
              </p>
              {/* Saved ticket types may already have buyers, so only unsaved rows can be removed. */}
              {row.id === null && (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-900/5 hover:text-ink-700"
                  aria-label={`Remove ticket ${index + 1}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
            <TextField
              label="Name"
              placeholder="e.g. Early Bird"
              value={row.name}
              onChange={(event) => updateRow(row.key, 'name', event.target.value)}
              error={errors.name}
              className="mt-1"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <TextField
                label="Price (Rp)"
                inputMode="numeric"
                placeholder="150000"
                value={row.price}
                onChange={(event) => updateRow(row.key, 'price', event.target.value.replace(/\D/g, ''))}
                error={errors.price}
              />
              <TextField
                label="Quota"
                inputMode="numeric"
                placeholder="100"
                value={row.quota}
                onChange={(event) => updateRow(row.key, 'quota', event.target.value.replace(/\D/g, ''))}
                error={errors.quota}
                hint={row.taken > 0 ? `${row.taken} already taken` : undefined}
              />
            </div>
          </div>
        )
      })}

      {listError && <p className="text-sm text-red-600">{listError}</p>}

      <Button variant="secondary" fullWidth onClick={() => onChange([...rows, emptyTicketType()])}>
        <Plus className="size-4" aria-hidden />
        Add ticket type
      </Button>
    </div>
  )
}
