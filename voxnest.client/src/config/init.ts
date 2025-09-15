/**
 * 配置初始化模块
 * 简化的配置初始化逻辑
 */

import { configManager, getAppConfig, type FrontendConfig, type AppConfig, type BackendServerConfig } from './index';

/**
 * 初始化配置
 * 在应用启动时调用此方法来确保配置正确性
 */
export async function initializeConfig(): Promise<boolean> {
  try {
    const appConfig = getAppConfig();
    
    if (appConfig.features.enableLogging) {
      console.log('🔧 正在初始化配置...');
    }
    
    // 验证配置
    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      console.error('❌ 配置验证失败:', validation.errors);
      return false;
    }

    if (appConfig.features.enableLogging) {
      console.log('✅ 配置验证通过');
    }
    
    // 仅在开发环境或明确启用时同步后端配置
    if (appConfig.app.environment === 'development' || appConfig.features.enableHealthCheck) {
      if (appConfig.features.enableLogging) {
        console.log('🔄 正在同步后端配置...');
      }
      
      const syncSuccess = await configManager.syncWithBackend();
      
      if (appConfig.features.enableLogging) {
        if (syncSuccess) {
          console.log('✅ 配置同步成功');
          console.log('📋 当前配置:', configManager.config);
        } else {
          console.warn('⚠️ 配置同步失败，将使用默认配置');
          console.log('📋 当前配置:', configManager.config);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 配置初始化失败:', error);
    return false;
  }
}

/**
 * 配置健康检查
 * 定期检查配置是否仍然有效（仅在启用时运行）
 */
export function startConfigHealthCheck(): void {
  const appConfig = getAppConfig();
  
  if (!appConfig.features.enableHealthCheck) {
    return;
  }

  // 使用配置中定义的检查间隔
  setInterval(async () => {
    try {
      const validation = configManager.validateConfig();
      if (!validation.isValid) {
        if (appConfig.features.enableLogging) {
          console.warn('⚠️ 配置验证失败，需要重新同步:', validation.errors);
        }
        await configManager.syncWithBackend();
      }
    } catch (error) {
      console.error('配置健康检查失败:', error);
    }
  }, appConfig.features.healthCheckInterval);
}

/**
 * 获取配置状态信息
 */
export function getConfigStatus(): {
  isValid: boolean;
  errors: string[];
  config: FrontendConfig;
  appConfig: AppConfig;
  backendConfig: BackendServerConfig | null;
} {
  const validation = configManager.validateConfig();
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    config: configManager.config,
    appConfig: configManager.appConfig,
    backendConfig: configManager.backendConfig
  };
}
