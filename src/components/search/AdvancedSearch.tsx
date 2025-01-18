import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Search as SearchIcon, Filter, Clock, Save, History } from 'lucide-react';
import DataService from '../../services/DataService';
import { TargetConfig } from '../../types';

interface SearchFilters {
  tld: string[];
  methods: string[];
  protocols: string[];
  ports: number[];
  useSSL?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
}

export const AdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    tld: [],
    methods: [],
    protocols: [],
    ports: []
  });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetConfig | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get all available targets
  const allTargets = useMemo(() => {
    const hosts = DataService.getActiveHosts();
    return hosts.flatMap(host => DataService.getTargetsForHost(host));
  }, []);

  // Extract unique values for filters
  const filterOptions = useMemo(() => ({
    tlds: Array.from(new Set(allTargets.map(t => t.host.split('.').slice(-1)[0]))),
    methods: Array.from(new Set(allTargets.map(t => t.method))),
    protocols: Array.from(new Set(allTargets.map(t => t.type))),
    ports: Array.from(new Set(allTargets.map(t => t.port))),
  }), [allTargets]);

  // Filter targets based on search query and filters
  const filteredTargets = useMemo(() => {
    return allTargets.filter(target => {
      // Search query check
      if (query && !target.host.toLowerCase().includes(query.toLowerCase()) &&
          !target.ip.includes(query)) {
        return false;
      }

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
        const targetHistory = DataService.getTargetHistory(target.target_id);
        const firstSeen = new Date(targetHistory[0]?.timestamp);
        if (firstSeen < filters.dateRange.start || firstSeen > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [allTargets, query, filters]);

  // Update filters
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: Array.isArray(prev[key])
        ? prev[key].includes(value)
          ? prev[key].filter(v => v !== value)
          : [...prev[key], value]
        : value
    }));
  }, []);

  // Save search
  const saveSearch = useCallback(() => {
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: query || 'Unnamed Search',
      query,
      filters,
      timestamp: new Date()
    };
    setSavedSearches(prev => [...prev, newSavedSearch]);
  }, [query, filters]);

  // Load saved search
  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setQuery(search.query);
    setFilters(search.filters);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hosts, IPs, or patterns..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={saveSearch}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <Save className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
            {/* TLD Filter */}
            <div>
              <h4 className="font-medium mb-2">TLD</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filterOptions.tlds.map(tld => (
                  <label key={tld} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.tld.includes(tld)}
                      onChange={() => updateFilter('tld', tld)}
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm">.{tld}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Method Filter */}
            <div>
              <h4 className="font-medium mb-2">Methods</h4>
              <div className="space-y-1">
                {filterOptions.methods.map(method => (
                  <label key={method} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.methods.includes(method)}
                      onChange={() => updateFilter('methods', method)}
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Protocol Filter */}
            <div>
              <h4 className="font-medium mb-2">Protocols</h4>
              <div className="space-y-1">
                {filterOptions.protocols.map(protocol => (
                  <label key={protocol} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.protocols.includes(protocol)}
                      onChange={() => updateFilter('protocols', protocol)}
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm">{protocol}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <h4 className="font-medium mb-2">Additional Filters</h4>
              <div className="space-y-2">
                <select
                  value={filters.useSSL === undefined ? '' : filters.useSSL.toString()}
                  onChange={(e) => updateFilter('useSSL', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full rounded-md border p-1"
                >
                  <option value="">Any SSL</option>
                  <option value="true">SSL Only</option>
                  <option value="false">Non-SSL Only</option>
                </select>

                {/* Date Range */}
                <div className="space-y-1">
                  <input
                    type="date"
                    onChange={(e) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      start: e.target.valueAsDate
                    })}
                    className="w-full rounded-md border p-1"
                  />
                  <input
                    type="date"
                    onChange={(e) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      end: e.target.valueAsDate
                    })}
                    className="w-full rounded-md border p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Search Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="md:col-span-2">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Results ({filteredTargets.length})</h3>
            <div className="space-y-4">
              {filteredTargets.map(target => (
                <div
                  key={target.target_id}
                  onClick={() => setSelectedTarget(target)}
                  className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{target.host}</h4>
                    <span className="text-sm text-gray-500">{target.ip}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span>{target.method}</span>
                    <span>{target.type}</span>
                    <span>Port: {target.port}</span>
                    <span>{target.use_ssl ? 'SSL' : 'Non-SSL'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Saved and Recent Searches */}
        <div className="space-y-6">
          {/* Saved Searches */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Saved Searches</h3>
            <div className="space-y-2">
              {savedSearches.map(search => (
                <div
                  key={search.id}
                  onClick={() => loadSavedSearch(search)}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{search.name}</span>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {search.timestamp.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Searches */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Recent Searches</h3>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  onClick={() => setQuery(search)}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <History className="h-4 w-4 text-gray-400" />
                    <span>{search}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
