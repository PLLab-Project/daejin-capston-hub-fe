import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { initialProjects } from './data/projects'
import { initialNotices } from './data/notices'

const initialFilters: FilterState = { year: [], category: [], sort: '최신순', search: '' }
type AuthStep = 'closed' | 'login' | 'first-login'
type CurrentPage = 'gallery' | 'notices' | 'register' | 'my-projects' | 'favorites'

export default function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [filters, setFilters] = useState(initialFilters)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('closed')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasCompletedInitialProfile, setHasCompletedInitialProfile] = useState(false)
  const [currentPage, setCurrentPage] = useState<CurrentPage>('gallery')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const selectedNotice = initialNotices.find((notice) => notice.id === selectedNoticeId)
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

  const updateFilters = (next: FilterState) => {
    setFilters(next)
    setPage(1)
  }

  const toggleBookmark = (id: number) => setProjects((items) => items.map((item) => item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
  const showGallery = () => {
    setCurrentPage('gallery')
    setSelectedProjectId(null)
    setSelectedNoticeId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showNotices = () => {
    setCurrentPage('notices')
    setSelectedProjectId(null)
    setSelectedNoticeId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showRegistration = () => {
    setCurrentPage('register')
    setSelectedProjectId(null)
    setSelectedNoticeId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showMyProjects = () => {
    setCurrentPage('my-projects')
    setSelectedProjectId(null)
    setSelectedNoticeId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showFavorites = () => {
    setCurrentPage('favorites')
    setSelectedProjectId(null)
    setSelectedNoticeId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showNotice = (id: number) => {
    setCurrentPage('notices')
    setSelectedNoticeId(id)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showProject = (id: number) => {
    setSelectedProjectId(id)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const closeProject = () => {
    setSelectedProjectId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
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
        author: '홍길동',
        date,
        year: Number(date.slice(0, 4)),
        category: data.category,
        bookmarked: false,
        owned: true,
        approvalStatus: 'pending',
      },
    ])
    showMyProjects()
  }

  const activeItem = currentPage === 'notices'
    ? '공지사항'
    : currentPage === 'register'
      ? '작품 등록'
    : currentPage === 'my-projects'
      ? '내 작품'
      : currentPage === 'favorites'
        ? '즐겨찾기'
        : '갤러리'

  return (
    <div id="top" className="flex min-h-screen flex-col bg-white text-neutral-800">
      <Header
        menuOpen={menuOpen}
        isLoggedIn={isLoggedIn}
        activeItem={activeItem}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onGalleryClick={showGallery}
        onNoticeClick={showNotices}
        onRegisterClick={showRegistration}
        onMyProjectsClick={showMyProjects}
        onFavoritesClick={showFavorites}
        onLoginClick={() => setAuthStep('login')}
        onLogoutClick={() => {
          setIsLoggedIn(false)
          setAuthStep('closed')
        }}
      />
      {currentPage === 'notices' ? (
        selectedNotice ? <NoticeDetail notice={selectedNotice} onBack={showNotices} /> : <NoticePage onOpen={showNotice} />
      ) : currentPage === 'register' ? (
        <ProjectRegistrationPage onCancel={showGallery} onSubmit={registerProject} />
      ) : selectedProject ? (
        <ProjectDetail
          key={selectedProject.id}
          project={selectedProject}
          backLabel={currentPage === 'favorites' ? '즐겨찾기' : currentPage === 'my-projects' ? '내 작품' : '갤러리'}
          onBack={closeProject}
          onBookmark={toggleBookmark}
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
              {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} onBookmark={toggleBookmark} onOpen={showProject} />)}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <strong className="text-lg">검색 결과가 없습니다.</strong>
              <p className="mt-2 text-sm text-neutral-400">다른 검색어나 필터를 선택해 보세요.</p>
              <button className="mt-5 rounded-full bg-brand px-5 py-2 text-sm text-white" type="button" onClick={() => updateFilters(initialFilters)}>필터 초기화</button>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <nav className="mb-10 mt-10 flex items-center justify-center gap-5 text-[11px] text-neutral-400 md:mb-0 md:mt-[57px] md:gap-6 md:text-[13px]" aria-label="페이지 이동">
              <button aria-label="이전 페이지" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={13} /></button>
              {[1, 2, 3].map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`flex h-5 min-w-[14px] items-center justify-center border-b-2 px-1 leading-none ${page === number ? 'border-brand font-semibold text-brand' : 'border-transparent'}`}>{number}</button>)}
              <span>…</span><button type="button" onClick={() => setPage(21)} className={`flex h-5 min-w-[18px] items-center justify-center border-b-2 px-1 leading-none ${page === 21 ? 'border-brand font-semibold text-brand' : 'border-transparent'}`}>21</button>
              <button aria-label="다음 페이지" type="button" onClick={() => setPage((value) => Math.min(21, value + 1))}><ChevronRight size={13} /></button>
            </nav>
          )}
        </main>
      )}
      <Footer />
      <LoginModal
        open={authStep === 'login'}
        onClose={() => setAuthStep('closed')}
        onSubmit={() => {
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
        onSubmit={() => {
          setHasCompletedInitialProfile(true)
          setIsLoggedIn(true)
          setAuthStep('closed')
        }}
      />
    </div>
  )
}
