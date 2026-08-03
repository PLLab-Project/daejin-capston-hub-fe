import type { GalleryProject } from '../types/project'

export const initialProjects: GalleryProject[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  title: 'AI 기반 스마트 교통신호 제어',
  description: '시스템 설계 및 임베디드 구현',
  author: '홍길동',
  date: '2026.05.14',
  year: 2026,
  category: '웹',
  bookmarked: index === 0 || index === 4,
}))
