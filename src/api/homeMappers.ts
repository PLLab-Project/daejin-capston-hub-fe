import type { Notice } from '../types/notice'
import type { GalleryProject, ProjectApprovalStatus, ProjectCategory } from '../types/project'
import { resolveApiUrl } from './client'
import type { NoticeDetailResponse, NoticePreviewResponse, ProjectDetailResponse, ProjectPreviewResponse } from './home'

const projectCategories: ProjectCategory[] = ['웹', '앱', '게임', '임베디드', '보안']

export function formatApiDate(value: string) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value
}

function getYear(value: string) {
  const year = Number(value?.slice(0, 4))
  return Number.isFinite(year) ? year : new Date().getFullYear()
}

export function mapProjectStatus(status: ProjectPreviewResponse['projectStatus']): ProjectApprovalStatus {
  if (status === 'PENDING') return 'pending'
  if (status === 'REJECTED') return 'rejected'
  return 'approved'
}

function getCategory(categoryName: string): ProjectCategory {
  return projectCategories.includes(categoryName as ProjectCategory) ? categoryName as ProjectCategory : '웹'
}

export function mapProjectPreview(project: ProjectPreviewResponse): GalleryProject {
  return {
    id: project.projectId,
    title: project.title,
    description: project.summary,
    detailSummary: project.summary,
    field: '',
    techStack: [],
    longDescription: '',
    demoVideoUrl: '',
    author: project.uploadUserName,
    date: formatApiDate(project.createdAt),
    year: getYear(project.createdAt),
    category: '웹',
    bookmarked: Boolean(project.bookmarked),
    owned: false,
    approvalStatus: mapProjectStatus(project.projectStatus),
    thumbnailUrl: resolveApiUrl(project.thumbnailUrl),
  }
}

export function mapMyProjectPreview(project: ProjectPreviewResponse): GalleryProject {
  return { ...mapProjectPreview(project), owned: true }
}

export function mapProjectDetail(project: ProjectDetailResponse): GalleryProject {
  const thumbnailFile = project.thumbnailImageFile
  const additionalImageFiles = project.addImageFiles ?? (project.addImageFilesUrl ?? []).map((fileUrl) => ({ fileUrl, originalName: '' }))
  const presentationReportFile = project.presentationReportFile
  const descriptionReportFile = project.descriptionReportFile
  const projectZipFile = project.projectZipFile

  return {
    id: project.projectId,
    title: project.title,
    description: project.summary,
    detailSummary: project.summary,
    field: project.categoryName,
    techStack: project.techStacks ?? [],
    longDescription: project.description,
    demoVideoUrl: resolveApiUrl(project.demoVideoUrl),
    author: project.name,
    date: formatApiDate(project.createdAt),
    year: getYear(project.createdAt),
    category: getCategory(project.categoryName),
    bookmarked: Boolean(project.bookMarked),
    owned: Boolean(project.mine),
    approvalStatus: 'approved',
    thumbnailUrl: resolveApiUrl(thumbnailFile?.fileUrl ?? project.thumbnailImageFileUrl),
    thumbnailName: thumbnailFile?.originalName,
    additionalImageUrls: additionalImageFiles.map((file) => resolveApiUrl(file.fileUrl)),
    additionalImageNames: additionalImageFiles.map((file) => file.originalName),
    presentationReportUrl: resolveApiUrl(presentationReportFile?.fileUrl ?? project.presentationReportFileUrl),
    presentationReportName: presentationReportFile?.originalName,
    descriptionReportUrl: resolveApiUrl(descriptionReportFile?.fileUrl ?? project.descriptionReportFileUrl),
    descriptionReportName: descriptionReportFile?.originalName,
    projectZipUrl: resolveApiUrl(projectZipFile?.fileUrl ?? project.projectZipFileUrl),
    projectZipName: projectZipFile?.originalName,
  }
}

function createExternalNoticeId(link: string) {
  let hash = 0
  for (let index = 0; index < link.length; index += 1) hash = ((hash << 5) - hash + link.charCodeAt(index)) | 0
  return -(Math.abs(hash) || 1)
}

export function mapNoticePreview(notice: NoticePreviewResponse): Notice {
  const isDaejinNotice = notice.noticeId === null || notice.noticeType === 'DAEJIN' || notice.noticeType === 'DEAJIN'
  const externalUrl = isDaejinNotice ? notice.link || undefined : undefined

  return {
    id: notice.noticeId ?? createExternalNoticeId(notice.link || notice.title),
    title: notice.title,
    date: formatApiDate(notice.createdAt),
    content: '',
    attachmentName: '',
    externalUrl,
    noticeType: notice.noticeType,
    hasFile: notice.hasFile,
  }
}

export function mapNoticeDetail(notice: NoticeDetailResponse): Notice {
  const attachments = (notice.files ?? []).map((file) => ({ ...file, fileUrl: resolveApiUrl(file.fileUrl) }))
  return {
    id: notice.id,
    title: notice.title,
    date: formatApiDate(notice.createdAt),
    content: notice.contents,
    attachmentName: attachments[0]?.originalName ?? '',
    attachments,
    noticeType: 'SERVICE',
    hasFile: attachments.length > 0,
  }
}
