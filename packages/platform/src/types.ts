export interface OpenedFile {
  id: string; // Unique ID for this specific opened instance
  name: string;
  size: number;
  type: string; // MIME type
  extension: string;
  buffer: ArrayBuffer; // The actual file contents kept in memory
  lastOpened: number;
}

export interface PlatformAdapter {
  app: {
    info(): { platform: 'web' | 'desktop'; version: string };
  };
  files: {
    pickFiles(options?: { accept?: string; multiple?: boolean }): Promise<OpenedFile[]>;
    readFile(file: File): Promise<ArrayBuffer>;
    saveAs(data: ArrayBuffer | Blob, suggestedName: string, mime: string): Promise<void>;
    onFileOpenRequest(callback: (files: OpenedFile[]) => void): () => void;
  };
}
