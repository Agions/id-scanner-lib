/**
 * Type definitions for browser-image-compression
 */

declare module 'browser-image-compression' {
  export interface Options {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    maxIteration?: number;
    quality?: number;
    fileType?: string;
    onProgress?: (progress: number) => void;
  }

  function imageCompression(file: File, options?: Options): Promise<File>;
  
  export default imageCompression;
}
