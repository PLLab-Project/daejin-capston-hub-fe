import { apiRequest } from './client'
import type { ProjectDetailResponse, ProjectPreviewResponse } from './home'

export function getMyProjectPreviews() {
  return apiRequest<ProjectPreviewResponse[]>('/my-project/preview')
}

export function getMyProjectDetail(projectId: number) {
  return apiRequest<ProjectDetailResponse>(`/my-project/detail/${projectId}`)
}
