import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login(credentials);
          
          if (response.data.success && response.data.data) {
            const { accessToken, user } = response.data.data;
            
            // 存储到localStorage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('user_info', JSON.stringify(user));
            
            set({
              user,
              token: accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.message || '登录失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          
          // 构建详细的错误信息
          const errorInfo = {
            status: error.response?.status || 'UNKNOWN',
            statusText: error.response?.statusText || '未知错误',
            message: error.response?.data?.message || error.message || '登录失败',
            errorCode: error.response?.data?.errorCode || 'UNKNOWN_ERROR',
            details: error.response?.data?.details || '',
            traceId: error.response?.data?.traceId || '',
          };
          
          // 抛出包含完整错误信息的错误
          const enhancedError = new Error(errorInfo.message);
          (enhancedError as any).errorInfo = errorInfo;
          throw enhancedError;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true });
          const response = await authApi.register(data);
          
          if (response.data.success) {
            set({ isLoading: false });
            // 注册成功，不自动登录，让用户手动登录
          } else {
            throw new Error(response.data.message || '注册失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          
          // 构建详细的错误信息
          const errorInfo = {
            status: error.response?.status || 'UNKNOWN',
            statusText: error.response?.statusText || '未知错误',
            message: error.response?.data?.message || error.message || '注册失败',
            errorCode: error.response?.data?.errorCode || 'UNKNOWN_ERROR',
            details: error.response?.data?.details || '',
            traceId: error.response?.data?.traceId || '',
          };
          
          // 抛出包含完整错误信息的错误
          const enhancedError = new Error(errorInfo.message);
          (enhancedError as any).errorInfo = errorInfo;
          throw enhancedError;
        }
      },

      logout: () => {
        // 调用API注销（可选）
        authApi.logout().catch(console.error);
        
        // 清除本地存储
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          const response = await authApi.getCurrentUser();
          
          if (response.data.success && response.data.data) {
            const user = response.data.data;
            
            // 更新localStorage中的用户信息
            localStorage.setItem('user_info', JSON.stringify(user));
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('获取用户信息失败');
          }
        } catch (error: any) {
          // 如果获取用户信息失败，可能是token过期，执行注销
          get().logout();
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
