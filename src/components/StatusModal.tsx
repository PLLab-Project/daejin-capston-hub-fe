import { Check, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface StatusModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
}

export function StatusModal({ open, title, description, onClose }: StatusModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => closeRef.current?.focus())

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="w-[313px] max-w-[calc(100vw-40px)] rounded-[15px] bg-white p-5 md:w-[420px] md:p-8" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="status-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[#eef3ff] text-brand md:h-8 md:w-8">
              <Check className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id="status-title" className="text-[15px] font-bold text-neutral-900 md:text-[19px]">{title}</h2>
              {description && <p className="mt-2 text-[10px] leading-4 text-neutral-400 md:text-[12px] md:leading-5">{description}</p>}
            </div>
          </div>
          <button type="button" className="login-modal__close flex-none" aria-label="알림 창 닫기" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <button ref={closeRef} type="button" className="mt-6 h-9 w-full rounded-[7px] bg-brand text-[11px] font-semibold text-white hover:bg-[#013f85] md:mt-8 md:h-11 md:text-[13px]" onClick={onClose}>확인</button>
      </section>
    </div>
  )
}
