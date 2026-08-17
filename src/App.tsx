import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Filters, type FilterState } from './components/Filters'
import { ProjectCard } from './components/ProjectCard'
import { ProjectDetail } from './components/ProjectDetail'
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
import { LoginRequiredModal } from './components/LoginRequiredModal'
import { login as loginApi, signup as signupApi } from './api/auth'
import { toggleProjectBookmark } from './api/bookmark'
import { deleteAdminNotice as deleteAdminNoticeApi, deleteAdminProject as deleteAdminProjectApi, getAdminProjects, modifyAdminNotice, registerAdminNotice, reviewAdminProject, type AdminProjectPreviewResponse } from './api/admin'
import { ApiError } from './api/client'
import { deleteProject as deleteProjectApi, getCategories, getNoticeDetail, getProjectDetail, modifyProject as modifyProjectApi, registerProject as registerProjectApi, searchNotices, searchProjects, type CategoryResponse, type ProjectSearchParams } from './api/home'
import { formatApiDate, mapMyProjectPreview, mapNoticeDetail, mapNoticePreview, mapProjectDetail, mapProjectPreview, mapProjectStatus } from './api/homeMappers'
import { getMyProjectDetail, getMyProjectPreviews } from './api/myProjects'
import { getMyProfile, updateMyProfile, type MypageProjectResponse, type MypageResponse } from './api/mypage'
import { clearAuthSession, completeSignup, getAuthSession, saveAuthSession } from './api/tokenStorage'
import type { Notice } from './types/notice'
import type { GalleryProject, ProjectCategory } from './types/project'
import { navigateHash, noticeHash, pageHash, projectHash, readHashRoute, type AppPage, type ProjectSourcePage } from './utils/hashRoute'

const initialFilters: FilterState = { year: [], category: [], sort: '최신순', search: '' }
type AuthStep = 'closed' | 'login' | 'first-login'
const homePageSize = 12
const noticePageSize = 20
const initialRoute = typeof window === 'undefined'
  ? { page: 'gallery' as AppPage, projectId: null, noticeId: null, editingProjectId: null }
  : readHashRoute()
const initialAuthSession = typeof window === 'undefined' ? null : getAuthSession()
const authenticatedPages = new Set<AppPage>(['register', 'my-projects', 'favorites', 'my-page', 'admin'])

interface FeedbackMessage {
  title: string
  description?: string
}

function isSignupCompletePreview() {
  return typeof window !== 'undefined'
    && import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview') === 'signup-complete'
}

function getInitialFeedback(): FeedbackMessage | null {
  if (!isSignupCompletePreview()) return null
  return {
    title: '정보 등록이 완료되었습니다.',
    description: '입력한 회원 정보는 마이페이지에서 수정할 수 있습니다.',
  }
}

interface ProjectCollectionState {
  key: string
  projects: GalleryProject[]
  totalPages: number
  totalElements: number
  error: string
}

interface NoticeCollectionState {
  key: string
  notices: Notice[]
  totalPages: number
  error: string
}

interface ProjectDetailState {
  projectId: number | null
  project: GalleryProject | null
  error: string
}

interface NoticeDetailState {
  noticeId: number | null
  notice: Notice | null
  error: string
}

interface ProfileState {
  key: string
  data: MypageResponse | null
  error: string
}

const initialProfile: UserProfile = {
  name: '',
  studentId: initialAuthSession?.studentId || '20241472',
  email: '',
}

function createProjectReference(project: MypageProjectResponse, owned: boolean): GalleryProject {
  return {
    id: project.projectId,
    title: project.title,
    description: '',
    detailSummary: '',
    field: '',
    techStack: [],
    longDescription: '',
    demoVideoUrl: '',
    author: '',
    date: '',
    year: new Date().getFullYear(),
    category: '웹',
    bookmarked: !owned,
    owned,
    approvalStatus: 'approved',
  }
}

function mapAdminProjectPreview(project: AdminProjectPreviewResponse): GalleryProject {
  return {
    ...createProjectReference({ projectId: project.projectId, title: project.title }, false),
    bookmarked: false,
    date: formatApiDate(project.createdAt),
    year: Number(project.createdAt.slice(0, 4)) || new Date().getFullYear(),
    approvalStatus: mapProjectStatus(project.projectStatus),
  }
}

function hasAdminRole(role: string | null | undefined) {
  return role?.toUpperCase().includes('ADMIN') ?? false
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError && error.message ? error.message : fallback
}

