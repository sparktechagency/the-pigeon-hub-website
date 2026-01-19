"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Bird } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { useGetPigeonSearchQuery } from '@/redux/featured/pigeon/pigeonApi';
import Spinner from '@/app/(commonLayout)/Spinner';

// Improved debounce hook যা initial render issue fix করে
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // First render এ immediate update করা
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default function PigeonHub() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  // console.log('searchTerm', searchTerm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPigeon, setSelectedPigeon] = useState(null);
  const inputRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Debounce delay calculation
  const debounceDelay = useMemo(() => {
    return searchTerm.length <= 1 ? 300 : 500;
  }, [searchTerm.length]);

  // Trim করা search term for API call
  const trimmedSearchTerm = useMemo(() => searchTerm.trim(), [searchTerm]);

  const debouncedSearchTerm = useDebounce(trimmedSearchTerm, debounceDelay);
  // console.log('debouncedSearchTerm', debouncedSearchTerm);

  // Fixed: Directly pass the search term instead of array format
  const shouldSkipQuery = !debouncedSearchTerm || debouncedSearchTerm.length < 2;
  
  const { data, isLoading, isFetching } = useGetPigeonSearchQuery(
    shouldSkipQuery ? undefined : debouncedSearchTerm, // Changed: Direct string pass
    {
      skip: shouldSkipQuery,
      // Cache results to avoid refetching
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
      refetchOnFocus: false,
    }
  );
  // console.log('data', data);

  const pigeonData = useMemo(() => data?.data || [], [data?.data]);
  // console.log('pigeonData', pigeonData);

  // Suggestions logic
  useEffect(() => {
    if (debouncedSearchTerm?.length >= 2 && pigeonData.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [debouncedSearchTerm, pigeonData]);

  // Input change handler - cursor position maintain করা
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setSearchTerm(value);
    setSelectedPigeon(null);
    
    if (!value.trim()) {
      setShowSuggestions(false);
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }, []);

  const handleSuggestionClick = useCallback((pigeon) => {
    setSearchTerm(`${pigeon?.name} (${pigeon?.ringNumber})`);
    setSelectedPigeon(pigeon);
    setShowSuggestions(false);
    router.push(`/pigeon-overview/${pigeon._id}`);
  }, [router]);

  // Input focus handler
  const handleInputFocus = useCallback(() => {
    if (inputRef.current && searchTerm) {
      const position = searchTerm.length;
      inputRef.current.setSelectionRange(position, position);
    }
  }, [searchTerm]);

  // Blur handler for suggestions
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  }, []);

  // Initial load flag reset
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, []);

  if (isInitialLoad.current && isLoading) {
    return <Spinner />;
  }

  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        // backgroundImage: `url('https://i.ibb.co.com/WpnfSfZb/Log-in.png')`,
        backgroundImage: `url('/assests/bg-banner.webp')`,
       
      }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center h-screen px-4">
        {/* Search Section */}
        <div className="w-full max-w-2xl mt-80 relative">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white z-10">
              <Search className="w-5 h-5" />
            </div>
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search pigeons by name or ring ID..."
              autoComplete="off"
              spellCheck={false}
              className="w-full px-12 py-4 text-lg rounded-full border-2 bg-black h-14 backdrop-blur-sm placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white shadow-l text-white transition-all duration-300"
            />
            
            {/* Loading indicator inside input */}
            {isFetching && trimmedSearchTerm.length >= 2 && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && pigeonData.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-50 backdrop-blur-sm">
              {pigeonData.map((pigeon, index) => (
                <PigeonSuggestionItem
                  key={`${pigeon._id}-${index}`}
                  pigeon={pigeon}
                  index={index}
                  total={pigeonData.length}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
            </div>
          )}

      
          {trimmedSearchTerm.length >= 2 && 
           !isFetching && 
           !isLoading && 
           pigeonData.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 text-center backdrop-blur-sm bg-white/95">
              <Bird className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No verified and Iconic pigeons found matching your search</p>
            </div>
          )}
        </div>

        {/* Selected Pigeon Display */}
        {/* {selectedPigeon && (
          <SelectedPigeonDisplay pigeon={selectedPigeon} />
        )} */}
      </div>
    </div>
  );
}

// Memoized suggestion item component
const PigeonSuggestionItem = React.memo(({ pigeon, index, total, onSuggestionClick }) => {
  const handleClick = useCallback((e) => {
    e.preventDefault();
    onSuggestionClick(pigeon);
  }, [pigeon, onSuggestionClick]);

  return (
    <div
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent input blur
      className={`px-6 py-2 cursor-pointer hover:bg-blue-50 transition-colors duration-200 flex items-center justify-between ${
        index !== total - 1 ? 'border-b border-slate-100' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Bird className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="font-semibold text-slate-800">{pigeon?.name}</div>
          <div className="text-sm text-slate-500">Ring ID: {pigeon?.ringNumber}</div>
        </div>
      </div>
    </div>
  );
});

PigeonSuggestionItem.displayName = 'PigeonSuggestionItem';

// Memoized selected pigeon display
// const SelectedPigeonDisplay = React.memo(({ pigeon }) => (
//   <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
//     <div className="text-center">
//       <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
//         <Bird className="w-10 h-10 text-white" />
//       </div>
//       <h3 className="text-2xl font-bold text-slate-800 mb-2">{pigeon.name}</h3>
//       <div className="text-sm text-slate-600 mb-4">
//         <div className="bg-slate-100 rounded-full px-3 py-1 inline-block mb-2">
//           Ring ID: {pigeon.ringNumber}
//         </div>
//       </div>
//       <div className="grid grid-cols-3 gap-4 text-center mt-6">
//         <div className="bg-slate-50 rounded-lg p-3">
//           <div className="text-2xl font-bold text-blue-600">12</div>
//           <div className="text-xs text-slate-500">Races</div>
//         </div>
//         <div className="bg-slate-50 rounded-lg p-3">
//           <div className="text-2xl font-bold text-green-600">8</div>
//           <div className="text-xs text-slate-500">Wins</div>
//         </div>
//         <div className="bg-slate-50 rounded-lg p-3">
//           <div className="text-2xl font-bold text-orange-600">3rd</div>
//           <div className="text-xs text-slate-500">Rank</div>
//         </div>
//       </div>
//     </div>
//   </div>
// ));

// SelectedPigeonDisplay.displayName = 'SelectedPigeonDisplay';