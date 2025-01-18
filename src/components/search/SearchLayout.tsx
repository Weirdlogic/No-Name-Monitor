import React from 'react';
import { SearchProvider } from '../../contexts/SearchContext';
import { AdvancedSearch } from './AdvancedSearch';
import { SearchResults } from './SearchResults';
import { TargetDetails } from '../analysis/TargetDetails';
import { useSearch } from '../../contexts/SearchContext';

const SearchContent = () => {
  const { state, dispatch } = useSearch();
  const { results, selectedTarget, loading, error } = state;

  return (
    <div className="space-y-6">
      <AdvancedSearch />
      
      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <SearchResults 
          results={results}
          onTargetSelect={(target) => 
            dispatch({ type: 'SELECT_TARGET', payload: target })
          }
        />
      )}

      {selectedTarget && (
        <TargetDetails target={selectedTarget} />
      )}
    </div>
  );
};

export const SearchLayout = () => {
  return (
    <SearchProvider>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Target Search & Analysis
        </h1>
        <SearchContent />
      </div>
    </SearchProvider>
  );
};