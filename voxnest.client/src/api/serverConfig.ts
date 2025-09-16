import { apiClient } from './client';

// 服务器配置相关的类型定义
export interface ServerConfig {
  name: string;
  version: string;
  environment: string;
  timeZone: string;
  enableHttpsRedirection: boolean;
  enableDetailedErrors: boolean;
  maxRequestBodySize: number;
}

export interface DatabaseConfig {
  provider: string;
  connectionString: string;
  enableSensitiveDataLogging: boolean;
  enableDetailedErrors: boolean;
  maxPoolSize: number;
  connectionTimeout: number;
}

export interface JwtConfig {
  secretKey: string;
  issuer: string;
  audience: string;
  expireMinutes: number;
  clockSkew: number;
}

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  allowCredentials: boolean;
}

export interface LoggingConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  filePath: string;
  maxFileSize: number;
  retainedFileCount: number;
}

export interface FullServerConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  logging: LoggingConfig;
}

export interface TimeZoneInfo {
  id: string;
  displayName: string;
  standardName: string;
  baseUtcOffset: string;
  supportsDaylightSavingTime: boolean;
}

export interface ConfigValidationRequest {
  category: string;
  configData: any;
}

export interface SetTimeZoneRequest {
  timeZoneId: string;
}

export interface ConfigResetRequest {
  category?: string;
}

export interface Result<T> {
  isSuccess: boolean;
  data: T | null;
  message: string | null;
  errorDetails: string | null;
}

/**
 * 服务器配置API客户端
 */
export const serverConfigApi = {
  /**
   * 获取完整的服务器配置
   */
  getFullConfig: async () => {
    const response = await apiClient.get<Result<FullServerConfig>>('/api/serverconfig/full');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取服务器配置失败');
  },

  /**
   * 获取服务器基本配置
   */
  getServerConfig: async () => {
    const response = await apiClient.get<Result<ServerConfig>>('/api/serverconfig/server');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取服务器配置失败');
  },

  /**
   * 获取数据库配置（敏感信息已脱敏）
   */
  getDatabaseConfig: async () => {
    const response = await apiClient.get<Result<DatabaseConfig>>('/api/serverconfig/database');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取数据库配置失败');
  },

  /**
   * 获取JWT配置（敏感信息已脱敏）
   */
  getJwtConfig: async () => {
    const response = await apiClient.get<JwtConfig>('/api/serverconfig/jwt');
    return response.data;
  },

  /**
   * 获取CORS配置
   */
  getCorsConfig: async () => {
    const response = await apiClient.get<Result<CorsConfig>>('/api/serverconfig/cors');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取CORS配置失败');
  },

  /**
   * 获取日志配置
   */
  getLoggingConfig: async () => {
    const response = await apiClient.get<Result<LoggingConfig>>('/api/serverconfig/logging');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取日志配置失败');
  },

  /**
   * 更新服务器配置
   */
  updateServerConfig: async (config: ServerConfig) => {
    const response = await apiClient.put<boolean>('/api/serverconfig/server', config);
    return response.data;
  },

  /**
   * 更新CORS配置
   */
  updateCorsConfig: async (config: CorsConfig) => {
    const response = await apiClient.put<boolean>('/api/serverconfig/cors', config);
    return response.data;
  },

  /**
   * 更新日志配置
   */
  updateLoggingConfig: async (config: LoggingConfig) => {
    const response = await apiClient.put<boolean>('/api/serverconfig/logging', config);
    return response.data;
  },

  /**
   * 获取所有可用时区
   */
  getAvailableTimeZones: async () => {
    const response = await apiClient.get<Result<TimeZoneInfo[]>>('/api/serverconfig/timezones');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取时区列表失败');
  },

  /**
   * 获取当前时区信息
   */
  getCurrentTimeZone: async () => {
    const response = await apiClient.get<Result<TimeZoneInfo>>('/api/serverconfig/timezone');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取当前时区失败');
  },

  /**
   * 设置时区
   */
  setTimeZone: async (request: SetTimeZoneRequest) => {
    const response = await apiClient.post<Result<boolean>>('/api/serverconfig/timezone', request);
    if (response.data.isSuccess) {
      return response.data.data || true;
    }
    throw new Error(response.data.message || '设置时区失败');
  },

  /**
   * 验证配置有效性
   */
  validateConfig: async (request: ConfigValidationRequest) => {
    const response = await apiClient.post<Result<boolean>>('/api/serverconfig/validate', request);
    if (response.data.isSuccess) {
      return response.data.data || true;
    }
    throw new Error(response.data.message || '验证配置失败');
  },

  /**
   * 备份当前配置
   */
  backupConfig: async () => {
    const response = await apiClient.post<Result<string>>('/api/serverconfig/backup');
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || '备份配置失败');
  },

  /**
   * 重置配置为默认值
   */
  resetConfig: async (request: ConfigResetRequest) => {
    const response = await apiClient.post<Result<boolean>>('/api/serverconfig/reset', request);
    if (response.data.isSuccess) {
      return response.data.data || true;
    }
    throw new Error(response.data.message || '重置配置失败');
  }
};
