// src/services/ValidationService.ts

import { ConfigurationFile, TargetConfig, RandomRule } from '../types';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
  ValidationWarningType
} from '../types/validation';
import { TargetValidator } from './validators/TargetValidator';
import { RandomRuleValidator } from './validators/RandomRuleValidator';
import { RelationshipValidator } from './validators/RelationshipValidator';

class ValidationService {
  private static instance: ValidationService;
  private targetValidator: TargetValidator;
  private randomRuleValidator: RandomRuleValidator;
  private relationshipValidator: RelationshipValidator;

  private constructor() {
    this.targetValidator = new TargetValidator();
    this.randomRuleValidator = new RandomRuleValidator();
    this.relationshipValidator = new RelationshipValidator();
  }

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  public validateConfiguration(config: ConfigurationFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate basic structure
    if (!this.isValidConfigStructure(config, errors)) {
      return { isValid: false, errors, warnings };
    }

    // Validate targets if present
    if (config.targets) {
      config.targets.forEach((target, index) => {
        const targetValidation = this.targetValidator.validate(target);
        this.addPrefixToResults(targetValidation, `targets[${index}]`, errors, warnings);
      });
    }

    // Validate random rules
    config.randoms.forEach((rule, index) => {
      const ruleValidation = this.randomRuleValidator.validate(rule);
      this.addPrefixToResults(ruleValidation, `randoms[${index}]`, errors, warnings);
    });

    // Check relationships
    const relationshipValidation = this.relationshipValidator.validate(config);
    errors.push(...relationshipValidation.errors);
    warnings.push(...relationshipValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidConfigStructure(
    config: ConfigurationFile,
    errors: ValidationError[]
  ): boolean {
    if (!config.randoms || !Array.isArray(config.randoms)) {
      errors.push({
        type: ValidationErrorType.MISSING_FIELD,
        field: 'randoms',
        message: 'Configuration must include randoms array'
      });
      return false;
    }

    if (config.targets && !Array.isArray(config.targets)) {
      errors.push({
        type: ValidationErrorType.INVALID_TYPE,
        field: 'targets',
        message: 'Targets must be an array if present'
      });
      return false;
    }

    return true;
  }

  private addPrefixToResults(
    validation: ValidationResult,
    prefix: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    validation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `${prefix}.${error.field}`
      });
    });
    
    validation.warnings.forEach(warning => {
      warnings.push({
        ...warning,
        field: `${prefix}.${warning.field}`
      });
    });
  }
}

export default ValidationService.getInstance();