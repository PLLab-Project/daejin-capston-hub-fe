import { Menu, X } from 'lucide-react'

const navItems = ['갤러리', '공지사항', '작품 등록', '내 작품', '즐겨찾기', '마이페이지']

interface HeaderProps {
  menuOpen: boolean
  onMenuToggle: () => void
  onLoginClick: () => void
}

export function Header({ menuOpen, onMenuToggle, onLoginClick }: HeaderProps) {
  const openLogin = () => {
    if (menuOpen) onMenuToggle()
    onLoginClick()
  }

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-brand text-white">
        <div className="page-container flex h-[35px] items-center justify-between md:h-[60px]">
          <a className="flex items-baseline gap-1" href="#top" aria-label="졸업작품 갤러리 홈">
            <strong className="text-[15px] tracking-[-0.04em] md:hidden">졸업작품 갤러리</strong>
            <strong className="hidden text-[25px] tracking-[-0.04em] md:inline">졸업작품 갤러리</strong>
            <span className="text-[7px] md:text-[12px]">컴퓨터공학전공</span>
          </a>
          <button className="p-1 md:hidden" type="button" onClick={onMenuToggle} aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}>
            {menuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </header>

      <nav className="hidden border-b border-neutral-200 bg-white shadow-sm md:block">
        <div className="page-container flex h-[40px] items-center">
          <div className="flex h-full items-center gap-12">
            {navItems.map((item, index) => (
              <a key={item} href={index === 0 ? '#top' : `#${item}`} className={`flex h-full items-center text-[13px] ${index === 0 ? 'border-b-2 border-brand font-semibold text-neutral-900' : 'text-neutral-500 hover:text-brand'}`}>
                {item}
              </a>
            ))}
          </div>
          <button className="ml-auto text-[13px] text-brand hover:underline" type="button" onClick={openLogin}>로그인</button>
        </div>
      </nav>

      <div
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
        className={`absolute inset-x-0 top-[35px] z-40 grid origin-top bg-white transition-[grid-template-rows,opacity,box-shadow] md:hidden ${menuOpen ? 'grid-rows-[1fr] border-b border-neutral-200 opacity-100 shadow-lg duration-300 ease-out' : 'pointer-events-none grid-rows-[0fr] border-b border-transparent opacity-0 shadow-none duration-200 ease-in'}`}
      >
        <div className="min-h-0 overflow-hidden">
          {navItems.map((item, index) => (
            <a key={item} href={index === 0 ? '#top' : `#${item}`} onClick={onMenuToggle} className={`block px-6 py-3 text-[11px] ${index === 0 ? 'bg-[#eef3ff] font-semibold text-neutral-900' : 'text-neutral-600'}`}>
              {item}
            </a>
          ))}
          <button className="block w-full px-6 py-3 text-left text-[11px] text-brand" type="button" onClick={openLogin}>로그인</button>
        </div>
      </div>
    </div>
  )
}
