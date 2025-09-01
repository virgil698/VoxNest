// 用户状态枚举
export const UserStatus = {
  Pending: 0,
  Active: 1,
  Disabled: 2,
  Deleted: 3,
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// 用户信息类型
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  roles: string[];
}

// 登录请求类型
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 登录响应类型
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
