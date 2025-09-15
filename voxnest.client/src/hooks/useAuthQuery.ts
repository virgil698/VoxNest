import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '../lib/queryClient';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

// 使用现有的类型定义
import type { User } from '../types/auth';

// 扩展用户信息类型
export interface ExtendedUser extends User {
  profile?: {
    displayName?: string;
    bio?: string;
    website?: string;
    location?: string;
  };
  isActive?: boolean;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
}

// 获取当前用户信息 Hook
export function useCurrentUserQuery(enabled: boolean = true) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<ExtendedUser> => {
      const response = await api.get<ExtendedUser>('/auth/me');
      return response.data.data!;
    },
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10分钟
    gcTime: 1000 * 60 * 30, // 30分钟
    retry: (failureCount, error: unknown) => {
      // 401错误不重试（认证失效）
      const errorWithResponse = error as { response?: { status?: number } };
      if (errorWithResponse?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// 登录 Hook
export function useLoginMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<{ token: string; user: User }> => {
      const response = await api.post<{ token: string; user: User }>('/auth/login', credentials);
      return response.data.data!;
    },
    onSuccess: (data) => {
      // 更新认证状态
      setAuth(data.token, data.user);
      
      // 设置用户数据到查询缓存
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      
      message.success(`欢迎回来，${data.user.username}！`);
      
      // 重定向到首页
      navigate('/', { replace: true });
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    },
  });
}

// 注册 Hook
export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (userData: RegisterRequest): Promise<{ message: string }> => {
      const response = await api.post<{ message: string }>('/auth/register', userData);
      return response.data.data!;
    },
    onSuccess: (data) => {
      message.success(data.message || '注册成功！请登录');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '注册失败，请重试';
      message.error(errorMessage);
    },
  });
}

// 退出登录 Hook
export function useLogoutMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      // 清除认证状态
      logout();
      
      // 清除相关缓存数据
      queryClient.removeQueries({ queryKey: queryKeys.auth.user });
      queryClient.removeQueries({ queryKey: queryKeys.auth.profile });
      
      // 无效化需要认证的查询
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          // 无效化所有可能包含用户特定数据的查询
          return query.queryKey.includes('user-specific') || 
                 query.queryKey.includes('admin') ||
                 query.queryKey.includes('my-');
        }
      });
      
      message.success('已安全退出登录');
      navigate('/', { replace: true });
    },
    onError: () => {
      // 即使API调用失败，也要清除本地状态
      logout();
      queryClient.clear();
      message.success('已退出登录');
      navigate('/', { replace: true });
    },
  });
}

// 更新用户资料 Hook
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UpdateProfileRequest): Promise<ExtendedUser> => {
      const response = await api.put<ExtendedUser>('/auth/profile', profileData);
      return response.data.data!;
    },
    onMutate: async (newProfile) => {
      // 乐观更新用户信息
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.user });
      
      const previousUser = queryClient.getQueryData<ExtendedUser>(queryKeys.auth.user);
      
      if (previousUser) {
        queryClient.setQueryData<ExtendedUser>(queryKeys.auth.user, {
          ...previousUser,
          profile: {
            ...previousUser.profile,
            ...newProfile,
          },
        });
      }

      return { previousUser };
    },
    onError: (error: unknown, _, context) => {
      // 回滚乐观更新
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.user, context.previousUser);
      }
      
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '更新资料失败';
      message.error(errorMessage);
    },
    onSuccess: (updatedUser) => {
      // 更新Auth Store中的用户信息
      const { user, setAuth, token } = useAuthStore.getState();
      if (user && token) {
        setAuth(token, { ...user, ...updatedUser });
      }
      
      message.success('资料更新成功！');
    },
    onSettled: () => {
      // 重新获取用户数据以确保同步
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
}

// 修改密码 Hook
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (passwordData: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }): Promise<{ message: string }> => {
      const response = await api.put<{ message: string }>('/auth/change-password', passwordData);
      return response.data.data!;
    },
    onSuccess: (data) => {
      message.success(data.message || '密码修改成功！');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '密码修改失败';
      message.error(errorMessage);
    },
  });
}

// 忘记密码 Hook
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email: string): Promise<{ message: string }> => {
      const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
      return response.data.data!;
    },
    onSuccess: (data) => {
      message.success(data.message || '重置密码邮件已发送');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '发送重置邮件失败';
      message.error(errorMessage);
    },
  });
}

// 重置密码 Hook
export function useResetPasswordMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (resetData: {
      token: string;
      password: string;
      confirmPassword: string;
    }): Promise<{ message: string }> => {
      const response = await api.post<{ message: string }>('/auth/reset-password', resetData);
      return response.data.data!;
    },
    onSuccess: (data) => {
      message.success(data.message || '密码重置成功！');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '密码重置失败';
      message.error(errorMessage);
    },
  });
}

// 验证当前密码 Hook
export function useVerifyPasswordMutation() {
  return useMutation({
    mutationFn: async (password: string): Promise<{ valid: boolean }> => {
      const response = await api.post<{ valid: boolean }>('/auth/verify-password', { password });
      return response.data.data!;
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '密码验证失败';
      message.error(errorMessage);
    },
  });
}

// 自定义Hook：认证状态检查
export function useAuthStatus() {
  const { isAuthenticated, user } = useAuthStore();
  const userQuery = useCurrentUserQuery(isAuthenticated);

  return {
    isAuthenticated,
    user: userQuery.data || user,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error,
    refetch: userQuery.refetch,
    
    // 权限检查辅助函数
    hasRole: (role: string) => {
      const currentUser = userQuery.data || user;
      return currentUser?.roles?.includes(role) || false;
    },
    
    isAdmin: () => {
      const currentUser = userQuery.data || user;
      return currentUser?.roles?.includes('Admin') || false;
    },
    
    isModerator: () => {
      const currentUser = userQuery.data || user;
      return currentUser?.roles?.includes('Moderator') || currentUser?.roles?.includes('Admin') || false;
    },
  };
}
