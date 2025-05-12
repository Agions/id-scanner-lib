/**
 * Type definitions for tesseract.js
 */

declare module 'tesseract.js' {
  export interface WorkerOptions {
    langPath?: string;
    corePath?: string;
    workerPath?: string;
    logger?: (message: any) => void;
    errorHandler?: (error: Error) => void;
  }

  export interface RecognizeResult {
    data: {
      text: string;
      hocr: string;
      tsv: string;
      confidence: number;
      blocks: any[];
      lines: any[];
      words: any[];
      symbols: any[];
    };
  }

  export interface Worker {
    load(): Promise<any>;
    loadLanguage(lang: string): Promise<any>;
    initialize(lang: string): Promise<any>;
    setParameters(params: Record<string, any>): Promise<any>;
    recognize(image: HTMLCanvasElement | ImageData | Buffer | string): Promise<RecognizeResult>;
    terminate(): Promise<any>;
  }

  export function createWorker(options?: WorkerOptions): Worker;
}
