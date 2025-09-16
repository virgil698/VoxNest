/**
 * 回到顶部扩展集成
 * 提供智能的页面顶部导航功能，支持配置化的显示条件和动画效果
 */

/* eslint-disable react-refresh/only-export-components */

import React, { useState, useEffect, useCallback } from 'react';
import BackToTopButton, { type BackToTopConfig } from './BackToTopButton';
import type { IntegrationContext } from '../../src/extensions/core/types';
import { createConfigManager, type ExtensionConfigManager } from '../../src/extensions/core/ConfigManager';

// 扩展配置接口
interface BackToTopExtensionConfig extends BackToTopConfig {
  // 扩展级别的配置选项
  enableExtension: boolean;
  enableLogging: boolean;
  enableAnalytics: boolean;
}

// 默认扩展配置
const defaultExtensionConfig: BackToTopExtensionConfig = {
  // 继承按钮组件的默认配置
  showThreshold: 200,
  position: 'bottom-right',
  enableAnimation: true,
  animationDuration: 300,
  smoothScrollDuration: 500,
  buttonSize: 'medium',
  buttonStyle: 'circle',
  showIcon: true,
  showText: false,
  buttonText: '顶部',
  hideOnTop: true,
  enableHover: true,
  backgroundColor: '#1890ff',
  textColor: '#ffffff',
  borderRadius: 50,
  opacity: 0.8,
  hoverOpacity: 1.0,
  zIndex: 1000,
  
  // 扩展级别配置
  enableExtension: true,
  enableLogging: true,
  enableAnalytics: false
};

