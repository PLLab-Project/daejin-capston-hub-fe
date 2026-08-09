import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Notice } from '../types/notice'

interface NoticePageProps {
  notices: Notice[]
  onOpen: (id: number) => void
}

export function NoticePage({ notices, onOpen }: NoticePageProps) {
  const [searchDraft, setSearchDraft] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredNotices = useMemo(() => {
    const keyword = searchKeyword.trim().toLocaleLowerCase('ko-KR')
    if (!keyword) return notices
    return notices.filter((notice) => notice.title.toLocaleLowerCase('ko-KR').includes(keyword))
  }, [notices, searchKeyword])

  const submitSearch = () => setSearchKeyword(searchDraft.trim())

  return (
    <main className="page-container flex flex-1 flex-col pt-3 md:pt-[17px]">
      <form
        className="relative h-5 w-full md:ml-auto md:h-[30px] md:w-[500px]"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submitSearch()
        }}
      >
        <input
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          className="block h-full w-full rounded-full bg-[#f0f0f0] pl-2.5 pr-7 text-[9px] outline-none ring-brand/20 placeholder:text-neutral-400 focus:ring-2 md:pl-4 md:pr-10 md:text-[11px]"
          placeholder="제목으로 검색"
          aria-label="공지사항 제목 검색"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 md:right-3" aria-label="공지사항 검색">
          <Search className="h-[9px] w-[9px] md:h-3 md:w-3" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-3 md:mt-[15px]">
        <table className="w-full table-fixed border-collapse" aria-label="공지사항 목록">
          <colgroup>
            <col />
            <col className="w-[68px] md:w-[132px]" />
          </colgroup>
          <thead className="border-y border-neutral-200 bg-slate-50 text-left text-[8px] font-normal text-neutral-500 md:text-[11px]">
            <tr className="h-[27px] md:h-[33px]">
              <th className="px-2.5 font-normal md:px-5">제목</th>
              <th className="px-1 font-normal md:px-0">날짜</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotices.map((notice) => (
              <tr key={notice.id} className="h-[25px] border-b border-neutral-200 text-[10px] text-neutral-700 transition-colors hover:bg-neutral-50 md:h-[32px] md:text-[12px]">
                <td className="truncate px-2.5 md:px-5">
                  <button type="button" className="block w-full truncate text-left hover:text-brand hover:underline" onClick={() => onOpen(notice.id)}>
                    {notice.title}
                  </button>
                </td>
                <td className="px-1 text-[8px] text-neutral-400 md:px-0 md:text-[10px]">{notice.date}</td>
              </tr>
            ))}
            {filteredNotices.length === 0 && (
              <tr className="h-20 border-b border-neutral-200">
                <td colSpan={2} className="text-center text-[10px] text-neutral-400 md:text-[12px]">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="mb-[43px] mt-auto flex h-5 items-center justify-center gap-5 text-[10px] text-neutral-400 md:mb-0 md:gap-6 md:text-[12px]" aria-label="공지사항 페이지 이동">
        <button type="button" aria-label="이전 페이지" className="grid h-5 w-4 place-items-center" disabled>
          <ChevronLeft className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden="true" />
        </button>
        <button type="button" aria-current="page" className="flex h-5 min-w-[14px] items-center justify-center border-b-2 border-brand px-1 font-semibold leading-none text-brand">1</button>
        <button type="button" aria-label="다음 페이지" className="grid h-5 w-4 place-items-center" disabled>
          <ChevronRight className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden="true" />
        </button>
      </nav>
    </main>
  )
}
