import { apiClient } from './client';

// 站点设置类型枚举
export const SiteSettingType = {
  Text: 0,
  Number: 1,
  Boolean: 2,
  Json: 3,
  File: 4,
  Color: 5,
  RichText: 6
} as const;
export type SiteSettingType = typeof SiteSettingType[keyof typeof SiteSettingType];

// 用户状态枚举（与后端保持一致）
export const UserStatus = {
  Pending: 0,
  Active: 1,
  Disabled: 2,
  Deleted: 3
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// 帖子状态枚举（与后端保持一致）
export const PostStatus = {
  Draft: 0,
  Published: 1,
  Locked: 2,
  Pinned: 3,
  Deleted: 4
} as const;
export type PostStatus = typeof PostStatus[keyof typeof PostStatus];

// 站点设置接口
export interface SiteSetting {
  id: number;
  key: string;
  value?: string;
  type: SiteSettingType;
  typeName: string;
  name: string;
  description?: string;
  group?: string;
  isPublic: boolean;
  sort: number;
  isEnabled: boolean;
  defaultValue?: string;
  validationRules?: string;
  options?: string;
  createdAt: string;
  updatedAt: string;
  updatedByName?: string;
}

// 更新站点设置接口
export interface UpdateSiteSetting {
  key: string;
  value?: string;
  type: SiteSettingType;
  name: string;
  description?: string;
  group?: string;
  isPublic: boolean;
  sort: number;
  isEnabled: boolean;
  defaultValue?: string;
  validationRules?: string;
  options?: string;
}

// 站点概览接口
export interface SiteOverview {
  userStats: UserStats;
  postStats: PostStats;
  systemStats: SystemStats;
  recentActivity: RecentActivity;
}

// 站点基础统计接口 - 用于首页显示
export interface SiteStats {
  totalUsers: number;
  onlineUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  newPostsToday: number;
  newUsersToday: number;
  recentActiveUsers: number;
  generatedAt: string;
}

// 系统信息接口
export interface SystemInfo {
  uptime: number;
  memoryUsage: number;
  totalMemory: number;
  cpuUsage: number;
  databaseSize: number;
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  storageUsagePercent: number;
  extensionCount: number;
  activeExtensionCount: number;
  operatingSystem: string;
  dotNetVersion: string;
  applicationVersion: string;
  serverTime: string;
  timeZone: string;
  startupTime: string;
  gcInfo: GcInfo;
}

// GC信息接口
export interface GcInfo {
  gen0Collections: number;
  gen1Collections: number;
  gen2Collections: number;
  totalAllocatedBytes: number;
}

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  onlineUsers: number;
  recentNewUsers: Record<string, number>;
  userStatusDistribution: Record<string, number>;
}

export interface PostStats {
  totalPosts: number;
  newPostsToday: number;
  totalComments: number;
  newCommentsToday: number;
  recentPosts: Record<string, number>;
  categoryDistribution: Record<string, number>;
  popularTags: Record<string, number>;
}

export interface SystemStats {
  totalStorage: number;
  usedStorage: number;
  databaseSize: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  extensionCount: number;
  activeExtensionCount: number;
}

export interface RecentActivity {
  recentRegistrations: UserActivity[];
  recentPosts: PostActivity[];
  recentComments: CommentActivity[];
  systemEvents: SystemEvent[];
}

export interface UserActivity {
  id: number;
  username: string;
  email?: string;
  createdAt: string;
  status: string;
}

export interface PostActivity {
  id: number;
  title: string;
  authorName: string;
  categoryName: string;
  createdAt: string;
  viewCount: number;
}

export interface CommentActivity {
  id: number;
  content: string;
  authorName: string;
  postTitle: string;
  createdAt: string;
}

export interface SystemEvent {
  type: string;
  message: string;
  timestamp: string;
  level: string;
}

// 用户管理接口
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  statusName: string;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
  stats?: AdminUserStats;
}

export interface AdminUserStats {
  postCount: number;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  score: number;
  level: number;
  lastActiveAt: string;
}

export interface AdminUserQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus;
  role?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UpdateUserStatus {
  status: UserStatus;
  remark?: string;
}

