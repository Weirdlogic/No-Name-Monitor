export interface TargetConfig {
    target_id: string;
    request_id: string;
    host: string;
    ip: string;
    type: string;
    method: string;
    port: number;
    use_ssl: boolean;
    path: string;
    body: {
      type: string;
      value: string;
    };
    headers: string | null;
  }
  
  export interface RandomRule {
    name: string;
    id: string;
    digit: boolean;
    upper: boolean;
    lower: boolean;
    min: number;
    max: number;
  }
  
  export interface ConfigurationFile {
    targets: TargetConfig[] | null;
    randoms: RandomRule[];
  }

  export interface FileEntry {
    filename: string;              // 2024-01-23_21-20-04_DDoSia-target-list-full.json
    timestamp: Date;              // Parsed from filename
    lastModified: Date;           // From directory listing
    size: string;                 // File size (e.g., "78K")
    url: string;                  // Full URL for download
  }
  
  export interface ParserResult {
    entries: FileEntry[];
    errors: ParserError[];
  }
  
  export interface ParserError {
    type: 'FETCH' | 'PARSE' | 'VALIDATION';
    message: string;
    details?: unknown;
  }