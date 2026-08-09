import { ChevronRight, Pencil, Play, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { GalleryProject } from '../types/project'
import { VideoModal } from './VideoModal'

type ViewerRole = 'guest' | 'owner' | 'admin'

interface ProjectDetailProps {
  project: GalleryProject
  viewerRole?: ViewerRole
  onBack: () => void
  onBookmark: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

const downloads = ['발표 보고서 다운로드', '설명 보고서 다운로드', '프로젝트 파일 다운로드']
const projectImageNumbers = [1, 2, 3, 4, 5]
const visibleThumbnailCount = 3

function getCircularImageSequence(startImage: number, count: number) {
  const startIndex = projectImageNumbers.indexOf(startImage)

  return Array.from(
    { length: count },
    (_, offset) => projectImageNumbers[(startIndex + offset) % projectImageNumbers.length],
  )
}

export function ProjectDetail({
  project,
  viewerRole = 'guest',
  onBack,
  onBookmark,
  onEdit,
  onDelete,
}: ProjectDetailProps) {
  const [activeImage, setActiveImage] = useState(2)
  const [carouselStartImage, setCarouselStartImage] = useState(2)
  const [slideSteps, setSlideSteps] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const canEdit = viewerRole === 'owner'
  const canDelete = viewerRole === 'owner' || viewerRole === 'admin'
  const thumbnailTrackImages = getCircularImageSequence(
    carouselStartImage,
    visibleThumbnailCount + slideSteps,
  )

  const selectImage = (imageNumber: number) => {
    if (imageNumber === activeImage || slideSteps > 0) return

    const startIndex = projectImageNumbers.indexOf(carouselStartImage)
    const selectedIndex = projectImageNumbers.indexOf(imageNumber)
    const steps = (selectedIndex - startIndex + projectImageNumbers.length) % projectImageNumbers.length

    if (steps < 1 || steps >= visibleThumbnailCount) return

    setActiveImage(imageNumber)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCarouselStartImage(imageNumber)
      return
    }

    setSlideSteps(steps)
  }

  const finishThumbnailSlide = () => {
    if (slideSteps === 0) return
    setCarouselStartImage(activeImage)
    setSlideSteps(0)
  }

  return (
    <>
      <main className="page-container flex-1 pb-10 pt-[10px] md:pb-12 md:pt-6">
      <div className="flex min-h-[21px] items-start border-neutral-200 text-[8px] text-neutral-400 md:border-b md:pb-3 md:text-[11px]">
        <button type="button" className="hover:text-brand" onClick={onBack}>갤러리</button>
        <ChevronRight className="mx-3 mt-px h-2.5 w-2.5 md:mt-[3px] md:h-3 md:w-3" aria-hidden="true" />
        <span className="min-w-0 truncate text-neutral-600">{project.title} 시스템</span>

        {(canEdit || canDelete) && (
          <div className="ml-auto flex items-center gap-2 md:hidden">
            {canEdit && (
              <button type="button" className="detail-icon-button" aria-label="작품 수정" onClick={() => onEdit?.(project.id)}>
                <Pencil aria-hidden="true" />
              </button>
            )}
            {canDelete && (
              <button type="button" className="detail-icon-button text-red-400" aria-label="작품 삭제" onClick={() => onDelete?.(project.id)}>
                <Trash2 aria-hidden="true" />
              </button>
            )}
          </div>
        )}

      </div>

      <div className="hidden items-start justify-between pb-2 pt-2 md:flex">
        <ProjectHeading project={project} action={<BookmarkButton project={project} onBookmark={onBookmark} />} />
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2 pt-0.5">
            {canEdit && <button type="button" className="detail-action-button" onClick={() => onEdit?.(project.id)}>수정</button>}
            {canDelete && <button type="button" className="detail-action-button text-red-400" onClick={() => onDelete?.(project.id)}>삭제</button>}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.23fr)_minmax(0,1fr)] md:gap-8">
        <section aria-label="작품 이미지">
          <div className="detail-main-image relative flex aspect-[1.5/1] items-center justify-center overflow-hidden rounded-[10px] bg-slate-200">
            <button
              type="button"
              onClick={() => onBookmark(project.id)}
              className="absolute left-1.5 top-1.5 z-10 md:hidden"
              aria-label={project.bookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star className={project.bookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-400'} size={14} strokeWidth={1.5} />
            </button>
            <span key={activeImage} className="detail-main-image__content">
              {activeImage === 2 ? '대표 이미지' : `${activeImage}번 이미지`}
            </span>
          </div>

          <div className="mt-[10px] overflow-hidden md:mt-5">
            <div
              className={`detail-thumbnail-track ${slideSteps > 0 ? 'is-sliding' : ''}`}
              data-slide-steps={slideSteps}
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && event.propertyName === 'transform') {
                  finishThumbnailSlide()
                }
              }}
            >
              {thumbnailTrackImages.map((imageNumber) => (
                <button
                  type="button"
                  key={imageNumber}
                  onClick={() => selectImage(imageNumber)}
                  className={`flex aspect-[1.5/1] items-center justify-center rounded-[9px] bg-slate-200 text-[13px] text-slate-400 md:text-base ${activeImage === imageNumber ? 'border-2 border-blue-600' : 'border-2 border-transparent'}`}
                  aria-label={`${imageNumber}번 이미지 보기`}
                  aria-pressed={activeImage === imageNumber}
                  disabled={slideSteps > 0}
                >
                  {imageNumber}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col pt-[15px] md:pt-4" aria-label="작품 상세 정보">
          <div className="md:hidden"><ProjectHeading project={project} /></div>

          <div className="mt-[11px] border-t border-neutral-200 pt-[11px] md:mt-0 md:border-0 md:pt-0">
            <DetailRow label="분야">
              <span>{project.field}</span>
            </DetailRow>

            <DetailRow label="기술 스택" className="mt-[15px] md:mt-8">
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((technology) => (
                  <span key={technology} className="detail-tech-chip">{technology}</span>
                ))}
              </div>
            </DetailRow>

            <DetailRow label="작품 설명" className="mt-[24px] items-start md:mt-8">
              <div className="min-w-0 flex-1">
                <div className={`detail-description-copy ${descriptionExpanded ? 'is-expanded' : ''}`}>
                  {project.longDescription.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
                <button
                  type="button"
                  className="mt-1.5 text-[10px] font-semibold text-brand md:hidden"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                >
                  {descriptionExpanded ? '접기' : '더보기'}
                </button>
              </div>
            </DetailRow>
          </div>

          <div className="mt-5 pt-1 md:mt-auto md:pt-3">
            <button
              type="button"
              className="flex h-6 items-center text-[10px] text-neutral-600 md:h-8 md:text-[12px]"
              aria-haspopup="dialog"
              onClick={() => setVideoModalOpen(true)}
            >
              <Play className="mr-1 h-2.5 w-2.5 fill-neutral-600" aria-hidden="true" />
              시연 영상 보기
            </button>
            <div className="grid grid-cols-3 gap-1.5 md:gap-5">
              {downloads.map((download) => (
                <button key={download} type="button" className="h-[30px] rounded-[8px] border border-neutral-300 bg-white px-1 text-[8px] text-neutral-500 transition hover:border-brand hover:text-brand md:h-[45px] md:text-[11px]">
                  {download}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      </main>

      <VideoModal
        open={videoModalOpen}
        title={project.title}
        videoUrl={project.demoVideoUrl}
        onClose={() => setVideoModalOpen(false)}
      />
    </>
  )
}

function ProjectHeading({ project, action }: { project: GalleryProject; action?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-[17px] font-bold leading-[21px] tracking-[-0.035em] text-neutral-900 md:text-[24px] md:leading-8">{project.title}</h1>
        {action}
      </div>
      <p className="mt-0.5 truncate text-[11px] leading-[15px] text-neutral-400 md:mt-1 md:text-[13px] md:leading-5">{project.detailSummary}</p>
      <div className="mt-0.5 flex items-center gap-6 text-[10px] leading-[13px] text-neutral-400 md:mt-1 md:text-[11px] md:leading-4">
        <span>{project.author}</span>
        <time>{project.date}</time>
      </div>
    </div>
  )
}

function DetailRow({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flex text-[10px] leading-[17px] text-neutral-600 md:text-[12px] md:leading-[18px] ${className}`}>
      <strong className="w-16 flex-none font-semibold text-neutral-600 md:w-[86px]">{label}</strong>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function BookmarkButton({ project, onBookmark }: { project: GalleryProject; onBookmark: (id: number) => void }) {
  return (
    <button
      type="button"
      className="detail-bookmark-button"
      data-active={project.bookmarked}
      aria-pressed={project.bookmarked}
      aria-label={project.bookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      onClick={() => onBookmark(project.id)}
    >
      <Star aria-hidden="true" />
    </button>
  )
}
