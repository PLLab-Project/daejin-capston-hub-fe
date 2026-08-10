import { ChevronRight, Pencil, Play, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { GalleryProject } from '../types/project'
import { VideoModal } from './VideoModal'

type ViewerRole = 'guest' | 'owner' | 'admin'

interface ProjectDetailProps {
  project: GalleryProject
  viewerRole?: ViewerRole
  backLabel?: string
  onBack: () => void
  onBookmark: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  reviewMode?: boolean
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
}

const visibleThumbnailCount = 3

interface ProjectImageItem {
  id: string
  label: string
  url?: string
}

function getProjectImages(project: GalleryProject): ProjectImageItem[] {
  if (project.thumbnailUrl) {
    return [
      { id: 'thumbnail', label: '대표 이미지', url: project.thumbnailUrl },
      ...(project.additionalImageUrls ?? []).map((url, index) => ({ id: `additional-${index}`, label: `추가 이미지 ${index + 1}`, url })),
    ]
  }

  return Array.from({ length: 5 }, (_, index) => ({
    id: `placeholder-${index}`,
    label: index === 1 ? '대표 이미지' : `${index + 1}번 이미지`,
  }))
}

function getCircularImageSequence(startIndex: number, count: number, imageCount: number) {
  if (imageCount === 0) return []

  return Array.from(
    { length: count },
    (_, offset) => (startIndex + offset) % imageCount,
  )
}

export function ProjectDetail({
  project,
  viewerRole = 'guest',
  backLabel = '갤러리',
  onBack,
  onBookmark,
  onEdit,
  onDelete,
  reviewMode = false,
  onApprove,
  onReject,
}: ProjectDetailProps) {
  const projectImages = getProjectImages(project)
  const initialImageIndex = project.thumbnailUrl ? 0 : Math.min(1, projectImages.length - 1)
  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex)
  const [carouselStartIndex, setCarouselStartIndex] = useState(initialImageIndex)
  const [slideSteps, setSlideSteps] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const canEdit = viewerRole === 'owner'
  const canDelete = viewerRole === 'owner' || (viewerRole === 'admin' && !reviewMode)
  const canSlideImages = projectImages.length > visibleThumbnailCount
  const thumbnailTrackImages = canSlideImages
    ? getCircularImageSequence(carouselStartIndex, Math.min(visibleThumbnailCount + slideSteps, projectImages.length), projectImages.length)
    : projectImages.map((_, index) => index)
  const activeImage = projectImages[activeImageIndex]
  const downloads = [
    { label: '발표 보고서 다운로드', url: project.presentationReportUrl },
    { label: '설명 보고서 다운로드', url: project.descriptionReportUrl },
    { label: '프로젝트 파일 다운로드', url: project.projectZipUrl },
  ]

  const selectImage = (imageIndex: number) => {
    if (imageIndex === activeImageIndex || slideSteps > 0) return

    setActiveImageIndex(imageIndex)
    if (!canSlideImages) return

    const steps = (imageIndex - carouselStartIndex + projectImages.length) % projectImages.length

    if (steps < 1 || steps >= visibleThumbnailCount) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCarouselStartIndex(imageIndex)
      return
    }

    setSlideSteps(steps)
  }

  const finishThumbnailSlide = () => {
    if (slideSteps === 0) return
    setCarouselStartIndex(activeImageIndex)
    setSlideSteps(0)
  }

  return (
    <>
      <main className="page-container flex-1 pb-10 pt-[10px] md:pb-12 md:pt-6">
      <div className="flex min-h-[21px] items-start border-neutral-200 text-[8px] text-neutral-400 md:border-b md:pb-3 md:text-[11px]">
        <button type="button" className="hover:text-brand" onClick={onBack}>{backLabel}</button>
        <ChevronRight className="mx-3 mt-px h-2.5 w-2.5 md:mt-[3px] md:h-3 md:w-3" aria-hidden="true" />
        <span className="min-w-0 truncate text-neutral-600">{project.title} 시스템</span>

        {(canEdit || canDelete || reviewMode) && (
          <div className={`ml-auto flex items-center gap-2 md:hidden ${reviewMode ? '-mt-[9px]' : '-mt-[6px]'}`}>
            {canEdit && (
              <button type="button" className="detail-icon-button" aria-label="작품 수정" onClick={() => onEdit?.(project.id)}>
                <Pencil aria-hidden="true" />
              </button>
            )}
            {canDelete && (
              <button type="button" className="detail-icon-button is-danger" aria-label="작품 삭제" onClick={() => onDelete?.(project.id)}>
                <Trash2 aria-hidden="true" />
              </button>
            )}
            {reviewMode && (
              <>
                <button type="button" className="detail-action-button" onClick={() => onApprove?.(project.id)}>승인</button>
                <button type="button" className="detail-action-button is-danger" onClick={() => onReject?.(project.id)}>반려</button>
              </>
            )}
          </div>
        )}

      </div>

      <div className="hidden items-start justify-between pb-2 pt-2 md:flex">
        <ProjectHeading project={project} action={<BookmarkButton project={project} onBookmark={onBookmark} />} />
        {(canEdit || canDelete || reviewMode) && (
          <div className="flex h-8 items-center gap-2">
            {canEdit && <button type="button" className="detail-action-button" onClick={() => onEdit?.(project.id)}>수정</button>}
            {canDelete && <button type="button" className="detail-action-button is-danger" onClick={() => onDelete?.(project.id)}>삭제</button>}
            {reviewMode && <button type="button" className="detail-action-button" onClick={() => onApprove?.(project.id)}>승인</button>}
            {reviewMode && <button type="button" className="detail-action-button is-danger" onClick={() => onReject?.(project.id)}>반려</button>}
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
            {activeImage?.url ? (
              <img key={activeImage.id} src={activeImage.url} alt={activeImage.label} className="h-full w-full object-contain" />
            ) : (
              <span key={activeImage?.id} className="detail-main-image__content">{activeImage?.label}</span>
            )}
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
              {thumbnailTrackImages.map((imageIndex, trackIndex) => {
                const image = projectImages[imageIndex]
                return (
                <button
                  type="button"
                  key={`${image.id}-${trackIndex}`}
                  onClick={() => selectImage(imageIndex)}
                  className={`flex aspect-[1.5/1] items-center justify-center overflow-hidden rounded-[9px] bg-slate-200 text-[13px] text-slate-400 md:text-base ${activeImageIndex === imageIndex ? 'border-2 border-blue-600' : 'border-2 border-transparent'}`}
                  aria-label={`${image.label} 보기`}
                  aria-pressed={activeImageIndex === imageIndex}
                  disabled={slideSteps > 0}
                >
                  {image.url ? <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : imageIndex + 1}
                </button>
                )
              })}
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
            {project.demoVideoUrl && (
              <button
                type="button"
                className="flex h-6 items-center text-[10px] text-neutral-600 md:h-8 md:text-[12px]"
                aria-haspopup="dialog"
                onClick={() => setVideoModalOpen(true)}
              >
                <Play className="mr-1 h-2.5 w-2.5 fill-neutral-600" aria-hidden="true" />
                시연 영상 보기
              </button>
            )}
            <div className="grid grid-cols-3 gap-1.5 md:gap-5">
              {downloads.map((download) => download.url ? (
                <a key={download.label} href={download.url} target="_blank" rel="noreferrer" className="flex h-[30px] items-center justify-center rounded-[8px] border border-neutral-300 bg-white px-1 text-center text-[8px] text-neutral-500 transition hover:border-brand hover:text-brand md:h-[45px] md:text-[11px]">
                  {download.label}
                </a>
              ) : (
                <button key={download.label} type="button" disabled className="h-[30px] rounded-[8px] border border-neutral-200 bg-white px-1 text-[8px] text-neutral-300 md:h-[45px] md:text-[11px]">
                  {download.label}
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
