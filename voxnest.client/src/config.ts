/**
 * VoxNest 前端配置文件
 * 纯配置定义，不包含业务逻辑
 */

// ===========================================
// 配置接口定义
// ===========================================

export interface AppConfig {
  /** 应用信息 */
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
    debug: boolean;
  };
  
  /** API配置 */
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  /** 服务器配置 */
  server: {
    /** 前端开发服务器端口 */
    devPort: number;
    /** 后端HTTP端口 */
    backendHttpPort: number;
    /** 后端HTTPS端口 */
    backendHttpsPort: number;
    /** 是否启用HTTPS */
    useHttps: boolean;
  };
  
  /** 用户界面配置 */
  ui: {
    /** 默认主题 */
    theme: 'light' | 'dark' | 'auto';
    /** 当前主题包 */
    themePackage: string;
    /** 自定义主题ID（当themePackage为'custom'时使用） */
    customThemeId?: string;
    /** 默认语言 */
    locale: 'zh-CN' | 'en-US';
    /** 每页显示条数 */
    pageSize: number;
    /** 启用动画效果 */
    enableAnimations: boolean;
    /** 启用主题包自动更新 */
    enableThemePackageAutoUpdate: boolean;
  };
  
  /** 功能配置 */
  features: {
    /** 启用开发者工具 */
    enableDevTools: boolean;
    /** 启用配置健康检查 */
    enableHealthCheck: boolean;
    /** 健康检查间隔（毫秒） */
    healthCheckInterval: number;
    /** 启用日志记录 */
    enableLogging: boolean;
    /** 日志级别 */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  /** 存储配置 */
  storage: {
    /** Token存储键名 */
    tokenKey: string;
    /** 用户信息存储键名 */
    userKey: string;
    /** 配置存储键名 */
    configKey: string;
  };
}

// ===========================================
// 默认配置
// ===========================================

export const defaultConfig: AppConfig = {
  app: {
    name: 'VoxNest',
    version: '1.0.0',
    environment: 'development',
    debug: import.meta.env.DEV || false,
  },
  
  api: {
    baseUrl: 'http://localhost:5201',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  server: {
    devPort: 54976,
    backendHttpPort: 5201,
    backendHttpsPort: 7042,
    useHttps: false,
  },
  
  ui: {
    theme: 'light',
    themePackage: 'default',
    locale: 'zh-CN',
    pageSize: 10,
    enableAnimations: true,
    enableThemePackageAutoUpdate: true,
  },
  
  features: {
    enableDevTools: import.meta.env.DEV || false,
    enableHealthCheck: true,
    healthCheckInterval: 5 * 60 * 1000, // 5分钟
    enableLogging: true,
    logLevel: import.meta.env.DEV ? 'debug' : 'info',
  },
  
  storage: {
    tokenKey: 'access_token',
    userKey: 'user_info',
    configKey: 'app_config',
  },
};

// ===========================================
// 环境变量映射
// ===========================================

/**
 * 从环境变量创建配置覆盖
 */
export function createConfigFromEnv(): Partial<AppConfig> {
  const envConfig: Partial<AppConfig> = {};
  
  // API配置
  if (import.meta.env.VITE_API_BASE_URL) {
    envConfig.api = {
      ...defaultConfig.api,
      baseUrl: import.meta.env.VITE_API_BASE_URL,
    };
  }
  
  // 服务器配置
  const serverConfig: Partial<AppConfig['server']> = {};
  if (import.meta.env.DEV_SERVER_PORT) {
    serverConfig.devPort = parseInt(import.meta.env.DEV_SERVER_PORT);
  }
  if (import.meta.env.VITE_BACKEND_HTTP_PORT) {
    serverConfig.backendHttpPort = parseInt(import.meta.env.VITE_BACKEND_HTTP_PORT);
  }
  if (import.meta.env.VITE_BACKEND_HTTPS_PORT) {
    serverConfig.backendHttpsPort = parseInt(import.meta.env.VITE_BACKEND_HTTPS_PORT);
  }
  if (import.meta.env.VITE_USE_HTTPS) {
    serverConfig.useHttps = import.meta.env.VITE_USE_HTTPS === 'true';
  }
  
  if (Object.keys(serverConfig).length > 0) {
    envConfig.server = { ...defaultConfig.server, ...serverConfig };
  }
  
  // UI配置
  const uiConfig: Partial<AppConfig['ui']> = {};
  if (import.meta.env.VITE_THEME) {
    uiConfig.theme = import.meta.env.VITE_THEME as AppConfig['ui']['theme'];
  }
  if (import.meta.env.VITE_THEME_PACKAGE) {
    uiConfig.themePackage = import.meta.env.VITE_THEME_PACKAGE;
  }
  if (import.meta.env.VITE_CUSTOM_THEME_ID) {
    uiConfig.customThemeId = import.meta.env.VITE_CUSTOM_THEME_ID;
  }
  
  if (Object.keys(uiConfig).length > 0) {
    envConfig.ui = { ...defaultConfig.ui, ...uiConfig };
  }
  
  // 功能配置
  const featuresConfig: Partial<AppConfig['features']> = {};
  if (import.meta.env.VITE_ENABLE_DEV_TOOLS !== undefined) {
    featuresConfig.enableDevTools = import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
  }
  if (import.meta.env.VITE_LOG_LEVEL) {
    featuresConfig.logLevel = import.meta.env.VITE_LOG_LEVEL as AppConfig['features']['logLevel'];
  }
  
  if (Object.keys(featuresConfig).length > 0) {
    envConfig.features = { ...defaultConfig.features, ...featuresConfig };
  }
  
  return envConfig;
}

// ===========================================
// 配置验证规则
// ===========================================

export interface ConfigValidationRule {
  path: string;
  validator: (value: any) => boolean;
  message: string;
}

export const configValidationRules: ConfigValidationRule[] = [
  {
    path: 'server.devPort',
    validator: (port: number) => port > 0 && port <= 65535,
    message: '前端开发服务器端口必须在1-65535范围内',
  },
  {
    path: 'server.backendHttpPort',
    validator: (port: number) => port > 0 && port <= 65535,
    message: '后端HTTP端口必须在1-65535范围内',
  },
  {
    path: 'server.backendHttpsPort',
    validator: (port: number) => port > 0 && port <= 65535,
    message: '后端HTTPS端口必须在1-65535范围内',
  },
  {
    path: 'api.timeout',
    validator: (timeout: number) => timeout > 0 && timeout <= 60000,
    message: 'API超时时间必须在0-60000毫秒范围内',
  },
  {
    path: 'ui.pageSize',
    validator: (size: number) => size > 0 && size <= 100,
    message: '每页显示条数必须在1-100范围内',
  },
];

// ===========================================
// 辅助函数
// ===========================================

/**
 * 深度合并配置对象
 */
export function mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
  const merged = { ...base };
  
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (merged as any)[key] = {
        ...(merged as any)[key],
        ...value,
      };
    } else if (value !== undefined) {
      (merged as any)[key] = value;
    }
  }
  
  return merged;
}

/**
 * 获取配置中指定路径的值
 */
export function getConfigValue(config: AppConfig, path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], config as any);
}

/**
 * 构建API基础URL
 */
export function buildApiBaseUrl(config: AppConfig): string {
  if (config.api.baseUrl) {
    return config.api.baseUrl;
  }
  
  const protocol = config.server.useHttps ? 'https' : 'http';
  const port = config.server.useHttps 
    ? config.server.backendHttpsPort 
    : config.server.backendHttpPort;
  
  return `${protocol}://localhost:${port}`;
}