export interface UpdateUserRoles {
  roleIds: number[];
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  roleIds: number[];
  remark?: string;
}

export interface UpdateUser {
  username: string;
  email: string;
  newPassword?: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  roleIds: number[];
  remark?: string;
}


// 移除重复的标签接口定义

// 通用分页结果接口 - 与后端PagedResult<T>结构保持一致
export interface PagedResult<T> {
  data: T[];  // 后端使用Data属性存储列表数据
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// 帖子管理相关接口
export interface PostAuthor {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface PostTag {
  id: number;
  name: string;
  color?: string;
  useCount: number;
}

export interface AdminPost {
  id: number;
  title: string;
  summary?: string;
  author: PostAuthor;
  category?: PostCategory;
  tags: PostTag[];
  status: PostStatus;
  statusName: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isSticky: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: PostStatus;
  categoryId?: number;
  authorId?: number;
  tag?: string;
  isSticky?: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UpdatePostStatus {
  status: PostStatus;
  remark?: string;
}

export interface BatchPostOperation {
  postIds: number[];
  operation: string;
  parameters?: string;
}

// 标签管理相关接口
export interface AdminTag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  useCount: number;
  isPermanent: boolean;
  priority: number;
  createdBy?: number;
  creatorName?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreateTag {
  name: string;
  color?: string;
  isPermanent?: boolean;
  priority?: number;
}

export interface UpdateTag {
  name: string;
  color?: string;
  priority?: number;
}

export interface AdminTagQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isPermanent?: boolean;
  minUseCount?: number;
  createdBy?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface TagStats {
  totalTags: number;
  permanentTags: number;
  dynamicTags: number;
  unusedTags: number;
  tagsToClean: number;
  topTags: AdminTag[];
  recentTags: AdminTag[];
}

// Admin API类
export class AdminApi {
  // 站点概览
  static async getSiteOverview(): Promise<SiteOverview> {
    const response = await apiClient.get('/api/admin/overview');
    return response.data.data;
  }

  // 站点基础统计 - 用于首页显示
  static async getSiteStats(): Promise<SiteStats> {
    const response = await apiClient.get('/api/admin/stats');
    return response.data.data;
  }

  // 系统信息
  static async getSystemInfo(): Promise<SystemInfo> {
    const response = await apiClient.get('/api/admin/system-info');
    return response.data.data;
  }

  // 站点设置
  static async getSiteSettings(group?: string): Promise<SiteSetting[]> {
    const response = await apiClient.get('/api/admin/settings', { params: { group } });
    return response.data.data;
  }

  static async getSiteSettingsByGroup(): Promise<Record<string, SiteSetting[]>> {
    const response = await apiClient.get('/api/admin/settings/grouped');
    return response.data.data;
  }

  static async getSiteSetting(key: string): Promise<SiteSetting> {
    const response = await apiClient.get(`/api/admin/settings/${key}`);
    return response.data.data;
  }

  static async updateSiteSetting(key: string, dto: UpdateSiteSetting): Promise<SiteSetting> {
    const response = await apiClient.put(`/api/admin/settings/${key}`, dto);
    return response.data.data;
  }

  static async batchUpdateSiteSettings(settings: Record<string, string>): Promise<SiteSetting[]> {
    const response = await apiClient.put('/api/admin/settings', settings);
    return response.data.data;
  }

  static async createSiteSetting(dto: UpdateSiteSetting): Promise<SiteSetting> {
    const response = await apiClient.post('/api/admin/settings', dto);
    return response.data.data;
  }

  static async deleteSiteSetting(key: string): Promise<boolean> {
    const response = await apiClient.delete(`/api/admin/settings/${key}`);
    return response.data.data;
  }

  // 用户管理
  static async getUsers(query: AdminUserQuery = {}): Promise<PagedResult<AdminUser>> {
    const response = await apiClient.get('/api/admin/users', { params: query });
    return response.data.data;
  }

  static async getUser(userId: number): Promise<AdminUser> {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data.data;
  }

  static async createUser(dto: CreateUser): Promise<AdminUser> {
    const response = await apiClient.post('/api/admin/users', dto);
    return response.data.data;
  }

