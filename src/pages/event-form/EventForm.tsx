import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { categoryMeta, eventCategories } from '@/config/categories'
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
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({ rows: {} })

  // The event and its ticket types are saved one call at a time. On Supabase
  // every write goes through Row Level Security, so only the organizer of the
  // event can change it.
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
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl space-y-4 pb-32 md:pb-6">
      <Section title="Poster">
        <PosterPicker
          title={values.title}
          category={values.category}
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
          <SelectField
            label="Category"
            value={values.category}
            onChange={(event) => update('category', event.target.value as EventFormValues['category'])}
            options={eventCategories.map((category) => ({
              value: category,
              label: categoryMeta[category].label,
            }))}
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

      {/* Mobile: a floating bar keeps the action within reach. */}
      <div className="fixed inset-x-0 bottom-0 z-10 px-4 pb-4 md:hidden">
        <div className="mx-auto flex max-w-2xl gap-3 rounded-3xl border border-white/60 bg-white/85 p-2 shadow-pill backdrop-blur-xl">
          <Button variant="secondary" className="flex-1" onClick={() => navigate(paths.organizerEvents)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={saveMutation.isPending}>
            {eventId ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </div>

      {/* Desktop: inline, so the bar never covers a field. */}
      <div className="hidden gap-3 pt-2 md:flex">
        <Button variant="secondary" className="flex-1" onClick={() => navigate(paths.organizerEvents)}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" isLoading={saveMutation.isPending}>
          {eventId ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
      <h2 className="mb-4 text-sm font-extrabold tracking-widest text-ink-400 uppercase">{title}</h2>
      {children}
    </section>
  )
}
