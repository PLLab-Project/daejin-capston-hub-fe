import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface VideoModalProps {
  open: boolean
  title: string
  videoUrl: string
  onClose: () => void
}

interface VideoSource {
  kind: 'embed' | 'file'
  url: string
}

function getVideoSource(value: string): VideoSource {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLocaleLowerCase().replace(/^www\./, '')

    if (hostname === 'drive.google.com') {
      const pathFileId = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1]
      const fileId = pathFileId || url.searchParams.get('id')
      if (fileId && /^[a-z0-9_-]+$/i.test(fileId)) {
        return { kind: 'embed', url: `https://drive.google.com/file/d/${fileId}/preview` }
      }
    }

    if (hostname === 'youtu.be' || hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') {
      const videoId = hostname === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
      if (videoId && /^[a-z0-9_-]+$/i.test(videoId)) {
        return { kind: 'embed', url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` }
      }
    }
  } catch {
    // 상대 경로와 직접 영상 파일 URL은 기존 video 요소에서 처리합니다.
  }

  return { kind: 'file', url: value }
}

export function VideoModal({ open, title, videoUrl, onClose }: VideoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const videoSource = getVideoSource(videoUrl)

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
          {videoSource.kind === 'embed' ? (
            <iframe
              src={videoSource.url}
              title={`${title} 시연 영상`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video controls playsInline preload="metadata" aria-label={`${title} 시연 영상`}>
              <source src={videoSource.url} />
              브라우저가 영상 재생을 지원하지 않습니다.
            </video>
          )}
        </div>
      </section>
    </div>
  )
}
