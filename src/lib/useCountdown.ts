import { useEffect, useState } from 'react'

/** Milliseconds left until `deadline` (ISO string), updated every second. */
export function useCountdown(deadline: string): number {
  const target = new Date(deadline).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])

  return Math.max(0, target - now)
}
