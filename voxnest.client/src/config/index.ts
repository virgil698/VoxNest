/**
 * VoxNest 前端配置管理
 * 统一管理前后端端口配置和其他环境配置
 */

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
 * 默认配置
 */
export const defaultConfig: FrontendConfig = {
  devServerPort: 54976,
  apiBaseUrl: 'http://localhost:5201',
  backendHttpPort: 5201,
  backendHttpsPort: 7042,
  useHttps: false // 默认使用HTTP，不使用HTTPS
};

/**
 * 配置管理类
 */
export class ConfigManager {
  private static _instance: ConfigManager;
  private _config: FrontendConfig;
  private _backendConfig: BackendServerConfig | null = null;

  private constructor() {
    this._config = this.loadConfig();
  }

  public static get instance(): ConfigManager {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager();
    }
    return ConfigManager._instance;
  }

  /**
   * 获取当前配置
   */
  public get config(): FrontendConfig {
    return this._config;
  }

  /**
   * 获取后端配置
   */
  public get backendConfig(): BackendServerConfig | null {
    return this._backendConfig;
  }

  /**
   * 加载配置
   */
  private loadConfig(): FrontendConfig {
    // 从环境变量加载配置
    const envConfig: Partial<FrontendConfig> = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      devServerPort: parseInt(import.meta.env.DEV_SERVER_PORT || '54976'),
      backendHttpPort: parseInt(import.meta.env.VITE_BACKEND_HTTP_PORT || '5201'),
      backendHttpsPort: parseInt(import.meta.env.VITE_BACKEND_HTTPS_PORT || '7042'),
      useHttps: import.meta.env.VITE_USE_HTTPS === 'true'
    };

    // 合并配置
    const config = { ...defaultConfig, ...envConfig };

    // 如果没有指定API基础URL，根据端口自动生成
    if (!config.apiBaseUrl) {
      const protocol = config.useHttps ? 'https' : 'http';
      const port = config.useHttps ? config.backendHttpsPort : config.backendHttpPort;
      config.apiBaseUrl = `${protocol}://localhost:${port}`;
    }

    return config;
  }

  /**
   * 从后端获取服务器配置
   */
  public async fetchBackendConfig(): Promise<BackendServerConfig | null> {
    try {
      // 这里可以调用后端API获取配置
      // 暂时使用模拟数据
      const mockConfig: BackendServerConfig = {
        server: {
          name: "VoxNest Server",
          version: "1.0.0",
          environment: "Development",
          port: this._config.backendHttpPort,
          https_port: this._config.backendHttpsPort
        },
        cors: {
          allowed_origins: [
            `http://localhost:${this._config.devServerPort}`,
            `http://localhost:${this._config.backendHttpPort}`,
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

      // 更新前端配置以匹配后端配置
      const protocol = this._config.useHttps ? 'https' : 'http';
      const port = this._config.useHttps ? backendConfig.server.https_port : backendConfig.server.port;
      
      this._config.backendHttpPort = backendConfig.server.port;
      this._config.backendHttpsPort = backendConfig.server.https_port;
      this._config.apiBaseUrl = `${protocol}://localhost:${port}`;

      console.log('配置已同步:', this._config);
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
    this._config = { ...this._config, ...partialConfig };
  }

  /**
   * 获取API基础URL
   */
  public getApiBaseUrl(): string {
    return this._config.apiBaseUrl;
  }

  /**
   * 获取前端开发服务器端口
   */
  public getDevServerPort(): number {
    return this._config.devServerPort;
  }

  /**
   * 检查端口配置是否有效
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this._config.backendHttpPort < 1 || this._config.backendHttpPort > 65535) {
      errors.push('后端HTTP端口必须在1-65535范围内');
    }

    if (this._config.backendHttpsPort < 1 || this._config.backendHttpsPort > 65535) {
      errors.push('后端HTTPS端口必须在1-65535范围内');
    }

    if (this._config.devServerPort < 1 || this._config.devServerPort > 65535) {
      errors.push('前端开发服务器端口必须在1-65535范围内');
    }

    if (this._config.backendHttpPort === this._config.devServerPort) {
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

// 导出便捷方法
export const getConfig = () => configManager.config;
export const getApiBaseUrl = () => configManager.getApiBaseUrl();
export const getDevServerPort = () => configManager.getDevServerPort();
