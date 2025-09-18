import { api } from './client';

// 用户个人主页相关的API接口

// 用户资料DTO接口
export interface UserProfileDto {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: string;
  gender?: string;
  status: number;
  createdAt: string;
  lastLoginAt?: string;
  roles: string[];
  stats?: UserStatsDto;
}

// 用户统计信息DTO接口
export interface UserStatsDto {
  postCount: number;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  followerCount: number;
  followingCount: number;
  score: number;
  level: number;
  experience: number;
  continuousSignInDays: number;
  lastSignInAt?: string;
  lastActiveAt: string;
}

// 用户最近活动DTO接口
export interface UserRecentActivityDto {
  id: number;
  type: string;
  description: string;
  link?: string;
  createdAt: string;
}

// 用户最近帖子DTO接口
export interface UserRecentPostDto {
  id: number;
  title: string;
  summary?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  tags: string[];
}

// 用户个人主页完整信息DTO接口
export interface UserProfilePageDto {
  profile: UserProfileDto;
  recentActivities: UserRecentActivityDto[];
  recentPosts: UserRecentPostDto[];
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 根据用户名获取用户个人主页信息
 */
export const getUserProfile = async (username: string): Promise<UserProfilePageDto> => {
  const response = await api.get<ApiResponse<UserProfilePageDto>>(`/api/UserProfile/${username}`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取用户资料失败');
  }
  
  return (response.data.data as unknown) as UserProfilePageDto;
};

/**
 * 根据用户ID获取用户个人主页信息
 */
export const getUserProfileById = async (userId: number): Promise<UserProfilePageDto> => {
  const response = await api.get<ApiResponse<UserProfilePageDto>>(`/api/UserProfile/id/${userId}`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取用户资料失败');
  }
  
  return (response.data.data as unknown) as UserProfilePageDto;
};

/**
 * 获取用户最近活动
 */
export const getUserRecentActivities = async (userId: number, limit: number = 10): Promise<UserRecentActivityDto[]> => {
  const response = await api.get<ApiResponse<UserRecentActivityDto[]>>(`/api/UserProfile/${userId}/activities`, {
    params: { limit }
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取用户活动失败');
  }
  
  return (response.data.data as unknown) as UserRecentActivityDto[];
};

/**
 * 获取用户最近帖子
 */
export const getUserRecentPosts = async (userId: number, limit: number = 10): Promise<UserRecentPostDto[]> => {
  const response = await api.get<ApiResponse<UserRecentPostDto[]>>(`/api/UserProfile/${userId}/posts`, {
    params: { limit }
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取用户帖子失败');
  }
  
  return (response.data.data as unknown) as UserRecentPostDto[];
};
