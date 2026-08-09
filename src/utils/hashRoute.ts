export type AppPage = 'gallery' | 'notices' | 'register' | 'my-projects' | 'favorites' | 'my-page' | 'admin'
export type ProjectSourcePage = 'gallery' | 'my-projects' | 'favorites'

export interface AppRoute {
  page: AppPage
  projectId: number | null
  noticeId: number | null
  editingProjectId: number | null
}

const pagePaths: Record<AppPage, string> = {
  gallery: 'gallery',
  notices: 'notices',
  register: 'register',
  'my-projects': 'my-projects',
  favorites: 'favorites',
  'my-page': 'my-page',
  admin: 'admin',
}

const emptyRoute = (page: AppPage): AppRoute => ({ page, projectId: null, noticeId: null, editingProjectId: null })

export function pageHash(page: AppPage) {
  return `#/${pagePaths[page]}`
}

export function noticeHash(id: number) {
  return `#/notices/${id}`
}

export function projectHash(id: number, source: ProjectSourcePage, editing = false) {
  return `#/projects/${id}${editing ? '/edit' : ''}?from=${source}`
}

export function navigateHash(hash: string, replace = false) {
  const oldURL = window.location.href
  if (replace) window.history.replaceState(null, '', hash)
  else window.history.pushState(null, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: window.location.href }))
}

export function readHashRoute(hash = window.location.hash): AppRoute {
  const normalized = hash.startsWith('#/') ? hash.slice(2) : ''
  const [path, queryString = ''] = normalized.split('?')
  const segments = path.split('/').filter(Boolean)
  const query = new URLSearchParams(queryString)

  if (segments[0] === 'projects') {
    const id = Number(segments[1])
    const requestedSource = query.get('from')
    const source: ProjectSourcePage = requestedSource === 'my-projects' || requestedSource === 'favorites' ? requestedSource : 'gallery'
    if (Number.isInteger(id) && id > 0) {
      return {
        page: source,
        projectId: id,
        noticeId: null,
        editingProjectId: segments[2] === 'edit' ? id : null,
      }
    }
  }

  if (segments[0] === 'notices') {
    const id = Number(segments[1])
    return Number.isInteger(id) && id > 0
      ? { page: 'notices', projectId: null, noticeId: id, editingProjectId: null }
      : emptyRoute('notices')
  }

  const page = (Object.entries(pagePaths).find(([, pathName]) => pathName === segments[0])?.[0] ?? 'gallery') as AppPage
  return emptyRoute(page)
}
