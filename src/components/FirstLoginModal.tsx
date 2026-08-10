import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export interface FirstLoginProfile {
  name: string
  email: string
}

interface FirstLoginModalProps {
  open: boolean
  errorMessage?: string
  submitting?: boolean
  onClose: () => void
  onInputChange?: () => void
  onSubmit: (profile: FirstLoginProfile) => void | Promise<void>
}

export function FirstLoginModal({ open, errorMessage, submitting = false, onClose, onInputChange, onSubmit }: FirstLoginModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nameRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onClose, submitting])

  if (!open) return null

  return (
    <div className="login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose() }}>
      <section className="login-modal first-login-modal" role="dialog" aria-modal="true" aria-labelledby="first-login-title">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="first-login-title" className="login-modal__title">처음 오셨네요!</h2>
            <p className="first-login-modal__description">바로 시작할 수 있게 몇 가지만 알려주세요</p>
          </div>
          <button type="button" className="login-modal__close" aria-label="정보 입력 창 닫기" disabled={submitting} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <form
          className="login-form first-login-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit({ name: name.trim(), email: email.trim() })
          }}
        >
          <label className="login-field">
            <span>이름</span>
            <input ref={nameRef} type="text" autoComplete="name" value={name} disabled={submitting} onChange={(event) => {
              setName(event.target.value)
              onInputChange?.()
            }} placeholder="이름을 입력하세요" required />
          </label>

          <label className="login-field">
            <span>이메일</span>
            <input type="email" autoComplete="email" value={email} disabled={submitting} onChange={(event) => {
              setEmail(event.target.value)
              onInputChange?.()
            }} placeholder="pllab1004@gmail.com" required />
          </label>

          {errorMessage && <p className="text-[10px] leading-4 text-red-500" role="alert">{errorMessage}</p>}

          <button type="submit" className="login-submit first-login-submit disabled:cursor-wait disabled:opacity-70" disabled={submitting}>
            {submitting ? '처리 중...' : '시작하기'}
          </button>
        </form>
      </section>
    </div>
  )
}
