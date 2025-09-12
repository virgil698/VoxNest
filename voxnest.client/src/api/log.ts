import { apiClient } from './client';

// 日志级别枚举
export const LogLevel = {
  Debug: 0,
  Info: 1,
  Warning: 2,
  Error: 3,
  Fatal: 4
} as const;
export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// 日志分类枚举
export const LogCategory = {
  System: 0,
  Authentication: 1,
  Api: 2,
  Database: 3,
  UserAction: 4,
  Error: 5,
  Performance: 6,
  Security: 7,
  Frontend: 8
} as const;
export type LogCategory = typeof LogCategory[keyof typeof LogCategory];

// 日志条目接口
export interface LogEntry {
  id: number;
  level: LogLevel;
  levelName: string;
  category: LogCategory;
  categoryName: string;
  message: string;
  details?: string;
  exception?: string;
  source?: string;
  userId?: number;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  httpMethod?: string;
  statusCode?: number;
  duration?: number;
  relatedEntityId?: number;
  relatedEntityType?: string;
  metadata?: string;
  createdAt: string;
}

// 创建日志条目接口
export interface CreateLogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
  exception?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  httpMethod?: string;
  statusCode?: number;
  duration?: number;
  relatedEntityId?: number;
  relatedEntityType?: string;
  metadata?: string;
}

// 日志查询参数接口
export interface LogQueryParams {
  pageNumber?: number;
  pageSize?: number;
  level?: LogLevel;
  category?: LogCategory;
  userId?: number;
  search?: string;
  source?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  statusCode?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// 日志查询结果接口
export interface LogQueryResult {
  items: LogEntry[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// 日志统计接口
export interface LogStats {
  totalCount: number;
  todayCount: number;
  levelCounts: Record<LogLevel, number>;
  categoryCounts: Record<LogCategory, number>;
  recentDailyCounts: Record<string, number>;
  recentErrors: LogEntry[];
  topUsers: Record<string, number>;
  topIpAddresses: Record<string, number>;
}

// 日志API类
export class LogApi {
  /**
   * 创建日志条目
   */
  static async createLog(logEntry: CreateLogEntry): Promise<LogEntry> {
    const response = await apiClient.post('/api/log', logEntry);
    return response.data.data;
  }

  /**
   * 获取日志列表
   */
  static async getLogs(params: LogQueryParams = {}): Promise<LogQueryResult> {
    const response = await apiClient.get('/api/log', { params });
    return response.data.data;
  }

  /**
   * 获取日志详情
   */
  static async getLogById(id: number): Promise<LogEntry> {
    const response = await apiClient.get(`/api/log/${id}`);
    return response.data.data;
  }

  /**
   * 获取日志统计
   */
  static async getLogStats(): Promise<LogStats> {
    const response = await apiClient.get('/api/log/stats');
    return response.data.data;
  }

  /**
   * 清理过期日志
   */
  static async cleanupLogs(olderThanDays: number = 30): Promise<number> {
    const response = await apiClient.delete('/api/log/cleanup', {
      params: { olderThanDays }
    });
    return response.data.data;
  }

  /**
   * 批量删除日志
   */
  static async deleteLogs(ids: number[]): Promise<number> {
    const response = await apiClient.delete('/api/log', { data: ids });
    return response.data.data;
  }

  /**
   * 快速记录前端日志（便捷方法）
   */
  static async log(
    level: LogLevel,
    message: string,
    details?: string,
    source?: string,
    exception?: Error,
    metadata?: any
  ): Promise<void> {
    try {
      await this.createLog({
        level,
        category: LogCategory.Frontend,
        message,
        details,
        source,
        exception: exception?.stack || exception?.message,
        userAgent: navigator.userAgent,
        requestUrl: window.location.href,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });
    } catch (error) {
      // 避免日志记录失败影响主要功能
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * 记录调试日志
   */
  static async debug(message: string, details?: string, source?: string, metadata?: any): Promise<void> {
    return this.log(LogLevel.Debug, message, details, source, undefined, metadata);
  }

  /**
   * 记录信息日志
   */
  static async info(message: string, details?: string, source?: string, metadata?: any): Promise<void> {
    return this.log(LogLevel.Info, message, details, source, undefined, metadata);
  }

  /**
   * 记录警告日志
   */
  static async warning(message: string, details?: string, source?: string, metadata?: any): Promise<void> {
    return this.log(LogLevel.Warning, message, details, source, undefined, metadata);
  }

  /**
   * 记录错误日志
   */
  static async error(message: string, exception?: Error, source?: string, metadata?: any): Promise<void> {
    return this.log(LogLevel.Error, message, undefined, source, exception, metadata);
  }

  /**
   * 记录致命错误日志
   */
  static async fatal(message: string, exception?: Error, source?: string, metadata?: any): Promise<void> {
    return this.log(LogLevel.Fatal, message, undefined, source, exception, metadata);
  }
}

// 导出默认实例
export const logApi = LogApi;
