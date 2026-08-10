import type { GalleryProject, ProjectApprovalStatus } from '../types/project'
import { ProjectCard } from './ProjectCard'

const approvalGroups: Array<{
  status: ProjectApprovalStatus
  label: string
}> = [
  {
    status: 'approved',
    label: '승인된 작품',
  },
  {
    status: 'pending',
    label: '승인 대기 작품',
  },
  {
    status: 'rejected',
    label: '승인 거부 작품',
  },
]

interface ProjectCollectionPageProps {
  projects: GalleryProject[]
  emptyMessage: string
  groupByApprovalStatus?: boolean
  loading?: boolean
  errorMessage?: string
  onRetry?: () => void
  onBookmark: (id: number) => void
  onOpen: (id: number) => void
}

export function ProjectCollectionPage({
  projects,
  emptyMessage,
  groupByApprovalStatus = false,
  loading = false,
  errorMessage = '',
  onRetry,
  onBookmark,
  onOpen,
}: ProjectCollectionPageProps) {
  const renderProjectGrid = (items: GalleryProject[]) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-x-10 md:gap-y-[37px] lg:grid-cols-4">
      {items.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onBookmark={onBookmark}
          onOpen={onOpen}
        />
      ))}
    </div>
  )

  const visibleApprovalGroups = approvalGroups
    .map((group) => ({
      ...group,
      projects: projects.filter((project) => project.approvalStatus === group.status),
    }))
    .filter((group) => group.projects.length > 0)

  return (
    <main className="page-container flex flex-1 flex-col pt-4 md:pt-6">
      {loading ? (
        <div className="flex flex-1 items-center justify-center pb-20 text-center text-[11px] text-neutral-400 md:text-[13px]">작품 목록을 불러오는 중입니다.</div>
      ) : errorMessage ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
          <strong className="text-[12px] text-neutral-700 md:text-[14px]">작품 목록을 불러오지 못했습니다.</strong>
          <p className="mt-1.5 text-[10px] text-red-500 md:text-[12px]">{errorMessage}</p>
          {onRetry && <button type="button" className="mt-4 rounded-full bg-brand px-4 py-1.5 text-[10px] text-white md:text-[12px]" onClick={onRetry}>다시 시도</button>}
        </div>
      ) : projects.length > 0 ? (
        groupByApprovalStatus ? (
          <div className="flex flex-col gap-8 md:gap-10">
            {visibleApprovalGroups.map((group) => (
              <section key={group.status} aria-labelledby={`${group.status}-projects-heading`}>
                <div className="mb-3 border-b border-neutral-200 pb-2 md:mb-4 md:pb-2.5">
                  <h2 id={`${group.status}-projects-heading`} className="flex-none text-[9px] font-semibold leading-none text-neutral-500 md:text-[11px]">
                    {group.label}
                  </h2>
                </div>
                {renderProjectGrid(group.projects)}
              </section>
            ))}
          </div>
        ) : renderProjectGrid(projects)
      ) : (
        <div className="flex flex-1 items-center justify-center pb-20 text-center text-[11px] text-neutral-400 md:text-[13px]">
          {emptyMessage}
        </div>
      )}
    </main>
  )
}
