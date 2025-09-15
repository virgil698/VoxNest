import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { api } from '../api/client';

// 站点统计相关类型
export interface SiteStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  totalViews: number;
  todayPosts: number;
  todayUsers: number;
  todayViews: number;
  onlineUsers: number;
  lastUpdated: string;
}

export interface RealtimeStats {
  activeUsers: number;
  activeSessions: number;
  currentPageViews: number;
  recentActivities: Array<{
    type: 'post' | 'comment' | 'like' | 'view';
    userId?: number;
    username?: string;
    postId?: number;
    postTitle?: string;
    timestamp: string;
  }>;
}

// 获取站点统计数据 Hook
export function useSiteStatsQuery() {
  return useQuery({
    queryKey: queryKeys.site.stats,
    queryFn: async (): Promise<SiteStats> => {
      const response = await api.get<SiteStats>('/site/stats');
      return response.data.data!;
    },
    // 数据被认为新鲜的时间（30秒）
    staleTime: 1000 * 30,
    // 缓存时间（5分钟）
    gcTime: 1000 * 60 * 5,
    // 启用后台自动刷新
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // 每5分钟轮询一次更新（降低频率）
    refetchInterval: 1000 * 60 * 5,
    // 只有在窗口可见时才轮询
    refetchIntervalInBackground: false,
  });
}

// 获取实时统计数据 Hook（高频轮询）
export function useRealtimeStatsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ['site', 'realtime-stats'],
    queryFn: async (): Promise<RealtimeStats> => {
      const response = await api.get<RealtimeStats>('/site/realtime-stats');
      return response.data.data!;
    },
    enabled,
    // 实时数据立即过期
    staleTime: 0,
    // 缓存时间很短（1分钟）
    gcTime: 1000 * 60,
    // 中频轮询（每30秒更新一次，降低服务器压力）
    refetchInterval: 1000 * 30,
    // 只在窗口可见时轮询（降低后台负载）
    refetchIntervalInBackground: false,
    // 失败后继续重试
    retry: (failureCount, error: unknown) => {
      // 如果是网络错误或服务器错误，继续重试
      const errorWithResponse = error as { response?: { status?: number } };
      if ((errorWithResponse?.response?.status && errorWithResponse.response.status >= 500) || !errorWithResponse?.response) {
        return failureCount < 5;
      }
      return false;
    },
    // 重试间隔短一些
    retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 5000),
  });
}

// 获取站点设置 Hook
export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.site.settings,
    queryFn: async (): Promise<Record<string, unknown>> => {
      const response = await api.get<Record<string, unknown>>('/site/settings');
      return response.data.data!;
    },
    // 站点设置变化不频繁，缓存时间长一些
    staleTime: 1000 * 60 * 30, // 30分钟
    gcTime: 1000 * 60 * 60 * 2, // 2小时
    // 不需要自动刷新
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// 自定义Hook：动态控制轮询
export function useAdaptiveStatsQuery() {
  return useQuery({
    queryKey: ['site', 'adaptive-stats'],
    queryFn: async (): Promise<SiteStats> => {
      const response = await api.get<SiteStats>('/site/stats');
      return response.data.data!;
    },
    staleTime: 1000 * 60, // 1分钟
    // 动态轮询间隔：根据用户活跃度调整
    refetchInterval: (query) => {
      // 如果查询失败过，降低轮询频率
      if (query.state.errorUpdateCount > 0) {
        return 1000 * 60 * 5; // 5分钟
      }
      
      // 如果数据很新，轮询慢一些
      const data = query.state.data as SiteStats | undefined;
      const lastUpdated = data?.lastUpdated;
      if (lastUpdated) {
        const timeDiff = Date.now() - new Date(lastUpdated).getTime();
        if (timeDiff < 1000 * 60 * 5) { // 5分钟内更新过
          return 1000 * 60 * 2; // 2分钟轮询
        }
      }
      
      // 默认1分钟轮询
      return 1000 * 60;
    },
  });
}
