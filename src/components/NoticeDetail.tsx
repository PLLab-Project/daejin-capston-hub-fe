import { ChevronLeft, Paperclip } from 'lucide-react'
import type { Notice } from '../types/notice'

interface NoticeDetailProps {
  notice: Notice
  onBack: () => void
}

export function NoticeDetail({ notice, onBack }: NoticeDetailProps) {
  return (
    <main className="page-container flex flex-1 flex-col pt-3 md:pt-[17px]">
      <button type="button" className="flex h-5 w-fit items-center pr-2.5 text-[8px] leading-none text-neutral-400 hover:text-brand md:h-[30px] md:pr-5 md:text-[11px]" onClick={onBack}>
        <ChevronLeft className="mr-1 h-2 w-2 -translate-x-[3px] md:h-[11px] md:w-[11px] md:-translate-x-1" aria-hidden="true" />
        공지사항 목록
      </button>

      <article className="mt-3 w-full border-b border-neutral-200 md:mt-[17px]">
        <header className="flex min-h-[54px] w-full flex-col justify-center border-y border-neutral-200 px-2.5 py-2 md:min-h-[72px] md:px-5 md:py-3">
          <h1 className="min-w-0 truncate text-[12px] font-semibold text-neutral-800 md:text-[17px]">{notice.title}</h1>
          <time className="mt-1.5 text-[8px] text-neutral-400 md:mt-2 md:text-[10px]">{notice.date}</time>
        </header>

        <div className="min-h-[250px] whitespace-pre-line px-2.5 py-5 text-[10px] leading-[18px] text-neutral-600 md:min-h-[360px] md:px-5 md:py-8 md:text-[12px] md:leading-6">
          {notice.content}
        </div>

        <div className="flex min-h-[32px] w-full items-center border-t border-neutral-200 px-2.5 text-[9px] md:min-h-[40px] md:px-5 md:text-[11px]">
          <strong className="w-[62px] flex-none font-semibold text-neutral-600 md:w-[86px]">첨부파일</strong>
          <button type="button" className="flex min-w-0 items-center text-brand hover:underline">
            <Paperclip className="mr-1 h-2.5 w-2.5 flex-none md:h-3 md:w-3" aria-hidden="true" />
            <span className="truncate">{notice.attachmentName}</span>
          </button>
        </div>
      </article>

    </main>
  )
}
