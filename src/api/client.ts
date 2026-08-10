import { clearAuthSession, getAuthSession, updateAccessToken } from './tokenStorage'
import type { ApiResponse, RefreshResponseData } from './types'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.woojins-house.com').replace(/\/$/, '')

export function resolveApiUrl(value: string | null | undefined) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${apiBaseUrl}${value.startsWith('/') ? value : `/${value}`}`
}

export class ApiError extends Error {
  responseCode: number
  statusCode: string
  httpStatus: number

  constructor(message: string, responseCode = 0, statusCode = 'NETWORK_ERROR', httpStatus = 0) {
    super(message)
    this.name = 'ApiError'
    this.responseCode = responseCode
    this.statusCode = statusCode
    this.httpStatus = httpStatus
  }
}

let refreshPromise: Promise<string> | null = null

function notifyAuthExpired() {
  clearAuthSession()
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return await response.json() as ApiResponse<T>
  } catch {
    throw new ApiError('서버 응답을 확인할 수 없습니다.', response.status, 'INVALID_RESPONSE', response.status)
  }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const session = getAuthSession()
    if (!session?.refreshToken) {
      notifyAuthExpired()
      throw new ApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 1002, 'REFRESH_TOKEN_INVALID')
    }

    let response: Response
    try {
      response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.refreshToken}` },
      })
    } catch {
      throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }

    const payload = await parseResponse<RefreshResponseData | null>(response)
    if (payload.responseCode === 1002 || !payload.data?.accessToken) {
      notifyAuthExpired()
      throw new ApiError(payload.message || '로그인이 만료되었습니다. 다시 로그인해 주세요.', payload.responseCode, payload.statusCode, response.status)
    }
    if (!response.ok || payload.responseCode !== 200) {
      throw new ApiError(payload.message || '토큰을 재발급하지 못했습니다.', payload.responseCode, payload.statusCode, response.status)
    }

    updateAccessToken(payload.data.accessToken)
    return payload.data.accessToken
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean
  retryOnAuthError?: boolean
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const { auth = true, retryOnAuthError = true, headers: providedHeaders, ...requestOptions } = options
  const headers = new Headers(providedHeaders)
  const session = getAuthSession()

  if (auth && session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)
  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`, { ...requestOptions, headers })
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
  }

  const payload = await parseResponse<T>(response)
  if (payload.responseCode === 1001 && auth && retryOnAuthError) {
    await refreshAccessToken()
    return apiRequest<T>(path, { ...options, retryOnAuthError: false })
  }
  if (payload.responseCode === 1002) {
    notifyAuthExpired()
    throw new ApiError(payload.message || '로그인이 만료되었습니다. 다시 로그인해 주세요.', payload.responseCode, payload.statusCode, response.status)
  }
  if (!response.ok || payload.responseCode !== 200) {
    throw new ApiError(payload.message || '요청을 처리하지 못했습니다.', payload.responseCode, payload.statusCode, response.status)
  }

  return payload
}
