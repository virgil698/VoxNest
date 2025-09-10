import { apiClient } from './client';

// 安装状态相关接口
export interface InstallStatusDto {
  isInstalled: boolean;
  currentStep: InstallStep;
  configExists: boolean;
  databaseConnected: boolean;
  databaseInitialized: boolean;
  hasAdminUser: boolean;
}

export const InstallStep = {
  NotStarted: 0,
  DatabaseConfig: 1,
  DatabaseInit: 2,
  CreateAdmin: 3,
  Completed: 4
} as const;

export type InstallStep = typeof InstallStep[keyof typeof InstallStep];

// 数据库配置接口
export interface DatabaseConfigDto {
  provider: string;
  server: string;
  port: number;
  database: string;
  username: string;
  password: string;
  charSet: string;
}

// 管理员创建接口
export interface CreateAdminDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

// 站点配置接口
export interface SiteConfigDto {
  siteName: string;
  siteDescription?: string;
  adminEmail: string;
}

// API响应接口
export interface ApiResponse {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: string;
  traceId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

// 安装API类
export class InstallApi {
  // 获取安装状态
  static async getInstallStatus(): Promise<InstallStatusDto> {
    const response = await apiClient.get<InstallStatusDto>('/api/install/status');
    return response.data;
  }

  // 测试数据库连接
  static async testDatabaseConnection(config: DatabaseConfigDto): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/test-database', config);
    return response.data;
  }

  // 保存数据库配置
  static async saveDatabaseConfig(config: DatabaseConfigDto): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/save-database-config', config);
    return response.data;
  }

  // 初始化数据库
  static async initializeDatabase(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/initialize-database');
    return response.data;
  }

  // 直接初始化数据库（不依赖热重载）
  static async initializeDatabaseDirect(forceReinitialize: boolean = false): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/initialize-database-direct', {
      forceReinitialize
    });
    return response.data;
  }

  // 创建管理员账户
  static async createAdminUser(adminInfo: CreateAdminDto): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/create-admin', adminInfo);
    return response.data;
  }

  // 完成安装
  static async completeInstallation(siteConfig: SiteConfigDto): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/complete', siteConfig);
    return response.data;
  }

  // 诊断数据库状态
  static async diagnoseDatabase(): Promise<any> {
    const response = await apiClient.get('/api/install/diagnose-database');
    return response.data;
  }

  // 修复数据库结构
  static async repairDatabase(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/repair-database');
    return response.data;
  }

  // 重置安装状态（开发环境）
  static async resetInstallation(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/install/reset');
    return response.data;
  }
}
