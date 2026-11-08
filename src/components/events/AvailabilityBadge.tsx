import { Badge } from '../ui/Badge'

/** Shows "Sold out" / "Only N left" when it matters; nothing otherwise. */
export function AvailabilityBadge({ remaining }: { remaining: number }) {
  if (remaining === 0) return <Badge tone="danger">Sold out</Badge>
  if (remaining <= 10) return <Badge tone="warning">Only {remaining} left</Badge>
  return null
}
