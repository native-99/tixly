import { Camera, CameraOff, ScanLine } from 'lucide-react'
import QrScanner from 'qr-scanner'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

type ScannerState = 'idle' | 'starting' | 'scanning' | 'error'

/** The same QR stays in view for a while; only report it again after this gap. */
const REPEAT_SCAN_GAP_MS = 3000

interface CameraScannerProps {
  onDetected(code: string): void
  /** Shown on top of the live video, e.g. the latest scan result. */
  overlay?: ReactNode
}

function cameraErrorMessage(error: unknown): string {
  if (!window.isSecureContext || !navigator.mediaDevices) {
    return 'The camera needs a secure (HTTPS) connection. Use manual entry below, or open the deployed site.'
  }
  const text = String(error)
  if (text.includes('NotAllowed') || text.includes('Permission')) {
    return 'Camera permission was blocked. Allow it in your browser settings and try again.'
  }
  if (text.includes('NotFound') || text.includes('Camera not found')) {
    return 'No camera found on this device. Use manual entry below.'
  }
  return "Couldn't start the camera. Use manual entry below."
}

export function CameraScanner({ onDetected, overlay }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)
  const onDetectedRef = useRef(onDetected)
  const [state, setState] = useState<ScannerState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Always call the latest callback without restarting the camera.
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  // Release the camera when leaving the page.
  useEffect(() => {
    return () => {
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [])

  async function start() {
    const video = videoRef.current
    if (!video) return
    setState('starting')

    try {
      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          video,
          (result) => {
            const now = Date.now()
            const last = lastScanRef.current
            if (last && last.code === result.data && now - last.at < REPEAT_SCAN_GAP_MS) return
            lastScanRef.current = { code: result.data, at: now }
            onDetectedRef.current(result.data)
          },
          {
            returnDetailedScanResult: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 5,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          },
        )
      }
      await scannerRef.current.start()
      setState('scanning')
    } catch (error) {
      scannerRef.current?.destroy()
      scannerRef.current = null
      setErrorMessage(cameraErrorMessage(error))
      setState('error')
    }
  }

  function stop() {
    scannerRef.current?.stop()
    setState('idle')
  }

  const isLive = state === 'scanning' || state === 'starting'

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
        <video
          ref={videoRef}
          className={isLive ? 'h-full w-full object-cover' : 'hidden'}
          muted
          playsInline
        />
        {isLive && overlay && <div className="absolute inset-x-3 bottom-3">{overlay}</div>}
        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-slate-400">
            {state === 'error' ? (
              <>
                <CameraOff className="size-12" aria-hidden />
                <p className="mt-2 text-sm" role="alert">
                  {errorMessage}
                </p>
              </>
            ) : (
              <>
                <ScanLine className="size-14" aria-hidden />
                <p className="mt-2 text-sm">Point the camera at a ticket QR code.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLive ? (
          <Button variant="secondary" fullWidth onClick={stop}>
            <CameraOff className="size-4" aria-hidden />
            Stop camera
          </Button>
        ) : (
          <Button fullWidth onClick={start}>
            <Camera className="size-4" aria-hidden />
            {state === 'error' ? 'Try camera again' : 'Start camera'}
          </Button>
        )}
      </div>
    </div>
  )
}
