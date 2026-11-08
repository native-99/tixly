import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { queryKeys } from '@/lib/queryKeys'
import { getErrorMessage, services } from '@/services'
import { paths } from '@/routes/paths'
import {
  hasErrors,
  toEventInput,
  toTicketTypeInput,
  validate,
  type EventFormValues,
  type FormErrors,
} from './formModel'
import { PosterPicker } from './PosterPicker'
import { StatusToggle } from './StatusToggle'
import { TicketTypesEditor } from './TicketTypesEditor'

interface EventFormProps {
  /** Omit to create a new event. */
  eventId?: string
  initialValues: EventFormValues
}

export function EventForm({ eventId, initialValues }: EventFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const coverSeed = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({ rows: {} })

  // NOTE: these are several calls in the mock. In the Supabase stage this
  // becomes one database function, so the event and its tickets save atomically.
  const saveMutation = useMutation({
    mutationFn: async (formValues: EventFormValues) => {
      const eventInput = toEventInput(formValues)
      const saved = eventId
        ? await services.events.updateEvent(eventId, eventInput)
        : await services.events.createEvent(eventInput)

      for (const row of formValues.ticketTypes) {
        const ticketTypeInput = toTicketTypeInput(row)
        if (row.id) await services.events.updateTicketType(row.id, ticketTypeInput)
        else await services.events.createTicketType(saved.id, ticketTypeInput)
      }
      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
      navigate(paths.organizerEvents)
    },
  })

  function update<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setValues({ ...values, [field]: value })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      // Let the browser paint the errors, then move focus to the first one.
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        firstInvalid?.focus()
      })
      return
    }
    saveMutation.mutate(values)
  }

  const showFixMessage = hasErrors(errors)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-24">
      <Section title="Poster">
        <PosterPicker
          seed={eventId ?? coverSeed}
          title={values.title}
          posterUrl={values.posterUrl}
          onChange={(posterUrl) => update('posterUrl', posterUrl)}
        />
      </Section>

      <Section title="Details">
        <div className="space-y-4">
          <TextField
            label="Title"
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
            error={errors.title}
            maxLength={120}
          />
          <TextAreaField
            label="Description"
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="What should guests expect?"
            maxLength={2000}
          />
          <TextField
            label="Date & time"
            type="datetime-local"
            value={values.startsAtLocal}
            onChange={(event) => update('startsAtLocal', event.target.value)}
            error={errors.startsAtLocal}
          />
          <TextField
            label="Venue"
            value={values.venue}
            onChange={(event) => update('venue', event.target.value)}
            error={errors.venue}
          />
          <TextField
            label="City"
            value={values.city}
            onChange={(event) => update('city', event.target.value)}
            error={errors.city}
          />
        </div>
      </Section>

      <Section title="Tickets">
        <TicketTypesEditor
          rows={values.ticketTypes}
          rowErrors={errors.rows}
          listError={errors.ticketTypes}
          onChange={(rows) => update('ticketTypes', rows)}
        />
      </Section>

      <Section title="Visibility">
        <StatusToggle value={values.status} onChange={(status) => update('status', status)} />
      </Section>

      {showFixMessage && <ErrorAlert>Please fix the highlighted fields.</ErrorAlert>}
      {saveMutation.isError && <ErrorAlert>{getErrorMessage(saveMutation.error)}</ErrorAlert>}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3 px-4 py-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate(paths.organizerEvents)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={saveMutation.isPending}>
            {eventId ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}
