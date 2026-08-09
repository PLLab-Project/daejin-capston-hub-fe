import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Notice } from '../types/notice'
import type { GalleryProject } from '../types/project'
import { ConfirmModal } from './ConfirmModal'
import { NoticeDetail } from './NoticeDetail'
import { ProjectDetail } from './ProjectDetail'

type AdminTab = 'projects' | 'members' | 'notices'

export interface AdminNoticeData {
  title: string
  content: string
  attachmentName: string
}

interface AdminPageProps {
  projects: GalleryProject[]
  notices: Notice[]
  onApproveProject: (id: number) => void
  onRejectProject: (id: number) => void
  onSaveNotice: (id: number | null, data: AdminNoticeData) => void
  onDeleteNotice: (id: number) => void
}

type MemberRole = 'admin' | 'general'

interface Member {
  id: number
  name: string
  studentId: string
  email: string
  role: MemberRole
}

const initialMembers: Member[] = [
  { id: 1, name: '김민정', studentId: '20241472', email: 'minjung2283@gmail.com', role: 'admin' },
  { id: 2, name: '홍길동', studentId: '20261001', email: 'gildong@daejin.ac.kr', role: 'general' },
  { id: 3, name: '이서현', studentId: '20261002', email: 'seohyun@daejin.ac.kr', role: 'general' },
]

const tabItems: Array<{ id: AdminTab; label: string }> = [
  { id: 'projects', label: '작품 관리' },
  { id: 'members', label: '회원 관리' },
  { id: 'notices', label: '공지 관리' },
]

