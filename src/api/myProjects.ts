import { apiRequest } from './client'
import type { PageResponse, ProjectDetailResponse, ProjectPreviewResponse } from './home'

export function getMyProjectPreviews(page = 0, size = 12) {
  return apiRequest<PageResponse<ProjectPreviewResponse>>(`/my-project/preview?page=${page}&size=${size}`)
}

export function getMyProjectDetail(projectId: number) {
  return apiRequest<ProjectDetailResponse>(`/my-project/detail/${projectId}`)
}
