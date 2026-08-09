import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationItem = number | 'ellipsis'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  ariaLabel: string
  className?: string
}

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (page <= 3) return [1, 2, 3, 'ellipsis', totalPages]
  if (page >= totalPages - 2) return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

export function Pagination({ page, totalPages, onChange, ariaLabel, className = '' }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)
  const items = getPaginationItems(safePage, safeTotalPages)

  return (
    <nav className={`flex min-h-5 items-center justify-center gap-5 text-[10px] text-neutral-400 md:gap-6 md:text-[12px] ${className}`} aria-label={ariaLabel}>
      <button type="button" className="grid h-5 w-4 place-items-center disabled:cursor-default disabled:opacity-40" aria-label="이전 페이지" disabled={safePage === 1} onClick={() => onChange(safePage - 1)}>
        <ChevronLeft className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden="true" />
      </button>

      {items.map((item, index) => item === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
      ) : (
        <button
          key={item}
          type="button"
          aria-current={safePage === item ? 'page' : undefined}
          className={`flex h-5 min-w-[14px] items-center justify-center border-b-2 px-1 leading-none ${safePage === item ? 'border-brand font-semibold text-brand' : 'border-transparent hover:text-neutral-600'}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}

      <button type="button" className="grid h-5 w-4 place-items-center disabled:cursor-default disabled:opacity-40" aria-label="다음 페이지" disabled={safePage === safeTotalPages} onClick={() => onChange(safePage + 1)}>
        <ChevronRight className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden="true" />
      </button>
    </nav>
  )
}
