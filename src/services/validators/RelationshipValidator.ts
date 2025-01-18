// src/services/validators/RelationshipValidator.ts

import { ConfigurationFile } from '../../types';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
  ValidationWarningType
} from '../../types/validation';

export class RelationshipValidator {
  public validate(config: ConfigurationFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config.targets) {
      return { isValid: true, errors, warnings };
    }

    this.validateRandomRuleReferences(config, errors, warnings);
    this.validateTargetRelationships(config, errors, warnings);
    this.validateHostIPRelationships(config, errors, warnings);

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateRandomRuleReferences(
    config: ConfigurationFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    const randomRuleIds = new Set(config.randoms.map(r => r.id));
    const usedRandomRules = new Set<string>();

    config.targets?.forEach((target, index) => {
      // Check body value for random rule references
      const bodyRules = this.extractRandomRuleRefs(target.body.value);
      bodyRules.forEach(ruleId => {
        if (!randomRuleIds.has(ruleId)) {
          errors.push({
            type: ValidationErrorType.RELATIONSHIP_ERROR,
            field: `targets[${index}].body.value`,
            message: `References non-existent random rule: ${ruleId}`
          });
        } else {
          usedRandomRules.add(ruleId);
        }
      });

      // Check path for random rule references
      const pathRules = this.extractRandomRuleRefs(target.path);
      pathRules.forEach(ruleId => {
        if (!randomRuleIds.has(ruleId)) {
          errors.push({
            type: ValidationErrorType.RELATIONSHIP_ERROR,
            field: `targets[${index}].path`,
            message: `References non-existent random rule: ${ruleId}`
          });
        } else {
          usedRandomRules.add(ruleId);
        }
      });
    });

    // Check for unused random rules
    randomRuleIds.forEach(ruleId => {
      if (!usedRandomRules.has(ruleId)) {
        warnings.push({
          type: ValidationWarningType.POTENTIAL_DUPLICATE,
          field: 'randoms',
          message: `Random rule '${ruleId}' is never used`
        });
      }
    });
  }

  private validateTargetRelationships(
    config: ConfigurationFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    const targetIds = new Set<string>();
    const requestIds = new Set<string>();

    config.targets?.forEach((target, index) => {
      // Check for duplicate target IDs
      if (targetIds.has(target.target_id)) {
        errors.push({
          type: ValidationErrorType.RELATIONSHIP_ERROR,
          field: `targets[${index}].target_id`,
          message: `Duplicate target ID: ${target.target_id}`
        });
      }
      targetIds.add(target.target_id);

      // Check for duplicate request IDs
      if (requestIds.has(target.request_id)) {
        warnings.push({
          type: ValidationWarningType.POTENTIAL_DUPLICATE,
          field: `targets[${index}].request_id`,
          message: `Duplicate request ID: ${target.request_id}`
        });
      }
      requestIds.add(target.request_id);
    });
  }

  private validateHostIPRelationships(
    config: ConfigurationFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    const hostToIPs = new Map<string, Set<string>>();
    const ipToHosts = new Map<string, Set<string>>();

    config.targets?.forEach((target, index) => {
      // Track host-IP relationships
      if (!hostToIPs.has(target.host)) {
        hostToIPs.set(target.host, new Set());
      }
      hostToIPs.get(target.host)?.add(target.ip);

      if (!ipToHosts.has(target.ip)) {
        ipToHosts.set(target.ip, new Set());
      }
      ipToHosts.get(target.ip)?.add(target.host);
    });

    // Check for hosts with multiple IPs
    hostToIPs.forEach((ips, host) => {
      if (ips.size > 1) {
        warnings.push({
          type: ValidationWarningType.SUSPICIOUS_VALUE,
          field: 'host-ip-relationship',
          message: `Host '${host}' is associated with multiple IPs: ${Array.from(ips).join(', ')}`
        });
      }
    });

    // Check for IPs with multiple hosts
    ipToHosts.forEach((hosts, ip) => {
      if (hosts.size > 1) {
        warnings.push({
          type: ValidationWarningType.SUSPICIOUS_VALUE,
          field: 'ip-host-relationship',
          message: `IP '${ip}' is associated with multiple hosts: ${Array.from(hosts).join(', ')}`
        });
      }
    });
  }

  private extractRandomRuleRefs(value: string): string[] {
    // Extract $_* references from the value
    const regex = /\$_([a-zA-Z0-9_]+)/g;
    const matches = value.match(regex) || [];
    return matches.map(match => match.slice(2)); // Remove $_
  }
}