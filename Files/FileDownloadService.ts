// src/services/FileDownloadService.ts
import { FileEntry } from '../types';

class FileDownloadService {
  private static instance: FileDownloadService;
  private downloadQueue: FileEntry[] = [];
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): FileDownloadService {
    if (!FileDownloadService.instance) {
      FileDownloadService.instance = new FileDownloadService();
    }
    return FileDownloadService.instance;
  }

  public async downloadFile(fileEntry: FileEntry): Promise<string> {
    try {
      const response = await fetch(fileEntry.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error downloading file ${fileEntry.filename}:`, error);
      throw error;
    }
  }

  public queueDownload(fileEntry: FileEntry) {
    this.downloadQueue.push(fileEntry);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.downloadQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const fileEntry = this.downloadQueue.shift()!;

    try {
      const content = await this.downloadFile(fileEntry);
      // Here we would process the file content
      // We'll implement this when we connect to DataService
    } catch (error) {
      console.error('Error processing queue:', error);
    }

    // Process next file after a short delay
    setTimeout(() => this.processQueue(), 1000);
  }
}

export default FileDownloadService.getInstance();