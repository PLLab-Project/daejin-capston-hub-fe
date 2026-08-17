import { ChevronDown, Paperclip, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Notice } from '../types/notice'
import type { GalleryProject } from '../types/project'
import { navigateHash } from '../utils/hashRoute'
import { ConfirmModal } from './ConfirmModal'
import { NoticeDetail } from './NoticeDetail'
import { Pagination } from './Pagination'
import { ProjectDetail } from './ProjectDetail'

type AdminTab = 'projects' | 'members' | 'notices'

export interface AdminNoticeData {
  title: string
  content: string
  attachmentName: string
  files: File[]
}

interface AdminPageProps {
  projects: GalleryProject[]
  members: AdminMember[]
  notices: Notice[]
  projectsLoading?: boolean
  projectsError?: string
  projectsPage?: number
  projectsTotalPages?: number
  projectSearchKeyword?: string
  membersLoading?: boolean
  membersError?: string
  membersPage?: number
  membersTotalPages?: number
  memberSearchKeyword?: string
  onRetryProjects?: () => void
  onRetryMembers?: () => void
  onProjectsPageChange?: (page: number) => void
  onMembersPageChange?: (page: number) => void
  onProjectSearch?: (keyword: string) => void
  onMemberSearch?: (keyword: string) => void
  onMemberRoleChange: (id: number, role: AdminMemberRole) => Promise<boolean> | boolean
  onDeleteMember: (id: number) => Promise<boolean> | boolean
  onLoadProject?: (id: number) => Promise<GalleryProject>
  onLoadNotice?: (id: number) => Promise<Notice>
  onApproveProject: (id: number) => Promise<boolean> | boolean
  onRejectProject: (id: number) => Promise<boolean> | boolean
  onDeleteProject: (id: number) => Promise<boolean> | boolean
  onSaveNotice: (id: number | null, data: AdminNoticeData) => Promise<boolean> | boolean
  onDeleteNotice: (id: number) => Promise<boolean> | boolean
}

export type AdminMemberRole = 'admin' | 'general'

export interface AdminMember {
  id: number
  name: string
  studentId: string
  email: string
  role: AdminMemberRole
}

const tabItems: Array<{ id: AdminTab; label: string }> = [
  { id: 'projects', label: '작품 관리' },
  { id: 'members', label: '회원 관리' },
  { id: 'notices', label: '공지 관리' },
]

const pageSize = 12

interface AdminRouteState {
  tab: AdminTab
  projectId: number | null
  noticeId: number | null
  noticeEditor: number | 'new' | null
}

function adminHash(tab: AdminTab) {
  return `#/admin?tab=${tab}`
}

function readAdminRoute(): AdminRouteState {
  const normalized = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : ''
  const [path, queryString = ''] = normalized.split('?')
  const segments = path.split('/').filter(Boolean)
  const queryTab = new URLSearchParams(queryString).get('tab')
  const requestedTab: AdminTab = queryTab === 'members' || queryTab === 'notices' ? queryTab : 'projects'

  if (segments[0] !== 'admin') return { tab: requestedTab, projectId: null, noticeId: null, noticeEditor: null }
  if (segments[1] === 'projects') {
    const projectId = Number(segments[2])
    return { tab: 'projects', projectId: Number.isInteger(projectId) && projectId > 0 ? projectId : null, noticeId: null, noticeEditor: null }
  }
  if (segments[1] === 'notices') {
    if (segments[2] === 'new') return { tab: 'notices', projectId: null, noticeId: null, noticeEditor: 'new' }
    const noticeId = Number(segments[2])
    if (Number.isInteger(noticeId) && noticeId > 0) {
      return segments[3] === 'edit'
        ? { tab: 'notices', projectId: null, noticeId: null, noticeEditor: noticeId }
        : { tab: 'notices', projectId: null, noticeId, noticeEditor: null }
    }
  }

  return { tab: requestedTab, projectId: null, noticeId: null, noticeEditor: null }
}

