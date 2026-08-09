import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface VideoModalProps {
  open: boolean
  title: string
  videoUrl: string
  onClose: () => void
}

export function VideoModal({ open, title, videoUrl, onClose }: VideoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="video-modal" role="dialog" aria-modal="true" aria-label={`${title} 시연 영상`}>
        <button ref={closeButtonRef} type="button" className="video-modal__close" aria-label="시연 영상 닫기" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <div className="video-modal__player">
          <video controls playsInline preload="metadata" aria-label={`${title} 시연 영상`}>
            <source src={videoUrl} type="video/mp4" />
            브라우저가 영상 재생을 지원하지 않습니다.
          </video>
        </div>
      </section>
    </div>
  )
}
