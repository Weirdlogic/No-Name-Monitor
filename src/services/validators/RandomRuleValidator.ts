// src/services/validators/RandomRuleValidator.ts

import { RandomRule } from '../../types';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
  ValidationWarningType
} from '../../types/validation';

export class RandomRuleValidator {
  public validate(rule: RandomRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    this.validateBasicFields(rule, errors);
    this.validateRanges(rule, errors, warnings);
    this.validateCharacterSets(rule, errors, warnings);

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateBasicFields(rule: RandomRule, errors: ValidationError[]) {
    // Validate name
    if (!rule.name || typeof rule.name !== 'string') {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'name',
        message: 'Name must be a non-empty string'
      });
    }

    // Validate ID
    if (!rule.id || typeof rule.id !== 'string') {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'id',
        message: 'ID must be a non-empty string'
      });
    }

    // Validate boolean fields
    ['digit', 'upper', 'lower'].forEach(field => {
      if (typeof rule[field as keyof RandomRule] !== 'boolean') {
        errors.push({
          type: ValidationErrorType.INVALID_TYPE,
          field,
          message: `${field} must be a boolean`
        });
      }
    });
  }

  private validateRanges(
    rule: RandomRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // Validate min value
    if (typeof rule.min !== 'number' || rule.min < 0) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'min',
        message: 'min must be a non-negative number'
      });
    }

    // Validate max value
    if (typeof rule.max !== 'number') {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'max',
        message: 'max must be a number'
      });
    }

    // Validate min/max relationship
    if (typeof rule.min === 'number' && typeof rule.max === 'number') {
      if (rule.max < rule.min) {
        errors.push({
          type: ValidationErrorType.INVALID_VALUE,
          field: 'max',
          message: 'max must be greater than or equal to min'
        });
      }

      // Check for potentially problematic ranges
      if (rule.max - rule.min > 1000) {
        warnings.push({
          type: ValidationWarningType.SUSPICIOUS_VALUE,
          field: 'max',
          message: 'Large range between min and max may impact performance'
        });
      }
    }
  }

  private validateCharacterSets(
    rule: RandomRule,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // Check if at least one character set is enabled
    if (!rule.digit && !rule.upper && !rule.lower) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'characterSets',
        message: 'At least one character set (digit, upper, or lower) must be enabled'
      });
    }

    // Warn about potential entropy issues
    const characterSetCount = [rule.digit, rule.upper, rule.lower].filter(Boolean).length;
    if (characterSetCount === 1 && rule.max > 8) {
      warnings.push({
        type: ValidationWarningType.SUSPICIOUS_VALUE,
        field: 'characterSets',
        message: 'Using single character set with large length may result in low entropy'
      });
    }
  }
}