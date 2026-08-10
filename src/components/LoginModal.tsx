import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export interface LoginCredentials {
  studentId: string
  password: string
  remember: boolean
}

interface LoginModalProps {
  open: boolean
  errorMessage?: string
  submitting?: boolean
  onClose: () => void
  onInputChange?: () => void
  onSubmit: (credentials: LoginCredentials) => void | Promise<void>
}

export function LoginModal({ open, errorMessage, submitting = false, onClose, onInputChange, onSubmit }: LoginModalProps) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const studentIdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    studentIdRef.current?.focus()

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
      <section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="flex items-center justify-between">
          <h2 id="login-title" className="login-modal__title">로그인</h2>
          <button type="button" className="login-modal__close" aria-label="로그인 창 닫기" disabled={submitting} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit({ studentId: studentId.trim(), password, remember })
          }}
        >
          <label className="login-field">
            <span>학번</span>
            <input
              ref={studentIdRef}
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={studentId}
              disabled={submitting}
              onChange={(event) => {
                setStudentId(event.target.value)
                onInputChange?.()
              }}
              placeholder="학번을 입력하세요"
              required
            />
          </label>

          <label className="login-field">
            <span>비밀번호</span>
            <span className="login-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={submitting}
                onChange={(event) => {
                  setPassword(event.target.value)
                  onInputChange?.()
                }}
                placeholder="비밀번호를 입력하세요"
                required
              />
              <button type="button" disabled={submitting} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}>
                {showPassword ? '숨기기' : '표시'}
              </button>
            </span>
          </label>

          <label className="login-remember">
            <input type="checkbox" checked={remember} disabled={submitting} onChange={(event) => setRemember(event.target.checked)} />
            <span>로그인 상태 유지</span>
          </label>

          {errorMessage && <p className="text-[10px] leading-4 text-red-500" role="alert">{errorMessage}</p>}

          <button type="submit" className="login-submit disabled:cursor-wait disabled:opacity-70" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </section>
    </div>
  )
}
