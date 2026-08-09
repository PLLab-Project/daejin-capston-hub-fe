import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => cancelRef.current?.focus())

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onCancel, open])

  if (!open) return null

  return (
    <div className="login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="w-[313px] max-w-[calc(100vw-40px)] rounded-[15px] bg-white p-5 md:w-[420px] md:p-8" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-title" className="text-[16px] font-bold text-neutral-900 md:text-[20px]">{title}</h2>
            <p id="confirm-description" className="mt-2 text-[10px] leading-4 text-neutral-400 md:text-[12px] md:leading-5">{description}</p>
          </div>
          <button type="button" className="login-modal__close flex-none" aria-label="확인 창 닫기" onClick={onCancel}>
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-3">
          <button ref={cancelRef} type="button" className="h-9 rounded-[7px] border border-neutral-300 bg-white text-[11px] text-neutral-500 hover:border-neutral-400 md:h-11 md:text-[13px]" onClick={onCancel}>취소</button>
          <button type="button" className="h-9 rounded-[7px] bg-red-500 text-[11px] font-semibold text-white hover:bg-red-600 md:h-11 md:text-[13px]" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
