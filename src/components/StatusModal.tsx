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
      <section className="w-[303px] max-w-[calc(100vw-40px)] rounded-[15px] bg-white px-[15px] pb-[15px] pt-[29px] text-center md:w-[386px] md:pt-[33px]" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="status-title">
        <h2 id="status-title" className="text-[14px] font-medium text-neutral-900 md:text-[18px]">{title}</h2>
        {description && <p className="mt-2.5 text-[10px] leading-4 text-neutral-400 md:text-[12px] md:leading-5">{description}</p>}

        <button ref={closeRef} type="button" className="mt-[25px] h-9 w-full rounded-[7px] border-0 bg-brand text-[11px] font-semibold text-white outline-none hover:bg-[#013f85] focus:outline-none focus-visible:outline-none md:h-11 md:text-[13px]" onClick={onClose}>확인</button>
      </section>
    </div>
  )
}
