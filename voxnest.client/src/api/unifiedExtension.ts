/**
 * 统一扩展管理 API 客户端
 */

import { apiClient } from './client';

// 统一扩展接口
export interface UnifiedExtension {
  id: number;
  uniqueId: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  type: 'plugin' | 'theme';
  status: 'active' | 'inactive' | 'error' | 'loading';
  originalStatus?: any;
  fileSize: number;
  config?: string;
  iconPath?: string;
  previewImagePath?: string;
  screenshots?: string;
  tags?: string;
  downloadCount: number;
  isBuiltIn: boolean;
  isVerified: boolean;
  uploadedByUserId?: number;
  uploadedByUsername?: string;
  lastError?: string;
  installedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 插件专属字段
  dependencies?: string;
  minVoxNestVersion?: string;
  maxVoxNestVersion?: string;
  
  // 主题专属字段
  variables?: string;
  customCss?: string;
  colorScheme?: string;
  supportedModes?: string;
  useCount?: number;
  isDefault?: boolean;
  
  // 能力声明
  capabilities?: ExtensionCapabilities;
}

// 扩展能力标识
export interface ExtensionCapabilities {
  hasUI: boolean;
  hasAPI: boolean;
  hasStorage: boolean;
  hasTheming: boolean;
  hasLayout: boolean;
  slots: string[];
  hooks: string[];
}

// 统一扩展查询参数
export interface UnifiedExtensionQuery {
  search?: string;
  type?: 'plugin' | 'theme' | 'all';
  status?: 'active' | 'inactive' | 'error' | 'all';
  isBuiltIn?: boolean;
  isVerified?: boolean;
  tags?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

// 统一扩展统计信息
export interface UnifiedExtensionStats {
  totalExtensions: number;
  totalPlugins: number;
  totalThemes: number;
  activeExtensions: number;
  inactiveExtensions: number;
  errorExtensions: number;
  builtInExtensions: number;
  verifiedExtensions: number;
  totalFileSize: number;
  extensionsByType: Record<string, number>;
  extensionsByStatus: Record<string, number>;
}

// 扩展操作请求
export interface ExtensionAction {
  action: 'enable' | 'disable' | 'activate' | 'install' | 'uninstall';
  extensionType: 'plugin' | 'theme';
  extensionId: number;
  parameters?: Record<string, any>;
}

// 批量扩展操作请求
export interface BatchExtensionAction {
  action: string;
  extensions: Array<{
    id: number;
    type: 'plugin' | 'theme';
    uniqueId: string;
  }>;
  parameters?: Record<string, any>;
}

// 分页结果
export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
}

// API 响应
export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

/**
 * 统一扩展管理 API
 */
