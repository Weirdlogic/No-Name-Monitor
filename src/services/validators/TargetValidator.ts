// src/services/validators/TargetValidator.ts

import { TargetConfig } from '../../types';
import { ValidationResult, ValidationError, ValidationWarning, ValidationErrorType, ValidationWarningType } from '../../types/validation';
import { COMMON_PORTS, VALID_METHODS, VALID_PROTOCOLS, REQUIRED_TARGET_FIELDS } from '../../constants/validationConstants';
import { NetworkValidator } from './NetworkValidator';

export class TargetValidator {
  private networkValidator = new NetworkValidator();

  public validate(target: TargetConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    this.validateRequiredFields(target, errors);
    this.validateHostAndIP(target, errors, warnings);
    this.validateProtocolAndMethod(target, errors, warnings);
    this.validatePortAndSSL(target, errors, warnings);
    this.validatePathAndBody(target, errors, warnings);

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateRequiredFields(target: TargetConfig, errors: ValidationError[]) {
    REQUIRED_TARGET_FIELDS.forEach(field => {
      if (!(field in target)) {
        errors.push({
          type: ValidationErrorType.MISSING_FIELD,
          field,
          message: `Required field '${field}' is missing`
        });
      }
    });
  }

  private validateHostAndIP(
    target: TargetConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!this.networkValidator.isValidHostname(target.host)) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'host',
        message: 'Invalid hostname format'
      });
    }

    if (!this.networkValidator.isValidIP(target.ip)) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'ip',
        message: 'Invalid IP address format'
      });
    }

    if (this.networkValidator.isSuspiciousHost(target.host)) {
      warnings.push({
        type: ValidationWarningType.SUSPICIOUS_VALUE,
        field: 'host',
        message: 'Suspicious hostname pattern detected'
      });
    }
  }

  private validateProtocolAndMethod(
    target: TargetConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!VALID_PROTOCOLS.has(target.type)) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'type',
        message: `Invalid protocol: ${target.type}`
      });
    }

    if (target.type.startsWith('http') && !VALID_METHODS.has(target.method)) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'method',
        message: `Invalid HTTP method: ${target.method}`
      });
    }
  }

  private validatePortAndSSL(
    target: TargetConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (target.port < 1 || target.port > 65535) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'port',
        message: 'Port number out of valid range (1-65535)'
      });
    }

    if (!COMMON_PORTS.has(target.port)) {
      warnings.push({
        type: ValidationWarningType.UNCOMMON_PATTERN,
        field: 'port',
        message: 'Uncommon port number'
      });
    }

    if (typeof target.use_ssl !== 'boolean') {
      errors.push({
        type: ValidationErrorType.INVALID_TYPE,
        field: 'use_ssl',
        message: 'use_ssl must be a boolean'
      });
    }

    // SSL/Port consistency checks
    if (target.use_ssl && target.port === 80) {
      warnings.push({
        type: ValidationWarningType.SUSPICIOUS_VALUE,
        field: 'port',
        message: 'SSL enabled but using HTTP port 80'
      });
    }
    if (!target.use_ssl && target.port === 443) {
      warnings.push({
        type: ValidationWarningType.SUSPICIOUS_VALUE,
        field: 'port',
        message: 'SSL disabled but using HTTPS port 443'
      });
    }
  }

  private validatePathAndBody(
    target: TargetConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (!target.path.startsWith('/')) {
      errors.push({
        type: ValidationErrorType.INVALID_VALUE,
        field: 'path',
        message: 'Path must start with /'
      });
    }

    if (!target.body || typeof target.body !== 'object') {
      errors.push({
        type: ValidationErrorType.INVALID_TYPE,
        field: 'body',
        message: 'Body must be an object'
      });
    } else {
      if (!('type' in target.body) || !('value' in target.body)) {
        errors.push({
          type: ValidationErrorType.MISSING_FIELD,
          field: 'body',
          message: 'Body must contain type and value fields'
        });
      }
    }
  }
}