import { api } from './client';

// 扩展配置相关类型定义
export interface ExtensionConfig {
  id: string;
  extensionId: string;
  extensionType: 'plugin' | 'theme' | 'integration';
  configSchema: ExtensionConfigSchema;
  userConfig: Record<string, unknown>;
  defaultConfig: Record<string, unknown>;
  isEnabled: boolean;
  lastModified: string;
  version: string;
}

export interface ExtensionConfigSchema {
  title: string;
  description?: string;
  properties: Record<string, ExtensionConfigProperty>;
  required?: string[];
  groups?: ExtensionConfigGroup[];
}

export interface ExtensionConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'color' | 'select' | 'textarea' | 'url';
  title: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ label: string; value: unknown }>;
  min?: number;
  max?: number;
  pattern?: string;
  format?: string;
  group?: string;
  order?: number;
  hidden?: boolean;
  depends?: string; // 依赖其他字段的值
  dependsValue?: unknown; // 依赖字段的期望值
}

export interface ExtensionConfigGroup {
  id: string;
  title: string;
  description?: string;
  order?: number;
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface ExtensionConfigQuery {
  extensionId?: string;
  extensionType?: 'plugin' | 'theme' | 'integration';
  enabled?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ExtensionConfigListResponse {
  configs: ExtensionConfig[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateExtensionConfigRequest {
  userConfig: Record<string, unknown>;
  isEnabled?: boolean;
}

export interface CreateExtensionConfigRequest {
  extensionId: string;
  extensionType: 'plugin' | 'theme' | 'integration';
  configSchema: ExtensionConfigSchema;
  defaultConfig: Record<string, unknown>;
}

// 扩展配置API
export const extensionConfigApi = {
  // 获取扩展配置列表
  async getConfigs(query?: ExtensionConfigQuery): Promise<{ data: ExtensionConfigListResponse }> {
    const response = await api.get<ExtensionConfigListResponse>('/api/extension/configs', { params: query });
    return { data: response.data.data! };
  },

  // 获取特定扩展的配置
  async getConfig(extensionId: string): Promise<{ data: ExtensionConfig }> {
    const response = await api.get<ExtensionConfig>(`/api/extension/configs/${extensionId}`);
    return { data: response.data.data! };
  },

  // 更新扩展配置
  async updateConfig(extensionId: string, config: UpdateExtensionConfigRequest): Promise<{ data: ExtensionConfig }> {
    const response = await api.put<ExtensionConfig>(`/api/extension/configs/${extensionId}`, config);
    return { data: response.data.data! };
  },

  // 创建扩展配置
  async createConfig(config: CreateExtensionConfigRequest): Promise<{ data: ExtensionConfig }> {
    const response = await api.post<ExtensionConfig>('/api/extension/configs', config);
    return { data: response.data.data! };
  },

  // 删除扩展配置
  async deleteConfig(extensionId: string): Promise<void> {
    await api.delete(`/api/extension/configs/${extensionId}`);
  },

  // 重置扩展配置为默认值
  async resetConfig(extensionId: string): Promise<{ data: ExtensionConfig }> {
    const response = await api.post<ExtensionConfig>(`/api/extension/configs/${extensionId}/reset`);
    return { data: response.data.data! };
  },

  // 验证扩展配置
  async validateConfig(extensionId: string, config: Record<string, unknown>): Promise<{ data: { valid: boolean; errors?: string[] } }> {
    const response = await api.post<{ valid: boolean; errors?: string[] }>(`/api/extension/configs/${extensionId}/validate`, { config });
    return { data: response.data.data! };
  },

  // 获取扩展配置模板
  async getConfigTemplate(extensionType: 'plugin' | 'theme' | 'integration'): Promise<{ data: ExtensionConfigSchema }> {
    const response = await api.get<ExtensionConfigSchema>(`/extension-configs/templates/${extensionType}`);
    return { data: response.data.data! };
  },

  // 导出扩展配置
  async exportConfigs(extensionIds?: string[]): Promise<{ data: ExtensionConfig[] }> {
    const response = await api.post<ExtensionConfig[]>('/extension-configs/export', { extensionIds });
    return { data: response.data.data! };
  },

  // 导入扩展配置
  async importConfigs(configs: ExtensionConfig[]): Promise<{ data: { success: number; failed: number; errors: string[] } }> {
    const response = await api.post<{ success: number; failed: number; errors: string[] }>('/extension-configs/import', { configs });
    return { data: response.data.data! };
  },

  // 获取扩展配置历史记录
  async getConfigHistory(extensionId: string): Promise<{ data: Array<{ timestamp: string; config: Record<string, unknown>; version: string }> }> {
    const response = await api.get<Array<{ timestamp: string; config: Record<string, unknown>; version: string }>>(`/extension-configs/${extensionId}/history`);
    return { data: response.data.data! };
  },

  // 恢复扩展配置到历史版本
  async restoreConfig(extensionId: string, timestamp: string): Promise<{ data: ExtensionConfig }> {
    const response = await api.post<ExtensionConfig>(`/extension-configs/${extensionId}/restore`, { timestamp });
    return { data: response.data.data! };
  }
};
