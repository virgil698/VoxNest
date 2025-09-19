import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import type { SearchFilters } from '../api/search';

export interface UseSearchOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
  staleTime?: number;
}

export const useSearch = (query: string, filters: SearchFilters = {}, options: UseSearchOptions = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000 // 5分钟
  } = options;

  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => searchApi.search(query, filters),
    enabled: enabled && !!query.trim(),
    staleTime
  });
};

export const useSearchSuggestions = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['searchSuggestions', query],
    queryFn: () => searchApi.getSearchSuggestions(query),
    enabled: enabled && query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: false
  });
};

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popularSearches'],
    queryFn: searchApi.getPopularSearches,
    staleTime: 60 * 60 * 1000, // 1小时
    refetchOnWindowFocus: false
  });
};

export const useSearchHistory = () => {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['searchHistory'],
    queryFn: searchApi.getSearchHistory,
    staleTime: Infinity, // 本地缓存永不过期
    refetchOnWindowFocus: false
  });

  const saveHistoryMutation = useMutation({
    mutationFn: searchApi.saveSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    }
  });

  const clearHistoryMutation = useMutation({
    mutationFn: searchApi.clearSearchHistory,
    onSuccess: () => {
      queryClient.setQueryData(['searchHistory'], []);
    }
  });

  return {
    ...historyQuery,
    saveHistory: saveHistoryMutation.mutate,
    clearHistory: clearHistoryMutation.mutate,
    isSaving: saveHistoryMutation.isPending,
    isClearing: clearHistoryMutation.isPending
  };
};

export const useSearchableCategories = () => {
  return useQuery({
    queryKey: ['searchableCategories'],
    queryFn: searchApi.getSearchableCategories,
    staleTime: 60 * 60 * 1000, // 1小时
    refetchOnWindowFocus: false
  });
};

export const useSearchableTags = () => {
  return useQuery({
    queryKey: ['searchableTags'],
    queryFn: searchApi.getSearchableTags,
    staleTime: 30 * 60 * 1000, // 30分钟
    refetchOnWindowFocus: false
  });
};

/**
 * 搜索状态管理 Hook
 */
export const useSearchState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    searchIn: 'topics_posts',
    sortBy: 'relevance',
    page: 1,
    limit: 20
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // 除了翻页操作，其他筛选都重置到第一页
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchIn: 'topics_posts',
      sortBy: 'relevance',
      page: 1,
      limit: 20
    });
  }, []);

  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    toggleAdvancedFilters
  };
};

/**
 * 搜索高亮 Hook
 */
export const useSearchHighlight = () => {
  const highlightText = useCallback((text: string, searchTerms: string | string[]): React.ReactNode => {
    if (!searchTerms || !text) return text;
    
    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
    const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    
    return text.split(regex).map((part, index) => {
      const isHighlight = terms.some(term => 
        part.toLowerCase() === term.toLowerCase()
      );
      
      return isHighlight ? React.createElement('mark', {
        key: index,
        style: {
          backgroundColor: '#fff3cd',
          padding: '0 2px',
          borderRadius: '2px',
          fontWeight: '500'
        }
      }, part) : part;
    });
  }, []);

  return { highlightText };
};

/**
 * 搜索记录保存 Hook
 */
export const useSearchLogger = () => {
  const { saveHistory } = useSearchHistory();

  const logSearch = useCallback((query: string) => {
    if (query.trim().length > 0) {
      // 延迟保存，避免频繁的API调用
      const timeoutId = setTimeout(() => {
        saveHistory(query.trim());
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [saveHistory]);

  return { logSearch };
};
