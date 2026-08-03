import { Star } from 'lucide-react'
import type { GalleryProject } from '../types/project'

interface ProjectCardProps {
  project: GalleryProject
  onBookmark: (id: number) => void
}

export function ProjectCard({ project, onBookmark }: ProjectCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[10px] border border-neutral-200 bg-white md:overflow-visible md:rounded-none md:border-0">
      <button type="button" onClick={() => onBookmark(project.id)} className="absolute left-1.5 top-1.5 z-10" aria-label={project.bookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
        <Star size={14} strokeWidth={1.5} className={project.bookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-400'} />
      </button>
      <button type="button" className="project-image relative block aspect-[2.14/1] w-full overflow-hidden rounded-t-[10px] bg-slate-200 md:aspect-[1.495/1] md:rounded-[10px]" aria-label={`${project.title} 상세보기`}>
        <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-t from-brand/10 to-transparent" />
      </button>
      <div className="relative px-2 pb-1.5 pt-[5px] md:px-3 md:pb-0 md:pt-1">
        <h2 className="truncate text-[12px] font-semibold leading-[14px] tracking-[-0.02em] text-neutral-900 md:text-[15px] md:leading-5">{project.title}</h2>
        <p className="mt-[3px] truncate text-[9px] leading-[11px] text-neutral-400 md:mt-0.5 md:text-[12px] md:leading-[18px]">{project.description}</p>
        <div className="mt-0.5 flex text-[9px] leading-[10px] text-neutral-400 md:mt-1 md:border-t md:border-neutral-200 md:pt-1 md:text-[11px] md:leading-4">
          <span>{project.author}</span>
          <time className="ml-3 md:ml-auto">{project.date}</time>
        </div>
      </div>
    </article>
  )
}
