import { api } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/auth';

export const authApi = {
  // 用户登录
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  // 用户注册
  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  // 用户注销
  logout: () =>
    api.post('/auth/logout'),

  // 检查用户名是否可用
  checkUsername: (username: string) =>
    api.get<{ username: string; available: boolean }>(`/auth/check-username/${username}`),

  // 检查邮箱是否可用
  checkEmail: (email: string) =>
    api.get<{ email: string; available: boolean }>(`/auth/check-email?email=${email}`),
};
