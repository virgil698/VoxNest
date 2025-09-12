/**
 * VoxNest 前端配置管理
 * 负责加载、验证和管理应用配置
 */

import { 
  type AppConfig, 
  defaultConfig, 
  createConfigFromEnv, 
  mergeConfig, 
  configValidationRules,
  getConfigValue,
  buildApiBaseUrl 
} from '../config';

// 向后兼容的类型定义
export interface FrontendConfig {
  /** 前端开发服务器端口 */
  devServerPort: number;
  /** 后端API基础URL */
  apiBaseUrl: string;
  /** 后端HTTP端口 */
  backendHttpPort: number;
  /** 后端HTTPS端口 */
  backendHttpsPort: number;
  /** 是否启用HTTPS */
  useHttps: boolean;
}

export interface BackendServerConfig {
  server: {
    name: string;
    version: string;
    environment: string;
    port: number;
    https_port: number;
  };
  cors: {
    allowed_origins: string[];
  };
}

/**
 * 配置管理类
 */
export class ConfigManager {
  private static _instance: ConfigManager;
  private _appConfig: AppConfig;
  private _backendConfig: BackendServerConfig | null = null;

  private constructor() {
    this._appConfig = this.loadAppConfig();
  }

  public static get instance(): ConfigManager {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager();
    }
    return ConfigManager._instance;
  }

  /**
   * 获取完整应用配置
   */
  public get appConfig(): AppConfig {
    return this._appConfig;
  }

  /**
   * 获取当前配置（向后兼容）
   */
  public get config(): FrontendConfig {
    return this.toFrontendConfig(this._appConfig);
  }

  /**
   * 获取后端配置
   */
  public get backendConfig(): BackendServerConfig | null {
    return this._backendConfig;
  }

  /**
   * 加载应用配置
   */
  private loadAppConfig(): AppConfig {
    // 从环境变量创建配置覆盖
    const envConfig = createConfigFromEnv();
    
    // 从本地存储加载保存的配置
    const savedConfig = this.loadSavedConfig();
    
    // 合并配置：默认配置 < 环境变量 < 保存的配置
    let config = mergeConfig(defaultConfig, envConfig);
    if (savedConfig) {
      config = mergeConfig(config, savedConfig);
    }
    
    // 确保API基础URL正确
    config.api.baseUrl = buildApiBaseUrl(config);
    
    return config;
  }

  /**
   * 从本地存储加载保存的配置
   */
  private loadSavedConfig(): Partial<AppConfig> | null {
    try {
      const saved = localStorage.getItem(defaultConfig.storage.configKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('加载保存的配置失败:', error);
      return null;
    }
  }

  /**
   * 将新配置格式转换为向后兼容的格式
   */
  private toFrontendConfig(appConfig: AppConfig): FrontendConfig {
    return {
      devServerPort: appConfig.server.devPort,
      apiBaseUrl: appConfig.api.baseUrl,
      backendHttpPort: appConfig.server.backendHttpPort,
      backendHttpsPort: appConfig.server.backendHttpsPort,
      useHttps: appConfig.server.useHttps,
    };
  }

  /**
   * 从后端获取服务器配置
   */
  public async fetchBackendConfig(): Promise<BackendServerConfig | null> {
    try {
      // 这里可以调用后端API获取配置
      // 暂时使用模拟数据
      const frontendConfig = this.toFrontendConfig(this._appConfig);
      const mockConfig: BackendServerConfig = {
        server: {
          name: this._appConfig.app.name + " Server",
          version: this._appConfig.app.version,
          environment: this._appConfig.app.environment,
          port: frontendConfig.backendHttpPort,
          https_port: frontendConfig.backendHttpsPort
        },
        cors: {
          allowed_origins: [
            `http://localhost:${frontendConfig.devServerPort}`,
            `http://localhost:${frontendConfig.backendHttpPort}`,
            "http://localhost:3000"
          ]
        }
      };

      this._backendConfig = mockConfig;
      return mockConfig;
    } catch (error) {
      console.error('获取后端配置失败:', error);
      return null;
    }
  }

  /**
   * 同步配置：确保前端配置与后端配置匹配
   */
  public async syncWithBackend(): Promise<boolean> {
    try {
      const backendConfig = await this.fetchBackendConfig();
      if (!backendConfig) {
        return false;
      }

      // 更新应用配置以匹配后端配置
      const updatedConfig: Partial<AppConfig> = {
        server: {
          ...this._appConfig.server,
          backendHttpPort: backendConfig.server.port,
          backendHttpsPort: backendConfig.server.https_port,
        },
        api: {
          ...this._appConfig.api,
          baseUrl: buildApiBaseUrl({
            ...this._appConfig,
            server: {
              ...this._appConfig.server,
              backendHttpPort: backendConfig.server.port,
              backendHttpsPort: backendConfig.server.https_port,
            }
          })
        }
      };

      this._appConfig = mergeConfig(this._appConfig, updatedConfig);
      this.saveConfig();

      if (this._appConfig.features.enableLogging) {
        console.log('配置已同步:', this.toFrontendConfig(this._appConfig));
      }
      return true;
    } catch (error) {
      console.error('配置同步失败:', error);
      return false;
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(partialConfig: Partial<FrontendConfig>): void {
    // 转换为新配置格式
    const appConfigUpdate: Partial<AppConfig> = {
      server: {
        ...this._appConfig.server,
        devPort: partialConfig.devServerPort ?? this._appConfig.server.devPort,
        backendHttpPort: partialConfig.backendHttpPort ?? this._appConfig.server.backendHttpPort,
        backendHttpsPort: partialConfig.backendHttpsPort ?? this._appConfig.server.backendHttpsPort,
        useHttps: partialConfig.useHttps ?? this._appConfig.server.useHttps,
      },
      api: {
        ...this._appConfig.api,
        baseUrl: partialConfig.apiBaseUrl ?? this._appConfig.api.baseUrl,
      }
    };

    this._appConfig = mergeConfig(this._appConfig, appConfigUpdate);
    this.saveConfig();
  }

  /**
   * 更新应用配置
   */
  public updateAppConfig(partialConfig: Partial<AppConfig>): void {
    this._appConfig = mergeConfig(this._appConfig, partialConfig);
    this.saveConfig();
  }

  /**
   * 保存配置到本地存储
   */
  public saveConfig(): void {
    try {
      localStorage.setItem(
        this._appConfig.storage.configKey, 
        JSON.stringify(this._appConfig)
      );
    } catch (error) {
      console.warn('保存配置失败:', error);
    }
  }

  /**
   * 获取API基础URL
   */
  public getApiBaseUrl(): string {
    return this._appConfig.api.baseUrl;
  }

  /**
   * 获取前端开发服务器端口
   */
  public getDevServerPort(): number {
    return this._appConfig.server.devPort;
  }

  /**
   * 验证配置
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 使用配置验证规则
    for (const rule of configValidationRules) {
      const value = getConfigValue(this._appConfig, rule.path);
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    // 检查端口冲突
    const frontendConfig = this.toFrontendConfig(this._appConfig);
    if (frontendConfig.backendHttpPort === frontendConfig.devServerPort) {
      errors.push('后端端口不能与前端开发服务器端口相同');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 导出配置管理器实例
export const configManager = ConfigManager.instance;

// 导出便捷方法（向后兼容）
export const getConfig = () => configManager.config;
export const getApiBaseUrl = () => configManager.getApiBaseUrl();
export const getDevServerPort = () => configManager.getDevServerPort();

// 新的便捷方法
export const getAppConfig = () => configManager.appConfig;
export const updateAppConfig = (config: Partial<AppConfig>) => configManager.updateAppConfig(config);
export const validateConfig = () => configManager.validateConfig();
export const saveConfig = () => configManager.saveConfig();

// 重新导出配置定义中的其他实用函数
export {
  type AppConfig,
  defaultConfig,
  createConfigFromEnv,
  mergeConfig,
  configValidationRules,
  getConfigValue,
  buildApiBaseUrl
} from '../config';
