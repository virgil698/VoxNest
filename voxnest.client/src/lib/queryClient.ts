import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

// 默认查询配置
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // 数据被认为是新鲜的时间（5分钟）
    staleTime: 1000 * 60 * 5,
    // 缓存时间（30分钟） 
    gcTime: 1000 * 60 * 30,
    // 重试配置
    retry: (failureCount, error: unknown) => {
      // 不重试4xx错误
      const errorWithResponse = error as { response?: { status?: number } };
      if (errorWithResponse?.response?.status && errorWithResponse.response.status >= 400 && errorWithResponse.response.status < 500) {
        return false;
      }
      // 最多重试3次
      return failureCount < 3;
    },
    // 重试延迟（指数退避）
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // 窗口重新获得焦点时重新获取数据
    refetchOnWindowFocus: true,
    // 重新连接时重新获取数据
    refetchOnReconnect: true,
    // 默认不在组件挂载时重新获取数据（因为有staleTime）
    refetchOnMount: false,
  },
  mutations: {
    // 失败时重试1次
    retry: 1,
  },
};

// 创建QueryClient实例
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// 查询键工厂 - 统一管理查询键
export const queryKeys = {
  // 认证相关
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
  },
  
  // 帖子相关
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
  },
  
  // 分类相关
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.categories.all, 'detail', id] as const,
  },
  
  // 管理相关
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    logs: () => [...queryKeys.admin.all, 'logs'] as const,
  },
  
  // 站点统计
  site: {
    stats: ['site', 'stats'] as const,
    settings: ['site', 'settings'] as const,
  },
} as const;

// 无效化查询的辅助函数
export const invalidateQueries = {
  // 无效化所有帖子查询
  posts: () => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  // 无效化特定帖子列表
  postsList: (params?: Record<string, unknown>) => {
    if (params) {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list(params) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    }
  },
  // 无效化帖子详情
  postDetail: (id: number) => queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) }),
  
  // 无效化认证信息
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.user }),
  
  // 无效化管理数据
  admin: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  
  // 无效化站点统计
  siteStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.site.stats }),
};
