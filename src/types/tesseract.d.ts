/**
 * Type definitions for tesseract.js
 */

declare module "tesseract.js" {
  // Based on https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts
  // and https://github.com/naptha/tesseract.js/blob/master/docs/api.md

  export interface Point {
    x: number
    y: number
  }

  export interface Bbox {
    x0: number
    y0: number
    x1: number
    y1: number
  }

  export interface Baseline {
    x0: number
    y0: number
    x1: number
    y1: number
    has_descenders: boolean
    has_ascenders: boolean
  }

  export interface Word {
    symbols: Symbol[]
    choices: Choice[]
    text: string
    confidence: number
    baseline: Baseline
    bbox: Bbox
    is_numeric: boolean
    in_dictionary: boolean
    direction: string
    language: string
    is_from_dictionary: boolean
    is_fuzzy: boolean
    is_certain: boolean
    is_bold: boolean
    is_italic: boolean
    is_underlined: boolean
    is_monospace: boolean
    is_serif: boolean
    is_smallcaps: boolean
    font_id: number
    font_size: number
    font_name: string
  }

  export interface Symbol {
    choices: Choice[]
    image: null | HTMLImageElement // Or string if it's a path/URL
    text: string
    confidence: number
    baseline: Baseline
    bbox: Bbox
    is_superscript: boolean
    is_subscript: boolean
    is_dropcap: boolean
  }

  export interface Choice {
    text: string
    confidence: number
  }

  export interface Line {
    words: Word[]
    text: string
    confidence: number
    baseline: Baseline
    bbox: Bbox
  }

  export interface Paragraph {
    lines: Line[]
    text: string
    confidence: number
    baseline: Baseline
    bbox: Bbox
    is_ltr: boolean
  }

  export interface Block {
    paragraphs: Paragraph[]
    lines: Line[]
    words: Word[]
    text: string
    confidence: number
    baseline: Baseline
    bbox: Bbox
    blocktype: string
    polygon: Point[]
  }

  export interface Page {
    blocks: Block[]
    confidence: number
    html: string // HTML representation of the page
    jobId?: string
    text: string
    lines: Line[]
    oem: string
    operator: string
    paragraphs: Paragraph[]
    psm: string
    symbols: Symbol[]
    version: string
    words: Word[]
    hocr?: string // hOCR output
    tsv?: string // TSV output
  }

  export interface LoggerMessage {
    jobId?: string
    workerId?: string
    status: string
    progress: number
    userfriendlyText?: string
  }

  export interface WorkerOptions {
    langPath?: string
    corePath?: string
    workerPath?: string
    logger?: (message: LoggerMessage) => void // More specific type for logger message <mcreference index="1" link="https://github.com/naptha/tesseract.js/blob/master/docs/api.md"></mcreference>
    errorHandler?: (error: Error) => void
    // Add other options based on documentation if needed
    [key: string]: any // For other less common or dynamic options
  }

  export interface RecognizeResult {
    data: Page // Use the detailed Page interface
  }

  export interface DetectResult {
    data: {
      tesseract_script_id: number | null
      script: string | null
      script_confidence: number | null
      orientation_degrees: number | null
      orientation_confidence: number | null
    }
    jobId?: string
  }

  export interface ConfigResult {
    data: null
    jobId?: string
  }

  export type ImageLike =
    | HTMLImageElement
    | HTMLCanvasElement
    | File
    | string
    | Buffer
    | ImageData // Common image types

  export interface Worker {
    load(jobId?: string): Promise<ConfigResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    loadLanguage(
      langs?: string | string[],
      jobId?: string
    ): Promise<ConfigResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    initialize(
      langs?: string | string[],
      oem?: OEM,
      config?: string | Partial<InitOptions>,
      jobId?: string
    ): Promise<ConfigResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    setParameters(
      params: Partial<Parameters>,
      jobId?: string
    ): Promise<ConfigResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    recognize(
      image: ImageLike,
      options?: Partial<RecognizeOptions>,
      output?: Partial<OutputFormats>,
      jobId?: string
    ): Promise<RecognizeResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    detect(
      image: ImageLike,
      options?: Partial<WorkerOptions>,
      jobId?: string
    ): Promise<DetectResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    terminate(jobId?: string): Promise<ConfigResult> // <mcreference index="4" link="https://github.com/naptha/tesseract.js/blob/master/src/index.d.ts"></mcreference>
    // Add other worker methods if present in the version you are targeting
    // Example from docs for other methods like FS operations:
    writeText?(
      path: string,
      text: string,
      jobId?: string
    ): Promise<ConfigResult>
    readText?(path: string, jobId?: string): Promise<ConfigResult>
    removeFile?(path: string, jobId?: string): Promise<ConfigResult> // Assuming removeFile also returns ConfigResult or similar
    FS?(method: string, args: any[], jobId?: string): Promise<any> // FS is more generic
  }

  // Based on Tesseract's OEM and PSM enums
  export enum OEM {
    TESSERACT_ONLY = 0,
    LSTM_ONLY = 1,
    TESSERACT_LSTM_COMBINED = 2,
    DEFAULT = 3,
  }

  export enum PSM {
    OSD_ONLY = 0,
    AUTO_OSD = 1,
    AUTO_ONLY = 2,
    AUTO = 3,
    SINGLE_COLUMN = 4,
    SINGLE_BLOCK_VERT_TEXT = 5,
    SINGLE_BLOCK = 6,
    SINGLE_LINE = 7,
    SINGLE_WORD = 8,
    CIRCLE_WORD = 9,
    SINGLE_CHAR = 10,
    SPARSE_TEXT = 11,
    SPARSE_TEXT_OSD = 12,
    RAW_LINE = 13,
  }

  export interface Parameters {
    tessedit_char_whitelist?: string
    tessedit_pageseg_mode?: PSM
    // Add other Tesseract parameters as needed
    [key: string]: any // For flexibility with other parameters
  }

  export interface RecognizeOptions {
    rectangle?: Bbox // For recognizing a specific region
    rectangles?: Bbox[] // For recognizing multiple regions
    // Add other recognize specific options
    [key: string]: any
  }

  export interface OutputFormats {
    text?: boolean
    blocks?: boolean
    hocr?: boolean
    tsv?: boolean
    pdf?: boolean // If PDF output is supported
    // Add other output formats
    [key: string]: any
  }

  export interface InitOptions {
    load_system_dawg?: boolean
    load_freq_dawg?: boolean
    load_punc_dawg?: boolean
    load_number_dawg?: boolean
    load_unambig_dawg?: boolean
    load_bigram_dawg?: boolean
    load_fixed_length_dawgs?: boolean
    // Add other init-only parameters
    [key: string]: any
  }

  export function createWorker(options?: Partial<WorkerOptions>): Worker // 修正返回类型为 Worker 而非 Promise<Worker>
  export function setLogging(logging: boolean): void
  export function recognize(
    image: ImageLike,
    langs?: string | string[],
    options?: Partial<RecognizeOptions & WorkerOptions>
  ): Promise<RecognizeResult>
  export function detect(
    image: ImageLike,
    options?: Partial<WorkerOptions>
  ): Promise<DetectResult>

  // 正确导出 OEM 和 PSM 枚举
  export { OEM, PSM }
}