export default function App() {
  const [projects, setProjects] = useState<GalleryProject[]>([])
  const [filters, setFilters] = useState(initialFilters)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>(isSignupCompletePreview() ? 'closed' : initialAuthSession?.newUser ? 'first-login' : 'closed')
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialAuthSession && !initialAuthSession.newUser))
  const [isAdmin, setIsAdmin] = useState(hasAdminRole(initialAuthSession?.role))
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [signupError, setSignupError] = useState('')
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page)
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialRoute.projectId)
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(initialRoute.noticeId)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(initialRoute.editingProjectId)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(getInitialFeedback)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [galleryReloadKey, setGalleryReloadKey] = useState(0)
  const [noticeSearchKeyword, setNoticeSearchKeyword] = useState('')
  const [noticePage, setNoticePage] = useState(1)
  const [noticeReloadKey, setNoticeReloadKey] = useState(0)
  const [projectDetailReloadKey, setProjectDetailReloadKey] = useState(0)
  const [noticeDetailReloadKey, setNoticeDetailReloadKey] = useState(0)
  const [myProjectsReloadKey, setMyProjectsReloadKey] = useState(0)
  const [profileReloadKey, setProfileReloadKey] = useState(0)
  const [favoritesReloadKey, setFavoritesReloadKey] = useState(0)
  const [adminProjectsReloadKey, setAdminProjectsReloadKey] = useState(0)
  const [galleryState, setGalleryState] = useState<ProjectCollectionState>({ key: '', projects: [], totalPages: 0, totalElements: 0, error: '' })
  const [publicNoticeState, setPublicNoticeState] = useState<NoticeCollectionState>({ key: '', notices: [], totalPages: 0, error: '' })
  const [projectDetailState, setProjectDetailState] = useState<ProjectDetailState>({ projectId: null, project: null, error: '' })
  const [noticeDetailState, setNoticeDetailState] = useState<NoticeDetailState>({ noticeId: null, notice: null, error: '' })
  const [myProjectsState, setMyProjectsState] = useState<ProjectCollectionState>({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
  const [myProjectDetailState, setMyProjectDetailState] = useState<ProjectDetailState>({ projectId: null, project: null, error: '' })
  const [profileState, setProfileState] = useState<ProfileState>({ key: '', data: null, error: '' })
  const [favoriteProjectsState, setFavoriteProjectsState] = useState<ProjectCollectionState>({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
  const [adminProjectsState, setAdminProjectsState] = useState<ProjectCollectionState>({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
  const myProjects = useMemo(() => [
    ...myProjectsState.projects,
    ...projects.filter((project) => project.owned && !myProjectsState.projects.some((item) => item.id === project.id)),
  ], [myProjectsState.projects, projects])
  const favoriteProjects = favoriteProjectsState.projects
  const editingProject = myProjectDetailState.projectId === editingProjectId
    ? myProjectDetailState.project
    : myProjects.find((project) => project.id === editingProjectId)

  const categoryIdByName = useMemo(() => new Map(categories.map((category) => [category.name, category.categoryId])), [categories])
  const categoryOptions = useMemo(() => {
    const names = categories.map((category) => category.name).filter((name): name is ProjectCategory => ['웹', '앱', '게임', '임베디드', '보안'].includes(name))
    return names.length > 0 ? names : ['웹', '앱', '게임', '임베디드', '보안'] as ProjectCategory[]
  }, [categories])
  const galleryQuery = useMemo<ProjectSearchParams>(() => ({
    keyword: filters.search || undefined,
    year: filters.year[0],
    categoryIds: filters.category.map((category) => categoryIdByName.get(category)).filter((categoryId): categoryId is number => categoryId !== undefined),
    sortType: filters.sort === '이름순' ? 'NAME' : 'LATEST',
    direction: filters.sort === '이름순' ? 'ASC' : 'DESC',
    page: page - 1,
    size: homePageSize,
  }), [categoryIdByName, filters, page])
  const galleryQueryKey = `${JSON.stringify(galleryQuery)}:${galleryReloadKey}`
  const galleryLoading = galleryState.key !== galleryQueryKey
  const galleryProjects = galleryLoading ? [] : galleryState.projects.slice(0, homePageSize)
  const homeTotalPages = Math.max(1, galleryState.totalPages)
  const currentHomePage = Math.min(page, homeTotalPages)
  const noticeQueryKey = `all-notices:${noticeReloadKey}`
  const noticesLoading = publicNoticeState.key !== noticeQueryKey
  const filteredPublicNotices = useMemo(() => {
    const keyword = noticeSearchKeyword.trim().toLocaleLowerCase('ko-KR')
    return keyword
      ? publicNoticeState.notices.filter((notice) => notice.title.toLocaleLowerCase('ko-KR').includes(keyword))
      : publicNoticeState.notices
  }, [noticeSearchKeyword, publicNoticeState.notices])
  const publicNoticeTotalPages = Math.max(1, Math.ceil(filteredPublicNotices.length / noticePageSize))
  const paginatedPublicNotices = filteredPublicNotices.slice((noticePage - 1) * noticePageSize, noticePage * noticePageSize)
  const myProjectsQueryKey = `my-projects:${myProjectsReloadKey}`
  const myProjectsLoading = currentPage === 'my-projects' && myProjectsState.key !== myProjectsQueryKey
  const profileQueryKey = `profile:${profileReloadKey}`
  const profileLoading = currentPage === 'my-page' && profileState.key !== profileQueryKey
  const favoritesQueryKey = `favorites:${favoritesReloadKey}:${profileState.key}`
  const favoritesLoading = currentPage === 'favorites' && favoriteProjectsState.key !== favoritesQueryKey
  const adminProjectsQueryKey = `admin-projects:${adminProjectsReloadKey}`
  const adminProjectsLoading = currentPage === 'admin' && adminProjectsState.key !== adminProjectsQueryKey
  const selectedProject = currentPage === 'my-projects'
    ? myProjectDetailState.projectId === selectedProjectId ? myProjectDetailState.project : null
    : projectDetailState.projectId === selectedProjectId ? projectDetailState.project : null
  const selectedNotice = noticeDetailState.noticeId === selectedNoticeId ? noticeDetailState.notice : null
  const myPageFavoriteProjects = (profileState.data?.myBookmarkProjects ?? []).map((project) => createProjectReference(project, false))
  const managedNotices = publicNoticeState.notices.filter((notice) => notice.noticeType === 'SERVICE')

  const updateFilters = (next: FilterState) => {
    setFilters(next)
    setPage(1)
  }

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((response) => {
        if (!cancelled) setCategories(response.data)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestKey = galleryQueryKey

    searchProjects(galleryQuery)
      .then((response) => {
        if (cancelled) return
        setGalleryState({
          key: requestKey,
          projects: response.data.content.map(mapProjectPreview),
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
          error: '',
        })
      })
      .catch((error) => {
        if (cancelled) return
        setGalleryState({ key: requestKey, projects: [], totalPages: 0, totalElements: 0, error: getAuthErrorMessage(error, '작품 목록을 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [galleryQuery, galleryQueryKey])

  useEffect(() => {
    let cancelled = false
    const requestKey = noticeQueryKey

    searchNotices({ page: 0, size: 1000 })
      .then((response) => {
        if (cancelled) return
        const notices = [...response.data.content]
          .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
          .map(mapNoticePreview)
        setPublicNoticeState({
          key: requestKey,
          notices,
          totalPages: Math.max(1, Math.ceil(notices.length / noticePageSize)),
          error: '',
        })
      })
      .catch((error) => {
        if (cancelled) return
        setPublicNoticeState({ key: requestKey, notices: [], totalPages: 0, error: getAuthErrorMessage(error, '공지사항을 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [noticeQueryKey])

  useEffect(() => {
    if (selectedProjectId === null || (currentPage !== 'gallery' && currentPage !== 'favorites')) return
    let cancelled = false
    const projectId = selectedProjectId

    getProjectDetail(projectId)
      .then((response) => {
        if (!cancelled) setProjectDetailState({ projectId, project: mapProjectDetail(response.data), error: '' })
      })
      .catch((error) => {
        if (!cancelled) setProjectDetailState({ projectId, project: null, error: getAuthErrorMessage(error, '작품 상세정보를 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, projectDetailReloadKey, selectedProjectId])

  useEffect(() => {
    if (!isLoggedIn || (currentPage !== 'my-projects' && currentPage !== 'my-page')) return
    let cancelled = false
    const requestKey = myProjectsQueryKey

    getMyProjectPreviews()
      .then((response) => {
        if (cancelled) return
        const loadedProjects = response.data.map(mapMyProjectPreview)
        setMyProjectsState({
          key: requestKey,
          projects: loadedProjects,
          totalPages: 1,
          totalElements: loadedProjects.length,
          error: '',
        })
      })
      .catch((error) => {
        if (!cancelled) setMyProjectsState({ key: requestKey, projects: [], totalPages: 1, totalElements: 0, error: getAuthErrorMessage(error, '내 작품을 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, isLoggedIn, myProjectsQueryKey])

  useEffect(() => {
    if (!isLoggedIn || selectedProjectId === null || currentPage !== 'my-projects') return
    let cancelled = false
    const projectId = selectedProjectId

    getMyProjectDetail(projectId)
      .then((response) => {
        if (cancelled) return
        const preview = myProjects.find((project) => project.id === projectId)
        setMyProjectDetailState({
          projectId,
          project: { ...mapProjectDetail(response.data), owned: true, approvalStatus: preview?.approvalStatus ?? 'pending' },
          error: '',
        })
      })
      .catch((error) => {
        if (!cancelled) setMyProjectDetailState({ projectId, project: null, error: getAuthErrorMessage(error, '내 작품 상세정보를 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, myProjects, projectDetailReloadKey, selectedProjectId, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || (currentPage !== 'my-page' && currentPage !== 'favorites')) return
    let cancelled = false
    const requestKey = profileQueryKey

    getMyProfile()
      .then((response) => {
        if (cancelled) return
        setProfile({ name: response.data.name, studentId: response.data.stdNum, email: response.data.email })
        setProfileState({ key: requestKey, data: response.data, error: '' })
      })
      .catch((error) => {
        if (!cancelled) setProfileState({ key: requestKey, data: null, error: getAuthErrorMessage(error, '마이페이지 정보를 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, isLoggedIn, profileQueryKey])

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'favorites' || profileState.key !== profileQueryKey || !profileState.data) return
    let cancelled = false
    const requestKey = favoritesQueryKey
    const references = profileState.data.myBookmarkProjects ?? []

    Promise.allSettled(references.map((project) => getProjectDetail(project.projectId)))
      .then((results) => {
        if (cancelled) return
        const loadedProjects = results.map((result, index) => result.status === 'fulfilled'
          ? { ...mapProjectDetail(result.value.data), bookmarked: true }
          : createProjectReference(references[index], false))
        setFavoriteProjectsState({
          key: requestKey,
          projects: loadedProjects,
          totalPages: 1,
          totalElements: loadedProjects.length,
          error: '',
        })
      })
      .catch((error) => {
        if (!cancelled) setFavoriteProjectsState({ key: requestKey, projects: [], totalPages: 1, totalElements: 0, error: getAuthErrorMessage(error, '즐겨찾기를 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, favoritesQueryKey, isLoggedIn, profileQueryKey, profileState])

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || currentPage !== 'admin') return
    let cancelled = false
    const requestKey = adminProjectsQueryKey

    getAdminProjects()
      .then((response) => {
        if (cancelled) return
        const loadedProjects = response.data.map(mapAdminProjectPreview)
        setAdminProjectsState({ key: requestKey, projects: loadedProjects, totalPages: 1, totalElements: loadedProjects.length, error: '' })
      })
      .catch((error) => {
        if (!cancelled) setAdminProjectsState({ key: requestKey, projects: [], totalPages: 1, totalElements: 0, error: getAuthErrorMessage(error, '관리할 작품을 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [adminProjectsQueryKey, currentPage, isAdmin, isLoggedIn])

  useEffect(() => {
    if (selectedNoticeId === null || currentPage !== 'notices') return
    let cancelled = false
    const noticeId = selectedNoticeId

    getNoticeDetail(noticeId)
      .then((response) => {
        if (!cancelled) setNoticeDetailState({ noticeId, notice: mapNoticeDetail(response.data), error: '' })
      })
      .catch((error) => {
        if (!cancelled) setNoticeDetailState({ noticeId, notice: null, error: getAuthErrorMessage(error, '공지사항 상세정보를 불러오지 못했습니다.') })
      })

    return () => { cancelled = true }
  }, [currentPage, noticeDetailReloadKey, selectedNoticeId])

  const syncRoute = useCallback(() => {
    const route = readHashRoute()
    const session = getAuthSession()

    if (authenticatedPages.has(route.page) && (!session || session.newUser)) {
      window.history.replaceState(null, '', pageHash('gallery'))
      setCurrentPage('gallery')
      setSelectedProjectId(null)
      setSelectedNoticeId(null)
      setEditingProjectId(null)
      setMenuOpen(false)
      if (session?.newUser) {
        setSignupError('서비스 이용을 위해 회원 정보를 입력해 주세요.')
        setAuthStep('first-login')
      } else {
        setAuthStep('closed')
        setLoginRequiredOpen(true)
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    if (route.page === 'admin' && !hasAdminRole(session?.role)) {
      window.history.replaceState(null, '', pageHash('gallery'))
      setCurrentPage('gallery')
      setSelectedProjectId(null)
      setSelectedNoticeId(null)
      setEditingProjectId(null)
      setMenuOpen(false)
      setFeedback({ title: '관리자 권한이 필요합니다.' })
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

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
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [syncRoute])

  const navigateTo = useCallback((hash: string, replace = false) => {
    if (window.location.hash === hash) {
      syncRoute()
      return
    }
    navigateHash(hash, replace)
  }, [syncRoute])

  const applyBookmarkState = (id: number, bookmarked: boolean) => {
    setProjects((items) => items.map((item) => item.id === id ? { ...item, bookmarked } : item))
    setGalleryState((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === id ? { ...project, bookmarked } : project),
    }))
    setProjectDetailState((current) => current.project?.id === id
      ? { ...current, project: { ...current.project, bookmarked } }
      : current)
    setMyProjectsState((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === id ? { ...project, bookmarked } : project),
    }))
    setMyProjectDetailState((current) => current.project?.id === id
      ? { ...current, project: { ...current.project, bookmarked } }
      : current)
    setFavoriteProjectsState((current) => ({
      ...current,
      projects: bookmarked
        ? current.projects.map((project) => project.id === id ? { ...project, bookmarked } : project)
        : current.projects.filter((project) => project.id !== id),
    }))
  }

  const toggleBookmark = async (id: number) => {
    if (!isLoggedIn) {
      setLoginError('즐겨찾기는 로그인 후 이용할 수 있습니다.')
      setAuthStep('login')
      return
    }

    const project = projectDetailState.project?.id === id
      ? projectDetailState.project
      : myProjectDetailState.project?.id === id
        ? myProjectDetailState.project
        : [...galleryState.projects, ...myProjects, ...favoriteProjects].find((item) => item.id === id)
    const previousBookmarked = Boolean(project?.bookmarked)
    applyBookmarkState(id, !previousBookmarked)

    try {
      const response = await toggleProjectBookmark(id)
      applyBookmarkState(id, response.data.bookMarked)
      setProfileReloadKey((key) => key + 1)
      setFavoritesReloadKey((key) => key + 1)
    } catch (error) {
      applyBookmarkState(id, previousBookmarked)
      setFeedback({ title: '즐겨찾기를 변경하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
    }
  }
  const showGallery = () => navigateTo(pageHash('gallery'))
  const showNotices = () => navigateTo(pageHash('notices'))
  const showRegistration = () => navigateTo(pageHash('register'))
  const showMyProjects = () => navigateTo(pageHash('my-projects'))
  const showFavorites = () => navigateTo(pageHash('favorites'))
  const showMyPage = () => navigateTo(pageHash('my-page'))
  const showAdmin = () => navigateTo(pageHash('admin'))
  const showNotice = (notice: Notice) => {
    if (notice.externalUrl) {
      window.open(notice.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    navigateTo(noticeHash(notice.id))
  }
  const showProject = (id: number) => {
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(id, source))
  }

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsLoggedIn(false)
      setIsAdmin(false)
      setAuthSubmitting(false)
      setLoginError('로그인이 만료되었습니다. 다시 로그인해 주세요.')
      setAuthStep('login')
      setMyProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
      setFavoriteProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
      setProfileState({ key: '', data: null, error: '' })
      setAdminProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
      navigateTo(pageHash('gallery'), true)
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [navigateTo])

  const openLogin = () => {
    setLoginError('')
    setAuthStep('login')
  }

  const handleLogin = async (credentials: { studentId: string; password: string; remember: boolean }) => {
    setAuthSubmitting(true)
    setLoginError('')

    try {
      const response = await loginApi({ stdNum: credentials.studentId, password: credentials.password })
      const loginData = response.data

      if (!loginData.loginStatus) {
        setLoginError(loginData.remainingTries === null
          ? '존재하지 않는 학번입니다.'
          : `비밀번호가 일치하지 않습니다. 남은 시도 횟수는 ${loginData.remainingTries}회입니다.`)
        return
      }

      if (!loginData.accessToken || !loginData.refreshToken) {
        throw new ApiError('로그인 토큰을 받지 못했습니다. 다시 시도해 주세요.')
      }

      const role = loginData.role || 'MEMBER'
      saveAuthSession({
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        role,
        studentId: credentials.studentId,
        newUser: loginData.newUser,
      }, credentials.remember)
      setProfile((current) => ({ ...current, studentId: credentials.studentId }))
      setIsAdmin(hasAdminRole(role))

      if (loginData.newUser) {
        setIsLoggedIn(false)
        setSignupError('')
        setAuthStep('first-login')
        return
      }

      setIsLoggedIn(true)
      setAuthStep('closed')
      showGallery()
    } catch (error) {
      setLoginError(getAuthErrorMessage(error, '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'))
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleSignup = async (firstLoginProfile: { name: string; email: string }) => {
    setAuthSubmitting(true)
    setSignupError('')

    try {
      await signupApi(firstLoginProfile)
      completeSignup()
      setProfile((current) => ({ ...current, ...firstLoginProfile }))
      setIsLoggedIn(true)
      setAuthStep('closed')
      setFeedback({
        title: '정보 등록이 완료되었습니다.',
        description: '입력한 회원 정보는 마이페이지에서 수정할 수 있습니다.',
      })
      showGallery()
    } catch (error) {
      setSignupError(getAuthErrorMessage(error, '회원 정보 등록 중 오류가 발생했습니다. 다시 시도해 주세요.'))
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setIsLoggedIn(false)
    setIsAdmin(false)
    setLoginError('')
    setSignupError('')
    setAuthStep('closed')
    setProfile(initialProfile)
    setMyProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
    setMyProjectDetailState({ projectId: null, project: null, error: '' })
    setFavoriteProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
    setProfileState({ key: '', data: null, error: '' })
    setAdminProjectsState({ key: '', projects: [], totalPages: 1, totalElements: 0, error: '' })
    showGallery()
  }

  const closeProject = () => {
    navigateTo(pageHash(currentPage))
  }

  const startEditingProject = (id: number) => {
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(id, source, true))
  }

  const registerProject = async (data: ProjectRegistrationData) => {
    const categoryId = categoryIdByName.get(data.category)
    if (categoryId === undefined) throw new Error('선택한 분야 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.')
    if (!data.thumbnail || !data.presentationReport || !data.descriptionReport || !data.projectZip) {
      throw new Error('필수 파일을 모두 등록해 주세요.')
    }

    await registerProjectApi({
      title: data.title,
      summary: data.summary,
      categoryId,
      techStacks: data.techStack.split(',').map((technology) => technology.trim()).filter(Boolean),
      description: data.description,
      demoVideoUrl: data.demoVideoUrl,
    }, {
      thumbnail: data.thumbnail,
      addImage: data.additionalImages,
      presentationReport: data.presentationReport,
      descriptionReport: data.descriptionReport,
      projectZip: data.projectZip,
    })

    setMyProjectsReloadKey((key) => key + 1)
    setGalleryReloadKey((key) => key + 1)
    setFeedback({
      title: '작품 등록이 완료되었습니다.',
      description: '등록한 작품은 내 작품에서 확인할 수 있으며 관리자 승인 후 갤러리에 공개됩니다.',
    })
    showMyProjects()
  }

  const updateProject = async (data: ProjectRegistrationData) => {
    if (editingProjectId === null) return
    const updatedProjectId = editingProjectId
    const categoryId = categoryIdByName.get(data.category)
    if (categoryId === undefined) throw new Error('선택한 분야 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.')

    await modifyProjectApi(updatedProjectId, {
      title: data.title,
      summary: data.summary,
      categoryId,
      techStacks: data.techStack.split(',').map((technology) => technology.trim()).filter(Boolean),
      description: data.description,
      demoVideoUrl: data.demoVideoUrl,
    }, {
      thumbnail: data.thumbnail,
      addImage: data.additionalImages,
      presentationReport: data.presentationReport,
      descriptionReport: data.descriptionReport,
      projectZip: data.projectZip,
    })

    setMyProjectsReloadKey((key) => key + 1)
    setGalleryReloadKey((key) => key + 1)
    setProjectDetailReloadKey((key) => key + 1)
    setMyProjectDetailState({ projectId: null, project: null, error: '' })
    setFeedback({ title: '작품 수정이 완료되었습니다.', description: '변경한 내용이 작품 상세정보에 반영되었습니다.' })
    const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
    navigateTo(projectHash(updatedProjectId, source))
  }

  const deleteProject = async (id: number) => {
    if (isAdmin) {
      if (!await deleteManagedProject(id)) return
    } else {
      try {
        await deleteProjectApi(id)
        setProjects((items) => items.filter((project) => project.id !== id))
        setGalleryReloadKey((key) => key + 1)
        setMyProjectsReloadKey((key) => key + 1)
        setFavoritesReloadKey((key) => key + 1)
        setFeedback({ title: '작품이 삭제되었습니다.' })
      } catch (error) {
        setPendingDeleteProjectId(null)
        setFeedback({ title: '작품을 삭제하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
        return
      }
    }
    setPendingDeleteProjectId(null)
    navigateTo(pageHash(currentPage))
  }

  const setProjectApproval = async (id: number, approvalStatus: 'approved' | 'rejected') => {
    try {
      await reviewAdminProject(id, approvalStatus === 'approved' ? 'APPROVED' : 'REJECTED')
      setAdminProjectsState((current) => ({
        ...current,
        projects: current.projects.map((project) => project.id === id ? { ...project, approvalStatus } : project),
      }))
      setFeedback({ title: approvalStatus === 'approved' ? '작품을 승인했습니다.' : '작품 승인을 반려했습니다.' })
      return true
    } catch (error) {
      setFeedback({ title: '작품 심사 상태를 변경하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
      return false
    }
  }

  const deleteManagedProject = async (id: number) => {
    try {
      await deleteAdminProjectApi(id)
      setAdminProjectsState((current) => ({
        ...current,
        projects: current.projects.filter((project) => project.id !== id),
        totalElements: Math.max(0, current.totalElements - 1),
      }))
      setProjects((items) => items.filter((project) => project.id !== id))
      setAdminProjectsReloadKey((key) => key + 1)
      setGalleryReloadKey((key) => key + 1)
      setMyProjectsReloadKey((key) => key + 1)
      setFavoritesReloadKey((key) => key + 1)
      setProjectDetailState((current) => current.projectId === id ? { projectId: null, project: null, error: '' } : current)
      setMyProjectDetailState((current) => current.projectId === id ? { projectId: null, project: null, error: '' } : current)
      setFeedback({ title: '작품이 삭제되었습니다.' })
      return true
    } catch (error) {
      setFeedback({ title: '작품을 삭제하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
      return false
    }
  }

  const saveNotice = async (id: number | null, data: AdminNoticeData) => {
    try {
      if (id === null) {
        await registerAdminNotice({ title: data.title, contents: data.content }, data.files)
      } else {
        await modifyAdminNotice(id, { title: data.title, contents: data.content }, data.files)
      }
      setNoticeReloadKey((key) => key + 1)
      setNoticeDetailState({ noticeId: null, notice: null, error: '' })
      setFeedback(id === null
        ? { title: '공지 등록이 완료되었습니다.', description: '새 공지사항이 목록에 추가되었습니다.' }
        : { title: '공지 수정이 완료되었습니다.', description: '변경한 내용이 공지사항에 반영되었습니다.' })
      return true
    } catch (error) {
      setFeedback({ title: id === null ? '공지를 등록하지 못했습니다.' : '공지를 수정하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
      return false
    }
  }

  const loadAdminProject = useCallback(async (id: number) => {
    const response = await getProjectDetail(id)
    const preview = adminProjectsState.projects.find((project) => project.id === id)
    return { ...mapProjectDetail(response.data), approvalStatus: preview?.approvalStatus ?? 'pending' }
  }, [adminProjectsState.projects])

  const loadAdminNotice = useCallback(async (id: number) => {
    const response = await getNoticeDetail(id)
    return mapNoticeDetail(response.data)
  }, [])

  const deleteAdminNotice = async (id: number) => {
    try {
      await deleteAdminNoticeApi(id)
      setNoticeReloadKey((key) => key + 1)
      setNoticeDetailState((current) => current.noticeId === id ? { noticeId: null, notice: null, error: '' } : current)
      setFeedback({ title: '공지가 삭제되었습니다.' })
      return true
    } catch (error) {
      setFeedback({ title: '공지를 삭제하지 못했습니다.', description: getAuthErrorMessage(error, '잠시 후 다시 시도해 주세요.') })
      return false
    }
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
        onMenuClose={() => setMenuOpen(false)}
        onGalleryClick={showGallery}
        onNoticeClick={showNotices}
        onRegisterClick={showRegistration}
        onMyProjectsClick={showMyProjects}
        onFavoritesClick={showFavorites}
        onMyPageClick={showMyPage}
        onAdminClick={showAdmin}
        onLoginClick={openLogin}
        onLogoutClick={handleLogout}
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
            thumbnailUrl: editingProject.thumbnailUrl,
            thumbnailName: editingProject.thumbnailName,
            additionalImageUrls: editingProject.additionalImageUrls,
            additionalImageNames: editingProject.additionalImageNames,
            presentationReportUrl: editingProject.presentationReportUrl,
            presentationReportName: editingProject.presentationReportName,
            descriptionReportUrl: editingProject.descriptionReportUrl,
            descriptionReportName: editingProject.descriptionReportName,
            projectZipUrl: editingProject.projectZipUrl,
            projectZipName: editingProject.projectZipName,
            additionalImages: [],
          }}
          onCancel={() => {
            const source: ProjectSourcePage = currentPage === 'my-projects' || currentPage === 'favorites' ? currentPage : 'gallery'
            navigateTo(projectHash(editingProject.id, source))
          }}
          onSubmit={updateProject}
        />
      ) : currentPage === 'notices' ? (
        selectedNoticeId !== null ? (
          selectedNotice
            ? <NoticeDetail notice={selectedNotice} onBack={showNotices} />
            : <ApiPageState
                loading={noticeDetailState.noticeId !== selectedNoticeId}
                errorMessage={noticeDetailState.noticeId === selectedNoticeId ? noticeDetailState.error : ''}
                onBack={showNotices}
                onRetry={() => {
                  setNoticeDetailState({ noticeId: null, notice: null, error: '' })
                  setNoticeDetailReloadKey((key) => key + 1)
                }}
              />
        ) : (
          <NoticePage
            notices={noticesLoading ? [] : paginatedPublicNotices}
            page={noticePage}
            totalPages={publicNoticeTotalPages}
            loading={noticesLoading}
            errorMessage={noticesLoading ? '' : publicNoticeState.error}
            onOpen={showNotice}
            onSearch={(keyword) => {
              setNoticeSearchKeyword(keyword)
              setNoticePage(1)
            }}
            onPageChange={setNoticePage}
            onRetry={() => setNoticeReloadKey((key) => key + 1)}
          />
        )
      ) : currentPage === 'register' ? (
        <ProjectRegistrationPage adminMode={isAdmin} onCancel={showGallery} onSubmit={registerProject} />
      ) : currentPage === 'admin' ? (
        <AdminPage
          projects={adminProjectsState.projects}
          notices={managedNotices}
          projectsLoading={adminProjectsLoading}
          projectsError={adminProjectsState.error}
          onRetryProjects={() => setAdminProjectsReloadKey((key) => key + 1)}
          onLoadProject={loadAdminProject}
          onLoadNotice={loadAdminNotice}
          onApproveProject={(id) => setProjectApproval(id, 'approved')}
          onRejectProject={(id) => setProjectApproval(id, 'rejected')}
          onDeleteProject={deleteManagedProject}
          onSaveNotice={saveNotice}
          onDeleteNotice={deleteAdminNotice}
        />
      ) : currentPage === 'my-page' ? (
        <MyPage
          profile={profile}
          myProjects={myProjects}
          favoriteProjects={myPageFavoriteProjects}
          loading={profileLoading || myProjectsLoading}
          errorMessage={profileState.error || myProjectsState.error}
          onRetry={() => {
            setProfileReloadKey((key) => key + 1)
            setMyProjectsReloadKey((key) => key + 1)
          }}
          onProfileChange={async (nextProfile) => {
            await updateMyProfile({ name: nextProfile.name, email: nextProfile.email })
            setProfile(nextProfile)
            setProfileState((current) => current.data ? {
              ...current,
              data: { ...current.data, name: nextProfile.name, email: nextProfile.email },
            } : current)
            setFeedback({ title: '정보 수정이 완료되었습니다.', description: '변경한 회원 정보가 마이페이지에 반영되었습니다.' })
          }}
          onMyProjectsClick={showMyProjects}
          onFavoritesClick={showFavorites}
        />
      ) : selectedProjectId !== null && (currentPage === 'gallery' || currentPage === 'favorites' || currentPage === 'my-projects') && !selectedProject ? (
        <ApiPageState
          loading={currentPage === 'my-projects'
            ? myProjectDetailState.projectId !== selectedProjectId
            : projectDetailState.projectId !== selectedProjectId}
          errorMessage={currentPage === 'my-projects'
            ? myProjectDetailState.projectId === selectedProjectId ? myProjectDetailState.error : ''
            : projectDetailState.projectId === selectedProjectId ? projectDetailState.error : ''}
          onBack={closeProject}
          onRetry={() => {
            setProjectDetailState({ projectId: null, project: null, error: '' })
            setMyProjectDetailState({ projectId: null, project: null, error: '' })
            setProjectDetailReloadKey((key) => key + 1)
          }}
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
          loading={myProjectsLoading}
          errorMessage={myProjectsState.error}
          onRetry={() => setMyProjectsReloadKey((key) => key + 1)}
          onBookmark={toggleBookmark}
          onOpen={showProject}
        />
      ) : currentPage === 'favorites' ? (
        <ProjectCollectionPage
          projects={favoriteProjects}
          emptyMessage="즐겨찾기한 작품이 없습니다."
          loading={favoritesLoading || profileState.key !== profileQueryKey}
          errorMessage={profileState.error || favoriteProjectsState.error}
          onRetry={() => {
            setProfileReloadKey((key) => key + 1)
            setFavoritesReloadKey((key) => key + 1)
          }}
          onBookmark={toggleBookmark}
          onOpen={showProject}
        />
      ) : (
        <main className="page-container flex flex-1 flex-col">
          <Filters key={filters.search} filters={filters} resultCount={galleryState.totalElements} categoryOptions={categoryOptions} onChange={updateFilters} />

          {galleryLoading ? (
            <div className="flex min-h-[360px] items-center justify-center text-sm text-neutral-400">작품 목록을 불러오는 중입니다.</div>
          ) : galleryState.error ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <strong className="text-lg">작품 목록을 불러오지 못했습니다.</strong>
              <p className="mt-2 text-sm text-red-500">{galleryState.error}</p>
              <button className="mt-5 rounded-full bg-brand px-5 py-2 text-sm text-white" type="button" onClick={() => setGalleryReloadKey((key) => key + 1)}>다시 시도</button>
            </div>
          ) : galleryProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-x-10 md:gap-y-[37px] lg:grid-cols-4">
              {galleryProjects.map((project) => <ProjectCard key={project.id} project={project} onBookmark={toggleBookmark} onOpen={showProject} />)}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <strong className="text-lg">검색 결과가 없습니다.</strong>
              <p className="mt-2 text-sm text-neutral-400">다른 검색어나 필터를 선택해 보세요.</p>
              <button className="mt-5 rounded-full bg-brand px-5 py-2 text-sm text-white" type="button" onClick={() => updateFilters(initialFilters)}>필터 초기화</button>
            </div>
          )}

          {!galleryLoading && !galleryState.error && galleryProjects.length > 0 && (
            <Pagination
              page={currentHomePage}
              totalPages={homeTotalPages}
              onChange={(nextPage) => {
                setPage(nextPage)
                window.scrollTo({ top: 0, behavior: 'auto' })
              }}
              ariaLabel="페이지 이동"
              className="mb-10 mt-auto md:mb-10"
            />
          )}
        </main>
      )}
      <LoginModal
        open={authStep === 'login'}
        errorMessage={loginError}
        submitting={authSubmitting}
        onInputChange={() => setLoginError('')}
        onClose={() => {
          setLoginError('')
          setAuthStep('closed')
        }}
        onSubmit={handleLogin}
      />
      <LoginRequiredModal
        open={loginRequiredOpen}
        onCancel={() => setLoginRequiredOpen(false)}
        onConfirm={() => {
          setLoginRequiredOpen(false)
          setLoginError('')
          setAuthStep('login')
        }}
      />
      <FirstLoginModal
        open={authStep === 'first-login'}
        errorMessage={signupError}
        submitting={authSubmitting}
        onInputChange={() => setSignupError('')}
        onClose={() => {
          setSignupError('')
          setAuthStep('closed')
        }}
        onSubmit={handleSignup}
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

function ApiPageState({
  loading,
  errorMessage,
  onBack,
  onRetry,
}: {
  loading: boolean
  errorMessage: string
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <main className="page-container flex min-h-[360px] flex-1 flex-col items-center justify-center text-center">
      {loading ? (
        <p className="text-sm text-neutral-400">정보를 불러오는 중입니다.</p>
      ) : (
        <>
          <strong className="text-lg">정보를 불러오지 못했습니다.</strong>
          <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
          <div className="mt-5 flex gap-2">
            <button type="button" className="rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-500" onClick={onBack}>목록으로</button>
            <button type="button" className="rounded-full bg-brand px-5 py-2 text-sm text-white" onClick={onRetry}>다시 시도</button>
          </div>
        </>
      )}
    </main>
  )
}
