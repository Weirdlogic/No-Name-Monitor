// src/utils/idGenerator.ts

/**
 * Generates a unique ID combining timestamp and random elements
 * Format: timestamp-random
 */
export function generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }
  
  /**
   * Generates an alert-specific ID with prefix
   * Format: alert-timestamp-random
   */
  export function generateAlertId(): string {
    return `alert-${generateId()}`;
  }
  
  /**
   * Extracts timestamp from ID
   */
  export function getTimestampFromId(id: string): Date {
    const timestamp = parseInt(id.split('-')[0]);
    return new Date(timestamp);
  }
  
  /**
   * Checks if ID is valid
   */
  export function isValidId(id: string): boolean {
    const parts = id.split('-');
    if (parts.length !== 2) return false;
    
    const timestamp = parseInt(parts[0]);
    return !isNaN(timestamp) && timestamp > 0;
  }