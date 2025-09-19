import { apiClient } from './client';

export interface SearchFilters {
  searchIn?: 'topics_posts' | 'categories_tags' | 'users';
  sortBy?: 'relevance' | 'latest_post' | 'latest_topic' | 'most_liked' | 'most_viewed';
  category?: string;
  tags?: string[];
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  minReplies?: number;
  minViews?: number;
  minLikes?: number;
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'post' | 'topic' | 'user' | 'category';
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  viewCount?: number;
  likeCount?: number;
  url: string;
  highlight?: {
    title?: string[];
    content?: string[];
  };
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchTime: number; // 搜索耗时（毫秒）
  suggestions?: string[]; // 搜索建议
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'user' | 'category' | 'tag';
  count?: number;
}

class SearchApi {
  /**
   * 执行搜索
   */
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters.searchIn) params.append('searchIn', filters.searchIn);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.category) params.append('category', filters.category);
    if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters.author) params.append('author', filters.author);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.minReplies) params.append('minReplies', filters.minReplies.toString());
    if (filters.minViews) params.append('minViews', filters.minViews.toString());
    if (filters.minLikes) params.append('minLikes', filters.minLikes.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/search?${params.toString()}`);
    return response.data;
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const response = await apiClient.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * 获取热门搜索关键词
   */
  async getPopularSearches(): Promise<string[]> {
    const response = await apiClient.get('/search/popular');
    return response.data;
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(): Promise<string[]> {
    const response = await apiClient.get('/search/history');
    return response.data;
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(query: string): Promise<void> {
    await apiClient.post('/search/history', { query });
  }

  /**
   * 清除搜索历史
   */
  async clearSearchHistory(): Promise<void> {
    await apiClient.delete('/search/history');
  }

  /**
   * 获取分类列表（用于筛选）
   */
  async getSearchableCategories(): Promise<Array<{id: string; name: string; color: string; priority?: number}>> {
    const response = await apiClient.get('/search/categories');
    return response.data;
  }

  /**
   * 获取标签列表（用于筛选）
   */
  async getSearchableTags(): Promise<Array<{id: string; name: string; count: number}>> {
    const response = await apiClient.get('/search/tags');
    return response.data;
  }
}

export const searchApi = new SearchApi();
