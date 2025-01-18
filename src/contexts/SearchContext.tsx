import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { TargetConfig } from '../types';

// Search State Types
export interface SearchFilters {
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

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: TargetConfig[];
  selectedTarget: TargetConfig | null;
  savedSearches: SavedSearch[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
}

// Action Types
type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'SET_RESULTS'; payload: TargetConfig[] }
  | { type: 'SELECT_TARGET'; payload: TargetConfig | null }
  | { type: 'SAVE_SEARCH'; payload: SavedSearch }
  | { type: 'ADD_RECENT_SEARCH'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_SEARCH' };

// Initial State
const initialState: SearchState = {
  query: '',
  filters: {
    tld: [],
    methods: [],
    protocols: [],
    ports: []
  },
  results: [],
  selectedTarget: null,
  savedSearches: [],
  recentSearches: [],
  loading: false,
  error: null
};

// Context Creation
const SearchContext = createContext<{
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  saveSearch: (name: string) => void;
  clearSearch: () => void;
  loadSavedSearch: (search: SavedSearch) => void;
} | undefined>(undefined);

// Reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SELECT_TARGET':
      return { ...state, selectedTarget: action.payload };
    case 'SAVE_SEARCH':
      return {
        ...state,
        savedSearches: [...state.savedSearches, action.payload]
      };
    case 'ADD_RECENT_SEARCH':
      return {
        ...state,
        recentSearches: [
          action.payload,
          ...state.recentSearches.filter(s => s !== action.payload)
        ].slice(0, 10)
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_SEARCH':
      return {
        ...state,
        query: '',
        filters: initialState.filters,
        results: [],
        selectedTarget: null,
        error: null
      };
    default:
      return state;
  }
}

// Provider Component
export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Search Function
  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Update search state
      dispatch({ type: 'SET_QUERY', payload: query });
      if (filters) {
        dispatch({ type: 'SET_FILTERS', payload: filters });
      }

      if (query) {
        dispatch({ type: 'ADD_RECENT_SEARCH', payload: query });
      }

      // The actual search logic will be implemented in the SearchService
      // For now, we'll just update the state
      dispatch({ type: 'SET_RESULTS', payload: [] });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save Search
  const saveSearch = useCallback((name: string) => {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: state.query,
      filters: state.filters,
      timestamp: new Date()
    };
    dispatch({ type: 'SAVE_SEARCH', payload: savedSearch });
  }, [state.query, state.filters]);

  // Clear Search
  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  // Load Saved Search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    dispatch({ type: 'SET_QUERY', payload: savedSearch.query });
    dispatch({ type: 'SET_FILTERS', payload: savedSearch.filters });
    search(savedSearch.query, savedSearch.filters);
  }, [search]);

  const value = {
    state,
    dispatch,
    search,
    saveSearch,
    clearSearch,
    loadSavedSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom Hook
export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Utility Hook for Search Results
export function useSearchResults() {
  const { state } = useSearch();
  return {
    results: state.results,
    loading: state.loading,
    error: state.error,
    selectedTarget: state.selectedTarget
  };
}