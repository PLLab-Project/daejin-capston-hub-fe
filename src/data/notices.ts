import type { Notice } from '../types/notice'

const noticeContent = `안녕하세요. 졸업작품 갤러리 운영 안내입니다.

졸업작품 등록 및 수정은 정해진 기간 안에 진행해 주세요. 작품 소개, 대표 이미지, 발표 보고서와 프로젝트 파일을 모두 확인한 뒤 제출해 주시기 바랍니다.

등록한 작품에 관한 문의가 있다면 컴퓨터공학전공 담당자에게 문의해 주세요.`

export const initialNotices: Notice[] = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  title: '공지사항',
  date: '2026.07.19',
  content: noticeContent,
  attachmentName: '졸업작품_갤러리_이용안내.pdf',
}))
