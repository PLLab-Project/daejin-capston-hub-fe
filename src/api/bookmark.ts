import { apiRequest } from './client'

export interface ToggleBookmarkResponse {
  bookMarked: boolean
}

export function toggleProjectBookmark(projectId: number) {
  return apiRequest<ToggleBookmarkResponse>(`/bookmark/${projectId}/toggle`, {
    method: 'POST',
  })
}
