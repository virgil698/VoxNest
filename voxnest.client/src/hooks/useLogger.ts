import { useCallback } from 'react';
import { LogApi, LogLevel, LogCategory } from '../api/log';

/**
 * 日志记录Hook
 * 提供便捷的日志记录方法
 */
export function useLogger(defaultSource?: string) {
  
  /**
   * 记录日志
   */
  const log = useCallback(async (
    level: LogLevel,
    message: string,
    details?: string,
    source?: string,
    exception?: Error,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await LogApi.log(
        level,
        message,
        details,
        source || defaultSource,
        exception,
        metadata
      );
    } catch (error) {
      console.error('Logger error:', error);
    }
  }, [defaultSource]);

  /**
   * 记录调试日志
   */
  const debug = useCallback((message: string, details?: string, metadata?: Record<string, unknown>) => {
    log(LogLevel.Debug, message, details, undefined, undefined, metadata);
  }, [log]);

  /**
   * 记录信息日志
   */
  const info = useCallback((message: string, details?: string, metadata?: Record<string, unknown>) => {
    log(LogLevel.Info, message, details, undefined, undefined, metadata);
  }, [log]);

  /**
   * 记录警告日志
   */
  const warning = useCallback((message: string, details?: string, metadata?: Record<string, unknown>) => {
    log(LogLevel.Warning, message, details, undefined, undefined, metadata);
  }, [log]);

  /**
   * 记录错误日志
   */
  const error = useCallback((message: string, exception?: Error, metadata?: Record<string, unknown>) => {
    log(LogLevel.Error, message, undefined, undefined, exception, metadata);
  }, [log]);

  /**
   * 记录致命错误日志
   */
  const fatal = useCallback((message: string, exception?: Error, metadata?: Record<string, unknown>) => {
    log(LogLevel.Fatal, message, undefined, undefined, exception, metadata);
  }, [log]);

  /**
   * 记录用户操作日志
   */
  const logUserAction = useCallback((action: string, details?: string, entityId?: number, entityType?: string) => {
    LogApi.createLog({
      level: LogLevel.Info,
      category: LogCategory.UserAction,
      message: `User action: ${action}`,
      details,
      source: defaultSource,
      relatedEntityId: entityId,
      relatedEntityType: entityType,
      userAgent: navigator.userAgent,
      requestUrl: window.location.href
    }).catch(error => {
      console.error('Failed to log user action:', error);
    });
  }, [defaultSource]);

  /**
   * 记录API调用日志
   */
  const logApiCall = useCallback((
    url: string,
    method: string,
    statusCode?: number,
    duration?: number,
    error?: Error
  ) => {
    const level = statusCode && statusCode >= 400 ? LogLevel.Error : LogLevel.Info;
    const message = `API ${method} ${url}${statusCode ? ` - ${statusCode}` : ''}`;
    
    LogApi.createLog({
      level,
      category: LogCategory.Api,
      message,
      source: defaultSource,
      httpMethod: method,
      requestUrl: url,
      statusCode,
      duration,
      exception: error?.stack || error?.message,
      userAgent: navigator.userAgent
    }).catch(err => {
      console.error('Failed to log API call:', err);
    });
  }, [defaultSource]);

  /**
   * 记录性能日志
   */
  const logPerformance = useCallback((metric: string, value: number, details?: string) => {
    LogApi.createLog({
      level: LogLevel.Info,
      category: LogCategory.Performance,
      message: `Performance: ${metric} = ${value}ms`,
      details,
      source: defaultSource,
      duration: value,
      userAgent: navigator.userAgent,
      requestUrl: window.location.href
    }).catch(error => {
      console.error('Failed to log performance:', error);
    });
  }, [defaultSource]);

  return {
    log,
    debug,
    info,
    warning,
    error,
    fatal,
    logUserAction,
    logApiCall,
    logPerformance
  };
}

/**
 * 全局错误处理Hook
 * 自动捕获并记录未处理的错误
 */
export function useGlobalErrorHandler(source?: string) {
  const logger = useLogger(source);

  const handleError = useCallback((error: Error, errorInfo?: Record<string, unknown>) => {
    logger.error('Unhandled error', error, {
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }, [logger]);

  // 全局错误监听
  const setupGlobalErrorHandling = useCallback(() => {
    // 监听JavaScript错误
    const errorHandler = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    // 监听Promise rejection
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
    };

    // 监听页面卸载，取消未完成的日志请求
    const beforeUnloadHandler = () => {
      LogApi.cancelAllPendingRequests();
    };

    // 监听页面隐藏（用户切换标签页等）
    const visibilityChangeHandler = () => {
      if (document.hidden) {
        // 页面隐藏时，如果有太多未完成的请求，取消它们
        const pendingCount = LogApi.getPendingRequestCount();
        if (pendingCount > 5) {
          console.debug(`Too many pending log requests (${pendingCount}), canceling them`);
          LogApi.cancelAllPendingRequests();
        }
      }
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    window.addEventListener('beforeunload', beforeUnloadHandler);
    document.addEventListener('visibilitychange', visibilityChangeHandler);

    // 清理函数
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
    };
  }, [handleError]);

  return {
    handleError,
    setupGlobalErrorHandling
  };
}
