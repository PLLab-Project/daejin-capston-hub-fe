import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Header } from './components/Header'
import { Filters, type FilterState } from './components/Filters'
import { ProjectCard } from './components/ProjectCard'
import { ProjectDetail } from './components/ProjectDetail'
import { Footer } from './components/Footer'
import { LoginModal } from './components/LoginModal'
import { FirstLoginModal } from './components/FirstLoginModal'
import { initialProjects } from './data/projects'

const initialFilters: FilterState = { year: [], category: [], sort: '최신순', search: '' }
type AuthStep = 'closed' | 'login' | 'first-login'

export default function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [filters, setFilters] = useState(initialFilters)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('closed')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasCompletedInitialProfile, setHasCompletedInitialProfile] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const selectedProject = projects.find((project) => project.id === selectedProjectId)

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
    setSelectedProjectId(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const showProject = (id: number) => {
    setSelectedProjectId(id)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-white text-neutral-800">
      <Header
        menuOpen={menuOpen}
        isLoggedIn={isLoggedIn}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onGalleryClick={showGallery}
        onLoginClick={() => setAuthStep('login')}
        onLogoutClick={() => {
          setIsLoggedIn(false)
          setAuthStep('closed')
        }}
      />
      {selectedProject ? (
        <ProjectDetail
          key={selectedProject.id}
          project={selectedProject}
          onBack={showGallery}
          onBookmark={toggleBookmark}
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
