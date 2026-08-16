import { apiRequest } from './client'

export type AdminProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminProjectPreviewResponse {
  projectId: number
  title: string
  createdAt: string
  projectStatus: AdminProjectStatus
}

export interface RegisterNoticeRequest {
  title: string
  contents: string
}

export function getAdminProjects(keyword?: string) {
  const query = keyword?.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : ''
  return apiRequest<AdminProjectPreviewResponse[]>(`/admin/project${query}`)
}

export function reviewAdminProject(projectId: number, projectStatus: AdminProjectStatus) {
  return apiRequest<null>(`/admin/project/review/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ projectStatus }),
  })
}

export function registerAdminNotice(request: RegisterNoticeRequest, files: File[]) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  files.forEach((file) => formData.append('files', file))

  return apiRequest<null>('/admin/notice', {
    method: 'POST',
    body: formData,
  })
}

export function modifyAdminNotice(noticeId: number, request: RegisterNoticeRequest, files: File[]) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  files.forEach((file) => formData.append('files', file))

  return apiRequest<null>(`/admin/notice/modify/${noticeId}`, {
    method: 'PATCH',
    body: formData,
  })
}

export function deleteAdminNotice(noticeId: number) {
  return apiRequest<null>(`/admin/notice/${noticeId}`, {
    method: 'DELETE',
  })
}
