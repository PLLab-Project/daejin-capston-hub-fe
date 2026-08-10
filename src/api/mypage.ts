import { apiRequest } from './client'

export interface MypageProjectResponse {
  projectId: number
  title: string
}

export interface MypageResponse {
  name: string
  stdNum: string
  email: string
  myProjects: MypageProjectResponse[]
  myBookmarkProjects: MypageProjectResponse[]
}

export interface UserProfileModifyRequest {
  name: string
  email: string
}

export function getMyProfile() {
  return apiRequest<MypageResponse>('/mypage/me')
}

export function updateMyProfile(request: UserProfileModifyRequest) {
  return apiRequest<null>('/mypage/profile', {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
}
