import { useState, useEffect, useCallback, useRef } from 'react';
import { message, notification } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

// 网络状态Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      message.success('网络连接已恢复');
    };

    const handleOffline = () => {
      setIsOnline(false);
      message.warning('网络连接已断开');
    };

    // 检测连接速度
    const checkConnectionSpeed = () => {
      const connection = (navigator as { connection?: { effectiveType?: string; downlink?: number } }).connection;
      if (connection) {
        // 检测慢速连接（< 1Mbps）
        const isSlow = connection.effectiveType === 'slow-2g' || 
                       connection.effectiveType === '2g' ||
                       Boolean(connection.downlink && connection.downlink < 1);
        setIsSlowConnection(isSlow);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 监听连接变化
    const connection = (navigator as { connection?: { addEventListener?: (event: string, handler: () => void) => void; removeEventListener?: (event: string, handler: () => void) => void } }).connection;
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', checkConnectionSpeed);
      checkConnectionSpeed(); // 初始检查
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', checkConnectionSpeed);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isSlowConnection,
  };
}

// 页面可见性Hook
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// 智能预加载Hook
export function usePrefetch() {
  const queryClient = useQueryClient();
  const [isIdle, setIsIdle] = useState(false);

  // 检测用户是否空闲
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsIdle(true);
      }, 3000); // 3秒后认为用户空闲
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer(); // 初始设置

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      clearTimeout(timeoutId);
    };
  }, []);

  // 预取函数
  const prefetch = useCallback(async (
    queryKey: unknown[],
    queryFn: () => Promise<unknown>,
    options?: {
      staleTime?: number;
      priority?: 'high' | 'low';
    }
  ) => {
    const { staleTime = 1000 * 60 * 5, priority = 'low' } = options || {};

    // 低优先级的预取只在用户空闲时执行
    if (priority === 'low' && !isIdle) {
      return;
    }

    // 检查是否已经有数据
    const existingData = queryClient.getQueryData(queryKey);
    if (existingData) {
      return;
    }

    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [queryClient, isIdle]);

  return {
    prefetch,
    isIdle,
  };
}

// 表单自动保存Hook
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void> | void,
  options?: {
    delay?: number;
    enabled?: boolean;
  }
) {
  const { delay = 2000, enabled = true } = options || {};
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const save = useCallback(async (dataToSave: T) => {
    if (!enabled) return;

    try {
      setIsSaving(true);
      await onSave(dataToSave);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      message.error('自动保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, enabled]);

  useEffect(() => {
    if (!enabled || !data) return;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      save(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, delay, enabled]);

  return {
    isSaving,
    lastSaved,
    forceSave: () => save(data),
  };
}

// 键盘快捷键Hook
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const key = event.key.toLowerCase();
      const combination = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        key
      ].filter(Boolean).join('+');

      const handler = shortcuts[combination];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// 用户操作追踪Hook
export function useUserActivity() {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateActivity = () => {
      setIsActive(true);
      setLastActivity(new Date());
      
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 5分钟后认为用户不活跃
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, 5 * 60 * 1000);
    };

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    updateActivity(); // 初始化

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isActive,
    lastActivity,
    getInactiveTime: () => Date.now() - lastActivity.getTime(),
  };
}

// 性能监控Hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    renderTime?: number;
    networkLatency?: number;
  }>({});

  useEffect(() => {
    // 页面加载性能
    const updateLoadMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          networkLatency: navigation.responseStart - navigation.requestStart,
        }));
      }
    };

    // React 渲染性能
    const measureRenderTime = () => {
      const paintEntries = performance.getEntriesByType('paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (firstContentfulPaint) {
        setMetrics(prev => ({
          ...prev,
          renderTime: firstContentfulPaint.startTime,
        }));
      }
    };

    // 延迟执行以确保所有指标都可用
    setTimeout(() => {
      updateLoadMetrics();
      measureRenderTime();
    }, 1000);

    return () => {
      // 清理性能观察器
    };
  }, []);

  // 警告慢速性能
  useEffect(() => {
    if (metrics.loadTime && metrics.loadTime > 3000) {
      console.warn('Slow page load detected:', metrics.loadTime, 'ms');
    }
    if (metrics.renderTime && metrics.renderTime > 2000) {
      console.warn('Slow render detected:', metrics.renderTime, 'ms');
    }
  }, [metrics]);

  return metrics;
}

// 智能通知Hook
export function useSmartNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { isActive } = useUserActivity();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  const notify = useCallback((title: string, options?: {
    body?: string;
    icon?: string;
    tag?: string;
    requiresAction?: boolean;
  }) => {
    const { body, icon, tag, requiresAction = false } = options || {};

    // 如果用户当前活跃，使用应用内通知
    if (isActive && !requiresAction) {
      notification.info({
        message: title,
        description: body,
        placement: 'topRight',
      });
      return;
    }

    // 如果用户不活跃或需要操作，使用系统通知
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 5秒后自动关闭
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }, [permission, isActive]);

  return {
    permission,
    requestPermission,
    notify,
    canNotify: permission === 'granted',
  };
}
