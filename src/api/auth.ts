import { apiRequest } from './client'
import type { LoginRequest, LoginResponseData, SignupRequest } from './types'

export async function login(request: LoginRequest) {
  return apiRequest<LoginResponseData>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(request),
  })
}

export async function signup(request: SignupRequest) {
  return apiRequest<null>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
