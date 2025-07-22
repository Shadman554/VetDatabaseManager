import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export type SortOption = {
  value: string;
  label: string;
  key: string;
};

export type FilterOption = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export type SearchFilterSortProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortOptions: SortOption[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: string, direction: 'asc' | 'desc') => void;
  filterOptions: FilterOption[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  placeholder?: string;
  totalItems: number;
  filteredItems: number;
};

export default function SearchFilterSort({
  searchTerm,
  onSearchChange,
  sortOptions,
  sortBy,
  sortDirection,
  onSortChange,
  filterOptions,
  activeFilters,
  onFilterChange,
  onClearFilters,
  placeholder = "Search...",
  totalItems,
  filteredItems,
}: SearchFilterSortProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const activeFiltersCount = Object.values(activeFilters).filter(Boolean).length;

  const currentSortOption = sortOptions.find(opt => opt.key === sortBy);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search and Controls Row */}
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1 sm:flex-initial">
            <Select
              value={sortBy}
              onValueChange={(value) => onSortChange(value, sortDirection)}
            >
              <SelectTrigger className="flex-1 sm:w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 flex-shrink-0"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Filter Control */}
          {filterOptions.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-80" align="end" side="bottom">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearFilters}
                      className="h-auto p-1 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                
                {filterOptions.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs font-medium">{filter.label}</Label>
                    <Select
                      value={activeFilters[filter.key] || ""}
                      onValueChange={(value) => onFilterChange(filter.key, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All {filter.label.toLowerCase()}</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        </div>
      </div>

      {/* Active Filters and Results Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Filter Badges */}
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filterOptions.find(f => f.key === key);
            const option = filter?.options.find(o => o.value === value);
            if (!option) return null;
            
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter?.label}: {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange(key, "")}
                  className="h-auto p-0 text-xs hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          
          {/* Search Term Badge */}
          {searchTerm.trim() && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="h-auto p-0 text-xs hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
        
        {/* Results Count */}
        <div className="text-xs sm:text-sm order-first sm:order-last">
          {searchTerm || activeFiltersCount > 0 ? (
            <>Showing {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} items</>
          ) : (
            <>Total: {totalItems.toLocaleString()} items</>
          )}
          {currentSortOption && (
            <span className="hidden sm:inline"> • Sorted by {currentSortOption.label} ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})</span>
          )}
        </div>
      </div>
    </div>
  );
}