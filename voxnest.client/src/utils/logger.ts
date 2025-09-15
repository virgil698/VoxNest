import { LogApi, LogLevel } from '../api/log';

/**
 * 全局日志配置
 */
export class Logger {
  private static instance: Logger;
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取日志器单例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 初始化全局日志
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 设置全局错误处理
      this.setupGlobalErrorHandling();

      // 记录应用启动日志
      await LogApi.info('Application started', 'VoxNest frontend application initialized successfully');

      // 记录浏览器信息
      await LogApi.debug('Browser info', JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }));

      this.isInitialized = true;
      console.log('✅ Logger initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize logger:', error);
    }
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
      LogApi.error(
        `Unhandled JavaScript error: ${event.message}`,
        new Error(event.message),
        'GlobalErrorHandler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      ).catch(console.error);
    });

    // 捕获未处理的Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      LogApi.error(
        'Unhandled promise rejection',
        error,
        'GlobalErrorHandler',
        {
          reason: event.reason,
          type: 'unhandledrejection'
        }
      ).catch(console.error);

      // 防止默认行为（在控制台显示错误）
      event.preventDefault();
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      const state = document.hidden ? 'hidden' : 'visible';
      LogApi.debug(`Page visibility changed to ${state}`, undefined, 'VisibilityMonitor')
        .catch(console.error);
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      // 发送最后的日志（使用sendBeacon确保发送成功）
      LogApi.info('Application closing', 'User is leaving the application')
        .catch(console.error);
    });
  }

  /**
   * 记录页面访问
   */
  async logPageVisit(pageName: string, path: string): Promise<void> {
    try {
      await LogApi.info(`Page visit: ${pageName}`, `User visited page: ${path}`, 'PageTracker', {
        pageName,
        path,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log page visit:', error);
    }
  }

  /**
   * 记录性能指标
   */
  async logPerformanceMetrics(): Promise<void> {
    try {
      if ('performance' in window && 'timing' in window.performance) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        const firstPaint = timing.domLoading - timing.navigationStart;

        await LogApi.info('Performance metrics', JSON.stringify({
          loadTime,
          domReady,
          firstPaint,
          url: window.location.href
        }), 'PerformanceTracker');
      }
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  }

  /**
   * 记录API调用
   */
  async logApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: Error
  ): Promise<void> {
    try {
      const level = status >= 400 || error ? LogLevel.Error : LogLevel.Info;
      const message = `API ${method} ${url} - ${status}`;
      
      await LogApi.log(
        level,
        message,
        error ? error.message : undefined,
        'ApiTracker',
        error,
        {
          method,
          url,
          status,
          duration,
          timestamp: new Date().toISOString()
        }
      );
    } catch (err) {
      console.error('Failed to log API call:', err);
    }
  }

  /**
   * 记录用户行为
   */
  async logUserBehavior(action: string, details?: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await LogApi.info(`User action: ${action}`, details || `User performed: ${action}`, 'UserBehavior', {
        action,
        details,
        metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    } catch (error) {
      console.error('Failed to log user behavior:', error);
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 移除事件监听器等清理工作
    this.isInitialized = false;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();
