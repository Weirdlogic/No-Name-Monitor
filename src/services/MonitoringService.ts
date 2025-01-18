// src/services/MonitoringService.ts
import DataService from './DataService';
import DirectoryParserService from './DirectoryParserService';
import FileDownloadService from './FileDownloadService';
import { FileEntry } from '../types';

class MonitoringService {
  private static instance: MonitoringService;
  private isRunning: boolean = false;
  private lastProcessedTimestamp: Date | null = null;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Get last processed timestamp from DataService
    this.lastProcessedTimestamp = DataService.getLatestUpdate();

    // Start monitoring loop
    await this.monitoringLoop();
  }

  private async monitoringLoop() {
    while (this.isRunning) {
      try {
        if (DirectoryParserService.shouldFetch()) {
          await this.checkForNewFiles();
        }

        // Wait appropriate interval based on time of day
        await this.waitNextCheck();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }
  }

  private async checkForNewFiles() {
    try {
      // Get new files since last processed
      const newFiles = await DirectoryParserService.getNewFiles(
        this.lastProcessedTimestamp || new Date(0)
      );

      // Process each file
      for (const file of newFiles) {
        await this.processFile(file);
      }

      // Update last processed timestamp
      if (newFiles.length > 0) {
        this.lastProcessedTimestamp = newFiles[0].timestamp; // Newest file
      }
    } catch (error) {
      console.error('Error checking for new files:', error);
    }
  }

  private async processFile(fileEntry: FileEntry) {
    try {
      // Download file
      const content = await FileDownloadService.downloadFile(fileEntry);
      
      // Parse JSON
      const configData = JSON.parse(content);
      
      // Process in DataService
      await DataService.processConfigurationFile(fileEntry.filename, configData);

      console.log(`Successfully processed file: ${fileEntry.filename}`);
    } catch (error) {
      console.error(`Error processing file ${fileEntry.filename}:`, error);
    }
  }

  private async waitNextCheck() {
    const now = new Date();
    const hour = now.getHours();

    // Peak hours (30 min interval)
    if ((hour >= 6 && hour <= 8) || (hour >= 12 && hour <= 13)) {
      await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
    } else {
      // Regular hours (3 hour interval)
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 60 * 1000));
    }
  }

  public stopMonitoring() {
    this.isRunning = false;
  }

  // Manual control methods for testing/debugging
  public async processHistoricalFile(fileEntry: FileEntry) {
    await this.processFile(fileEntry);
  }

  public async forceCheck() {
    await this.checkForNewFiles();
  }
}

export default MonitoringService.getInstance();