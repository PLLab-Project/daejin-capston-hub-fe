import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Pencil, X } from 'lucide-react'
import type { GalleryProject } from '../types/project'

export interface UserProfile {
  name: string
  studentId: string
  email: string
}

interface MyPageProps {
  profile: UserProfile
  myProjects: GalleryProject[]
  favoriteProjects: GalleryProject[]
  onProfileChange: (profile: UserProfile) => void
  onMyProjectsClick: () => void
  onFavoritesClick: () => void
}

interface ProfileSectionProps {
  title: string
  projects: GalleryProject[]
  emptyMessage: string
  onClick: () => void
}

function ProfileSection({ title, projects, emptyMessage, onClick }: ProfileSectionProps) {
  return (
    <section className="w-full rounded-[10px] border border-neutral-200 px-2.5 py-2 md:rounded-[15px] md:px-5 md:py-4">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={onClick}>
        <h2 className="text-[10px] font-semibold text-neutral-800 md:text-[13px]">{title}</h2>
        <ChevronRight className="h-3 w-3 text-neutral-400 md:h-3.5 md:w-3.5" strokeWidth={1.4} aria-hidden="true" />
      </button>
      <div className="mt-2 border-t border-neutral-200 md:mt-3">
        {projects.length > 0 ? projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="block w-full border-b border-neutral-100 py-[5px] text-left text-[10px] text-neutral-700 last:border-b-0 last:pb-0 md:py-2.5 md:text-[12px]"
            onClick={onClick}
          >
            {project.title}
          </button>
        )) : (
          <p className="mb-0 mt-2 text-[9px] text-neutral-400 md:mt-2.5 md:text-[11px]">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

interface ProfileEditModalProps {
  profile: UserProfile
  onClose: () => void
  onSave: (profile: UserProfile) => void
}

function ProfileEditModal({ profile, onClose, onSave }: ProfileEditModalProps) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => nameRef.current?.focus())

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="login-modal border border-brand" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
        <div className="flex items-center justify-between">
          <h2 id="profile-edit-title" className="login-modal__title">정보 수정</h2>
          <button type="button" className="login-modal__close" aria-label="정보 수정 창 닫기" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({ ...profile, name: name.trim(), email: email.trim() })
          }}
        >
          <label className="login-field">
            <span>이름</span>
            <input ref={nameRef} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력하세요" required />
          </label>

          <label className="login-field">
            <span>이메일</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일을 입력하세요" required />
          </label>

          <button type="submit" className="login-submit profile-edit-submit">저장</button>
        </form>
      </section>
    </div>
  )
}

export function MyPage({
  profile,
  myProjects,
  favoriteProjects,
  onProfileChange,
  onMyProjectsClick,
  onFavoritesClick,
}: MyPageProps) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <main className="page-container flex flex-1 flex-col gap-4 pt-5 md:gap-4 md:pt-10">
        <section className="flex min-h-[58px] w-full items-center justify-between rounded-[10px] border border-neutral-200 px-2.5 py-2 md:min-h-[86px] md:rounded-[15px] md:px-5 md:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-bold leading-tight text-neutral-900 md:text-[20px]">{profile.name}</h1>
            <p className="mt-1 truncate text-[10px] text-neutral-400 md:text-[14px]">{profile.studentId} · {profile.email}</p>
          </div>
          <button type="button" className="ml-4 flex flex-none items-center gap-0.5 text-[9px] text-brand hover:underline md:gap-1 md:text-[12px]" onClick={() => setEditing(true)}>
            <Pencil className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" strokeWidth={1.5} aria-hidden="true" />
            수정
          </button>
        </section>

        <ProfileSection
          title="내 작품"
          projects={myProjects.slice(0, 1)}
          emptyMessage="등록한 작품이 없습니다."
          onClick={onMyProjectsClick}
        />
        <ProfileSection
          title="즐겨찾기"
          projects={favoriteProjects.slice(0, 3)}
          emptyMessage="즐겨찾기한 작품이 없습니다."
          onClick={onFavoritesClick}
        />
      </main>

      {editing && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSave={(nextProfile) => {
            onProfileChange(nextProfile)
            setEditing(false)
          }}
        />
      )}
    </>
  )
}
