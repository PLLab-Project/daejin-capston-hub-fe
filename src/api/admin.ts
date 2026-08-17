import { apiRequest } from './client'
import type { PageResponse } from './home'

export type AdminProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminProjectPreviewResponse {
  projectId: number
  title: string
  createdAt: string
  projectStatus: AdminProjectStatus
}

export type AdminUserRole = 'ADMIN' | 'MEMBER'

export interface AdminUserResponse {
  userId: number
  name: string
  stdNum: string
  email: string
  role: AdminUserRole
}

export interface RegisterNoticeRequest {
  title: string
  contents: string
}

export function getAdminProjects(keyword = '', page = 0, size = 12) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword.trim()) query.set('keyword', keyword.trim())
  return apiRequest<PageResponse<AdminProjectPreviewResponse>>(`/admin/project?${query.toString()}`)
}

export function getAdminUsers(keyword = '', page = 0, size = 12) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword.trim()) query.set('keyword', keyword.trim())
  return apiRequest<PageResponse<AdminUserResponse>>(`/admin/user?${query.toString()}`)
}

export function modifyAdminUserRole(userId: number, userRole: AdminUserRole) {
  return apiRequest<null>(`/admin/user/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ userRole }),
  })
}

export function deleteAdminUser(userId: number) {
  return apiRequest<null>(`/admin/user/${userId}`, {
    method: 'DELETE',
  })
}

export function reviewAdminProject(projectId: number, projectStatus: AdminProjectStatus) {
  return apiRequest<null>(`/admin/project/review/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ projectStatus }),
  })
}

export function deleteAdminProject(projectId: number) {
  return apiRequest<null>(`/admin/project/delete/${projectId}`, {
    method: 'DELETE',
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
