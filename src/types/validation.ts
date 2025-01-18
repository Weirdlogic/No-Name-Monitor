// src/types/validation.ts

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }
  
  export interface ValidationError {
    type: ValidationErrorType;
    field: string;
    message: string;
    details?: unknown;
  }
  
  export interface ValidationWarning {
    type: ValidationWarningType;
    field: string;
    message: string;
    details?: unknown;
  }
  
  export enum ValidationErrorType {
    MISSING_FIELD = 'MISSING_FIELD',
    INVALID_TYPE = 'INVALID_TYPE',
    INVALID_VALUE = 'INVALID_VALUE',
    MALFORMED_DATA = 'MALFORMED_DATA',
    RELATIONSHIP_ERROR = 'RELATIONSHIP_ERROR'
  }
  
  export enum ValidationWarningType {
    SUSPICIOUS_VALUE = 'SUSPICIOUS_VALUE',
    UNCOMMON_PATTERN = 'UNCOMMON_PATTERN',
    POTENTIAL_DUPLICATE = 'POTENTIAL_DUPLICATE'
  }