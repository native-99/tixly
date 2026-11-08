import { Link } from 'react-router'

interface PagePlaceholderProps {
  title: string
}

/** Temporary screen used while a page is being built. */
export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-10">
      <Link to="/" className="text-lg font-bold text-brand-600">
        Tixly
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Coming soon.</p>
    </main>
  )
}
