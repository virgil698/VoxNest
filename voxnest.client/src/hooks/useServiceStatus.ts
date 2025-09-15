import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useLogger } from './useLogger';

interface ServiceStatus {
  isInstalled: boolean;
  hasConfig: boolean;
  timestamp: string;
  version: string;
}

interface ServiceStatusHook {
  status: ServiceStatus | null;
  isLoading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  isServiceReady: boolean;
  isConfigurationChanged: boolean;
}

/**
 * 服务状态监控Hook
 * 用于检测后端服务状态和配置变化
 */
export function useServiceStatus(): ServiceStatusHook {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastKnownStatus, setLastKnownStatus] = useState<ServiceStatus | null>(null);
  const logger = useLogger('ServiceStatus');

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<ServiceStatus>('/configuration/status');
      const newStatus = response.data.data!;
      
      // 检测配置是否发生变化
      if (lastKnownStatus && 
          (lastKnownStatus.isInstalled !== newStatus.isInstalled || 
           lastKnownStatus.hasConfig !== newStatus.hasConfig)) {
        logger.info('Service configuration changed', JSON.stringify({
          before: lastKnownStatus,
          after: newStatus
        }));
      }
      
      setStatus(newStatus);
      setLastKnownStatus(newStatus);
      logger.debug('Service status updated', JSON.stringify(newStatus));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查服务状态失败';
      setError(errorMessage);
      logger.error('Failed to check service status', err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [lastKnownStatus, logger]);

  // 自动定期检查服务状态
  useEffect(() => {
    // 立即检查一次
    checkStatus();
    
    // 每30秒检查一次（比其他API请求频率低）
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  // 页面获得焦点时检查
  useEffect(() => {
    const handleFocus = () => {
      checkStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkStatus]);

  const isServiceReady = status?.isInstalled === true && status?.hasConfig === true;
  const isConfigurationChanged = lastKnownStatus !== null && 
    status !== null && 
    (lastKnownStatus.isInstalled !== status.isInstalled || 
     lastKnownStatus.hasConfig !== status.hasConfig);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    isServiceReady,
    isConfigurationChanged
  };
}

/**
 * 安装完成后的服务重启监控Hook
 */
export function usePostInstallMonitor(onServiceReady?: () => void): {
  isMonitoring: boolean;
  waitingForRestart: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
} {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [waitingForRestart, setWaitingForRestart] = useState(false);
  const { status, checkStatus } = useServiceStatus();
  const logger = useLogger('PostInstallMonitor');

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setWaitingForRestart(true);
    logger.info('Started post-install monitoring');
  }, [logger]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setWaitingForRestart(false);
    logger.info('Stopped post-install monitoring');
  }, [logger]);

  useEffect(() => {
    if (!isMonitoring || !waitingForRestart) return;

    // 检查服务是否已经重启并准备就绪
    if (status?.isInstalled && status?.hasConfig) {
      logger.info('Service is ready after installation');
      setWaitingForRestart(false);
      onServiceReady?.();
    }
  }, [status, isMonitoring, waitingForRestart, onServiceReady, logger]);

  useEffect(() => {
    if (!isMonitoring) return;

    // 每5秒检查一次（比正常频率高，因为在等待重启）
    const interval = setInterval(() => {
      if (waitingForRestart) {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring, waitingForRestart, checkStatus]);

  return {
    isMonitoring,
    waitingForRestart,
    startMonitoring,
    stopMonitoring
  };
}