export function AdminPage({
  projects,
  members,
  notices,
  projectsLoading = false,
  projectsError = '',
  projectsPage = 1,
  projectsTotalPages = 1,
  projectSearchKeyword = '',
  membersLoading = false,
  membersError = '',
  membersPage = 1,
  membersTotalPages = 1,
  memberSearchKeyword = '',
  onRetryProjects,
  onRetryMembers,
  onProjectsPageChange,
  onMembersPageChange,
  onProjectSearch,
  onMemberSearch,
  onMemberRoleChange,
  onDeleteMember,
  onLoadProject,
  onLoadNotice,
  onApproveProject,
  onRejectProject,
  onDeleteProject,
  onSaveNotice,
  onDeleteNotice,
}: AdminPageProps) {
  const initialAdminRoute = readAdminRoute()
  const [activeTab, setActiveTab] = useState<AdminTab>(initialAdminRoute.tab)
  const [searchDraft, setSearchDraft] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [reviewProjectId, setReviewProjectId] = useState<number | null>(initialAdminRoute.projectId)
  const [noticeEditorId, setNoticeEditorId] = useState<number | 'new' | null>(initialAdminRoute.noticeEditor)
  const [viewNoticeId, setViewNoticeId] = useState<number | null>(initialAdminRoute.noticeId)
  const [pendingDeleteNoticeId, setPendingDeleteNoticeId] = useState<number | null>(null)
  const [pendingDeleteMemberId, setPendingDeleteMemberId] = useState<number | null>(null)
  const [pendingRejectProjectId, setPendingRejectProjectId] = useState<number | null>(null)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)
  const [loadedReviewProject, setLoadedReviewProject] = useState<GalleryProject | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [loadedNotice, setLoadedNotice] = useState<Notice | null>(null)
  const [noticeLoadError, setNoticeLoadError] = useState('')
  const [page, setPage] = useState(1)
  const reviewProject = loadedReviewProject ?? projects.find((project) => project.id === reviewProjectId)
  const requestedNoticeId = viewNoticeId ?? (typeof noticeEditorId === 'number' ? noticeEditorId : null)
  const listedNotice = requestedNoticeId === null ? null : notices.find((notice) => notice.id === requestedNoticeId) ?? null
  const routeNotice = loadedNotice?.id === requestedNoticeId ? loadedNotice : onLoadNotice ? null : listedNotice
  const viewNotice = viewNoticeId === null ? null : routeNotice
  const noticeEditor = noticeEditorId === 'new' ? 'new' : typeof noticeEditorId === 'number' ? routeNotice : null

  useEffect(() => {
    const syncAdminRoute = () => {
      const route = readAdminRoute()
      setActiveTab(route.tab)
      setReviewProjectId(route.projectId)
      setViewNoticeId(route.noticeId)
      setNoticeEditorId(route.noticeEditor)
      setLoadedReviewProject(null)
      setReviewError('')
      setLoadedNotice(null)
      setNoticeLoadError('')
      const routeKeyword = route.tab === 'projects'
        ? projectSearchKeyword
        : route.tab === 'members'
          ? memberSearchKeyword
          : ''
      setSearchDraft(routeKeyword)
      setSearchKeyword(routeKeyword)
      setPage(1)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('hashchange', syncAdminRoute)
    return () => window.removeEventListener('hashchange', syncAdminRoute)
  }, [memberSearchKeyword, projectSearchKeyword])

  useEffect(() => {
    if (reviewProjectId === null || !onLoadProject) return

    let cancelled = false
    onLoadProject(reviewProjectId)
      .then((project) => {
        if (!cancelled) setLoadedReviewProject(project)
      })
      .catch((error) => {
        if (!cancelled) setReviewError(error instanceof Error ? error.message : '작품 상세정보를 불러오지 못했습니다.')
      })

    return () => { cancelled = true }
  }, [onLoadProject, reviewProjectId])

  useEffect(() => {
    if (requestedNoticeId === null || !onLoadNotice) return

    let cancelled = false
    onLoadNotice(requestedNoticeId)
      .then((notice) => {
        if (!cancelled) setLoadedNotice(notice)
      })
      .catch((error) => {
        if (!cancelled) setNoticeLoadError(error instanceof Error ? error.message : '공지사항 상세정보를 불러오지 못했습니다.')
      })

    return () => { cancelled = true }
  }, [onLoadNotice, requestedNoticeId])

  const filteredNotices = useMemo(() => {
    const keyword = searchKeyword.trim().toLocaleLowerCase('ko-KR')
    return keyword ? notices.filter((notice) => notice.title.toLocaleLowerCase('ko-KR').includes(keyword)) : notices
  }, [notices, searchKeyword])

  const activeItemCount = activeTab === 'notices' ? filteredNotices.length : 0
  const totalPages = Math.max(1, Math.ceil(activeItemCount / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const paginatedNotices = filteredNotices.slice(pageStart, pageStart + pageSize)
  const activePage = activeTab === 'projects'
    ? Math.min(projectsPage, Math.max(1, projectsTotalPages))
    : activeTab === 'members'
      ? Math.min(membersPage, Math.max(1, membersTotalPages))
      : currentPage
  const activeTotalPages = activeTab === 'projects'
    ? Math.max(1, projectsTotalPages)
    : activeTab === 'members'
      ? Math.max(1, membersTotalPages)
      : totalPages

  if (reviewProjectId !== null && (!loadedReviewProject || reviewError)) {
    return (
      <main className="page-container flex min-h-[360px] flex-1 flex-col items-center justify-center text-center">
        {!reviewError ? (
          <p className="text-sm text-neutral-400">작품 상세정보를 불러오는 중입니다.</p>
        ) : (
          <>
            <strong className="text-lg">작품 상세정보를 불러오지 못했습니다.</strong>
            <p className="mt-2 text-sm text-red-500">{reviewError}</p>
            <button type="button" className="mt-5 rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-500" onClick={() => navigateHash(adminHash('projects'))}>목록으로</button>
          </>
        )}
      </main>
    )
  }

  if (reviewProject) {
    return (
      <>
        <ProjectDetail
          project={reviewProject}
          viewerRole="admin"
          reviewMode
          backLabel="작품 관리"
          onBack={() => navigateHash(adminHash('projects'))}
          onBookmark={() => undefined}
          onApprove={async (id) => {
            if (await onApproveProject(id)) navigateHash(adminHash('projects'))
          }}
          onReject={setPendingRejectProjectId}
          onDelete={setPendingDeleteProjectId}
        />
        <ConfirmModal
          open={pendingRejectProjectId !== null}
          title="작품 승인을 반려하시겠습니까?"
          description="반려된 작품은 내 작품에서 승인 거부 상태로 표시됩니다."
          confirmLabel="반려"
          onCancel={() => setPendingRejectProjectId(null)}
          onConfirm={async () => {
            if (pendingRejectProjectId !== null && await onRejectProject(pendingRejectProjectId)) {
              setPendingRejectProjectId(null)
              navigateHash(adminHash('projects'))
            }
          }}
        />
        <ConfirmModal
          open={pendingDeleteProjectId !== null}
          title="작품을 삭제하시겠습니까?"
          description="삭제한 작품과 등록 파일은 복구할 수 없습니다."
          confirmLabel="삭제"
          onCancel={() => setPendingDeleteProjectId(null)}
          onConfirm={async () => {
            if (pendingDeleteProjectId !== null && await onDeleteProject(pendingDeleteProjectId)) {
              setPendingDeleteProjectId(null)
              navigateHash(adminHash('projects'))
            }
          }}
        />
      </>
    )
  }

  if (requestedNoticeId !== null && !routeNotice) {
    return (
      <main className="page-container flex flex-1 flex-col pt-3 md:pt-[17px]">
        <AdminStateRow
          message={noticeLoadError || '공지사항 상세정보를 불러오는 중입니다.'}
          actionLabel={noticeLoadError ? '목록으로' : undefined}
          onAction={noticeLoadError ? () => navigateHash(adminHash('notices')) : undefined}
        />
      </main>
    )
  }

  if (noticeEditor) {
    return (
      <AdminNoticeEditor
        initialNotice={noticeEditor === 'new' ? undefined : noticeEditor}
        onCancel={() => navigateHash(adminHash('notices'))}
        onSubmit={async (data) => {
          const saved = await onSaveNotice(noticeEditor === 'new' ? null : noticeEditor.id, data)
          if (saved) navigateHash(adminHash('notices'))
        }}
      />
    )
  }

  if (viewNotice) {
    return <NoticeDetail notice={viewNotice} backLabel="공지 관리" onBack={() => navigateHash(adminHash('notices'))} />
  }

  const changeTab = (tab: AdminTab) => {
    navigateHash(adminHash(tab))
  }

  const searchPlaceholder = activeTab === 'members' ? '이름, 학번으로 검색' : '제목으로 검색'

  return (
    <>
      <main className="page-container flex flex-1 flex-col md:pt-[29px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
          <form
            className="relative mt-3 h-5 w-full md:mt-0 md:h-[30px] md:w-[500px]"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              const keyword = searchDraft.trim()
              setSearchKeyword(keyword)
              setPage(1)
              if (activeTab === 'projects') onProjectSearch?.(keyword)
              if (activeTab === 'members') onMemberSearch?.(keyword)
            }}
          >
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="block h-full w-full rounded-full bg-[#f0f0f0] px-3 pr-8 text-[9px] outline-none placeholder:text-neutral-400 md:px-4 md:pr-10 md:text-[11px]" placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 md:right-3" aria-label="관리자 페이지 검색"><Search className="h-2.5 w-2.5 md:h-3 md:w-3" /></button>
          </form>

          <div className="my-3 flex items-center gap-3 md:my-0 md:gap-6">
            {activeTab === 'notices' && (
              <button type="button" className="h-[26px] w-[92px] rounded-full border border-neutral-300 text-[9px] text-neutral-600 hover:border-brand hover:text-brand md:h-[30px] md:w-[112px] md:text-[11px]" onClick={() => navigateHash('#/admin/notices/new')}>공지 등록</button>
            )}
            <div className="grid h-[26px] flex-1 grid-cols-3 overflow-hidden rounded-full bg-[#f0f0f0] md:h-[30px] md:w-[336px] md:flex-none">
              {tabItems.map((tab) => (
                <button key={tab.id} type="button" className={`rounded-full border text-[9px] md:text-[11px] ${activeTab === tab.id ? 'border-neutral-300 bg-[#dfe7fb] font-normal text-brand' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`} onClick={() => changeTab(tab.id)}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:mt-[15px]">
          {activeTab === 'projects' && (
            projectsLoading
              ? <AdminStateRow message="작품 목록을 불러오는 중입니다." />
              : projectsError
                ? <AdminStateRow message={projectsError} actionLabel="다시 시도" onAction={onRetryProjects} />
                : <ProjectManagementTable projects={projects} onOpen={(id) => navigateHash(`#/admin/projects/${id}`)} />
          )}
          {activeTab === 'members' && (
            membersLoading
              ? <AdminStateRow message="회원 목록을 불러오는 중입니다." />
              : membersError
                ? <AdminStateRow message={membersError} actionLabel="다시 시도" onAction={onRetryMembers} />
                : <MemberManagementTable memberItems={members} onRoleChange={onMemberRoleChange} onDelete={setPendingDeleteMemberId} />
          )}
          {activeTab === 'notices' && (
            <NoticeManagementTable
              notices={paginatedNotices}
              onOpen={(id) => navigateHash(`#/admin/notices/${id}`)}
              onEdit={(notice) => navigateHash(`#/admin/notices/${notice.id}/edit`)}
              onDelete={setPendingDeleteNoticeId}
            />
          )}
        </div>

        <Pagination
          page={activePage}
          totalPages={activeTotalPages}
          onChange={activeTab === 'projects' && onProjectsPageChange
            ? onProjectsPageChange
            : activeTab === 'members' && onMembersPageChange
              ? onMembersPageChange
              : setPage}
          ariaLabel="관리자 목록 페이지 이동"
          className="mb-10 mt-auto"
        />
      </main>

      <ConfirmModal
        open={pendingDeleteNoticeId !== null}
        title="공지를 삭제하시겠습니까?"
        description="삭제한 공지사항과 첨부파일은 복구할 수 없습니다."
        confirmLabel="삭제"
        onCancel={() => setPendingDeleteNoticeId(null)}
        onConfirm={async () => {
          if (pendingDeleteNoticeId !== null && await onDeleteNotice(pendingDeleteNoticeId)) setPendingDeleteNoticeId(null)
        }}
      />
      <ConfirmModal
        open={pendingDeleteMemberId !== null}
        title="회원을 삭제하시겠습니까?"
        description="삭제한 회원 정보는 복구할 수 없습니다."
        confirmLabel="삭제"
        onCancel={() => setPendingDeleteMemberId(null)}
        onConfirm={async () => {
          if (pendingDeleteMemberId !== null && await onDeleteMember(pendingDeleteMemberId)) {
            setPendingDeleteMemberId(null)
          }
        }}
      />
    </>
  )
}

function ProjectManagementTable({ projects, onOpen }: { projects: GalleryProject[]; onOpen: (id: number) => void }) {
  return (
    <div className="w-full text-[9px] md:text-[11px]">
      <div className="grid h-[27px] grid-cols-[1fr_82px] items-center border-y border-neutral-200 bg-slate-50 px-3 text-neutral-400 md:h-[32px] md:grid-cols-[1fr_132px] md:px-5"><span>제목</span><span>등록일</span></div>
      {projects.map((project) => (
        <button key={project.id} type="button" className="grid h-[29px] w-full grid-cols-[1fr_82px] items-center border-b border-neutral-200 px-3 text-left text-neutral-700 hover:bg-neutral-50 md:h-[32px] md:grid-cols-[1fr_132px] md:px-5" onClick={() => onOpen(project.id)}>
          <span className="truncate">{project.title}</span><span className="text-neutral-400">{project.date}</span>
        </button>
      ))}
      {projects.length === 0 && <EmptyRow />}
    </div>
  )
}

function MemberManagementTable({ memberItems, onRoleChange, onDelete }: { memberItems: AdminMember[]; onRoleChange: (id: number, role: AdminMemberRole) => Promise<boolean> | boolean; onDelete: (id: number) => void }) {
  const [openMemberId, setOpenMemberId] = useState<number | null>(null)

  return (
    <div className="w-full text-[9px] md:text-[11px]">
      <div className="grid h-[27px] grid-cols-[0.7fr_0.8fr_1.25fr_58px] items-center border-y border-neutral-200 bg-slate-50 px-3 text-neutral-400 md:h-[32px] md:grid-cols-[0.8fr_1fr_1.45fr_110px] md:px-5"><span>이름</span><span>학번</span><span>이메일</span><span>관리</span></div>
      {memberItems.map((member) => (
        <div key={member.id} className="grid min-h-[29px] grid-cols-[0.7fr_0.8fr_1.25fr_58px] items-center border-b border-neutral-200 px-3 text-neutral-700 md:min-h-[32px] md:grid-cols-[0.8fr_1fr_1.45fr_110px] md:px-5">
          <span>{member.name}</span><span>{member.studentId}</span><span className="truncate">{member.email}</span>
          <div className="relative justify-self-start">
            <button type="button" className="flex h-6 items-center gap-1 text-[8px] text-neutral-500 md:text-[10px]" aria-haspopup="menu" aria-expanded={openMemberId === member.id} onClick={() => setOpenMemberId((current) => current === member.id ? null : member.id)}>
              {member.role === 'admin' ? '관리자' : '일반'}
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${openMemberId === member.id ? 'rotate-180' : ''}`} strokeWidth={1.4} aria-hidden="true" />
            </button>
            {openMemberId === member.id && (
              <div className="absolute left-0 top-full z-30 min-w-[48px] overflow-hidden rounded-[3px] border border-neutral-200 bg-white shadow-sm" role="menu">
                <button type="button" role="menuitem" className="block h-6 w-full px-2 text-left text-[8px] text-neutral-500 hover:bg-[#eef3ff] md:text-[10px]" onClick={async () => { await onRoleChange(member.id, member.role === 'admin' ? 'general' : 'admin'); setOpenMemberId(null) }}>{member.role === 'admin' ? '일반' : '관리자'}</button>
                <button type="button" role="menuitem" className="block h-6 w-full px-2 text-left text-[8px] text-red-400 hover:bg-red-50 md:text-[10px]" onClick={() => { onDelete(member.id); setOpenMemberId(null) }}>삭제</button>
              </div>
            )}
          </div>
        </div>
      ))}
      {memberItems.length === 0 && <EmptyRow />}
    </div>
  )
}

function NoticeManagementTable({ notices, onOpen, onEdit, onDelete }: { notices: Notice[]; onOpen: (id: number) => void; onEdit: (notice: Notice) => void; onDelete: (id: number) => void }) {
  return (
    <div className="w-full text-[9px] md:text-[11px]">
      <div className="grid h-[27px] grid-cols-[1fr_75px_64px] items-center border-y border-neutral-200 bg-slate-50 px-3 text-neutral-400 md:h-[32px] md:grid-cols-[1fr_132px_100px] md:px-5"><span>제목</span><span>날짜</span><span /></div>
      {notices.map((notice) => (
        <div key={notice.id} className="grid min-h-[29px] grid-cols-[1fr_75px_64px] items-center border-b border-neutral-200 px-3 text-neutral-700 md:min-h-[32px] md:grid-cols-[1fr_132px_100px] md:px-5">
          <button type="button" className="flex min-w-0 items-center text-left hover:text-brand hover:underline" onClick={() => onOpen(notice.id)}>
            <span className="truncate">{notice.title}</span>
            {notice.hasFile && <Paperclip className="ml-1 h-2.5 w-2.5 flex-none text-neutral-400 md:h-3 md:w-3" aria-label="첨부파일 있음" />}
          </button><span className="text-neutral-400">{notice.date}</span>
          <span className="flex justify-end gap-3"><button type="button" className="text-neutral-500 hover:text-brand" onClick={() => onEdit(notice)}>수정</button><button type="button" className="text-red-400 hover:text-red-500" onClick={() => onDelete(notice.id)}>삭제</button></span>
        </div>
      ))}
      {notices.length === 0 && <EmptyRow />}
    </div>
  )
}

function EmptyRow() {
  return <div className="flex h-20 items-center justify-center border-b border-neutral-200 text-[10px] text-neutral-400 md:text-[12px]">검색 결과가 없습니다.</div>
}

function AdminStateRow({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex h-24 flex-col items-center justify-center border-y border-neutral-200 text-[10px] text-neutral-400 md:text-[12px]">
      <span>{message}</span>
      {actionLabel && onAction && <button type="button" className="mt-2 text-brand hover:underline" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}

function AdminNoticeEditor({ initialNotice, onCancel, onSubmit }: { initialNotice?: Notice; onCancel: () => void; onSubmit: (data: AdminNoticeData) => Promise<void> | void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const existingAttachmentNames = initialNotice?.attachments?.map((attachment) => attachment.originalName).join(', ') || initialNotice?.attachmentName || ''
  const attachmentName = selectedFiles.map((file) => file.name).join(', ') || existingAttachmentNames

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit({
      title: String(formData.get('title') ?? '').trim(),
      content: String(formData.get('content') ?? '').trim(),
      attachmentName,
      files: selectedFiles,
    })
  }

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[768px] flex-1 pb-8 pt-5 md:pb-12 md:pt-11">
      <h1 className="text-[17px] font-bold text-neutral-900 md:text-[20px]">공지 {initialNotice ? '수정' : '등록'}</h1>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">제목</span><input name="title" defaultValue={initialNotice?.title} className="h-[34px] w-full rounded-[5px] border border-neutral-300 px-3 text-[10px] outline-none focus:border-brand md:h-11 md:px-4 md:text-[12px]" placeholder="공지 제목을 입력하세요" required /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">내용</span><textarea name="content" defaultValue={initialNotice?.content} className="h-[310px] w-full resize-none rounded-[5px] border border-neutral-300 p-3 text-[10px] leading-5 outline-none focus:border-brand md:h-[480px] md:p-4 md:text-[12px] md:leading-6" placeholder="공지 내용을 입력하세요" required /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">첨부 파일</span><span className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[5px] border border-dashed border-neutral-300 bg-slate-50 px-3 text-[10px] text-neutral-400 md:text-[12px]"><span className="truncate">{attachmentName || '+'}</span><input type="file" multiple className="sr-only" onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))} /></span></label>
        <div className="flex justify-between pt-1"><button type="button" className="h-10 w-[100px] rounded-[7px] border border-neutral-300 text-[11px] text-neutral-500 md:h-11 md:w-40 md:text-[13px]" onClick={onCancel}>취소</button><button type="submit" className="h-10 w-[150px] rounded-[7px] bg-brand text-[11px] font-semibold text-white md:h-11 md:w-64 md:text-[13px]">{initialNotice ? '수정 완료' : '등록 완료'}</button></div>
      </form>
    </main>
  )
}
