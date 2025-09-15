import { extensionConfigApi } from '../../api/extensionConfig';
import type { Logger } from './types';

export interface ExtensionConfigManager {
  getConfig<T = Record<string, unknown>>(key?: string): T | undefined;
  setConfig(key: string, value: unknown): Promise<void>;
  onConfigChange(callback: (config: Record<string, unknown>) => void): () => void;
  refresh(): Promise<void>;
}

export class DefaultExtensionConfigManager implements ExtensionConfigManager {
  private config: Record<string, unknown> = {};
  private defaultConfig: Record<string, unknown> = {};
  private listeners: Set<(config: Record<string, unknown>) => void> = new Set();
  private extensionId: string;
  private logger: Logger;
  private refreshPromise?: Promise<void>;

  constructor(extensionId: string, defaultConfig: Record<string, unknown>, logger: Logger) {
    this.extensionId = extensionId;
    this.defaultConfig = defaultConfig;
    this.logger = logger.createChild('ConfigManager');
    
    // 初始化配置为默认值
    this.config = { ...defaultConfig };
    
    // 异步加载配置
    this.loadConfig().catch((error) => {
      this.logger.warn('Failed to load initial config, using defaults:', error);
    });
  }

  /**
   * 获取配置值
   * @param key 配置键，支持点号分隔的嵌套路径，如 'theme.colors.primary'
   * @returns 配置值或undefined
   */
  getConfig<T = Record<string, unknown>>(key?: string): T | undefined {
    if (!key) {
      return this.config as T;
    }

    return this.getNestedValue(this.config, key) as T;
  }

  /**
   * 设置配置值
   * @param key 配置键，支持点号分隔的嵌套路径
   * @param value 配置值
   */
  async setConfig(key: string, value: unknown): Promise<void> {
    try {
      // 更新本地配置
      this.setNestedValue(this.config, key, value);
      
      // 通知监听器
      this.notifyListeners();

      // 保存到服务器
      await extensionConfigApi.updateConfig(this.extensionId, {
        userConfig: this.config,
        isEnabled: true // 保持扩展启用状态
      });

      this.logger.debug(`Config updated: ${key} = ${JSON.stringify(value)}`);
    } catch (error) {
      this.logger.error('Failed to update config:', error);
      throw error;
    }
  }

  /**
   * 监听配置变化
   * @param callback 配置变化回调函数
   * @returns 取消监听的函数
   */
  onConfigChange(callback: (config: Record<string, unknown>) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 刷新配置（从服务器重新加载）
   */
  async refresh(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.loadConfig();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  /**
   * 从服务器加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const response = await extensionConfigApi.getConfig(this.extensionId);
      const serverConfig = response.data;
      
      if (serverConfig && serverConfig.userConfig) {
        // 合并服务器配置和默认配置
        this.config = this.mergeConfig(this.defaultConfig, serverConfig.userConfig);
        this.notifyListeners();
        this.logger.debug('Config loaded from server');
      }
    } catch (error) {
      // 如果加载失败（比如配置不存在），使用默认配置
      this.logger.warn('Failed to load config from server, using defaults:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * 合并配置对象
   */
  private mergeConfig(defaultConfig: Record<string, unknown>, userConfig: Record<string, unknown>): Record<string, unknown> {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      const userValue = userConfig[key];
      const defaultValue = defaultConfig[key];
      
      if (userValue !== null && userValue !== undefined) {
        if (typeof userValue === 'object' && !Array.isArray(userValue) &&
            typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
          // 递归合并对象
          result[key] = this.mergeConfig(defaultValue as Record<string, unknown>, userValue as Record<string, unknown>);
        } else {
          // 直接使用用户配置值
          result[key] = userValue;
        }
      }
    }
    
    return result;
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * 设置嵌套对象的值
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    
    current[lastKey] = value;
  }

  /**
   * 通知所有配置变化监听器
   */
  private notifyListeners(): void {
    for (const callback of this.listeners) {
      try {
        callback({ ...this.config });
      } catch (error) {
        this.logger.error('Error in config change listener:', error);
      }
    }
  }
}

/**
 * 创建扩展配置管理器
 */
export function createConfigManager(
  extensionId: string, 
  defaultConfig: Record<string, unknown>, 
  logger: Logger
): ExtensionConfigManager {
  return new DefaultExtensionConfigManager(extensionId, defaultConfig, logger);
}

/**
 * 配置管理器Hook
 * 为扩展提供React Hook风格的配置访问
 */
export interface ConfigManagerHooks {
  useConfig<T = Record<string, unknown>>(key?: string): [T | undefined, (value: T) => Promise<void>];
  useConfigValue<T = unknown>(key: string, defaultValue?: T): T;
}

export function createConfigManagerHooks(configManager: ExtensionConfigManager): ConfigManagerHooks {
  return {
    useConfig<T = Record<string, unknown>>(key?: string): [T | undefined, (value: T) => Promise<void>] {
      const value = configManager.getConfig<T>(key);
      
      const setValue = async (newValue: T) => {
        if (key) {
          await configManager.setConfig(key, newValue);
        } else {
          // 如果没有指定key，更新整个配置对象
          if (typeof newValue === 'object' && newValue !== null) {
            const updates = Object.entries(newValue as Record<string, unknown>);
            await Promise.all(updates.map(([k, v]) => configManager.setConfig(k, v)));
          }
        }
      };

      return [value, setValue];
    },

    useConfigValue<T = unknown>(key: string, defaultValue?: T): T {
      const value = configManager.getConfig<T>(key);
      return value !== undefined ? value : (defaultValue as T);
    }
  };
}
