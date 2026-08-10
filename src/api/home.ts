import { apiRequest } from './client'

export interface PageResponse<T> {
  content: T[]
  currentPage: number
  totalPages: number
  totalElements: number
  hasNext: boolean
}

export interface ProjectPreviewResponse {
  projectId: number
  thumbnailUrl: string
  title: string
  summary: string
  uploadUserName: string
  createdAt: string
  projectStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  bookmarked: boolean
}

export interface ProjectDetailResponse {
  projectId: number
  title: string
  summary: string
  description: string
  name: string
  createdAt: string
  categoryName: string
  techStacks: string[]
  demoVideoUrl: string
  thumbnailImageFileUrl: string
  addImageFilesUrl: string[]
  presentationReportFileUrl: string
  descriptionReportFileUrl: string
  projectZipFileUrl: string
  bookMarked: boolean
  mine: boolean
}

export interface CategoryResponse {
  categoryId: number
  name: string
}

export interface NoticePreviewResponse {
  noticeId: number | null
  title: string
  createdAt: string
  link: string | null
  noticeType: 'DAEJIN' | 'SERVICE'
  hasFile: boolean
}

export interface NoticeFileResponse {
  fileUrl: string
  originalName: string
}

export interface NoticeDetailResponse {
  id: number
  title: string
  contents: string
  createdAt: string
  files: NoticeFileResponse[]
}

export interface ProjectSearchParams {
  keyword?: string
  year?: string
  categoryIds?: number[]
  sortType?: 'LATEST' | 'NAME'
  direction?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export interface NoticeSearchParams {
  keyword?: string
  page?: number
  size?: number
}

export interface RegisterProjectRequest {
  title: string
  summary: string
  categoryId: number
  techStacks: string[]
  description: string
  demoVideoUrl: string
}

export interface RegisterProjectFiles {
  thumbnail: File
  addImage: File[]
  presentationReport: File
  descriptionReport: File
  projectZip: File
}

function createQuery(params: Record<string, string | number | Array<string | number> | undefined>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)))
      return
    }
    query.set(key, String(value))
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function searchProjects(params: ProjectSearchParams) {
  return apiRequest<PageResponse<ProjectPreviewResponse>>(`/home/project/search${createQuery({
    keyword: params.keyword,
    year: params.year,
    categoryIds: params.categoryIds,
    sortType: params.sortType,
    direction: params.direction,
    page: params.page,
    size: params.size,
  })}`)
}

export function getProjectDetail(projectId: number) {
  return apiRequest<ProjectDetailResponse>(`/home/project/detail/${projectId}`)
}

export function registerProject(request: RegisterProjectRequest, files: RegisterProjectFiles) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  formData.append('thumbnail', files.thumbnail)
  files.addImage.forEach((file) => formData.append('addImage', file))
  formData.append('presentationReport', files.presentationReport)
  formData.append('descriptionReport', files.descriptionReport)
  formData.append('projectZip', files.projectZip)

  return apiRequest<number>('/home/project', {
    method: 'POST',
    body: formData,
  })
}

export function getCategories() {
  return apiRequest<CategoryResponse[]>('/home/category')
}

export function searchNotices(params: NoticeSearchParams) {
  return apiRequest<PageResponse<NoticePreviewResponse>>(`/home/notice/search${createQuery({
    keyword: params.keyword,
    page: params.page,
    size: params.size,
  })}`)
}

export function getNoticeDetail(noticeId: number) {
  return apiRequest<NoticeDetailResponse>(`/home/notice/detail/${noticeId}`)
}
