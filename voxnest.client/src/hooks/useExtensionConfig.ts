import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { 
  extensionConfigApi,
  type ExtensionConfig,
  type ExtensionConfigQuery,
  type UpdateExtensionConfigRequest,
  type CreateExtensionConfigRequest,
  type ExtensionConfigListResponse
} from '../api/extensionConfig';

// 查询键扩展
const extensionConfigKeys = {
  all: ['extension-configs'] as const,
  lists: () => [...extensionConfigKeys.all, 'list'] as const,
  list: (query: ExtensionConfigQuery) => [...extensionConfigKeys.lists(), query] as const,
  details: () => [...extensionConfigKeys.all, 'detail'] as const,
  detail: (extensionId: string) => [...extensionConfigKeys.details(), extensionId] as const,
  templates: () => [...extensionConfigKeys.all, 'templates'] as const,
  template: (type: string) => [...extensionConfigKeys.templates(), type] as const,
  history: (extensionId: string) => [...extensionConfigKeys.all, 'history', extensionId] as const,
};

// 获取扩展配置列表
export function useExtensionConfigsQuery(query: ExtensionConfigQuery = {}) {
  const defaultQuery = {
    pageNumber: 1,
    pageSize: 20,
    ...query,
  };

  return useQuery({
    queryKey: extensionConfigKeys.list(defaultQuery),
    queryFn: async (): Promise<ExtensionConfigListResponse> => {
      const response = await extensionConfigApi.getConfigs(defaultQuery);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
}

// 获取特定扩展的配置
export function useExtensionConfigQuery(extensionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: extensionConfigKeys.detail(extensionId),
    queryFn: async (): Promise<ExtensionConfig> => {
      const response = await extensionConfigApi.getConfig(extensionId);
      return response.data;
    },
    enabled: enabled && !!extensionId,
    staleTime: 1000 * 60 * 5, // 5分钟
    gcTime: 1000 * 60 * 15, // 15分钟
  });
}

// 更新扩展配置
export function useUpdateExtensionConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ extensionId, config }: { extensionId: string; config: UpdateExtensionConfigRequest }): Promise<ExtensionConfig> => {
      const response = await extensionConfigApi.updateConfig(extensionId, config);
      return response.data;
    },
    onMutate: async ({ extensionId, config }) => {
      // 乐观更新
      await queryClient.cancelQueries({ queryKey: extensionConfigKeys.detail(extensionId) });
      
      const previousConfig = queryClient.getQueryData<ExtensionConfig>(extensionConfigKeys.detail(extensionId));
      
      if (previousConfig) {
        queryClient.setQueryData<ExtensionConfig>(extensionConfigKeys.detail(extensionId), {
          ...previousConfig,
          userConfig: { ...previousConfig.userConfig, ...config.userConfig },
          isEnabled: config.isEnabled ?? previousConfig.isEnabled,
          lastModified: new Date().toISOString(),
        });
      }

      return { previousConfig };
    },
    onError: (error: unknown, { extensionId }, context) => {
      // 回滚乐观更新
      if (context?.previousConfig) {
        queryClient.setQueryData(extensionConfigKeys.detail(extensionId), context.previousConfig);
      }
      
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '更新扩展配置失败';
      message.error(errorMessage);
    },
    onSuccess: () => {
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.lists() });
      message.success('扩展配置已更新');
    },
    onSettled: (_, __, { extensionId }) => {
      // 重新获取数据确保同步
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.detail(extensionId) });
    },
  });
}

// 创建扩展配置
export function useCreateExtensionConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: CreateExtensionConfigRequest): Promise<ExtensionConfig> => {
      const response = await extensionConfigApi.createConfig(config);
      return response.data;
    },
    onSuccess: (data) => {
      // 添加到缓存
      queryClient.setQueryData(extensionConfigKeys.detail(data.extensionId), data);
      
      // 无效化列表查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.lists() });
      
      message.success('扩展配置已创建');
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '创建扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 删除扩展配置
export function useDeleteExtensionConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (extensionId: string): Promise<void> => {
      await extensionConfigApi.deleteConfig(extensionId);
    },
    onSuccess: (_, extensionId) => {
      // 从缓存中移除
      queryClient.removeQueries({ queryKey: extensionConfigKeys.detail(extensionId) });
      
      // 无效化列表查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.lists() });
      
      message.success('扩展配置已删除');
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '删除扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 重置扩展配置
export function useResetExtensionConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (extensionId: string): Promise<ExtensionConfig> => {
      const response = await extensionConfigApi.resetConfig(extensionId);
      return response.data;
    },
    onSuccess: (data, extensionId) => {
      // 更新缓存
      queryClient.setQueryData(extensionConfigKeys.detail(extensionId), data);
      
      // 无效化列表查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.lists() });
      
      message.success('扩展配置已重置为默认值');
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '重置扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 验证扩展配置
export function useValidateExtensionConfigMutation() {
  return useMutation({
    mutationFn: async ({ extensionId, config }: { extensionId: string; config: Record<string, unknown> }): Promise<{ valid: boolean; errors?: string[] }> => {
      const response = await extensionConfigApi.validateConfig(extensionId, config);
      return response.data;
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '验证扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 获取扩展配置模板
export function useExtensionConfigTemplateQuery(extensionType: 'plugin' | 'theme' | 'integration', enabled: boolean = true) {
  return useQuery({
    queryKey: extensionConfigKeys.template(extensionType),
    queryFn: async () => {
      const response = await extensionConfigApi.getConfigTemplate(extensionType);
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30分钟
    gcTime: 1000 * 60 * 60, // 1小时
  });
}

// 导出扩展配置
export function useExportExtensionConfigsMutation() {
  return useMutation({
    mutationFn: async (extensionIds?: string[]): Promise<ExtensionConfig[]> => {
      const response = await extensionConfigApi.exportConfigs(extensionIds);
      return response.data;
    },
    onSuccess: (data) => {
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extension-configs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('扩展配置已导出');
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '导出扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 导入扩展配置
export function useImportExtensionConfigsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configs: ExtensionConfig[]): Promise<{ success: number; failed: number; errors: string[] }> => {
      const response = await extensionConfigApi.importConfigs(configs);
      return response.data;
    },
    onSuccess: (data) => {
      // 无效化所有配置查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.all });
      
      if (data.failed > 0) {
        message.warning(`导入完成：成功 ${data.success} 个，失败 ${data.failed} 个`);
      } else {
        message.success(`成功导入 ${data.success} 个扩展配置`);
      }
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '导入扩展配置失败';
      message.error(errorMessage);
    },
  });
}

// 获取扩展配置历史
export function useExtensionConfigHistoryQuery(extensionId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: extensionConfigKeys.history(extensionId),
    queryFn: async () => {
      const response = await extensionConfigApi.getConfigHistory(extensionId);
      return response.data;
    },
    enabled: enabled && !!extensionId,
    staleTime: 1000 * 60 * 5, // 5分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
}

// 恢复扩展配置
export function useRestoreExtensionConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ extensionId, timestamp }: { extensionId: string; timestamp: string }): Promise<ExtensionConfig> => {
      const response = await extensionConfigApi.restoreConfig(extensionId, timestamp);
      return response.data;
    },
    onSuccess: (data, { extensionId }) => {
      // 更新缓存
      queryClient.setQueryData(extensionConfigKeys.detail(extensionId), data);
      
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: extensionConfigKeys.history(extensionId) });
      
      message.success('扩展配置已恢复');
    },
    onError: (error: unknown) => {
      const errorWithMessage = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithMessage?.response?.data?.message || '恢复扩展配置失败';
      message.error(errorMessage);
    },
  });
}