export function AdminPage({
  projects,
  notices,
  onApproveProject,
  onRejectProject,
  onSaveNotice,
  onDeleteNotice,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('projects')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [reviewProjectId, setReviewProjectId] = useState<number | null>(null)
  const [noticeEditor, setNoticeEditor] = useState<Notice | 'new' | null>(null)
  const [viewNoticeId, setViewNoticeId] = useState<number | null>(null)
  const [pendingDeleteNoticeId, setPendingDeleteNoticeId] = useState<number | null>(null)
  const [memberItems, setMemberItems] = useState(initialMembers)
  const reviewProject = projects.find((project) => project.id === reviewProjectId)
  const viewNotice = notices.find((notice) => notice.id === viewNoticeId)

  const filteredProjects = useMemo(() => {
    const keyword = searchKeyword.trim().toLocaleLowerCase('ko-KR')
    return keyword ? projects.filter((project) => project.title.toLocaleLowerCase('ko-KR').includes(keyword)) : projects
  }, [projects, searchKeyword])

  const filteredMembers = useMemo(() => {
    const keyword = searchKeyword.trim().toLocaleLowerCase('ko-KR')
    return keyword ? memberItems.filter((member) => [member.name, member.studentId].some((value) => value.toLocaleLowerCase('ko-KR').includes(keyword))) : memberItems
  }, [memberItems, searchKeyword])

  const filteredNotices = useMemo(() => {
    const keyword = searchKeyword.trim().toLocaleLowerCase('ko-KR')
    return keyword ? notices.filter((notice) => notice.title.toLocaleLowerCase('ko-KR').includes(keyword)) : notices
  }, [notices, searchKeyword])

  if (reviewProject) {
    return (
      <ProjectDetail
        project={reviewProject}
        viewerRole="admin"
        reviewMode
        backLabel="작품 관리"
        onBack={() => setReviewProjectId(null)}
        onBookmark={() => undefined}
        onApprove={(id) => {
          onApproveProject(id)
          setReviewProjectId(null)
        }}
        onReject={(id) => {
          onRejectProject(id)
          setReviewProjectId(null)
        }}
      />
    )
  }

  if (noticeEditor) {
    return (
      <AdminNoticeEditor
        initialNotice={noticeEditor === 'new' ? undefined : noticeEditor}
        onCancel={() => setNoticeEditor(null)}
        onSubmit={(data) => {
          onSaveNotice(noticeEditor === 'new' ? null : noticeEditor.id, data)
          setNoticeEditor(null)
        }}
      />
    )
  }

  if (viewNotice) {
    return <NoticeDetail notice={viewNotice} backLabel="공지 관리" onBack={() => setViewNoticeId(null)} />
  }

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab)
    setSearchDraft('')
    setSearchKeyword('')
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
              setSearchKeyword(searchDraft.trim())
            }}
          >
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="block h-full w-full rounded-full bg-[#f0f0f0] px-3 pr-8 text-[9px] outline-none placeholder:text-neutral-400 md:px-4 md:pr-10 md:text-[11px]" placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 md:right-3" aria-label="관리자 페이지 검색"><Search className="h-2.5 w-2.5 md:h-3 md:w-3" /></button>
          </form>

          <div className="my-3 flex items-center gap-3 md:my-0 md:gap-6">
            {activeTab === 'notices' && (
              <button type="button" className="h-[26px] w-[92px] rounded-full border border-neutral-300 text-[9px] text-neutral-600 hover:border-brand hover:text-brand md:h-[30px] md:w-[112px] md:text-[11px]" onClick={() => setNoticeEditor('new')}>공지 등록</button>
            )}
            <div className="grid h-[26px] flex-1 grid-cols-3 overflow-hidden rounded-full bg-[#f0f0f0] md:h-[30px] md:w-[336px] md:flex-none">
              {tabItems.map((tab) => (
                <button key={tab.id} type="button" className={`rounded-full border text-[9px] md:text-[11px] ${activeTab === tab.id ? 'border-neutral-300 bg-[#dfe7fb] font-normal text-brand' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`} onClick={() => changeTab(tab.id)}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:mt-[15px]">
          {activeTab === 'projects' && <ProjectManagementTable projects={filteredProjects} onOpen={setReviewProjectId} />}
          {activeTab === 'members' && (
            <MemberManagementTable
              memberItems={filteredMembers}
              onRoleChange={(id, role) => setMemberItems((items) => items.map((member) => member.id === id ? { ...member, role } : member))}
              onDelete={(id) => setMemberItems((items) => items.filter((member) => member.id !== id))}
            />
          )}
          {activeTab === 'notices' && (
            <NoticeManagementTable
              notices={filteredNotices}
              onOpen={setViewNoticeId}
              onEdit={setNoticeEditor}
              onDelete={setPendingDeleteNoticeId}
            />
          )}
        </div>

        <AdminPagination />
      </main>

      <ConfirmModal
        open={pendingDeleteNoticeId !== null}
        title="공지를 삭제하시겠습니까?"
        description="삭제한 공지사항과 첨부파일은 복구할 수 없습니다."
        confirmLabel="삭제"
        onCancel={() => setPendingDeleteNoticeId(null)}
        onConfirm={() => {
          if (pendingDeleteNoticeId !== null) onDeleteNotice(pendingDeleteNoticeId)
          setPendingDeleteNoticeId(null)
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

function MemberManagementTable({ memberItems, onRoleChange, onDelete }: { memberItems: Member[]; onRoleChange: (id: number, role: MemberRole) => void; onDelete: (id: number) => void }) {
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
                <button type="button" role="menuitem" className="block h-6 w-full px-2 text-left text-[8px] text-neutral-500 hover:bg-[#eef3ff] md:text-[10px]" onClick={() => { onRoleChange(member.id, member.role === 'admin' ? 'general' : 'admin'); setOpenMemberId(null) }}>{member.role === 'admin' ? '일반' : '관리자'}</button>
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
          <button type="button" className="truncate text-left hover:text-brand hover:underline" onClick={() => onOpen(notice.id)}>{notice.title}</button><span className="text-neutral-400">{notice.date}</span>
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

function AdminPagination() {
  return (
    <nav className="mb-10 mt-auto flex h-5 items-center justify-center gap-5 pt-10 text-[10px] text-neutral-400 md:mb-0 md:gap-6 md:text-[12px]" aria-label="관리자 목록 페이지 이동">
      <button type="button" aria-label="이전 페이지" disabled><ChevronLeft className="h-3 w-3" /></button>
      <button type="button" className="flex h-5 min-w-[14px] items-center justify-center border-b-2 border-brand px-1 font-semibold leading-none text-brand">1</button>
      <button type="button" aria-label="다음 페이지" disabled><ChevronRight className="h-3 w-3" /></button>
    </nav>
  )
}

function AdminNoticeEditor({ initialNotice, onCancel, onSubmit }: { initialNotice?: Notice; onCancel: () => void; onSubmit: (data: AdminNoticeData) => void }) {
  const [attachmentName, setAttachmentName] = useState(initialNotice?.attachmentName ?? '')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit({
      title: String(formData.get('title') ?? '').trim(),
      content: String(formData.get('content') ?? '').trim(),
      attachmentName,
    })
  }

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[768px] flex-1 pb-8 pt-5 md:pb-12 md:pt-11">
      <h1 className="text-[17px] font-bold text-neutral-900 md:text-[20px]">공지 {initialNotice ? '수정' : '등록'}</h1>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">제목</span><input name="title" defaultValue={initialNotice?.title} className="h-[34px] w-full rounded-[5px] border border-neutral-300 px-3 text-[10px] outline-none focus:border-brand md:h-11 md:px-4 md:text-[12px]" placeholder="공지 제목을 입력하세요" required /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">내용</span><textarea name="content" defaultValue={initialNotice?.content} className="h-[310px] w-full resize-none rounded-[5px] border border-neutral-300 p-3 text-[10px] leading-5 outline-none focus:border-brand md:h-[480px] md:p-4 md:text-[12px] md:leading-6" placeholder="공지 내용을 입력하세요" required /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold md:text-[12px]">첨부 파일</span><span className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[5px] border border-dashed border-neutral-300 bg-slate-50 text-[10px] text-neutral-400 md:text-[12px]">{attachmentName || '+'}<input type="file" className="sr-only" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? '')} /></span></label>
        <div className="flex justify-between pt-1"><button type="button" className="h-10 w-[100px] rounded-[7px] border border-neutral-300 text-[11px] text-neutral-500 md:h-11 md:w-40 md:text-[13px]" onClick={onCancel}>취소</button><button type="submit" className="h-10 w-[150px] rounded-[7px] bg-brand text-[11px] font-semibold text-white md:h-11 md:w-64 md:text-[13px]">{initialNotice ? '수정 완료' : '등록 완료'}</button></div>
      </form>
    </main>
  )
}
