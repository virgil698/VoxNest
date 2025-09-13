/**
 * 基于文件系统的扩展管理 API 客户端
 */

import { apiClient } from './client';

// 导入类型定义
import type { 
  UnifiedExtension, 
  UnifiedExtensionQuery, 
  UnifiedExtensionStats,
  ExtensionUpload,
  ExtensionInstallResult
} from './unifiedExtension';

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export interface PagedResult<T> {
  isSuccess: boolean;
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// 基于文件系统的扩展管理API
export const fileSystemExtensionApi = {
  /**
   * 获取所有扩展（已安装和未安装）
   */
  async getExtensions(query: UnifiedExtensionQuery): Promise<PagedResult<UnifiedExtension>> {
    const response = await apiClient.get('/api/filesystem-extension', { 
      params: {
        page: query.page || 1,
        pageSize: query.pageSize || 10,
        search: query.search || '',
        type: query.type || 'all',
        status: query.status || 'all'
      }
    });
    return response.data;
  },

  /**
   * 获取扩展统计信息
   */
  async getExtensionStats(): Promise<ApiResponse<UnifiedExtensionStats>> {
    const response = await apiClient.get('/api/filesystem-extension/stats');
    return response.data;
  },

  /**
   * 安装扩展
   */
  async installExtension(uploadData: ExtensionUpload): Promise<ApiResponse<ExtensionInstallResult>> {
    const formData = new FormData();
    formData.append('ExtensionFile', uploadData.extensionFile);
    formData.append('ExtensionType', uploadData.extensionType);
    formData.append('AutoEnable', uploadData.autoEnable.toString());
    formData.append('OverrideExisting', uploadData.overrideExisting.toString());
    if (uploadData.installNote) {
      formData.append('InstallNote', uploadData.installNote);
    }

    const response = await apiClient.post('/api/filesystem-extension/install', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * 卸载扩展
   */
  async uninstallExtension(extensionId: string): Promise<ApiResponse<string>> {
    const response = await apiClient.delete(`/api/filesystem-extension/${extensionId}`);
    return response.data;
  },

  /**
   * 启用扩展
   */
  async enableExtension(extensionId: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post(`/api/filesystem-extension/${extensionId}/enable`);
    return response.data;
  },

  /**
   * 禁用扩展
   */
  async disableExtension(extensionId: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post(`/api/filesystem-extension/${extensionId}/disable`);
    return response.data;
  },

  /**
   * 重载扩展
   */
  async reloadExtension(extensionId: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post(`/api/filesystem-extension/${extensionId}/reload`);
    return response.data;
  },

  /**
   * 触发热重载
   */
  async triggerHotReload(): Promise<ApiResponse<string>> {
    const response = await apiClient.post('/api/filesystem-extension/hot-reload');
    return response.data;
  },

  /**
   * 获取扩展配置
   */
  async getExtensionsConfig(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/api/filesystem-extension/config');
    return response.data;
  },

  /**
   * 验证扩展结构
   */
  async validateExtensionStructure(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/api/filesystem-extension/validate-structure');
    return response.data;
  }
};

// 工具函数
export const fileSystemExtensionUtils = {
  /**
   * 格式化扩展状态
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '已启用',
      'inactive': '已安装',
      'uninstalled': '未安装',
      'error': '错误'
    };
    return statusMap[status] || status;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': 'success',
      'inactive': 'default',
      'uninstalled': 'warning',
      'error': 'error'
    };
    return colorMap[status] || 'default';
  },

  /**
   * 获取扩展类型图标
   */
  getTypeIcon(type: string): string {
    return type === 'plugin' ? 'code' : 'bg-colors';
  },

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 解析标签字符串
   */
  parseTags(tagsJson: string | null | undefined): string[] {
    if (!tagsJson) return [];
    try {
      const parsed = JSON.parse(tagsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
};

export default fileSystemExtensionApi;
