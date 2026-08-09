import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Filters, type FilterState } from './components/Filters'
import { ProjectCard } from './components/ProjectCard'
import { ProjectDetail } from './components/ProjectDetail'
import { Footer } from './components/Footer'
import { LoginModal } from './components/LoginModal'
import { FirstLoginModal } from './components/FirstLoginModal'
import { NoticePage } from './components/NoticePage'
import { NoticeDetail } from './components/NoticeDetail'
import { ProjectCollectionPage } from './components/ProjectCollectionPage'
import { ProjectRegistrationPage, type ProjectRegistrationData } from './components/ProjectRegistrationPage'
import { MyPage, type UserProfile } from './components/MyPage'
import { ConfirmModal } from './components/ConfirmModal'
import { AdminPage, type AdminNoticeData } from './components/AdminPage'
import { Pagination } from './components/Pagination'
import { StatusModal } from './components/StatusModal'
import { initialProjects } from './data/projects'
import { initialNotices } from './data/notices'
import { navigateHash, noticeHash, pageHash, projectHash, readHashRoute, type AppPage, type ProjectSourcePage } from './utils/hashRoute'

const initialFilters: FilterState = { year: [], category: [], sort: '최신순', search: '' }
type AuthStep = 'closed' | 'login' | 'first-login'
const homePageSize = 12
const initialRoute = typeof window === 'undefined'
  ? { page: 'gallery' as AppPage, projectId: null, noticeId: null, editingProjectId: null }
  : readHashRoute()

interface FeedbackMessage {
  title: string
  description?: string
}

const initialProfile: UserProfile = {
  name: '김민정',
  studentId: '20241472',
  email: 'minjung2283@gmail.com',
}

