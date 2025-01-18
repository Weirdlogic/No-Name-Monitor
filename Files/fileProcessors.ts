// src/utils/fileProcessors.ts
import { ConfigurationFile } from '../types';

export const parseConfigurationFile = async (file: File): Promise<ConfigurationFile> => {
  try {
    const content = await file.text();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing configuration file:', error);
    throw error;
  }
};

export const extractTimestampFromFilename = (filename: string): Date => {
  // Extract timestamp from DDoSia filename pattern
  const match = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
  if (!match) throw new Error('Invalid filename format');
  return new Date(match[1].replace(/_/g, ' ').replace(/-/g, ':'));
};