export const unifiedExtensionApi = {
  /**
   * 获取扩展列表
   */
  async getExtensions(query: UnifiedExtensionQuery = {}): Promise<PagedResult<UnifiedExtension>> {
    const response = await apiClient.get('/api/extension/unified', { params: query });
    return response.data;
  },

  /**
   * 获取扩展详情
   */
  async getExtension(id: number, type: 'plugin' | 'theme'): Promise<ApiResponse<UnifiedExtension>> {
    const response = await apiClient.get(`/api/extension/unified/${type}/${id}`);
    return response.data;
  },

  /**
   * 根据UniqueId获取扩展详情
   */
  async getExtensionByUniqueId(uniqueId: string, type: 'plugin' | 'theme'): Promise<ApiResponse<UnifiedExtension>> {
    const response = await apiClient.get(`/api/extension/unified/${type}/unique/${uniqueId}`);
    return response.data;
  },

  /**
   * 获取扩展统计信息
   */
  async getExtensionStats(): Promise<ApiResponse<UnifiedExtensionStats>> {
    const response = await apiClient.get('/api/extension/unified/stats');
    return response.data;
  },

  /**
   * 执行扩展操作
   */
  async executeAction(action: ExtensionAction): Promise<ApiResponse<string>> {
    const response = await apiClient.post('/api/extension/unified/action', action);
    return response.data;
  },

  /**
   * 批量执行扩展操作
   */
  async executeBatchAction(batchAction: BatchExtensionAction): Promise<ApiResponse<Record<string, string>>> {
    const response = await apiClient.post('/api/extension/unified/batch-action', batchAction);
    return response.data;
  },

  /**
   * 搜索扩展
   */
  async searchExtensions(searchTerm: string, limit = 10): Promise<ApiResponse<UnifiedExtension[]>> {
    const response = await apiClient.get('/api/extension/unified/search', { 
      params: { searchTerm, limit } 
    });
    return response.data;
  },

  /**
   * 获取扩展manifest
   */
  async getExtensionManifest(uniqueId: string, type: 'plugin' | 'theme'): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/api/extension/unified/${type}/${uniqueId}/manifest`);
    return response.data;
  },

  /**
   * 验证扩展兼容性
   */
  async validateCompatibility(uniqueId: string, type: 'plugin' | 'theme'): Promise<ApiResponse<Record<string, any>>> {
    const response = await apiClient.get(`/api/extension/unified/${type}/${uniqueId}/compatibility`);
    return response.data;
  },

  /**
   * 获取扩展依赖关系图
   */
  async getDependencyGraph(): Promise<ApiResponse<Record<string, any>>> {
    const response = await apiClient.get('/api/extension/unified/dependency-graph');
    return response.data;
  },

  /**
   * 导出扩展配置
   */
  async exportConfig(): Promise<Blob> {
    const response = await apiClient.get('/api/extension/unified/export-config', {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * 导入扩展配置
   */
  async importConfig(configData: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post('/api/extension/unified/import-config', configData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
};

// 扩展工具函数
export const unifiedExtensionUtils = {
  /**
   * 格式化扩展状态
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '运行中',
      'inactive': '未启用',
      'error': '错误',
      'loading': '加载中'
    };
    return statusMap[status] || status;
  },

  /**
   * 格式化扩展类型
   */
  formatType(type: string): string {
    const typeMap: Record<string, string> = {
      'plugin': '插件',
      'theme': '主题'
    };
    return typeMap[type] || type;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': 'success',
      'inactive': 'default',
      'error': 'error',
      'loading': 'processing'
    };
    return colorMap[status] || 'default';
  },

  /**
   * 获取类型颜色
   */
  getTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      'plugin': 'blue',
      'theme': 'purple'
    };
    return colorMap[type] || 'default';
  },

  /**
   * 检查是否可以执行操作
   */
  canExecuteAction(extension: UnifiedExtension, action: string): boolean {
    switch (action) {
      case 'enable':
        return extension.type === 'plugin' && extension.status === 'inactive';
      case 'disable':
        return (extension.type === 'plugin' && extension.status === 'active') ||
               (extension.type === 'theme' && extension.status === 'active');
      case 'activate':
        return extension.type === 'theme' && extension.status === 'inactive';
      default:
        return false;
    }
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
  parseTags(tagsString?: string): string[] {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    }
  },

  /**
   * 解析依赖关系
   */
  parseDependencies(dependenciesString?: string): string[] {
    if (!dependenciesString) return [];
    try {
      return JSON.parse(dependenciesString);
    } catch {
      return [];
    }
  },

  /**
   * 检查扩展是否兼容
   */
  isCompatible(extension: UnifiedExtension, voxNestVersion: string = '1.0.0'): boolean {
    if (!extension.minVoxNestVersion) return true;
    
    // 简单版本比较，实际应该使用semver
    const compareVersions = (a: string, b: string): number => {
      const partsA = a.split('.').map(Number);
      const partsB = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        
        if (partA > partB) return 1;
        if (partA < partB) return -1;
      }
      
      return 0;
    };

    const minVersionCheck = compareVersions(voxNestVersion, extension.minVoxNestVersion) >= 0;
    const maxVersionCheck = !extension.maxVoxNestVersion || 
                           compareVersions(voxNestVersion, extension.maxVoxNestVersion) <= 0;

    return minVersionCheck && maxVersionCheck;
  }
};

// 扩展安装相关接口
export interface ExtensionUpload {
  extensionFile: File;
  extensionType: 'plugin' | 'theme';
  autoEnable: boolean;
  overrideExisting: boolean;
  installNote?: string;
}

export interface ExtensionPreview {
  id: string;
  name: string;
  version: string;
  description?: string;
  author: string;
  type: string;
  homepage?: string;
  dependencies: string[];
  tags: string[];
  permissions: string[];
  fileSize: number;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  alreadyExists: boolean;
  existingVersion?: string;
}

export interface ExtensionInstallResult {
  success: boolean;
  extensionId: string;
  extensionName: string;
  version: string;
  type: string;
  installPath: string;
  enabled: boolean;
  message: string;
  errors: string[];
  warnings: string[];
  installedAt: string;
}

// 扩展安装API
export const extensionInstallerApi = {
  /**
   * 预览扩展文件
   */
  async previewExtension(extensionFile: File, extensionType: 'plugin' | 'theme'): Promise<ApiResponse<ExtensionPreview>> {
    const formData = new FormData();
    formData.append('extensionFile', extensionFile);
    formData.append('extensionType', extensionType);

    const response = await apiClient.post('/api/extension/unified/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
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

    const response = await apiClient.post('/api/extension/unified/install', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * 卸载扩展
   */
  async uninstallExtension(extensionId: string, extensionType: 'plugin' | 'theme'): Promise<ApiResponse<string>> {
    const response = await apiClient.delete(`/api/extension/unified/${extensionType}/${extensionId}`);
    return response.data;
  },

  /**
   * 验证扩展文件
   */
  async validateExtensionFile(extensionFile: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('extensionFile', extensionFile);

    const response = await apiClient.post('/api/extension/unified/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * 清理扩展文件
   */
  async cleanupExtensionFiles(): Promise<ApiResponse<Record<string, number>>> {
    const response = await apiClient.post('/api/extension/unified/cleanup');
    return response.data;
  },

  /**
   * 获取安装历史
   */
  async getInstallHistory(limit = 50): Promise<ApiResponse<ExtensionInstallResult[]>> {
    const response = await apiClient.get('/api/extension/unified/install-history', {
      params: { limit }
    });
    return response.data;
  }
};

export default unifiedExtensionApi;
