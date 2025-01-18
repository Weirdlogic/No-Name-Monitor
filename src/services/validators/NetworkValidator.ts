// src/services/validators/NetworkValidator.ts

export class NetworkValidator {
    private suspiciousHostPatterns = [
      /^[0-9]+\./,  // Starts with number
      /\.[0-9]+\./,  // Numeric subdomain
      /[^a-zA-Z0-9\-\.]/,  // Contains special characters
      /\.{2,}/,  // Multiple consecutive dots
      /\-{2,}/,  // Multiple consecutive hyphens
    ];
  
    public isValidHostname(host: string): boolean {
      // RFC 1123 hostname validation
      const hostnameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return hostnameRegex.test(host) && host.length <= 255;
    }
  
    public isValidIP(ip: string): boolean {
      // IPv4 validation
      if (this.isValidIPv4(ip)) return true;
      // IPv6 validation
      if (this.isValidIPv6(ip)) return true;
      return false;
    }
  
    public isSuspiciousHost(host: string): boolean {
      return this.suspiciousHostPatterns.some(pattern => pattern.test(host));
    }
  
    private isValidIPv4(ip: string): boolean {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(ip)) return false;
  
      // Validate each octet
      const octets = ip.split('.');
      return octets.every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }
  
    private isValidIPv6(ip: string): boolean {
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      // Basic IPv6 validation (could be extended for all IPv6 formats)
      if (!ipv6Regex.test(ip)) return false;
  
      // Validate each hextet
      const hextets = ip.split(':');
      return hextets.every(hextet => {
        const num = parseInt(hextet, 16);
        return num >= 0 && num <= 65535;
      });
    }
  }