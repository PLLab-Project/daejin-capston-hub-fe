export interface NoticeAttachment {
  fileUrl: string
  originalName: string
}

export interface Notice {
  id: number
  title: string
  date: string
  content: string
  attachmentName: string
  attachments?: NoticeAttachment[]
  externalUrl?: string
  noticeType?: 'DAEJIN' | 'SERVICE'
  hasFile?: boolean
}
