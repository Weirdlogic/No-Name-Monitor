// src/services/DirectoryParserService.ts
import { FileEntry, ParserResult, ParserError } from '../types';

export interface DirectoryParserConfig {
    baseUrl?: string;              
    filePattern?: RegExp;          
    maxRetries?: number;           
    retryDelay?: number;           
}

const DEFAULT_CONFIG: Required<DirectoryParserConfig> = {
    baseUrl: 'https://witha.name/data/',
    filePattern: /\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_DDoSia-target-list-full\.json$/,
    maxRetries: 3,
    retryDelay: 5000
};

class DirectoryParserService {
    private static instance: DirectoryParserService;
    private config: Required<DirectoryParserConfig>;
    private lastFetch: Date | null = null;

    private constructor(userConfig: DirectoryParserConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...userConfig };
    }

    public static getInstance(config?: DirectoryParserConfig): DirectoryParserService {
        if (!DirectoryParserService.instance) {
            DirectoryParserService.instance = new DirectoryParserService(config);
        }
        return DirectoryParserService.instance;
    }

    public async fetchDirectoryListing(): Promise<ParserResult> {
        try {
            const html = await this.fetchWithRetry(this.config.baseUrl);
            const entries = this.parseHtml(html);
            const sortedEntries = this.sortEntries(entries);

            this.lastFetch = new Date();
            return {
                entries: sortedEntries,
                errors: []
            };

        } catch (error) {
            return {
                entries: [],
                errors: [{
                    type: 'FETCH',
                    message: 'Failed to fetch directory listing',
                    details: error
                }]
            };
        }
    }

    private parseHtml(html: string): FileEntry[] {
        const entries: FileEntry[] = [];
        
        const lines = html.split('\n');
        
        const linkPattern = /<a href="([^"]+DDoSia-target-list-full\.json)">/;
        const metadataPattern = /(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2})\s+(\d+[KMG]?)/;

        for (const line of lines) {
            try {
                const filenameMatch = line.match(linkPattern);
                if (!filenameMatch) continue;
                const filename = filenameMatch[1];

                const metadataMatch = line.match(metadataPattern);
                if (!metadataMatch) continue;

                const [_, lastModifiedStr, sizeStr] = metadataMatch;

                const entry: FileEntry = {
                    filename,
                    timestamp: this.parseTimestamp(filename),
                    lastModified: new Date(lastModifiedStr),
                    size: sizeStr,
                    url: new URL(filename, this.config.baseUrl).toString()
                };

                entries.push(entry);
            } catch (error) {
                console.error('Error parsing line:', line, error);
            }
        }

        return entries;
    }

    private async fetchWithRetry(url: string): Promise<string> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.text();
            } catch (error) {
                lastError = error as Error;
                if (attempt < this.config.maxRetries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.retryDelay * attempt)
                    );
                }
            }
        }

        throw lastError || new Error('Failed to fetch after retries');
    }

    private parseTimestamp(timestampStr: string): Date {
        const timestampMatch = timestampStr.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        if (!timestampMatch) {
            throw new Error(`Invalid timestamp format: ${timestampStr}`);
        }

        const [datePart, timePart] = timestampMatch[1].split('_');
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split('-');

        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
        );
    }

    private sortEntries(entries: FileEntry[]): FileEntry[] {
        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    public async getLatestFile(): Promise<FileEntry | null> {
        try {
            const result = await this.fetchDirectoryListing();
            if (result.entries.length === 0) return null;
            
            return result.entries[0];
        } catch (error) {
            console.error('Error getting latest file:', error);
            return null;
        }
    }

    public async getNewFiles(since: Date): Promise<FileEntry[]> {
        try {
            const result = await this.fetchDirectoryListing();
            return result.entries.filter(entry => entry.timestamp > since);
        } catch (error) {
            console.error('Error getting new files:', error);
            return [];
        }
    }

    public shouldFetch(): boolean {
        if (!this.lastFetch) return true;

        const now = new Date();
        const hour = now.getHours();

        if ((hour >= 6 && hour <= 8) || (hour >= 12 && hour <= 13)) {
            return (now.getTime() - this.lastFetch.getTime()) >= 30 * 60 * 1000;
        }

        return (now.getTime() - this.lastFetch.getTime()) >= 3 * 60 * 60 * 1000;
    }
}

export default DirectoryParserService.getInstance();