  static async updateUser(userId: number, dto: UpdateUser): Promise<AdminUser> {
    const response = await apiClient.put(`/api/admin/users/${userId}`, dto);
    return response.data.data;
  }

  static async updateUserStatus(userId: number, dto: UpdateUserStatus): Promise<boolean> {
    const response = await apiClient.put(`/api/admin/users/${userId}/status`, dto);
    return response.data.data;
  }

  static async updateUserRoles(userId: number, dto: UpdateUserRoles): Promise<boolean> {
    const response = await apiClient.put(`/api/admin/users/${userId}/roles`, dto);
    return response.data.data;
  }

  static async deleteUser(userId: number): Promise<boolean> {
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return response.data.data;
  }

  // 标签管理
  static async getTags(query: AdminTagQuery = {}): Promise<PagedResult<AdminTag>> {
    const response = await apiClient.get('/api/admin/tags', { params: query });
    return response.data.data;
  }

  static async getTagStats(): Promise<TagStats> {
    const response = await apiClient.get('/api/admin/tags/stats');
    return response.data.data;
  }

  static async getTag(tagId: number): Promise<AdminTag> {
    const response = await apiClient.get(`/api/admin/tags/${tagId}`);
    return response.data.data;
  }

  static async createTag(dto: CreateTag): Promise<AdminTag> {
    const response = await apiClient.post('/api/admin/tags', dto);
    return response.data.data;
  }

  static async updateTag(tagId: number, dto: UpdateTag): Promise<AdminTag> {
    const response = await apiClient.put(`/api/admin/tags/${tagId}`, dto);
    return response.data.data;
  }

  static async deleteTag(tagId: number): Promise<boolean> {
    const response = await apiClient.delete(`/api/admin/tags/${tagId}`);
    return response.data.data;
  }

  static async mergeTags(sourceTagId: number, targetTagId: number): Promise<boolean> {
    const response = await apiClient.post(`/api/admin/tags/${sourceTagId}/merge/${targetTagId}`);
    return response.data.data;
  }

  static async cleanupUnusedTags(): Promise<number> {
    const response = await apiClient.post('/api/admin/tags/cleanup');
    return response.data.data;
  }

  static async batchDeleteTags(tagIds: number[]): Promise<number> {
    const response = await apiClient.post('/api/admin/tags/batch-delete', tagIds);
    return response.data.data;
  }

  static async updateTagPriority(tagId: number, priority: number): Promise<AdminTag> {
    const response = await apiClient.put(`/api/admin/tags/${tagId}/priority`, { priority });
    return response.data.data;
  }

  static async batchUpdateTagPriorities(tagPriorities: Array<{ id: number; priority: number }>): Promise<boolean> {
    const response = await apiClient.put('/api/admin/tags/batch-priority', tagPriorities);
    return response.data.data;
  }

  // 帖子管理
  static async getPosts(query: AdminPostQuery = {}): Promise<PagedResult<AdminPost>> {
    const response = await apiClient.get('/api/admin/posts', { params: query });
    return response.data.data;
  }

  static async getPost(postId: number): Promise<AdminPost> {
    const response = await apiClient.get(`/api/admin/posts/${postId}`);
    return response.data.data;
  }

  static async updatePostStatus(postId: number, dto: UpdatePostStatus): Promise<boolean> {
    const response = await apiClient.put(`/api/admin/posts/${postId}/status`, dto);
    return response.data.data;
  }

  static async batchOperatePosts(dto: BatchPostOperation): Promise<number> {
    const response = await apiClient.post('/api/admin/posts/batch', dto);
    return response.data.data;
  }

  static async deletePost(postId: number): Promise<boolean> {
    const response = await apiClient.delete(`/api/admin/posts/${postId}`);
    return response.data.data;
  }

  static async updatePostTags(postId: number, tagIds: number[]): Promise<boolean> {
    const response = await apiClient.put(`/api/admin/posts/${postId}/tags`, tagIds);
    return response.data.data;
  }
}

// 导出默认实例
export const adminApi = AdminApi;
