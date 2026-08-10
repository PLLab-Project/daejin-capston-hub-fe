import { useEffect, useRef } from 'react'

interface LoginRequiredModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function LoginRequiredModal({ open, onCancel, onConfirm }: LoginRequiredModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => confirmRef.current?.focus())

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
      >
        <h2 id="login-required-title" className="text-[12px] font-medium text-neutral-900 md:text-[16px]" style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>로그인이 필요합니다.</h2>

        <button ref={confirmRef} type="button" className="mt-[30px] h-8 w-full rounded-[7px] border-0 bg-brand text-[11px] font-semibold text-white outline-none hover:bg-[#013f85] focus:outline-none focus-visible:outline-none md:h-10 md:text-[13px]" onClick={onConfirm}>확인</button>
      </section>
    </div>
  )
}
