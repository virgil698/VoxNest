import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { message } from 'antd';
import { api } from '../api/client';
import type { Post, PostListParams } from './usePostsQuery';

// 无限滚动帖子列表的响应类型
export interface InfinitePostsResponse {
  posts: Post[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 无限滚动帖子列表 Hook
export function useInfinitePostsQuery(params: Omit<PostListParams, 'pageNumber'> = {}) {
  const defaultParams = {
    pageSize: 10,
    sortBy: 'created' as const,
    sortOrder: 'desc' as const,
    ...params
  };

  const query = useInfiniteQuery({
    queryKey: ['posts', 'infinite', defaultParams],
    queryFn: async ({ pageParam = 1 }): Promise<InfinitePostsResponse> => {
      const response = await api.get<InfinitePostsResponse>('/posts', {
        params: { ...defaultParams, pageNumber: pageParam }
      });
      return response.data.data!;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // 2分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });

  // 获取平铺的帖子列表
  const posts = query.data?.pages.flatMap(page => page.posts) || [];
  
  // 总数量（从第一页获取）
  const totalCount = query.data?.pages[0]?.totalCount || 0;

  return {
    ...query,
    posts,
    totalCount,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

// 无限滚动Hook工厂
export function useInfiniteScroll(
  queryResult: UseInfiniteQueryResult<unknown, Error>,
  options?: {
    threshold?: number; // 触发加载的像素阈值
    enabled?: boolean;  // 是否启用无限滚动
    onError?: (error: Error) => void;
  }
) {
  const { threshold = 200, enabled = true, onError } = options || {};
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 创建观察者的回调
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage().catch(error => {
        if (onError) {
          onError(error);
        } else {
          message.error('加载更多内容失败');
        }
      });
    }
  }, [queryResult, onError]);

  // 设置观察目标的ref回调
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (!enabled || queryResult.isLoading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (node) {
      observerRef.current = new IntersectionObserver(observerCallback, {
        rootMargin: `${threshold}px`,
      });
      observerRef.current.observe(node);
    }
  }, [enabled, queryResult.isLoading, observerCallback, threshold]);

  return {
    lastElementRef,
    hasNextPage: queryResult.hasNextPage,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    fetchNextPage: () => queryResult.fetchNextPage(),
  };
}

// 虚拟滚动Hook（用于大量数据的性能优化）
export function useVirtualScroll<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  const getVisibleItems = useCallback((scrollTop: number) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleCount + overscan * 2
    );

    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    }));

    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, visibleCount, overscan]);

  return {
    totalHeight,
    visibleCount,
    getVisibleItems,
  };
}

// 滚动位置恢复Hook
export function useScrollRestoration(key: string) {
  const scrollPositions = useRef<Record<string, number>>({});

  const saveScrollPosition = useCallback((position: number) => {
    scrollPositions.current[key] = position;
  }, [key]);

  const restoreScrollPosition = useCallback(() => {
    return scrollPositions.current[key] || 0;
  }, [key]);

  const clearScrollPosition = useCallback(() => {
    delete scrollPositions.current[key];
  }, [key]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}

// 懒加载图片Hook
export function useLazyImages() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lazyImageRef = useCallback((node: HTMLImageElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.getAttribute('data-src');
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );
      observerRef.current.observe(node);
    }
  }, []);

  return { lazyImageRef };
}

// 分页Hook（传统分页）
export function usePagination(
  totalCount: number,
  pageSize: number = 10
) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageInfo = useCallback((currentPage: number) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    
    return {
      startIndex,
      endIndex,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
    };
  }, [totalCount, pageSize, totalPages]);

  return {
    totalPages,
    getPageInfo,
  };
}
