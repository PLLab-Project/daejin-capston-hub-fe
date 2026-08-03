export type ProjectCategory = '웹' | '앱' | '게임' | '임베디드'

export interface GalleryProject {
  id: number
  title: string
  description: string
  author: string
  date: string
  year: number
  category: ProjectCategory
  bookmarked: boolean
}
