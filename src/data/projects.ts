import type { GalleryProject } from '../types/project'

const longDescription = `본 작품은 딥러닝 기반의 객체 감지 기술을 활용하여 실시간으로 교통량을 분석하고, 교통 신호를 동적으로 최적화하는 시스템입니다.
YOLO v8 모델을 활용하여 차량, 보행자, 자전거 등 다양한 객체를 실시간으로 감지하며, 강화학습을 통해 신호 제어 알고리즘을 지속적으로 개선합니다. 실제 교통 데이터를 기반으로 시뮬레이션한 결과, 기존 고정 신호 대비 평균 대기 시간 32% 감소, 차량 통과량 27% 향상을 달성하였습니다. 본 작품은 딥러닝 기반의 객체 감지 기술을 활용하여 실시간으로 교통량을 분석하고, 교통 신호를 동적으로 최적화하는 시스템입니다.
YOLO v8 모델을 활용하여 차량, 보행자, 자전거 등 다양한 객체를 실시간으로 감지하며, 강화학습을 통해 신호 제어 알고리즘을 지속적으로 개선합니다. 실제 교통 데이터를 기반으로 시뮬레이션한 결과, 기존 고정 신호 대비 평균 대기 시간 32% 감소, 차량 통과량 27% 향상을 달성하였습니다.`

export const initialProjects: GalleryProject[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  title: 'AI 기반 스마트 교통신호 제어',
  description: '시스템 설계 및 임베디드 구현',
  detailSummary: '딥러닝을 활용한 실시간 교통량 분석 및 신호 최적화 솔루션',
  field: 'AI / 머신러닝',
  techStack: ['Python', 'TensorFlow', 'React', 'FastAPI', 'OpenCV'],
  longDescription,
  demoVideoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  author: '홍길동',
  date: '2026.05.14',
  year: 2026,
  category: '웹',
  bookmarked: index === 0 || index === 4 || index === 8,
  owned: index === 1 || index === 2,
  approvalStatus: index === 2 ? 'pending' : index === 3 ? 'rejected' : 'approved',
}))
