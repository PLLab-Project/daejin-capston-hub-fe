export interface ApiResponse<T> {
  data: T
  localDateTime?: string
  message: string
  responseCode: number
  statusCode: string
}

export interface LoginRequest {
  stdNum: string
  password: string
}

export interface LoginResponseData {
  accessToken: string | null
  refreshToken: string | null
  loginStatus: boolean
  newUser: boolean
  remainingTries: string | null
  role: 'MEMBER' | 'ADMIN' | string | null
}

export interface SignupRequest {
  name: string
  email: string
}

export interface RefreshResponseData {
  accessToken: string
}
