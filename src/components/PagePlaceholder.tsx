import { Construction } from 'lucide-react'
import { PageHeader } from './PageHeader'

/** Temporary screen used while a page is being built. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <Construction className="size-8 text-slate-400" aria-hidden />
        <p className="mt-3 text-sm text-slate-500">This page is under construction.</p>
      </div>
    </>
  )
}