// 主集成组件
const BackToTopIntegration: React.FC<{ context?: IntegrationContext }> = ({ context: _context }) => {
  // 状态管理
  const [config, setConfig] = useState<BackToTopExtensionConfig>(defaultExtensionConfig);
  const [configManager, setConfigManager] = useState<ExtensionConfigManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 日志记录函数
  const log = useCallback((message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    if (config.enableLogging) {
      const prefix = '🔝 [BackToTop]';
      switch (level) {
        case 'warn':
          console.warn(`${prefix} ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
      }
    }
  }, [config.enableLogging]);

  // 分析统计函数
  const trackEvent = useCallback((event: string) => {
    if (config.enableAnalytics) {
      log(`Analytics: ${event}`, 'info');
      // 这里可以集成分析服务
      // analyticsService.track(event);
    }
  }, [config.enableAnalytics, log]);

  // 回到顶部事件处理
  const handleScrollToTop = useCallback(() => {
    trackEvent('scroll_to_top');
    log('User scrolled to top');
  }, [trackEvent, log]);


  // 初始化配置管理器
  useEffect(() => {
    try {
        // 创建完整的 logger 对象
        const logger = {
          trace: (message: string, ..._args: unknown[]) => log(`TRACE: ${message}`, 'info'),
          debug: (message: string, ..._args: unknown[]) => log(`DEBUG: ${message}`, 'info'),
          info: (message: string, ..._args: unknown[]) => log(message, 'info'),
          warn: (message: string, ..._args: unknown[]) => log(message, 'warn'),
          error: (message: string, ..._args: unknown[]) => log(message, 'error'),
          createChild: (name: string) => ({
            trace: (message: string, ..._args: unknown[]) => log(`[${name}] TRACE: ${message}`, 'info'),
            debug: (message: string, ..._args: unknown[]) => log(`[${name}] DEBUG: ${message}`, 'info'),
            info: (message: string, ..._args: unknown[]) => log(`[${name}] ${message}`, 'info'),
            warn: (message: string, ..._args: unknown[]) => log(`[${name}] ${message}`, 'warn'),
            error: (message: string, ..._args: unknown[]) => log(`[${name}] ${message}`, 'error'),
            createChild: (childName: string) => logger.createChild(`${name}.${childName}`)
          })
        };

        const manager = createConfigManager(
          'back-to-top',
          defaultExtensionConfig as unknown as Record<string, unknown>,
          logger
        );
        
        setConfigManager(manager);
        
        // 加载保存的配置
        const savedConfig = manager.getConfig<BackToTopExtensionConfig>();
        if (savedConfig) {
          setConfig({ ...defaultExtensionConfig, ...savedConfig });
          log('Configuration loaded from storage');
        }

      } catch (err: any) {
        console.error('Failed to initialize config manager:', err);
        setError('配置管理器初始化失败');
      }
  }, [log]);

  // 监听配置变化并保存
  useEffect(() => {
    if (configManager && isInitialized) {
      // 使用 setConfig 方法保存配置的每个字段
      Promise.all(
        Object.entries(config).map(([key, value]) => 
          configManager.setConfig(key, value)
        )
      ).catch((err: any) => {
        console.error('Failed to save config:', err);
        log('Configuration save failed', 'error');
      });
    }
  }, [config, configManager, isInitialized, log]);

  // 初始化完成标记
  useEffect(() => {
    if (configManager && !isInitialized) {
      setIsInitialized(true);
      log('Extension initialized successfully');
      trackEvent('extension_initialized');
    }
  }, [configManager, isInitialized, log, trackEvent]);

  // 全局钩子函数注册
  useEffect(() => {
    // 注册全局回到顶部对象
    window.VoxNestBackToTop = {
      initialize: () => {
        log('Global initialize hook called');
        trackEvent('global_initialize');
      },
      cleanup: () => {
        log('Global cleanup hook called');
        trackEvent('global_cleanup');
      }
    };

    // 清理函数
    return () => {
      if (window.VoxNestBackToTop) {
        delete window.VoxNestBackToTop;
      }
    };
  }, [log, trackEvent]);

  // 错误处理显示
  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#ff4d4f', 
        color: 'white', 
        padding: '8px 12px', 
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        回到顶部扩展错误: {error}
      </div>
    );
  }

  // 扩展未启用时不渲染
  if (!config.enableExtension) {
    return null;
  }

  // 渲染回到顶部按钮
  return (
    <BackToTopButton
      config={config}
      className="voxnest-extension-back-to-top"
      onScrollToTop={handleScrollToTop}
    />
  );
};

/**
 * 初始化回到顶部扩展
 * 这个函数会被PublicExtensionLoader调用
 */
export function initializeBackToTop(framework: any) {
  console.log('🔝 初始化回到顶部扩展...');
  
  try {
    // 将组件注册到overlay.root槽位
    framework.slots.register('overlay.root', {
      component: BackToTopIntegration,
      source: 'back-to-top',
      name: '回到顶部按钮',
      priority: 100
    });
    
    console.log('🔝 [BackToTop] 组件已注册到 overlay.root 槽位');

    // 注册到全局对象（用于manifest中的hooks）
    if (typeof window !== 'undefined') {
      (window as any).VoxNestBackToTop = {
        initialize: () => console.log('🔝 [BackToTop] Global initialize called'),
        cleanup: () => console.log('🔝 [BackToTop] Global cleanup called'),
        component: BackToTopIntegration,
        config: defaultExtensionConfig
      };
    }

    console.log('✅ 回到顶部扩展初始化成功');
    return true;
  } catch (error) {
    console.error('❌ 回到顶部扩展初始化失败:', error);
    return false;
  }
}

// 导出集成组件和相关接口
export default initializeBackToTop;
export { BackToTopIntegration, initializeBackToTop as initialize };
export type { BackToTopExtensionConfig };

// 集成配置选项
export const integrationConfig = {
  name: 'BackToTop',
  version: '1.0.0',
  component: BackToTopIntegration,
  defaultConfig: defaultExtensionConfig,
  configSchema: {
    // 这里可以定义配置表单的验证规则
    enableExtension: { type: 'boolean', required: true },
    showThreshold: { type: 'number', min: 50, max: 1000 },
    position: { type: 'string', enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
    buttonSize: { type: 'string', enum: ['small', 'medium', 'large'] }
  }
};
