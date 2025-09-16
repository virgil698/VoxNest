import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { 
  serverConfigApi, 
  type ServerConfig, 
  type CorsConfig,
  type LoggingConfig,
  type SetTimeZoneRequest,
  type ConfigResetRequest
} from '../api/serverConfig';
import { useLogger } from './useLogger';

/**
 * 服务器配置查询Hook
 */
export function useServerConfigQuery() {
  const logger = useLogger('useServerConfig');

  return useQuery({
    queryKey: ['serverConfig', 'full'],
    queryFn: async () => {
      logger.debug('Fetching full server config');
      const result = await serverConfigApi.getFullConfig();
      logger.debug('Full server config fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 30, // 30分钟后垃圾回收
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * 服务器基本配置查询Hook
 */
export function useServerBasicConfigQuery() {
  const logger = useLogger('useServerBasicConfig');

  return useQuery({
    queryKey: ['serverConfig', 'server'],
    queryFn: async () => {
      logger.debug('Fetching server basic config');
      const result = await serverConfigApi.getServerConfig();
      logger.debug('Server basic config fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * 数据库配置查询Hook
 */
export function useDatabaseConfigQuery() {
  const logger = useLogger('useDatabaseConfig');

  return useQuery({
    queryKey: ['serverConfig', 'database'],
    queryFn: async () => {
      logger.debug('Fetching database config');
      const result = await serverConfigApi.getDatabaseConfig();
      logger.debug('Database config fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * CORS配置查询Hook
 */
export function useCorsConfigQuery() {
  const logger = useLogger('useCorsConfig');

  return useQuery({
    queryKey: ['serverConfig', 'cors'],
    queryFn: async () => {
      logger.debug('Fetching CORS config');
      const result = await serverConfigApi.getCorsConfig();
      logger.debug('CORS config fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * 日志配置查询Hook
 */
export function useLoggingConfigQuery() {
  const logger = useLogger('useLoggingConfig');

  return useQuery({
    queryKey: ['serverConfig', 'logging'],
    queryFn: async () => {
      logger.debug('Fetching logging config');
      const result = await serverConfigApi.getLoggingConfig();
      logger.debug('Logging config fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * 时区查询Hooks
 */
export function useTimeZoneQueries() {
  const logger = useLogger('useTimeZone');

  // 获取所有可用时区
  const availableTimeZonesQuery = useQuery({
    queryKey: ['serverConfig', 'timezones'],
    queryFn: async () => {
      logger.debug('Fetching available time zones');
      const result = await serverConfigApi.getAvailableTimeZones();
      logger.debug(`Fetched ${result.length} available time zones`);
      return result;
    },
    staleTime: 1000 * 60 * 60, // 1小时内认为数据是新鲜的
    gcTime: 1000 * 60 * 60 * 2, // 2小时后垃圾回收
  });

  // 获取当前时区
  const currentTimeZoneQuery = useQuery({
    queryKey: ['serverConfig', 'timezone', 'current'],
    queryFn: async () => {
      logger.debug('Fetching current time zone');
      const result = await serverConfigApi.getCurrentTimeZone();
      logger.debug('Current time zone fetched successfully');
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    availableTimeZones: availableTimeZonesQuery,
    currentTimeZone: currentTimeZoneQuery,
  };
}

/**
 * 服务器配置更新Hooks
 */
export function useServerConfigMutations() {
  const queryClient = useQueryClient();
  const logger = useLogger('useServerConfigMutations');

  // 更新服务器基本配置
  const updateServerConfig = useMutation({
    mutationFn: async (config: ServerConfig) => {
      logger.info('Updating server config');
      return await serverConfigApi.updateServerConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
      message.success('服务器配置更新成功');
      logger.info('Server config updated successfully');
    },
    onError: (error) => {
      message.error('服务器配置更新失败');
      logger.error('Server config update failed', error);
    },
  });

  // 更新CORS配置
  const updateCorsConfig = useMutation({
    mutationFn: async (config: CorsConfig) => {
      logger.info('Updating CORS config');
      return await serverConfigApi.updateCorsConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
      message.success('CORS配置更新成功');
      logger.info('CORS config updated successfully');
    },
    onError: (error) => {
      message.error('CORS配置更新失败');
      logger.error('CORS config update failed', error);
    },
  });

  // 更新日志配置
  const updateLoggingConfig = useMutation({
    mutationFn: async (config: LoggingConfig) => {
      logger.info('Updating logging config');
      return await serverConfigApi.updateLoggingConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
      message.success('日志配置更新成功，建议重启服务以生效');
      logger.info('Logging config updated successfully');
    },
    onError: (error) => {
      message.error('日志配置更新失败');
      logger.error('Logging config update failed', error);
    },
  });

  // 设置时区
  const setTimeZone = useMutation({
    mutationFn: async (request: SetTimeZoneRequest) => {
      logger.info('Setting time zone');
      return await serverConfigApi.setTimeZone(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
      message.success('时区设置成功');
      logger.info('Time zone set successfully');
    },
    onError: (error) => {
      message.error('时区设置失败');
      logger.error('Time zone setting failed', error);
    },
  });

  // 备份配置
  const backupConfig = useMutation({
    mutationFn: async () => {
      logger.info('Creating configuration backup');
      return await serverConfigApi.backupConfig();
    },
    onSuccess: (backupPath) => {
      message.success(`配置备份成功: ${backupPath}`);
      logger.info('Configuration backup created');
    },
    onError: (error) => {
      message.error('配置备份失败');
      logger.error('Configuration backup failed', error);
    },
  });

  // 重置配置
  const resetConfig = useMutation({
    mutationFn: async (request: ConfigResetRequest) => {
      logger.info('Resetting configuration');
      return await serverConfigApi.resetConfig(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
      message.success('配置重置成功');
      logger.info('Configuration reset successfully');
    },
    onError: (error) => {
      message.error('配置重置失败');
      logger.error('Configuration reset failed', error);
    },
  });

  return {
    updateServerConfig,
    updateCorsConfig,
    updateLoggingConfig,
    setTimeZone,
    backupConfig,
    resetConfig,
  };
}

/**
 * 综合服务器配置Hook
 */
export function useServerConfig() {
  const configQuery = useServerConfigQuery();
  const basicConfigQuery = useServerBasicConfigQuery();
  const databaseConfigQuery = useDatabaseConfigQuery();
  const corsConfigQuery = useCorsConfigQuery();
  const loggingConfigQuery = useLoggingConfigQuery();
  const timeZoneQueries = useTimeZoneQueries();
  const mutations = useServerConfigMutations();

  return {
    // 查询
    fullConfig: configQuery,
    serverConfig: basicConfigQuery,
    databaseConfig: databaseConfigQuery,
    corsConfig: corsConfigQuery,
    loggingConfig: loggingConfigQuery,
    ...timeZoneQueries,
    
    // 变更操作
    ...mutations,
    
    // 便捷状态
    isLoading: configQuery.isLoading || basicConfigQuery.isLoading,
    isError: configQuery.isError || basicConfigQuery.isError,
    error: configQuery.error || basicConfigQuery.error,
    
    // 刷新所有配置
    refetchAll: () => {
      configQuery.refetch();
      basicConfigQuery.refetch();
      databaseConfigQuery.refetch();
      corsConfigQuery.refetch();
      loggingConfigQuery.refetch();
      timeZoneQueries.currentTimeZone.refetch();
    },
  };
}
