'use client';

import { Listbox, ListboxButton, Label, ListboxOption, ListboxOptions } from '@headlessui/react';

export interface RoundsFilterOptions {
  domains: string[];
  categories: string[];
  subcategories: string[];
  frequencies: string[];
  horizons: string[];
}

interface FilterPanelProps {
  filterOptions: RoundsFilterOptions;
  selectedDomains: string[];
  selectedCategories: string[];
  selectedFrequencies: string[];
  selectedHorizons: string[];
  status?: 'active' | 'completed' | 'all';
  endDateFrom?: string;
  endDateTo?: string;
  searchTerm?: string;
  onDomainsChange: (domains: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onFrequenciesChange: (frequencies: string[]) => void;
  onHorizonsChange: (horizons: string[]) => void;
  onStatusChange: (status: 'active' | 'completed' | 'all') => void;
  onEndDateFromChange: (date: string) => void;
  onEndDateToChange: (date: string) => void;
  onSearchTermChange: (searchTerm: string) => void;
  onClearFilters: () => void;
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const handleSelect = (values: string[]) => {
    onChange(values);
  };

  return (
    <Listbox value={selected} onChange={handleSelect} multiple>
      <div className="relative">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </Label>
        
        <ListboxButton className="relative w-full min-h-[42px] p-2 text-left bg-white border border-gray-300 rounded-md cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                >
                  {item}
                  <span
                    className="hover:text-blue-900 cursor-pointer"
                    onClick={(e) => handleRemove(item, e)}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Select {label.toLowerCase()}...</span>
          )}
        </ListboxButton>

        <ListboxOptions className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0">
          {options.map((option) => (
            <ListboxOption
              key={option}
              value={option}
              className="flex items-center px-3 py-2 cursor-pointer data-[focus]:bg-blue-50 data-[selected]:bg-blue-100 data-[selected]:font-medium"
            >
              {option}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export default function FilterPanel({
  filterOptions,
  selectedDomains,
  selectedCategories,
  selectedFrequencies,
  selectedHorizons,
  status,
  endDateFrom,
  endDateTo,
  searchTerm,
  onDomainsChange,
  onCategoriesChange,
  onFrequenciesChange,
  onHorizonsChange,
  onStatusChange,
  onEndDateFromChange,
  onEndDateToChange,
  onSearchTermChange,
  onClearFilters,
}: FilterPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Status and Search in same row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status || 'all'}
              onChange={(e) => onStatusChange(e.target.value as 'active' | 'completed' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="searchTerm"
              type="text"
              placeholder="Search by name, ID, or description..."
              value={searchTerm || ''}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Multi-select filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MultiSelect
            label="Domain"
            options={filterOptions.domains}
            selected={selectedDomains}
            onChange={onDomainsChange}
          />

          <MultiSelect
            label="Category"
            options={filterOptions.categories}
            selected={selectedCategories}
            onChange={onCategoriesChange}
          />

          <MultiSelect
            label="Frequency"
            options={filterOptions.frequencies}
            selected={selectedFrequencies}
            onChange={onFrequenciesChange}
          />

          <MultiSelect
            label="Horizon"
            options={filterOptions.horizons}
            selected={selectedHorizons}
            onChange={onHorizonsChange}
          />
        </div>

        {/* Date Range Filters */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">End Date Range</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="endDateFrom" className="block text-xs text-gray-600 mb-1">
                From
              </label>
              <input
                id="endDateFrom"
                type="date"
                value={endDateFrom || ''}
                onChange={(e) => onEndDateFromChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDateTo" className="block text-xs text-gray-600 mb-1">
                To
              </label>
              <input
                id="endDateTo"
                type="date"
                value={endDateTo || ''}
                onChange={(e) => onEndDateToChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
