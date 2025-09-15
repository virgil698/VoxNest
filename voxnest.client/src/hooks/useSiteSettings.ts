import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { siteApi, type SiteInfo, type PublicSettings } from '../api/site';
import { useLogger } from './useLogger';

/**
 * 站点信息查询Hook
 */
export function useSiteInfoQuery(): UseQueryResult<SiteInfo, Error> {
  const logger = useLogger('useSiteInfoQuery');

  return useQuery({
    queryKey: ['site', 'info'],
    queryFn: async () => {
      logger.debug('Fetching site info');
      const result = await siteApi.getSiteInfo();
      logger.debug('Site info fetched successfully', JSON.stringify(result.data));
      return result.data;
    },
    staleTime: 1000 * 60 * 30, // 30分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 60, // 1小时后垃圾回收
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * 公开站点设置查询Hook
 */
export function usePublicSettingsQuery(): UseQueryResult<PublicSettings, Error> {
  const logger = useLogger('usePublicSettingsQuery');

  return useQuery({
    queryKey: ['site', 'settings', 'public'],
    queryFn: async () => {
      logger.debug('Fetching public site settings');
      const result = await siteApi.getPublicSettings();
      logger.debug('Public settings fetched successfully', `Found ${Object.keys(result.data).length} settings`);
      return result.data;
    },
    staleTime: 1000 * 60 * 30, // 30分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 60, // 1小时后垃圾回收
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * 开发者工具配置Hook
 */
export function useDevToolsConfig() {
  const { data: siteInfo, isLoading, error } = useSiteInfoQuery();
  const logger = useLogger('useDevToolsConfig');

  const isReactQueryDevtoolsEnabled = siteInfo?.dev?.reactQueryDevtools ?? false;

  logger.debug('DevTools config', `enabled: ${isReactQueryDevtoolsEnabled}, loading: ${isLoading}, hasError: ${!!error}`);

  return {
    isReactQueryDevtoolsEnabled,
    isLoading,
    error,
    siteInfo
  };
}

/**
 * 主题配置Hook
 */
export function useThemeConfig() {
  const { data: siteInfo, isLoading, error } = useSiteInfoQuery();
  const logger = useLogger('useThemeConfig');

  const themeConfig = siteInfo?.theme ?? {
    primaryColor: '#1890ff',
    darkModeEnabled: true,
    defaultMode: 'light' as const
  };

  logger.debug('Theme config', JSON.stringify(themeConfig));

  return {
    themeConfig,
    isLoading,
    error,
    siteInfo
  };
}

/**
 * 功能配置Hook
 */
export function useFeaturesConfig() {
  const { data: siteInfo, isLoading, error } = useSiteInfoQuery();
  const logger = useLogger('useFeaturesConfig');

  const featuresConfig = siteInfo?.features ?? {
    registrationEnabled: true,
    emailVerification: false,
    guestPosting: false,
    commentsEnabled: true
  };

  logger.debug('Features config', JSON.stringify(featuresConfig));

  return {
    featuresConfig,
    isLoading,
    error,
    siteInfo
  };
}
