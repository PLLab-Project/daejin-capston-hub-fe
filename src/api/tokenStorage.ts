export interface AuthSession {
  accessToken: string
  refreshToken: string
  role: string
  studentId: string
  newUser: boolean
}

const storageKey = 'graduation-gallery-auth'

function readStorage(storage: Storage): AuthSession | null {
  try {
    const rawSession = storage.getItem(storageKey)
    if (!rawSession) return null
    const session = JSON.parse(rawSession) as Partial<AuthSession>
    if (!session.accessToken || !session.refreshToken) return null
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      role: session.role ?? 'MEMBER',
      studentId: session.studentId ?? '',
      newUser: Boolean(session.newUser),
    }
  } catch {
    return null
  }
}

function getSessionSource() {
  if (typeof window === 'undefined') return null
  if (readStorage(window.sessionStorage)) return window.sessionStorage
  if (readStorage(window.localStorage)) return window.localStorage
  return null
}

export function getAuthSession() {
  const source = getSessionSource()
  return source ? readStorage(source) : null
}

export function saveAuthSession(session: AuthSession, remember: boolean) {
  if (typeof window === 'undefined') return
  clearAuthSession()
  const storage = remember ? window.localStorage : window.sessionStorage
  storage.setItem(storageKey, JSON.stringify(session))
}

export function updateAccessToken(accessToken: string) {
  const source = getSessionSource()
  if (!source) return
  const session = readStorage(source)
  if (!session) return
  source.setItem(storageKey, JSON.stringify({ ...session, accessToken }))
}

export function completeSignup() {
  const source = getSessionSource()
  if (!source) return
  const session = readStorage(source)
  if (!session) return
  source.setItem(storageKey, JSON.stringify({ ...session, newUser: false }))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(storageKey)
  window.localStorage.removeItem(storageKey)
}
