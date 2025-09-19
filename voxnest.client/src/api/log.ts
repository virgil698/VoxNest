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
  // 请求去重映射表
  private static pendingRequests = new Map<string, Promise<LogEntry>>();
  // AbortController映射表，用于管理请求取消
  private static abortControllers = new Map<string, AbortController>();
  
  /**
   * 创建日志条目
   */
  static async createLog(logEntry: CreateLogEntry): Promise<LogEntry> {
    // 数据验证
    if (!logEntry.message || logEntry.message.trim() === '') {
      throw new Error('日志消息不能为空');
    }

    // 生成请求指纹用于去重
    const requestKey = this.generateRequestKey(logEntry);
    
    // 如果相同的请求正在进行中，返回已存在的Promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    // 创建新的请求Promise
    const requestPromise = this.executeCreateLog(logEntry);
    
    // 将请求添加到待处理映射表
    this.pendingRequests.set(requestKey, requestPromise);
    
    // 请求完成后从映射表中移除
    requestPromise.finally(() => {
      this.pendingRequests.delete(requestKey);
      this.abortControllers.delete(requestKey);
    });

    return requestPromise;
  }

  /**
   * 执行实际的日志创建请求
   */
  private static async executeCreateLog(logEntry: CreateLogEntry): Promise<LogEntry> {
    const requestKey = this.generateRequestKey(logEntry);
    
    // 创建AbortController用于请求取消控制
    const abortController = new AbortController();
    this.abortControllers.set(requestKey, abortController);

    try {
      // 确保数据完整性
      const cleanedLogEntry = {
        ...logEntry,
        message: logEntry.message?.trim() || '',
        details: logEntry.details?.trim(),
        source: logEntry.source?.trim(),
        exception: logEntry.exception?.trim(),
        // 移除可能导致序列化问题的空值
        ...Object.fromEntries(
          Object.entries(logEntry).filter(([_, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        )
      };

      const response = await apiClient.post('/api/log', cleanedLogEntry, {
        signal: abortController.signal,
        timeout: 10000, // 日志请求专用超时时间（10秒）
        headers: {
          'Content-Type': 'application/json',
          'X-Log-Request': 'true' // 标识为日志请求
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      // 如果是请求被取消，不记录为错误
      if (error.name === 'CanceledError' || 
          error.message?.includes('canceled') || 
          error.message?.includes('aborted') ||
          abortController.signal.aborted) {
        console.debug('Log request was canceled or aborted');
        throw error;
      }

      // 如果是499状态码（客户端关闭请求），也视为正常取消
      if (error.response?.status === 499) {
        console.debug('Log request closed by client (499)');
        throw error;
      }
      
      // 其他错误记录但不向上抛出，避免影响主要功能
      console.error('Failed to create log entry:', {
        error: error.message,
        status: error.response?.status,
        logEntry: {
          level: logEntry.level,
          category: logEntry.category,
          message: logEntry.message?.substring(0, 100), // 限制日志长度
          source: logEntry.source
        }
      });
      throw error;
    }
  }

  /**
   * 生成请求指纹用于去重
   */
  private static generateRequestKey(logEntry: CreateLogEntry): string {
    const key = `${logEntry.level}-${logEntry.category}-${logEntry.message}-${logEntry.source || 'unknown'}`;
    return btoa(key).substring(0, 16); // Base64编码后取前16位
  }

  /**
   * 取消所有未完成的日志请求
   * 通常在页面卸载时调用
   */
  static cancelAllPendingRequests(): void {
    console.debug(`Canceling ${this.abortControllers.size} pending log requests`);
    
    // 取消所有未完成的请求
    this.abortControllers.forEach((controller, key) => {
      try {
        controller.abort('Page unloading');
      } catch (error) {
        console.debug(`Failed to abort request ${key}:`, error);
      }
    });

    // 清理映射表
    this.abortControllers.clear();
    this.pendingRequests.clear();
  }

  /**
   * 获取当前未完成的日志请求数量
   */
  static getPendingRequestCount(): number {
    return this.pendingRequests.size;
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
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // 输入验证
    if (!message || message.trim() === '') {
      console.warn('Log message is empty, skipping log entry');
      return;
    }

    try {
      // 安全地序列化metadata
      let metadataString: string | undefined;
      if (metadata) {
        try {
          metadataString = JSON.stringify(metadata, (_, value) => {
            // 处理可能导致循环引用的对象
            if (typeof value === 'object' && value !== null) {
              if (value instanceof Error) {
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack
                };
              }
              // 限制对象深度，避免过大的序列化数据
              if (JSON.stringify(value).length > 10000) {
                return '[Object too large]';
              }
            }
            return value;
          });
        } catch (serializationError) {
          console.warn('Failed to serialize metadata:', serializationError);
          metadataString = '[Serialization failed]';
        }
      }

      await this.createLog({
        level,
        category: LogCategory.Frontend,
        message: message.trim(),
        details: details?.trim(),
        source: source?.trim(),
        exception: exception?.stack || exception?.message,
        userAgent: navigator?.userAgent,
        requestUrl: typeof window !== 'undefined' ? window.location?.href : undefined,
        metadata: metadataString
      });
    } catch (error: any) {
      // 避免日志记录失败影响主要功能
      // 只在非取消请求的情况下输出错误
      if (!error.name?.includes('Cancel') && !error.message?.includes('canceled')) {
        console.error('Failed to send log to server:', {
          error: error.message,
          level,
          message: message.substring(0, 100), // 只显示前100个字符
          source
        });
      }
    }
  }

  /**
   * 记录调试日志
   */
  static async debug(message: string, details?: string, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.Debug, message, details, source, undefined, metadata);
  }

  /**
   * 记录信息日志
   */
  static async info(message: string, details?: string, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.Info, message, details, source, undefined, metadata);
  }

  /**
   * 记录警告日志
   */
  static async warning(message: string, details?: string, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.Warning, message, details, source, undefined, metadata);
  }

  /**
   * 记录错误日志
   */
  static async error(message: string, exception?: Error, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.Error, message, undefined, source, exception, metadata);
  }

  /**
   * 记录致命错误日志
   */
  static async fatal(message: string, exception?: Error, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.Fatal, message, undefined, source, exception, metadata);
  }
}

// 导出默认实例
export const logApi = LogApi;
