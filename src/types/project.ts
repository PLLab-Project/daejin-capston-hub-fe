export type ProjectCategory = '웹' | '앱' | '게임' | '임베디드' | '보안'
export type ProjectApprovalStatus = 'approved' | 'pending' | 'rejected'

export interface GalleryProject {
  id: number
  title: string
  description: string
  detailSummary: string
  field: string
  techStack: string[]
  longDescription: string
  demoVideoUrl: string
  author: string
  date: string
  year: number
  category: ProjectCategory
  bookmarked: boolean
  owned: boolean
  approvalStatus: ProjectApprovalStatus
  thumbnailUrl?: string
  additionalImageUrls?: string[]
  presentationReportUrl?: string
  descriptionReportUrl?: string
  projectZipUrl?: string
}
