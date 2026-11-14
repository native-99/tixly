import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { paths } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">The page you're looking for doesn't exist.</p>
      <Link
        to={paths.events}
        className={`mt-6 ${buttonClasses('primary')}`}
      >
        Browse events
      </Link>
    </div>
  )
}
