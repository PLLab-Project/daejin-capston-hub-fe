import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpDown, ChevronDown, Search, X } from 'lucide-react'
import type { ProjectCategory } from '../types/project'

export interface FilterState {
  year: string[]
  category: ProjectCategory[]
  sort: '최신순' | '이름순'
  search: string
}

interface FiltersProps {
  filters: FilterState
  resultCount: number
  categoryOptions?: ProjectCategory[]
  onChange: (filters: FilterState) => void
}

const defaultCategories: ProjectCategory[] = ['웹', '앱', '게임', '임베디드', '보안']

type FilterMenu = 'year' | 'category' | 'sort'

interface FilterDropdownProps {
  id: FilterMenu
  label: string
  selectedValues: readonly string[]
  options: readonly string[]
  open: boolean
  showSortIcon?: boolean
  onToggle: (id: FilterMenu) => void
  onSelect: (value: string) => void
}

function FilterDropdown({ id, label, selectedValues, options, open, showSortIcon = false, onToggle, onSelect }: FilterDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 })

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setMenuPosition({ top: rect.bottom, left: rect.left, width: rect.width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div data-filter-id={id} className={`filter-dropdown w-[52px] shrink-0 md:w-[108px] ${open ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="filter-dropdown__trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" className="filter-dropdown__chevron" />
      </button>

      {open && (
        <div className="filter-dropdown__menu" role="listbox" aria-label={`${label} 선택`} style={menuPosition}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selectedValues.includes(option)}
              className="filter-dropdown__option"
              onClick={() => onSelect(option)}
            >
              <span>{option}</span>
              {showSortIcon && <ArrowUpDown aria-hidden="true" className="filter-dropdown__sort-icon" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface SelectedFilterChipProps {
  label: string
  onRemove: () => void
}

function SelectedFilterChip({ label, onRemove }: SelectedFilterChipProps) {
  return (
    <button type="button" className="selected-filter-chip" aria-label={`${label} 필터 해제`} onClick={onRemove}>
      <span>{label}</span>
      <X aria-hidden="true" />
    </button>
  )
}

export function Filters({ filters, resultCount, categoryOptions = defaultCategories, onChange }: FiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)
  const [openFilter, setOpenFilter] = useState<FilterMenu | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const filterStripRef = useRef<HTMLDivElement>(null)
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => onChange({ ...filters, [key]: value })

  const submitSearch = () => update('search', searchDraft.trim())

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sectionRef.current?.contains(event.target as Node)) setOpenFilter(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenFilter(null)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const toggleFilter = (id: FilterMenu) => setOpenFilter((current) => current === id ? null : id)
  const toggleYear = (value: string) => update('year', filters.year.includes(value) ? [] : [value])
  const toggleCategory = (value: string) => {
    const category = value as ProjectCategory
    update('category', filters.category.includes(category) ? filters.category.filter((item) => item !== category) : [...filters.category, category])
  }

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) return
    const frame = window.requestAnimationFrame(() => {
      filterStripRef.current?.scrollTo({ left: filterStripRef.current.scrollWidth, behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [filters.year, filters.category])

  return (
    <section ref={sectionRef} className="sticky top-[35px] z-40 h-[44px] bg-white pb-3 pt-3 before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-white md:top-[100px] md:flex md:h-[66px] md:items-center md:pb-0 md:pt-0" aria-label="작품 검색 및 필터">
      <div className="flex h-[20px] min-w-0 flex-1 items-center gap-2 md:h-[32px] md:gap-[14px]">
        <div ref={filterStripRef} className="filter-control-strip">
          <FilterDropdown id="year" label="연도" selectedValues={filters.year} options={['2026', '2025', '2024', '2023']} open={openFilter === 'year'} onToggle={toggleFilter} onSelect={(value) => { toggleYear(value); setOpenFilter(null) }} />
          <FilterDropdown id="category" label="분야" selectedValues={filters.category} options={categoryOptions} open={openFilter === 'category'} onToggle={toggleFilter} onSelect={(value) => { toggleCategory(value); setOpenFilter(null) }} />
          <FilterDropdown id="sort" label="정렬" selectedValues={[filters.sort]} options={['최신순', '이름순']} open={openFilter === 'sort'} showSortIcon onToggle={toggleFilter} onSelect={(value) => { update('sort', value as FilterState['sort']); setOpenFilter(null) }} />

          {filters.category.map((category) => <SelectedFilterChip key={`category-${category}`} label={category} onRemove={() => toggleCategory(category)} />)}
          {filters.year.map((year) => <SelectedFilterChip key={`year-${year}`} label={year} onRemove={() => toggleYear(year)} />)}
          <span className="hidden shrink-0 border-l border-neutral-200 pl-3 text-xs text-neutral-400 md:inline">총 {resultCount}개 작품</span>
        </div>

        <form className="relative h-[20px] min-w-0 flex-1 leading-none md:ml-auto md:h-[30px] md:max-w-[500px]" onSubmit={(event) => { event.preventDefault(); submitSearch() }} role="search">
          <input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submitSearch() } }} className="block h-[20px] w-full rounded-full bg-[#f0f0f0] pl-2.5 pr-6 text-[9px] outline-none ring-brand/20 placeholder:text-neutral-400 focus:ring-2 md:h-[30px] md:pl-4 md:pr-10 md:text-[11px]" placeholder="작품명, 학생명, 키워드 검색..." aria-label="작품 검색어" />
          <button type="submit" aria-label="검색" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 md:right-3">
            <Search className="h-[9px] w-[9px] md:h-3 md:w-3" />
          </button>
        </form>
      </div>
    </section>
  )
}
