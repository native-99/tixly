import { useMutation } from '@tanstack/react-query'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { EventCover } from '@/components/events/EventCover'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { getErrorMessage, services } from '@/services'

interface PosterPickerProps {
  /** Used for the placeholder cover when there's no poster. */
  seed: string
  title: string
  posterUrl: string | null
  onChange(posterUrl: string | null): void
}

export function PosterPicker({ seed, title, posterUrl, onChange }: PosterPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => services.events.uploadPoster(file),
    onSuccess: (url) => onChange(url),
  })

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    event.target.value = '' // allow picking the same file again
  }

  return (
    <div>
      <EventCover
        event={{ id: seed, title: title || 'New event', posterUrl }}
        className="aspect-[16/9] w-full rounded-xl"
      />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          isLoading={uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
          {posterUrl ? 'Change poster' : 'Upload poster'}
        </Button>
        {posterUrl && (
          <Button variant="ghost" onClick={() => onChange(null)} aria-label="Remove poster">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      {uploadMutation.isError && (
        <div className="mt-3">
          <ErrorAlert>{getErrorMessage(uploadMutation.error)}</ErrorAlert>
        </div>
      )}
    </div>
  )
}
