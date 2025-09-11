/**
 * 配置初始化模块
 * 在应用启动时自动检查和同步前后端配置
 */

import { configManager } from './index';

/**
 * 初始化配置
 * 在应用启动时调用此方法来确保配置正确性
 */
export async function initializeConfig(): Promise<boolean> {
  try {
    console.log('🔧 正在初始化配置...');
    
    // 验证配置
    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      console.error('❌ 配置验证失败:', validation.errors);
      return false;
    }

    console.log('✅ 配置验证通过');
    
    // 尝试同步后端配置
    console.log('🔄 正在同步后端配置...');
    const syncSuccess = await configManager.syncWithBackend();
    
    if (syncSuccess) {
      console.log('✅ 配置同步成功');
      console.log('📋 当前配置:', configManager.config);
    } else {
      console.warn('⚠️ 配置同步失败，将使用默认配置');
      console.log('📋 当前配置:', configManager.config);
    }

    return true;
  } catch (error) {
    console.error('❌ 配置初始化失败:', error);
    return false;
  }
}

/**
 * 配置健康检查
 * 定期检查配置是否仍然有效
 */
export function startConfigHealthCheck(): void {
  // 每5分钟检查一次配置
  setInterval(async () => {
    try {
      const validation = configManager.validateConfig();
      if (!validation.isValid) {
        console.warn('⚠️ 配置验证失败，需要重新同步:', validation.errors);
        await configManager.syncWithBackend();
      }
    } catch (error) {
      console.error('配置健康检查失败:', error);
    }
  }, 5 * 60 * 1000); // 5分钟
}

/**
 * 获取配置状态信息
 */
export function getConfigStatus(): {
  isValid: boolean;
  errors: string[];
  config: any;
  backendConfig: any;
} {
  const validation = configManager.validateConfig();
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    config: configManager.config,
    backendConfig: configManager.backendConfig
  };
}
