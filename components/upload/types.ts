export type FileStatus = 'queued' | 'uploading' | 'extracting' | 'done' | 'error'

export interface ExtractResult {
  text: string
  preview: string
  pageCount: number
  analysis: {
    title: string
    charCount: number
    wordCount: number
    estimatedPages: number
    categories: string[]
    compliance: {
      pageRange: boolean
      hasAbstract: boolean
      hasReferences: boolean
    }
  }
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  fileType: 'pdf' | 'docx' | 'doc' | 'hwp' | 'other'
  status: FileStatus
  progress: number
  result?: ExtractResult
  error?: string
  paperId?: string      // Supabase DB UUID (추출 완료 후 수신)
  paperNumber?: string  // 'SUB-2025-001' 형식
}
