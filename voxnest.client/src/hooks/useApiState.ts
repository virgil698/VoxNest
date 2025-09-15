import { type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';
import { message } from 'antd';

// API状态类型定义
export interface ApiState {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  isStale: boolean;
}

export interface ApiActions {
  retry: () => void;
  refresh: () => void;
  clearError: () => void;
}

// 通用API状态Hook
export function useApiState<TData = unknown, TError = unknown>(
  query: UseQueryResult<TData, TError>
): ApiState & ApiActions {
  const clearError = useCallback(() => {
    query.refetch();
  }, [query]);

  const retry = useCallback(() => {
    query.refetch();
  }, [query]);

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    // 状态
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isStale: query.isStale,
    
    // 操作
    retry,
    refresh,
    clearError,
  };
}

// Mutation状态Hook
export function useMutationState<TData = unknown, TError = unknown, TVariables = unknown>(
  mutation: UseMutationResult<TData, TError, TVariables>
) {
  return {
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isIdle: mutation.isIdle,
    data: mutation.data,
    reset: mutation.reset,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  };
}

// 错误处理Hook
export function useErrorHandler() {
  const showError = useCallback((error: unknown, defaultMessage: string = '操作失败') => {
    const errorWithMessage = error as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage = errorWithMessage?.response?.data?.message || errorWithMessage?.message || defaultMessage;
    message.error(errorMessage);
  }, []);

  const handleNetworkError = useCallback((error: unknown) => {
    const errorWithResponse = error as { response?: { status?: number } };
    if (!errorWithResponse?.response) {
      message.error('网络连接失败，请检查网络状态');
      return;
    }

    const status = errorWithResponse.response?.status;
    switch (status) {
      case 400:
        message.error('请求参数错误');
        break;
      case 401:
        message.error('未授权访问，请重新登录');
        break;
      case 403:
        message.error('权限不足');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 429:
        message.error('请求过于频繁，请稍后重试');
        break;
      case 500:
        message.error('服务器内部错误');
        break;
      case 502:
        message.error('网关错误');
        break;
      case 503:
        message.error('服务暂时不可用');
        break;
      default:
        message.error(`请求失败 (${status})`);
    }
  }, []);

  return {
    showError,
    handleNetworkError,
  };
}

// 加载状态Hook
export function useLoadingState() {
  const showLoading = useCallback((text: string = '加载中...') => {
    const hide = message.loading(text, 0);
    return hide;
  }, []);

  return {
    showLoading,
  };
}

// 数据新鲜度检查Hook
export function useDataFreshness<T>(data: T, lastUpdated?: string, staleThreshold: number = 5 * 60 * 1000) {
  const isStale = useCallback(() => {
    if (!lastUpdated) return true;
    
    const updateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    
    return (now - updateTime) > staleThreshold;
  }, [lastUpdated, staleThreshold]);

  const getAgeInMinutes = useCallback(() => {
    if (!lastUpdated) return null;
    
    const updateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    
    return Math.floor((now - updateTime) / (1000 * 60));
  }, [lastUpdated]);

  return {
    isStale: isStale(),
    ageInMinutes: getAgeInMinutes(),
    hasData: data !== undefined && data !== null,
  };
}

// 离线状态检测Hook
export function useOnlineStatus() {
  const isOnline = navigator.onLine;

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

// 组合Hook：完整的API状态管理
export function useApiStateManagement<TData = unknown, TError = unknown>(
  query: UseQueryResult<TData, TError>,
  options?: {
    showErrorMessage?: boolean;
    staleThreshold?: number;
  }
) {
  const apiState = useApiState(query);
  const { showError, handleNetworkError } = useErrorHandler();
  const { showLoading } = useLoadingState();
  const dataFreshness = useDataFreshness(
    query.data, 
    (query.data as { lastUpdated?: string })?.lastUpdated, 
    options?.staleThreshold
  );
  const { isOnline } = useOnlineStatus();

  // 自动显示错误消息
  if (options?.showErrorMessage && apiState.isError && apiState.error) {
    handleNetworkError(apiState.error);
  }

  return {
    ...apiState,
    ...dataFreshness,
    isOnline,
    isOffline: !isOnline,
    // 辅助方法
    showError: (message?: string) => showError(apiState.error, message),
    showLoading,
    // 数据状态判断
    isEmpty: !query.data || (Array.isArray(query.data) && query.data.length === 0),
    hasData: !!query.data,
    isLoadingInitial: query.isLoading && !query.data,
    isLoadingMore: query.isFetching && !!query.data,
  };
}