export default function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [filters, setFilters] = useState(initialFilters)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('closed')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasCompletedInitialProfile, setHasCompletedInitialProfile] = useState(false)
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page)
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialRoute.projectId)
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(initialRoute.noticeId)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(initialRoute.editingProjectId)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)
  const [notices, setNotices] = useState(initialNotices)
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const selectedNotice = notices.find((notice) => notice.id === selectedNoticeId)
  const editingProject = projects.find((project) => project.id === editingProjectId)
  const myProjects = projects.filter((project) => project.owned)
  const favoriteProjects = projects.filter((project) => project.bookmarked)

  const filteredProjects = useMemo(() => {
    const keyword = filters.search.trim().toLocaleLowerCase('ko-KR')
    const result = projects.filter((project) =>
      (!filters.year.length || filters.year.includes(String(project.year))) &&
      (!filters.category.length || filters.category.includes(project.category)) &&
      (!keyword || [project.title, project.description, project.author].some((value) => value.toLocaleLowerCase('ko-KR').includes(keyword))),
    )
    return [...result].sort((a, b) => filters.sort === '이름순' ? a.title.localeCompare(b.title, 'ko-KR') : b.date.localeCompare(a.date))
  }, [filters, projects])
  const homeTotalPages = Math.max(1, Math.ceil(filteredProjects.length / homePageSize))
  const currentHomePage = Math.min(page, homeTotalPages)
  const paginatedProjects = filteredProjects.slice((currentHomePage - 1) * homePageSize, currentHomePage * homePageSize)

  const updateFilters = (next: FilterState) => {
    setFilters(next)
    setPage(1)
  }

  const syncRoute = useCallback(() => {
    const route = readHashRoute()
    setCurrentPage(route.page)
    setSelectedProjectId(route.projectId)
    setSelectedNoticeId(route.noticeId)
    setEditingProjectId(route.editingProjectId)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#top') {
      window.history.replaceState(null, '', pageHash('gallery'))
    }
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [syncRoute])

  const navigateTo = useCallback((hash: string, replace = false) => {
    if (window.location.hash === hash) {
      syncRoute()
      return
    }
    navigateHash(hash, replace)
  }, [syncRoute])

  const toggleBookmark = (id: number) => setProjects((items) => items.map((item) => item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
  const showGallery = () => navigateTo(pageHash('gallery'))
  const showNotices = () => navigateTo(pageHash('notices'))
  const showRegistration = () => navigateTo(pageHash('register'))
  const showMyProjects = () => navigateTo(pageHash('my-projects'))
  const showFavorites = () => navigateTo(pageHash('favorites'))
  const showMyPage = () => navigateTo(pageHash('my-page'))
  const showAdmin = () => navigateTo(pageHash('admin'))
  const showNotice = (id: number) => navigateTo(noticeHash(id))
  const showProject = (id: number) => {
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(id, source))
  }

  const closeProject = () => {
    navigateTo(pageHash(currentPage))
  }

  const startEditingProject = (id: number) => {
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(id, source, true))
  }

  const registerProject = (data: ProjectRegistrationData) => {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '.')

    setProjects((items) => [
      ...items,
      {
        id: Math.max(0, ...items.map((project) => project.id)) + 1,
        title: data.title,
        description: data.summary,
        detailSummary: data.summary,
        field: data.category,
        techStack: data.techStack.split(',').map((technology) => technology.trim()).filter(Boolean),
        longDescription: data.description,
        demoVideoUrl: data.demoVideoUrl || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        author: data.author || profile.name,
        date,
        year: Number(date.slice(0, 4)),
        category: data.category,
        bookmarked: false,
        owned: true,
        approvalStatus: 'pending',
      },
    ])
    setFeedback({
      title: '작품 등록이 완료되었습니다.',
      description: '등록한 작품은 내 작품에서 확인할 수 있으며 관리자 승인 후 갤러리에 공개됩니다.',
    })
    showMyProjects()
  }

  const updateProject = (data: ProjectRegistrationData) => {
    if (editingProjectId === null) return
    const updatedProjectId = editingProjectId

    setProjects((items) => items.map((project) => project.id === updatedProjectId ? {
      ...project,
      title: data.title,
      description: data.summary,
      detailSummary: data.summary,
      field: data.category,
      category: data.category,
      techStack: data.techStack.split(',').map((technology) => technology.trim()).filter(Boolean),
      longDescription: data.description,
      demoVideoUrl: data.demoVideoUrl || project.demoVideoUrl,
    } : project))
    setFeedback({ title: '작품 수정이 완료되었습니다.', description: '변경한 내용이 작품 상세정보에 반영되었습니다.' })
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(updatedProjectId, source))
  }

  const deleteProject = (id: number) => {
    setProjects((items) => items.filter((project) => project.id !== id))
    setPendingDeleteProjectId(null)
    navigateTo(pageHash(currentPage))
  }

  const setProjectApproval = (id: number, approvalStatus: 'approved' | 'rejected') => {
    setProjects((items) => items.map((project) => project.id === id ? { ...project, approvalStatus } : project))
  }

  const saveNotice = (id: number | null, data: AdminNoticeData) => {
    if (id !== null) {
      setNotices((items) => items.map((notice) => notice.id === id ? { ...notice, ...data } : notice))
      setFeedback({ title: '공지 수정이 완료되었습니다.', description: '변경한 내용이 공지사항에 반영되었습니다.' })
      return
    }

    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '.')
    setNotices((items) => [{ id: Math.max(0, ...items.map((notice) => notice.id)) + 1, date, ...data }, ...items])
    setFeedback({ title: '공지 등록이 완료되었습니다.', description: '새 공지사항이 목록에 추가되었습니다.' })
  }

  const activeItem = currentPage === 'notices'
    ? '공지사항'
    : currentPage === 'register'
      ? '작품 등록'
    : currentPage === 'my-projects'
      ? '내 작품'
      : currentPage === 'favorites'
        ? '즐겨찾기'
        : currentPage === 'my-page'
          ? '마이페이지'
        : currentPage === 'admin'
          ? '관리자 페이지'
        : '갤러리'

  return (
    <div id="top" className="flex min-h-screen flex-col bg-white text-neutral-800">
      <Header
        menuOpen={menuOpen}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        activeItem={activeItem}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onGalleryClick={showGallery}
        onNoticeClick={showNotices}
        onRegisterClick={showRegistration}
        onMyProjectsClick={showMyProjects}
        onFavoritesClick={showFavorites}
        onMyPageClick={showMyPage}
        onAdminClick={showAdmin}
        onLoginClick={() => setAuthStep('login')}
        onLogoutClick={() => {
          setIsLoggedIn(false)
          setIsAdmin(false)
          setAuthStep('closed')
          showGallery()
        }}
      />
      {editingProject ? (
        <ProjectRegistrationPage
          key={editingProject.id}
          mode="edit"
          initialData={{
            title: editingProject.title,
            summary: editingProject.description,
            category: editingProject.category,
            techStack: editingProject.techStack.join(', '),
            description: editingProject.longDescription,
            demoVideoUrl: editingProject.demoVideoUrl,
          }}
          onCancel={() => {
            const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
            navigateTo(projectHash(editingProject.id, source))
          }}
          onSubmit={updateProject}
        />
      ) : currentPage === 'notices' ? (
        selectedNotice ? <NoticeDetail notice={selectedNotice} onBack={showNotices} /> : <NoticePage notices={notices} onOpen={showNotice} />
      ) : currentPage === 'register' ? (
        <ProjectRegistrationPage adminMode={isAdmin} onCancel={showGallery} onSubmit={registerProject} />
      ) : currentPage === 'admin' ? (
        <AdminPage
          projects={projects}
          notices={notices}
          onApproveProject={(id) => setProjectApproval(id, 'approved')}
          onRejectProject={(id) => setProjectApproval(id, 'rejected')}
          onSaveNotice={saveNotice}
          onDeleteNotice={(id) => setNotices((items) => items.filter((notice) => notice.id !== id))}
        />
      ) : currentPage === 'my-page' ? (
        <MyPage
          profile={profile}
          myProjects={myProjects}
          favoriteProjects={favoriteProjects}
          onProfileChange={(nextProfile) => {
            setProfile(nextProfile)
            setFeedback({ title: '정보 수정이 완료되었습니다.', description: '변경한 회원 정보가 마이페이지에 반영되었습니다.' })
          }}
          onMyProjectsClick={showMyProjects}
          onFavoritesClick={showFavorites}
        />
      ) : selectedProject ? (
        <ProjectDetail
          key={selectedProject.id}
          project={selectedProject}
          viewerRole={isAdmin ? 'admin' : currentPage === 'my-projects' || (isLoggedIn && selectedProject.owned) ? 'owner' : 'guest'}
          backLabel={currentPage === 'favorites' ? '즐겨찾기' : currentPage === 'my-projects' ? '내 작품' : '갤러리'}
          onBack={closeProject}
          onBookmark={toggleBookmark}
          onEdit={startEditingProject}
          onDelete={setPendingDeleteProjectId}
        />
      ) : currentPage === 'my-projects' ? (
        <ProjectCollectionPage
          projects={myProjects}
          emptyMessage="등록한 작품이 없습니다."
          groupByApprovalStatus
          onBookmark={toggleBookmark}
          onOpen={showProject}
        />
      ) : currentPage === 'favorites' ? (
        <ProjectCollectionPage
          projects={favoriteProjects}
          emptyMessage="즐겨찾기한 작품이 없습니다."
          onBookmark={toggleBookmark}
          onOpen={showProject}
        />
      ) : (
        <main className="page-container flex-1">
          <Filters key={filters.search} filters={filters} resultCount={filteredProjects.length} onChange={updateFilters} />

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-x-10 md:gap-y-[37px] lg:grid-cols-4">
              {paginatedProjects.map((project) => <ProjectCard key={project.id} project={project} onBookmark={toggleBookmark} onOpen={showProject} />)}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <strong className="text-lg">검색 결과가 없습니다.</strong>
              <p className="mt-2 text-sm text-neutral-400">다른 검색어나 필터를 선택해 보세요.</p>
              <button className="mt-5 rounded-full bg-brand px-5 py-2 text-sm text-white" type="button" onClick={() => updateFilters(initialFilters)}>필터 초기화</button>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <Pagination
              page={currentHomePage}
              totalPages={homeTotalPages}
              onChange={(nextPage) => {
                setPage(nextPage)
                window.scrollTo({ top: 0, behavior: 'auto' })
              }}
              ariaLabel="페이지 이동"
              className="mb-10 mt-10 md:mb-0 md:mt-[57px]"
            />
          )}
        </main>
      )}
      <Footer />
      <LoginModal
        open={authStep === 'login'}
        onClose={() => setAuthStep('closed')}
        onSubmit={(credentials) => {
          if (credentials.studentId.trim().toLowerCase() === 'admin') {
            setIsAdmin(true)
            setIsLoggedIn(true)
            setAuthStep('closed')
            return
          }

          setIsAdmin(false)
          if (credentials.studentId.trim()) {
            setProfile((current) => ({ ...current, studentId: credentials.studentId.trim() }))
          }
          if (hasCompletedInitialProfile) {
            setIsLoggedIn(true)
            setAuthStep('closed')
            return
          }

          setAuthStep('first-login')
        }}
      />
      <FirstLoginModal
        open={authStep === 'first-login'}
        onClose={() => setAuthStep('closed')}
        onSubmit={(firstLoginProfile) => {
          setProfile((current) => ({ ...current, ...firstLoginProfile }))
          setHasCompletedInitialProfile(true)
          setIsLoggedIn(true)
          setAuthStep('closed')
          setFeedback({ title: '정보 등록이 완료되었습니다.', description: '입력한 회원 정보는 마이페이지에서 수정할 수 있습니다.' })
        }}
      />
      <ConfirmModal
        open={pendingDeleteProjectId !== null}
        title="작품을 삭제하시겠습니까?"
        description="삭제한 작품과 등록 파일은 복구할 수 없습니다."
        confirmLabel="삭제"
        onCancel={() => setPendingDeleteProjectId(null)}
        onConfirm={() => {
          if (pendingDeleteProjectId !== null) deleteProject(pendingDeleteProjectId)
        }}
      />
      <StatusModal
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        onClose={() => setFeedback(null)}
      />
    </div>
  )
}
