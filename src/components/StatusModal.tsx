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
      <section
        className="w-[233px] max-w-[calc(100vw-40px)] rounded-[15px] bg-white px-[10px] pb-2 pt-[34px] text-center md:w-[316px] md:pt-[38px]"
        style={{
          width: 'fit-content',
          minWidth: 'min(233px, calc(100vw - 24px))',
          maxWidth: 'calc(100vw - 24px)',
          paddingRight: 12,
          paddingLeft: 12,
          paddingBottom: 8,
        }}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-labelledby="status-title"
      >
        <h2
          id="status-title"
          className="text-[12px] font-medium text-neutral-900 md:text-[16px]"
          style={{ lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          {title}
        </h2>
        {description && (
          <p
            className="text-[10px] text-neutral-400 md:text-[12px]"
            style={{
              fontSize: 'clamp(8px, 2.65vw, 12px)',
              lineHeight: 1,
              marginTop: 5,
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </p>
        )}

        <button
          ref={closeRef}
          type="button"
          className="mt-[30px] h-8 w-full rounded-[7px] border-0 bg-brand text-[11px] font-semibold text-white outline-none hover:bg-[#013f85] focus:outline-none focus-visible:outline-none md:h-10 md:text-[13px]"
          style={{ width: '100%', marginLeft: 0 }}
          onClick={onClose}
        >
          확인
        </button>
      </section>
    </div>
  )
}
