import { TargetConfig } from '../types';
import DataService from './DataService';
import { SearchFilters } from '../contexts/SearchContext';

class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async searchTargets(query: string, filters?: SearchFilters): Promise<TargetConfig[]> {
    // Get all targets from DataService
    const hosts = DataService.getActiveHosts();
    const allTargets = hosts.flatMap(host => DataService.getTargetsForHost(host));

    // Apply search and filters
    return allTargets.filter(target => {
      // Query matching
      if (query) {
        const queryLower = query.toLowerCase();
        const matchesHost = target.host.toLowerCase().includes(queryLower);
        const matchesIP = target.ip.includes(query);
        if (!matchesHost && !matchesIP) return false;
      }

      // Apply filters if provided
      if (filters) {
        // TLD filter
        if (filters.tld.length > 0) {
          const tld = target.host.split('.').slice(-1)[0];
          if (!filters.tld.includes(tld)) return false;
        }

        // Method filter
        if (filters.methods.length > 0 && !filters.methods.includes(target.method)) {
          return false;
        }

        // Protocol filter
        if (filters.protocols.length > 0 && !filters.protocols.includes(target.type)) {
          return false;
        }

        // Port filter
        if (filters.ports.length > 0 && !filters.ports.includes(target.port)) {
          return false;
        }

        // SSL filter
        if (filters.useSSL !== undefined && filters.useSSL !== target.use_ssl) {
          return false;
        }

        // Date range filter
        if (filters.dateRange) {
          const history = DataService.getTargetHistory(target.target_id);
          const firstSeen = history[0]?.timestamp;
          if (firstSeen) {
            if (firstSeen < filters.dateRange.start || firstSeen > filters.dateRange.end) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }

  public findSimilarTargets(target: TargetConfig): TargetConfig[] {
    const hosts = DataService.getActiveHosts();
    const allTargets = hosts.flatMap(host => DataService.getTargetsForHost(host));

    // Calculate similarity score for each target
    const similarTargets = allTargets
      .filter(t => t.target_id !== target.target_id)
      .map(t => ({
        target: t,
        score: this.calculateSimilarityScore(target, t)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.target);

    return similarTargets;
  }

  private calculateSimilarityScore(target1: TargetConfig, target2: TargetConfig): number {
    let score = 0;

    // Same TLD
    if (this.getTLD(target1.host) === this.getTLD(target2.host)) {
      score += 2;
    }

    // Same method
    if (target1.method === target2.method) {
      score += 2;
    }

    // Same protocol
    if (target1.type === target2.type) {
      score += 2;
    }

    // Same port
    if (target1.port === target2.port) {
      score += 1;
    }

    // Same SSL configuration
    if (target1.use_ssl === target2.use_ssl) {
      score += 1;
    }

    // Similar path pattern
    if (this.haveSimilarPath(target1.path, target2.path)) {
      score += 2;
    }

    return score;
  }

  private getTLD(host: string): string {
    return host.split('.').slice(-1)[0];
  }

  private haveSimilarPath(path1: string, path2: string): boolean {
    // Remove query parameters and normalize
    const normalize = (path: string) => {
      return path.split('?')[0].split('/').filter(Boolean);
    };

    const parts1 = normalize(path1);
    const parts2 = normalize(path2);

    // Check if paths have similar structure
    if (parts1.length === parts2.length) {
      let similarities = 0;
      for (let i = 0; i < parts1.length; i++) {
        if (parts1[i] === parts2[i]) {
          similarities++;
        }
      }
      return similarities >= parts1.length / 2;
    }

    return false;
  }
}

export default SearchService.getInstance();