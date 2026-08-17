import { apiRequest } from './client'
import type { PageResponse, ProjectPreviewResponse } from './home'

export interface ToggleBookmarkResponse {
  bookMarked: boolean
}

export function toggleProjectBookmark(projectId: number) {
  return apiRequest<ToggleBookmarkResponse>(`/bookmark/${projectId}/toggle`, {
    method: 'POST',
  })
}

export function getBookmarkedProjectPreviews(page = 0, size = 12) {
  return apiRequest<PageResponse<ProjectPreviewResponse>>(`/bookmark/project/preview?page=${page}&size=${size}`)
}
