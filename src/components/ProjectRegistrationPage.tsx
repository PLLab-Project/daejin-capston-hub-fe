import { Archive, ChevronDown, FileText, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { DragEvent, FormEvent, ReactNode } from 'react'
import type { ProjectCategory } from '../types/project'

const categories: ProjectCategory[] = ['웹', '앱', '게임', '임베디드', '보안']
const inputClassName = 'h-[30px] w-full rounded-[5px] border border-neutral-300 bg-white px-2.5 text-[9px] text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-brand md:h-11 md:px-4 md:text-[12px]'
const labelClassName = 'mb-1.5 block text-[10px] font-semibold leading-none text-neutral-700 md:mb-2 md:text-[12px]'

export interface ProjectRegistrationData {
  studentId?: string
  author?: string
  title: string
  summary: string
  category: ProjectCategory
  techStack: string
  description: string
  demoVideoUrl: string
  thumbnail?: File
  additionalImages: File[]
  presentationReport?: File
  descriptionReport?: File
  projectZip?: File
}

interface ProjectRegistrationPageProps {
  mode?: 'create' | 'edit'
  adminMode?: boolean
  initialData?: ProjectRegistrationData
  onCancel: () => void
  onSubmit: (data: ProjectRegistrationData) => void | Promise<void>
}

export function ProjectRegistrationPage({ mode = 'create', adminMode = false, initialData, onCancel, onSubmit }: ProjectRegistrationPageProps) {
  const categoryRef = useRef<HTMLDivElement>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [category, setCategory] = useState<ProjectCategory | ''>(initialData?.category ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [thumbnailFiles, setThumbnailFiles] = useState<File[]>([])
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [presentationReport, setPresentationReport] = useState<File | null>(null)
  const [descriptionReport, setDescriptionReport] = useState<File | null>(null)
  const [projectZip, setProjectZip] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isEditing = mode === 'edit'

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!categoryRef.current?.contains(event.target as Node)) setCategoryOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    if (!category) {
      setCategoryOpen(true)
      return
    }

    if (!thumbnailFiles[0] || !presentationReport || !descriptionReport || !projectZip) {
      setSubmitError(`${isEditing ? '수정할' : '등록할'} 대표 이미지, 발표 보고서, 설명 보고서, 프로젝트 압축파일을 모두 등록해 주세요.`)
      return
    }

    const formData = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      await onSubmit({
        studentId: String(formData.get('studentId') ?? '').trim() || undefined,
        author: String(formData.get('author') ?? '').trim() || undefined,
        title: String(formData.get('title') ?? '').trim(),
        summary: String(formData.get('summary') ?? '').trim(),
        category,
        techStack: String(formData.get('techStack') ?? '').trim(),
        description: description.trim(),
        demoVideoUrl: String(formData.get('demoVideoUrl') ?? '').trim(),
        thumbnail: thumbnailFiles[0],
        additionalImages,
        presentationReport: presentationReport ?? undefined,
        descriptionReport: descriptionReport ?? undefined,
        projectZip: projectZip ?? undefined,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '작품 등록 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[768px] flex-1 pb-8 pt-4 md:pb-12 md:pt-6">
      <header className="border-b border-neutral-200 pb-3 md:pb-4">
        <h1 className="text-[16px] font-bold leading-5 text-neutral-900 md:text-[20px] md:leading-6">작품 {isEditing ? '수정' : '등록'}</h1>
        <p className="mt-1 text-[10px] text-neutral-400 md:mt-1.5 md:text-[12px]">졸업작품 정보를 {isEditing ? '수정하고 필요한 파일을 변경해' : '입력하고 파일을 업로드해'} 주세요.</p>
      </header>

      <form className="mt-3 space-y-3 md:mt-4 md:space-y-4" onSubmit={submitForm}>
        {adminMode && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <RegistrationField label="학번 *"><input name="studentId" className={inputClassName} placeholder="학번을 입력하세요" required /></RegistrationField>
            <RegistrationField label="이름 *"><input name="author" className={inputClassName} placeholder="이름을 입력하세요" required /></RegistrationField>
          </div>
        )}
        <RegistrationField label="작품명 *">
          <input name="title" className={inputClassName} placeholder="작품 제목을 입력하세요" defaultValue={initialData?.title} required />
        </RegistrationField>

        <RegistrationField label="요약 *">
          <input name="summary" className={inputClassName} placeholder="50자 이내로 입력하세요" defaultValue={initialData?.summary} maxLength={50} required />
        </RegistrationField>

        <div>
          <span className={labelClassName}>분야 *</span>
          <div ref={categoryRef} className={`relative h-[30px] md:h-11 ${categoryOpen ? 'z-30' : ''}`}>
            <button
              type="button"
              className={`${inputClassName} flex items-center justify-between text-left ${categoryOpen ? 'invisible' : ''}`}
              aria-label="분야 선택"
              aria-haspopup="listbox"
              aria-expanded={categoryOpen}
              onClick={() => setCategoryOpen(true)}
            >
              <span className={category ? 'text-neutral-700' : 'text-neutral-300'}>{category || '분야 선택'}</span>
              <ChevronDown className="h-2.5 w-2.5 text-neutral-400" aria-hidden="true" />
            </button>

            {categoryOpen && (
              <div className="absolute inset-x-0 top-0 overflow-hidden rounded-[5px] border border-brand bg-white" role="listbox" aria-label="분야 선택">
                <button
                  type="button"
                  className="flex h-[30px] w-full items-center justify-between px-2.5 text-left text-[9px] text-neutral-300 md:h-11 md:px-4 md:text-[12px]"
                  onClick={() => setCategoryOpen(false)}
                >
                  <span>{category || '분야를 선택하세요'}</span>
                  <ChevronDown className="h-2.5 w-2.5 rotate-180 text-neutral-400" aria-hidden="true" />
                </button>
                {categories.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={category === option}
                    className={`flex h-[23px] w-full items-center px-2.5 text-left text-[9px] text-neutral-500 transition-colors hover:bg-[#eef3ff] focus:bg-[#eef3ff] focus:outline-none md:h-[30px] md:px-4 md:text-[12px] ${category === option || (!category && index === 0) ? 'bg-[#eef3ff]' : ''}`}
                    onClick={() => {
                      setCategory(option)
                      setCategoryOpen(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <RegistrationField
          label="기술 스택 *"
          helper="(사용한 기술, 언어, 프레임워크 등)"
        >
          <input name="techStack" className={inputClassName} placeholder="예) Python, TensorFlow, React, FastAPI" defaultValue={initialData?.techStack} required />
        </RegistrationField>

        <RegistrationField label="작품 설명 *">
          <div className="relative">
            <textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-[167px] w-full resize-none rounded-[5px] border border-neutral-300 bg-white px-2.5 py-2 text-[9px] leading-[16px] text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-brand md:h-[150px] md:px-4 md:py-3 md:text-[12px] md:leading-[19px]"
              placeholder={'작품에 대한 설명을 입력하세요\n(개발 동기, 주요 기능, 사용 기술 등)'}
              maxLength={1000}
              required
            />
            <span className="pointer-events-none absolute bottom-2 right-2.5 text-[8px] text-neutral-300 md:bottom-2.5 md:right-3 md:text-[10px]">{description.length} / 1000자</span>
          </div>
        </RegistrationField>

        <RegistrationField label="시연 영상 URL">
          <input name="demoVideoUrl" type="url" className={inputClassName} placeholder="https://youtu.be/..." defaultValue={initialData?.demoVideoUrl} />
        </RegistrationField>

        <div className="grid gap-3 pt-0.5 md:grid-cols-2 md:gap-6 md:pt-0">
          <div className="space-y-3 md:space-y-4">
            <ImageUploadField
              label="대표 이미지 *"
              mode="representative"
              boxClassName="h-28"
              onFilesChange={setThumbnailFiles}
            />
            <ImageUploadField
              label="추가 이미지 (최대 5장)"
              mode="additional"
              boxClassName="h-16 md:h-14"
              onFilesChange={setAdditionalImages}
            />
          </div>

          <div className="space-y-3 md:space-y-4">
            <FileUploadField label="발표 보고서 *" accept=".ppt,.pptx" hint="PPT · 50MB" boxClassName="h-[30px] md:h-11" onFileChange={setPresentationReport} />
            <FileUploadField label="설명 보고서 *" accept=".hwp" hint="HWP · 50MB" boxClassName="h-[30px] md:h-11" onFileChange={setDescriptionReport} />
            <FileUploadField label="프로젝트 압축파일 *" accept=".zip" hint="ZIP · 500MB" boxClassName="h-[30px] md:h-11" onFileChange={setProjectZip} />
          </div>
        </div>

        {submitError && <p className="text-[9px] leading-4 text-red-500 md:text-[11px]" role="alert">{submitError}</p>}

        <aside className="rounded-[4px] bg-[#eef3ff] px-2.5 py-2 text-[8px] leading-[13px] text-brand md:px-4 md:py-3 md:text-[10px] md:leading-4">
          <strong className="block font-semibold">확인사항</strong>
          <span>{isEditing ? '변경한 내용은 저장 후 작품 상세페이지에 바로 반영됩니다.' : '필수항목(*) 누락 시 등록이 불가합니다. 등록 후 [내 작품]에서 수정 가능합니다.'}</span>
        </aside>

        <div className="flex items-center justify-between pt-3 md:pt-0">
          <button type="button" className="h-[30px] w-[84px] rounded-[7px] border border-neutral-300 bg-white text-[10px] text-neutral-500 hover:border-neutral-400 md:h-[46px] md:w-[160px] md:text-[13px]" onClick={onCancel}>취소</button>
          <button type="submit" disabled={submitting} className="h-[30px] w-[122px] rounded-[7px] bg-brand text-[10px] font-semibold text-white hover:bg-[#013f85] disabled:cursor-not-allowed disabled:opacity-60 md:h-[46px] md:w-64 md:text-[13px]">{submitting ? (isEditing ? '수정 중...' : '등록 중...') : (isEditing ? '수정 완료' : '등록 완료')}</button>
        </div>
      </form>
    </main>
  )
}

function RegistrationField({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClassName}>
        {label}
        {helper && <span className="ml-2 font-normal text-neutral-400">{helper}</span>}
      </span>
      {children}
    </label>
  )
}

interface ImagePreview {
  id: string
  name: string
  url: string
  file: File
}

function ImageUploadField({
  label,
  mode,
  boxClassName,
  onFilesChange,
}: {
  label: string
  mode: 'representative' | 'additional'
  boxClassName: string
  onFilesChange: (files: File[]) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef<ImagePreview[]>([])
  const [previews, setPreviews] = useState<ImagePreview[]>([])
  const [dragging, setDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const maxFiles = mode === 'additional' ? 5 : 1

  useEffect(() => {
    previewsRef.current = previews
  }, [previews])

  useEffect(() => {
    onFilesChange(previews.map((preview) => preview.file))
  }, [onFilesChange, previews])

  useEffect(() => () => {
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url))
  }, [])

  const addImages = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files)
    const hasInvalidType = selectedFiles.some((file) => !['image/jpeg', 'image/png'].includes(file.type))
    const hasOversizedFile = selectedFiles.some((file) => file.size > 10 * 1024 * 1024)
    const validFiles = selectedFiles.filter((file) =>
      ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024,
    )

    if (hasInvalidType) setErrorMessage('JPG 또는 PNG 파일만 업로드할 수 있습니다.')
    else if (hasOversizedFile) setErrorMessage('이미지는 파일당 10MB 이하만 업로드할 수 있습니다.')
    else if (mode === 'additional' && validFiles.length > Math.max(0, maxFiles - previews.length)) setErrorMessage('추가 이미지는 최대 5장까지 업로드할 수 있습니다.')
    else setErrorMessage('')

    setPreviews((current) => {
      const currentFileKeys = new Set(current.map((preview) => preview.id.split('--')[0]))
      const uniqueFiles = mode === 'representative'
        ? validFiles
        : validFiles.filter((file) => !currentFileKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
      const availableCount = mode === 'representative' ? 1 : Math.max(0, maxFiles - current.length)
      const acceptedFiles = uniqueFiles.slice(0, availableCount)
      const nextPreviews = acceptedFiles.map((file, index) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`
        return {
          id: `${fileKey}--${Date.now()}-${index}`,
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        }
      })

      if (mode === 'representative') {
        current.forEach((preview) => URL.revokeObjectURL(preview.url))
        return nextPreviews
      }

      return [...current, ...nextPreviews]
    })
  }

  const removePreview = (id: string) => {
    setPreviews((current) => {
      const removed = current.find((preview) => preview.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return current.filter((preview) => preview.id !== id)
    })
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    addImages(event.dataTransfer.files)
  }

  const borderClassName = dragging ? 'border-brand bg-[#eef3ff]' : 'border-neutral-300 bg-slate-50/70'
  const representativePreview = previews[0]

  return (
    <div>
      <label className={labelClassName} htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png"
        multiple={mode === 'additional'}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) addImages(event.target.files)
          event.currentTarget.value = ''
        }}
      />

      {mode === 'representative' ? (
        <div
          className={`relative overflow-hidden rounded-[4px] border border-dashed transition-colors ${borderClassName} ${boxClassName}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {representativePreview ? (
            <>
              <img src={representativePreview.url} alt="대표 이미지 미리보기" className="h-full w-full object-cover" />
              <button type="button" className="absolute inset-0 z-10" aria-label="대표 이미지 변경" onClick={() => inputRef.current?.click()}>
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[8px] text-white md:px-3 md:pb-2 md:text-[10px]">
                  <span className="max-w-[75%] truncate">{representativePreview.name}</span>
                  <span>변경</span>
                </span>
              </button>
              <button
                type="button"
                className="absolute right-1.5 top-1.5 z-20 grid h-4 w-4 place-items-center rounded-full bg-black/55 text-white md:h-5 md:w-5"
                aria-label="대표 이미지 삭제"
                onClick={() => removePreview(representativePreview.id)}
              >
                <X className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden="true" />
              </button>
            </>
          ) : (
            <button type="button" className="flex h-full w-full flex-col items-center justify-center text-[9px] text-neutral-300" onClick={() => inputRef.current?.click()}>
              <span>드래그 또는 클릭</span>
              <span className="mt-1 text-[8px] md:text-[9px]">JPG, PNG · 10MB</span>
            </button>
          )}
        </div>
      ) : (
        <div
          className={`flex items-center rounded-[4px] border border-dashed px-1.5 transition-colors md:px-2 ${borderClassName} ${boxClassName}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {previews.length === 0 ? (
            <button type="button" className="grid h-full w-full place-items-center text-neutral-300" aria-label="추가 이미지 선택" onClick={() => inputRef.current?.click()}>
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-1">
                {previews.map((preview, index) => (
                  <div key={preview.id} className="group relative h-12 w-12 flex-none overflow-hidden rounded-[3px] border border-neutral-200 bg-white md:h-11 md:w-11" title={preview.name}>
                    <img src={preview.url} alt={`추가 이미지 ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-0 top-0 grid h-3 w-3 place-items-center rounded-bl bg-black/60 text-white opacity-90 md:h-3.5 md:w-3.5"
                      aria-label={`${preview.name} 삭제`}
                      onClick={() => removePreview(preview.id)}
                    >
                      <X className="h-2 w-2" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {previews.length < maxFiles && (
                  <button type="button" className="grid h-12 w-12 flex-none place-items-center rounded-[3px] border border-dashed border-neutral-300 text-neutral-300 md:h-11 md:w-11" aria-label="추가 이미지 더 선택" onClick={() => inputRef.current?.click()}>
                    <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <span className="ml-auto pl-1.5 text-[8px] text-neutral-400 md:text-[9px]">{previews.length}/5</span>
            </>
          )}
        </div>
      )}
      {errorMessage && <p className="mt-1 text-[8px] leading-3 text-red-500 md:text-[10px] md:leading-4" role="alert">{errorMessage}</p>}
    </div>
  )
}

function FileUploadField({
  label,
  accept,
  hint,
  boxClassName,
  onFileChange,
}: {
  label: string
  accept: string
  hint: ReactNode
  boxClassName: string
  onFileChange: (file: File | null) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isArchive = accept.includes('.zip')
  const maxFileSize = (isArchive ? 500 : 50) * 1024 * 1024
  const FileIcon = isArchive ? Archive : FileText
  const acceptedExtensions = accept.split(',').map((extension) => extension.trim().toLowerCase())

  const selectFiles = (files: FileList | File[]) => {
    const file = Array.from(files)[0]
    if (!file) return
    const fileExtension = file ? `.${file.name.split('.').pop()?.toLowerCase()}` : ''
    if (!acceptedExtensions.includes(fileExtension)) {
      setErrorMessage(`${accept.replaceAll('.', '').toUpperCase().replaceAll(',', ', ')} 파일만 업로드할 수 있습니다.`)
      return
    }
    if (file.size > maxFileSize) {
      setErrorMessage(`${isArchive ? '압축파일은 500MB' : '보고서는 50MB'} 이하만 업로드할 수 있습니다.`)
      return
    }

    setSelectedFile(file)
    onFileChange(file)
    setErrorMessage('')
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    selectFiles(event.dataTransfer.files)
  }

  return (
    <div>
      <label className={labelClassName} htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) selectFiles(event.target.files)
          event.currentTarget.value = ''
        }}
      />
      <div
        className={`flex items-center rounded-[4px] border border-dashed px-2 text-[9px] transition-colors hover:border-neutral-400 md:px-3 md:text-[10px] ${dragging ? 'border-brand bg-[#eef3ff]' : 'border-neutral-300 bg-slate-50/70'} ${boxClassName}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <>
            <FileIcon className="mr-1.5 h-3 w-3 flex-none text-brand md:h-3.5 md:w-3.5" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-neutral-600" title={selectedFile.name}>{selectedFile.name}</span>
            <button type="button" className="ml-2 flex-none text-[8px] text-brand hover:underline md:text-[9px]" onClick={() => inputRef.current?.click()}>변경</button>
            <button type="button" className="ml-1.5 grid h-4 w-4 flex-none place-items-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600" aria-label={`${selectedFile.name} 삭제`} onClick={() => { setSelectedFile(null); onFileChange(null); setErrorMessage('') }}>
              <X className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="flex h-full w-full items-center justify-center text-neutral-300" onClick={() => inputRef.current?.click()}>{hint}</button>
        )}
      </div>
      {errorMessage && <p className="mt-1 text-[8px] leading-3 text-red-500 md:text-[10px] md:leading-4" role="alert">{errorMessage}</p>}
    </div>
  )
}
