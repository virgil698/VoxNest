import React from 'react';
import { FrontendSettingsManager } from '../config/frontendSettings';
import { useAuthStore } from '../stores/authStore';

/**
 * 开发者模式相关的 Hook
 */
export function useDeveloperMode() {
  const { user } = useAuthStore();

  // 检查是否启用了开发者模式
  const isDeveloperModeEnabled = FrontendSettingsManager.getSetting('developer.enabled');
  
  // 检查用户是否有管理员权限
  const isAdmin = user && Array.isArray(user.roles) && user.roles.includes('Admin');
  
  // 检查是否在开发环境
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 最终的开发者模式可用性：需要启用设置 + (管理员权限 || 开发环境)
  const isDeveloperModeAvailable = isDeveloperModeEnabled && (isAdmin || isDevelopment);

  // 各种开发者功能的可用性
  const canShowHotReload = isDeveloperModeAvailable && FrontendSettingsManager.getSetting('developer.showHotReload');
  const isFrameworkDebugEnabled = isDeveloperModeAvailable && FrontendSettingsManager.getSetting('developer.enableFrameworkDebug');
  const canShowPerformanceMetrics = isDeveloperModeAvailable && FrontendSettingsManager.getSetting('developer.showPerformanceMetrics');
  const isExtensionLogsEnabled = isDeveloperModeAvailable && FrontendSettingsManager.getSetting('developer.enableExtensionLogs');

  return {
    // 基本状态
    isDeveloperModeEnabled,
    isDeveloperModeAvailable,
    isAdmin,
    isDevelopment,
    
    // 功能可用性
    canShowHotReload,
    isFrameworkDebugEnabled,
    canShowPerformanceMetrics,
    isExtensionLogsEnabled,
    
    // 工具函数
    checkDeveloperAccess: () => isDeveloperModeAvailable,
    getDeveloperSetting: (key: string) => {
      if (!isDeveloperModeAvailable) return false;
      return FrontendSettingsManager.getSetting(`developer.${key}`);
    }
  };
}

/**
 * 开发者权限检查高阶组件
 */
export function withDeveloperMode<T extends Record<string, any> = Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  options: {
    fallback?: React.ReactNode;
    requireAdmin?: boolean;
  } = {}
) {
  const DeveloperModeWrapper: React.FC<T> = (props: T) => {
    const { isDeveloperModeAvailable, isAdmin, isDevelopment } = useDeveloperMode();
    
    // 如果需要管理员权限但不是管理员，且不在开发环境，则不显示
    if (options.requireAdmin && !isAdmin && !isDevelopment) {
      return (options.fallback || null) as React.ReactElement;
    }
    
    // 如果开发者模式不可用，则不显示
    if (!isDeveloperModeAvailable) {
      return (options.fallback || null) as React.ReactElement;
    }
    
    // 使用 React.createElement 来避免 JSX 编译问题
    return React.createElement(WrappedComponent as any, props);
  };
  
  DeveloperModeWrapper.displayName = `withDeveloperMode(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return DeveloperModeWrapper;
}

export default useDeveloperMode;
