/**
 * 主题管理 API
 */

import { request } from '../utils/request';

// 枚举定义
export const ThemeStatus = {
  Uploading: 0,
  Uploaded: 1,
  Installed: 2,
  Active: 3,
  Disabled: 4,
  InstallFailed: 5,
  Error: 6,
  Uninstalled: 7
} as const;

export type ThemeStatus = typeof ThemeStatus[keyof typeof ThemeStatus];

export const ThemeType = {
  Complete: 0,
  Color: 1,
  Layout: 2,
  Component: 3
} as const;

export type ThemeType = typeof ThemeType[keyof typeof ThemeType];

// 接口定义
export interface Theme {
  id: number;
  uniqueId: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  type: ThemeType;
  status: ThemeStatus;
  fileSize: number;
  config?: string;
  variables?: string;
  customCss?: string;
  previewImagePath?: string;
  screenshots?: string;
  tags?: string;
  colorScheme?: string;
  supportedModes?: string;
  downloadCount: number;
  useCount: number;
  isBuiltIn: boolean;
  isVerified: boolean;
  isDefault: boolean;
  uploadedByUserId?: number;
  uploadedByUsername?: string;
  lastError?: string;
  installedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeQuery {
  search?: string;
  status?: ThemeStatus;
  type?: ThemeType;
  isBuiltIn?: boolean;
  isVerified?: boolean;
  tags?: string;
  supportedMode?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateTheme {
  uniqueId: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  type: ThemeType;
  config?: string;
  variables?: string;
  customCss?: string;
  tags?: string;
  colorScheme?: string;
  supportedModes?: string;
  isDefault?: boolean;
}

export interface UpdateTheme {
  name?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  config?: string;
  variables?: string;
  customCss?: string;
  tags?: string;
  colorScheme?: string;
  supportedModes?: string;
  isDefault?: boolean;
  isVerified?: boolean;
}

export interface ThemeStats {
  totalThemes: number;
  activeThemes: number;
  disabledThemes: number;
  errorThemes: number;
  builtInThemes: number;
  verifiedThemes: number;
  totalFileSize: number;
  themesByType: Record<string, number>;
  themesByStatus: Record<string, number>;
  currentActiveTheme?: string;
}

export interface ThemePreview {
  id: number;
  name: string;
  previewImagePath?: string;
  variables?: string;
  colorScheme?: string;
  supportedModes?: string;
}

// API 方法
export const themeApi = {
  // 获取主题列表
  getThemes: (params: ThemeQuery) =>
    request.get<PagedResult<Theme>>('/theme', { params }),

  // 获取主题详情
  getTheme: (id: number) =>
    request.get<ApiResponse<Theme>>(`/theme/${id}`),

  // 根据唯一ID获取主题
  getThemeByUniqueId: (uniqueId: string) =>
    request.get<ApiResponse<Theme>>(`/theme/by-unique-id/${uniqueId}`),

  // 创建主题
  createTheme: (data: CreateTheme) =>
    request.post<ApiResponse<Theme>>('/theme', data),

  // 更新主题
  updateTheme: (id: number, data: UpdateTheme) =>
    request.put<ApiResponse<Theme>>(`/theme/${id}`, data),

  // 上传主题
  uploadTheme: (file: File, description?: string, tags?: string, setAsDefault = false) => {
    const formData = new FormData();
    formData.append('themeFile', file);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    formData.append('setAsDefault', setAsDefault.toString());
    
    return request.post<ApiResponse<Theme>>('/theme/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 安装主题
  installTheme: (id: number) =>
    request.post<ApiResponse<string>>(`/theme/${id}/install`),

  // 激活主题
  activateTheme: (id: number) =>
    request.post<ApiResponse<string>>(`/theme/${id}/activate`),

  // 禁用主题
  disableTheme: (id: number) =>
    request.post<ApiResponse<string>>(`/theme/${id}/disable`),

  // 卸载主题
  uninstallTheme: (id: number) =>
    request.post<ApiResponse<string>>(`/theme/${id}/uninstall`),

  // 删除主题
  deleteTheme: (id: number) =>
    request.delete<ApiResponse<string>>(`/theme/${id}`),

  // 获取当前激活主题
  getActiveTheme: () =>
    request.get<ApiResponse<Theme>>('/theme/active'),

  // 获取主题预览列表
  getThemePreviews: () =>
    request.get<ApiResponse<ThemePreview[]>>('/theme/previews'),

  // 获取主题统计
  getThemeStats: () =>
    request.get<ApiResponse<ThemeStats>>('/theme/stats'),

  // 预览主题
  previewTheme: (id: number) =>
    request.get<ApiResponse<ThemePreview>>(`/theme/${id}/preview`),

  // 重置为默认主题
  resetToDefaultTheme: () =>
    request.post<ApiResponse<string>>('/theme/reset-to-default'),

  // 批量更新主题状态
  batchUpdateThemeStatus: (themeIds: number[], status: ThemeStatus) =>
    request.post<ApiResponse<string>>('/theme/batch-status', {
      themeIds,
      status
    }),

  // 验证主题文件
  validateTheme: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return request.post<ApiResponse<string>>('/theme/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// 主题状态工具函数
export const themeUtils = {
  getStatusText: (status: ThemeStatus): string => {
    const statusMap = {
      [ThemeStatus.Uploading]: '上传中',
      [ThemeStatus.Uploaded]: '已上传',
      [ThemeStatus.Installed]: '已安装',
      [ThemeStatus.Active]: '已激活',
      [ThemeStatus.Disabled]: '已禁用',
      [ThemeStatus.InstallFailed]: '安装失败',
      [ThemeStatus.Error]: '错误',
      [ThemeStatus.Uninstalled]: '已卸载'
    };
    return statusMap[status] || '未知';
  },

  getStatusColor: (status: ThemeStatus): string => {
    const colorMap = {
      [ThemeStatus.Uploading]: 'processing',
      [ThemeStatus.Uploaded]: 'default',
      [ThemeStatus.Installed]: 'warning',
      [ThemeStatus.Active]: 'success',
      [ThemeStatus.Disabled]: 'default',
      [ThemeStatus.InstallFailed]: 'error',
      [ThemeStatus.Error]: 'error',
      [ThemeStatus.Uninstalled]: 'default'
    };
    return colorMap[status] || 'default';
  },

  getTypeText: (type: ThemeType): string => {
    const typeMap = {
      [ThemeType.Complete]: '完整主题',
      [ThemeType.Color]: '颜色主题',
      [ThemeType.Layout]: '布局主题',
      [ThemeType.Component]: '组件主题'
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
  },

  parseColorScheme: (colorScheme?: string): Record<string, string> => {
    if (!colorScheme) return {};
    try {
      return JSON.parse(colorScheme);
    } catch {
      return {};
    }
  },

  formatColorScheme: (colors: Record<string, string>): string => {
    return JSON.stringify(colors);
  },

  parseSupportedModes: (modes?: string): string[] => {
    if (!modes) return ['light'];
    try {
      return JSON.parse(modes);
    } catch {
      return modes.split(',').map(mode => mode.trim()).filter(mode => mode);
    }
  },

  formatSupportedModes: (modes: string[]): string => {
    return JSON.stringify(modes);
  }
};

export default themeApi;
