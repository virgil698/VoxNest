import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useDevToolsConfig } from '../hooks/useSiteSettings';
import { useLogger } from '../hooks/useLogger';

/**
 * 条件性渲染的开发者工具组件
 * 根据站点设置决定是否显示React Query开发者工具
 */
const ConditionalDevTools: React.FC = () => {
  const { isReactQueryDevtoolsEnabled, isLoading, error } = useDevToolsConfig();
  const logger = useLogger('ConditionalDevTools');

  // 如果配置正在加载，不渲染任何内容
  if (isLoading) {
    logger.debug('DevTools config is loading');
    return null;
  }

  // 如果配置加载失败，在开发环境下仍然显示开发者工具
  if (error) {
    logger.warning('Failed to load devtools config, falling back to environment check', error.message || 'Unknown error');
    
    // 开发环境下的回退逻辑
    if (process.env.NODE_ENV === 'development') {
      logger.info('Showing devtools in development mode (fallback)');
      return <ReactQueryDevtools initialIsOpen={false} />;
    }
    
    return null;
  }

  // 根据站点设置决定是否显示
  if (isReactQueryDevtoolsEnabled) {
    logger.info('Showing React Query devtools (enabled by site settings)');
    return <ReactQueryDevtools initialIsOpen={false} />;
  }

  // 即使站点设置禁用了，开发环境仍可显示（可选）
  if (process.env.NODE_ENV === 'development') {
    logger.debug('DevTools disabled by site settings but available in development');
    // 这里可以选择是否在开发环境下强制显示
    // 暂时禁用，完全依赖站点设置
  }

  logger.debug('DevTools not enabled, not rendering');
  return null;
};

export default ConditionalDevTools;
