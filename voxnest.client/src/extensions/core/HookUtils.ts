/**
 * 扩展钩子工具函数
 * 提供便捷的钩子触发和管理功能
 */

import { useEffect } from 'react';
import { getGlobalFramework } from './ExtensionFramework';
import type { IntegrationContext, IntegrationHooks } from './types';

// 钩子上下文缓存
let cachedContext: IntegrationContext | null = null;

/**
 * 获取当前集成上下文
 */
function getIntegrationContext(): IntegrationContext {
  if (!cachedContext) {
    const framework = getGlobalFramework();
    cachedContext = {
      framework,
      config: framework.config,
      logger: framework.logger,
      slots: framework.slots
    };
  }
  return cachedContext;
}

/**
 * 刷新缓存的上下文
 */
export function refreshHookContext(): void {
  cachedContext = null;
}

/**
 * 触发页面加载前钩子
 */
export async function triggerPageBeforeLoad(pagePath: string): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    pagePath
  };
  
  try {
    await framework.integrations.executeHook('page:beforeLoad', context);
  } catch (error) {
    framework.logger.error('Error executing page:beforeLoad hook:', error);
  }
}

/**
 * 触发页面加载后钩子
 */
export async function triggerPageAfterLoad(pagePath: string): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    pagePath
  };
  
  try {
    await framework.integrations.executeHook('page:afterLoad', context);
  } catch (error) {
    framework.logger.error('Error executing page:afterLoad hook:', error);
  }
}

/**
 * 触发路由变化钩子
 */
export async function triggerRouteChange(from: string, to: string): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    from,
    to
  };
  
  try {
    await framework.integrations.executeHook('route:change', context);
  } catch (error) {
    framework.logger.error('Error executing route:change hook:', error);
  }
}

/**
 * 触发认证状态变化钩子
 */
export async function triggerAuthChange(isAuthenticated: boolean, user?: unknown): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    isAuthenticated,
    user
  };
  
  try {
    await framework.integrations.executeHook('auth:change', context);
  } catch (error) {
    framework.logger.error('Error executing auth:change hook:', error);
  }
}

/**
 * 触发主题变化钩子
 */
export async function triggerThemeChange(theme: string, previousTheme: string): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    theme,
    previousTheme
  };
  
  try {
    await framework.integrations.executeHook('theme:change', context);
  } catch (error) {
    framework.logger.error('Error executing theme:change hook:', error);
  }
}

/**
 * 通用钩子触发器
 */
export async function triggerHook<T extends keyof IntegrationHooks>(
  hookName: T,
  additionalContext: Record<string, unknown> = {}
): Promise<void> {
  const framework = getGlobalFramework();
  const context = {
    ...getIntegrationContext(),
    ...additionalContext
  };
  
  try {
    await framework.integrations.executeHook(hookName, context);
    framework.logger.debug(`Hook ${hookName} executed successfully`);
  } catch (error) {
    framework.logger.error(`Error executing hook ${hookName}:`, error);
  }
}

/**
 * 批量触发钩子
 */
export async function triggerHooks<T extends keyof IntegrationHooks>(
  hookNames: T[],
  additionalContext: Record<string, unknown> = {}
): Promise<void> {
  const promises = hookNames.map(hookName => 
    triggerHook(hookName, additionalContext)
  );
  
  try {
    await Promise.all(promises);
  } catch (error) {
    const framework = getGlobalFramework();
    framework.logger.error('Error executing batch hooks:', error);
  }
}

/**
 * 获取钩子统计信息
 */
export function getHookStats(): {
  totalIntegrations: number;
  activeHooks: Record<keyof IntegrationHooks, number>;
} {
  const framework = getGlobalFramework();
  const stats = (framework.integrations as any).getStats();
  
  return {
    totalIntegrations: stats.total,
    activeHooks: stats.hookCounts
  };
}

/**
 * 检查特定钩子是否有监听器
 */
export function hasHookListeners<T extends keyof IntegrationHooks>(hookName: T): boolean {
  const stats = getHookStats();
  return (stats.activeHooks[hookName] || 0) > 0;
}

/**
 * React Hook 用于在组件中触发钩子
 */

export function usePageHooks(pagePath: string) {
  useEffect(() => {
    // 页面加载前
    triggerPageBeforeLoad(pagePath);
    
    // 页面加载后（异步）
    const timer = setTimeout(() => {
      triggerPageAfterLoad(pagePath);
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [pagePath]);
}

export function useRouteHooks(currentPath: string, previousPath?: string) {
  useEffect(() => {
    if (previousPath && previousPath !== currentPath) {
      triggerRouteChange(previousPath, currentPath);
    }
  }, [currentPath, previousPath]);
}

export function useAuthHooks(isAuthenticated: boolean, user?: unknown) {
  useEffect(() => {
    triggerAuthChange(isAuthenticated, user);
  }, [isAuthenticated, user]);
}

export function useThemeHooks(currentTheme: string, previousTheme?: string) {
  useEffect(() => {
    if (previousTheme && previousTheme !== currentTheme) {
      triggerThemeChange(currentTheme, previousTheme);
    }
  }, [currentTheme, previousTheme]);
}
