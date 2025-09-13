/**
 * 插件管理 API
 */

import { apiClient } from './client';
import type { PagedResult } from './admin';

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// 枚举定义
export const PluginStatus = {
  Uploading: 0,
  Uploaded: 1,
  Installed: 2,
  Enabled: 3,
  Disabled: 4,
  InstallFailed: 5,
  Error: 6,
  Uninstalled: 7
} as const;

export type PluginStatus = typeof PluginStatus[keyof typeof PluginStatus];

export const PluginType = {
  Feature: 0,
  Component: 1,
  Integration: 2,
  Tool: 3
} as const;

export type PluginType = typeof PluginType[keyof typeof PluginType];

// 接口定义
export interface Plugin {
  id: number;
  uniqueId: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  type: PluginType;
  status: PluginStatus;
  fileSize: number;
  config?: string;
  dependencies?: string;
  minVoxNestVersion?: string;
  maxVoxNestVersion?: string;
  iconPath?: string;
  screenshots?: string;
  tags?: string;
  downloadCount: number;
  isBuiltIn: boolean;
  isVerified: boolean;
  uploadedByUserId?: number;
  uploadedByUsername?: string;
  lastError?: string;
  installedAt?: string;
  enabledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluginQuery {
  search?: string;
  status?: PluginStatus;
  type?: PluginType;
  isBuiltIn?: boolean;
  isVerified?: boolean;
  tags?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreatePlugin {
  uniqueId: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  type: PluginType;
  config?: string;
  dependencies?: string;
  minVoxNestVersion?: string;
  maxVoxNestVersion?: string;
  tags?: string;
}

export interface UpdatePlugin {
  name?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  config?: string;
  tags?: string;
  isVerified?: boolean;
}

export interface PluginStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  errorPlugins: number;
  builtInPlugins: number;
  verifiedPlugins: number;
  totalFileSize: number;
  pluginsByType: Record<string, number>;
  pluginsByStatus: Record<string, number>;
}

export interface PluginVersion {
  id: number;
  version: string;
  releaseNotes?: string;
  fileSize: number;
  isActive: boolean;
  isPrerelease: boolean;
  downloadCount: number;
  createdAt: string;
}

// API 方法
export const pluginApi = {
  // 获取插件列表
  getPlugins: (params: PluginQuery) =>
    apiClient.get<PagedResult<Plugin>>('/plugin', { params }),

  // 获取插件详情
  getPlugin: (id: number) =>
    apiClient.get<ApiResponse<Plugin>>(`/plugin/${id}`),

  // 根据唯一ID获取插件
  getPluginByUniqueId: (uniqueId: string) =>
    apiClient.get<ApiResponse<Plugin>>(`/plugin/by-unique-id/${uniqueId}`),

  // 创建插件
  createPlugin: (data: CreatePlugin) =>
    apiClient.post<ApiResponse<Plugin>>('/plugin', data),

  // 更新插件
  updatePlugin: (id: number, data: UpdatePlugin) =>
    apiClient.put<ApiResponse<Plugin>>(`/plugin/${id}`, data),

  // 上传插件
  uploadPlugin: (file: File, description?: string, tags?: string) => {
    const formData = new FormData();
    formData.append('pluginFile', file);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    
    return apiClient.post<ApiResponse<Plugin>>('/plugin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 安装插件
  installPlugin: (id: number) =>
    apiClient.post<ApiResponse<string>>(`/plugin/${id}/install`),

  // 启用插件
  enablePlugin: (id: number) =>
    apiClient.post<ApiResponse<string>>(`/plugin/${id}/enable`),

  // 禁用插件
  disablePlugin: (id: number) =>
    apiClient.post<ApiResponse<string>>(`/plugin/${id}/disable`),

  // 卸载插件
  uninstallPlugin: (id: number) =>
    apiClient.post<ApiResponse<string>>(`/plugin/${id}/uninstall`),

  // 删除插件
  deletePlugin: (id: number) =>
    apiClient.delete<ApiResponse<string>>(`/plugin/${id}`),

  // 获取插件版本列表
  getPluginVersions: (id: number) =>
    apiClient.get<ApiResponse<PluginVersion[]>>(`/plugin/${id}/versions`),

  // 获取插件统计
  getPluginStats: () =>
    apiClient.get<ApiResponse<PluginStats>>('/plugin/stats'),

  // 获取已启用插件
  getEnabledPlugins: () =>
    apiClient.get<ApiResponse<Plugin[]>>('/plugin/enabled'),

  // 批量更新插件状态
  batchUpdatePluginStatus: (pluginIds: number[], status: PluginStatus) =>
    apiClient.post<ApiResponse<string>>('/plugin/batch-status', {
      pluginIds,
      status
    }),

  // 验证插件文件
  validatePlugin: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post<ApiResponse<string>>('/plugin/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 导出插件配置
  exportPluginConfig: (id: number) =>
    apiClient.get(`/plugin/${id}/export-config`, {
      responseType: 'blob'
    }),

  // 导入插件配置
  importPluginConfig: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('configFile', file);
    
    return apiClient.post<ApiResponse<string>>(`/plugin/${id}/import-config`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// 插件状态工具函数
export const pluginUtils = {
  getStatusText: (status: PluginStatus): string => {
    const statusMap = {
      [PluginStatus.Uploading]: '上传中',
      [PluginStatus.Uploaded]: '已上传',
      [PluginStatus.Installed]: '已安装',
      [PluginStatus.Enabled]: '已启用',
      [PluginStatus.Disabled]: '已禁用',
      [PluginStatus.InstallFailed]: '安装失败',
      [PluginStatus.Error]: '错误',
      [PluginStatus.Uninstalled]: '已卸载'
    };
    return statusMap[status] || '未知';
  },

  getStatusColor: (status: PluginStatus): string => {
    const colorMap = {
      [PluginStatus.Uploading]: 'processing',
      [PluginStatus.Uploaded]: 'default',
      [PluginStatus.Installed]: 'warning',
      [PluginStatus.Enabled]: 'success',
      [PluginStatus.Disabled]: 'default',
      [PluginStatus.InstallFailed]: 'error',
      [PluginStatus.Error]: 'error',
      [PluginStatus.Uninstalled]: 'default'
    };
    return colorMap[status] || 'default';
  },

  getTypeText: (type: PluginType): string => {
    const typeMap = {
      [PluginType.Feature]: '功能插件',
      [PluginType.Component]: '组件插件',
      [PluginType.Integration]: '集成插件',
      [PluginType.Tool]: '工具插件'
    };
    return typeMap[type] || '未知';
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  parseTags: (tags?: string): string[] => {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
  },

  formatTags: (tags: string[]): string => {
    return JSON.stringify(tags);
  }
};

export default pluginApi;
