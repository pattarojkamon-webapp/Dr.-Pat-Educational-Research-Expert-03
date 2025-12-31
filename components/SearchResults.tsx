import React from 'react';
import type { SearchResultItem } from '../utils/search';

interface SearchResultsProps {
  results: SearchResultItem[];
  onResultClick: (result: SearchResultItem) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  return (
    <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto border border-slate-200">
      <ul className="divide-y divide-gray-200">
        {results.length > 0 ? (
          results.map((result, index) => (
            <li 
              key={index} 
              onClick={() => onResultClick(result)}
              className="p-4 hover:bg-indigo-50 transition-colors duration-150 cursor-pointer"
            >
              <h3 className="font-bold text-indigo-700 text-md">{result.title}</h3>
              <p 
                className="text-sm text-gray-600 mt-1"
                dangerouslySetInnerHTML={{ __html: result.snippet.replace(/\n/g, ' ') }} 
              />
            </li>
          ))
        ) : (
          <li className="p-4 text-center text-gray-500">No results found.</li>
        )}
      </ul>
    </div>
  );
};