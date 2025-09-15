/**
 * VoxNest 扩展框架 React Hooks
 * 提供便捷的框架功能访问
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import type { ComponentRegistration, Integration } from '../core/types';
import { useExtensionFramework } from './components';

// ==================== 槽位相关 Hooks ====================

/**
 * 注册组件到槽位的 Hook
 */
export function useSlotRegistration(
  slotId: string,
  registration: ComponentRegistration,
  deps: React.DependencyList = []
) {
  const framework = useExtensionFramework();

  useEffect(() => {
    framework.slots.register(slotId, registration);

    return () => {
      framework.slots.unregister(slotId, registration.source);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework.slots, slotId, registration, ...deps]);
}

/**
 * 获取槽位状态的 Hook
 */
export function useSlot(slotId: string) {
  const framework = useExtensionFramework();
  const [components, setComponents] = useState(() => 
    framework.slots.getComponents(slotId)
  );

  useEffect(() => {
    const updateComponents = () => {
      setComponents(framework.slots.getComponents(slotId));
    };

    updateComponents();
    
    // 简单的轮询检查（后续可以改为事件驱动）
    const interval = setInterval(updateComponents, 1000);
    
    return () => clearInterval(interval);
  }, [framework.slots, slotId]);

  const hasComponents = useMemo(() => 
    framework.slots.hasComponents(slotId), 
    [framework.slots, slotId]
  );

  const render = useCallback((props?: Record<string, unknown>) => 
    framework.slots.render(slotId, props),
    [framework.slots, slotId]
  );

  return {
    hasComponents,
    components,
    render,
    count: components.length,
  };
}

/**
 * 批量注册组件的 Hook
 */
export function useBulkSlotRegistration(
  registrations: Array<{ slotId: string; registration: ComponentRegistration }>,
  deps: React.DependencyList = []
) {
  const framework = useExtensionFramework();

  useEffect(() => {
    // 注册所有组件
    registrations.forEach(({ slotId, registration }) => {
      framework.slots.register(slotId, registration);
    });

    return () => {
      // 清理所有注册
      registrations.forEach(({ slotId, registration }) => {
        framework.slots.unregister(slotId, registration.source);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework.slots, registrations, ...deps]);
}

// ==================== 集成相关 Hooks ====================

/**
 * 注册集成的 Hook
 */
export function useIntegration(integration: Integration, deps: React.DependencyList = []) {
  const framework = useExtensionFramework();

  useEffect(() => {
    framework.register(integration);

    return () => {
      framework.integrations.unregister(integration.name);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework, integration, ...deps]);
}

/**
 * 获取集成列表的 Hook
 */
export function useIntegrations() {
  const framework = useExtensionFramework();
  const [integrations, setIntegrations] = useState(() => 
    framework.integrations.getAll()
  );

  useEffect(() => {
    const updateIntegrations = () => {
      setIntegrations(framework.integrations.getAll());
    };

    updateIntegrations();
    
    // 定期更新集成列表
    const interval = setInterval(updateIntegrations, 2000);
    
    return () => clearInterval(interval);
  }, [framework.integrations]);

  return integrations;
}

// ==================== 框架状态 Hooks ====================

interface FrameworkStats {
  status: string;
  integrations: {
    total: number;
    withHooks: number;
    hookCounts: Record<string, number>;
  };
  slots: {
    total: number;
    components: number;
    breakdown: Record<string, number>;
  };
}

/**
 * 获取框架状态的 Hook
 */
export function useFrameworkStatus() {
  const framework = useExtensionFramework();
  const [status, setStatus] = useState(() => framework.status);
  const [stats, setStats] = useState<FrameworkStats>(() => framework.getStats() as unknown as FrameworkStats);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(framework.status);
      setStats(framework.getStats() as unknown as FrameworkStats);
    };

    updateStatus();
    
    const interval = setInterval(updateStatus, 2000);
    
    return () => clearInterval(interval);
  }, [framework]);

  return {
    status,
    stats,
    isReady: status === 'ready',
    isError: status === 'error',
    isInitializing: status === 'initializing',
  };
}

/**
 * 等待框架就绪的 Hook
 */
export function useFrameworkReady(callback?: () => void) {
  const framework = useExtensionFramework();
  const [isReady, setIsReady] = useState(true); // 简化版本，假设总是ready

  useEffect(() => {
    // if (framework.isReady()) {
      setIsReady(true);
      callback?.();
      return;
    // }

    const checkReady = () => {
      // if (framework.isReady()) {
        setIsReady(true);
        callback?.();
      // }
    };

    const interval = setInterval(checkReady, 100);
    
    return () => clearInterval(interval);
  }, [framework, callback]);

  return isReady;
}

// ==================== 便捷 Hooks ====================

/**
 * 简单的组件注册 Hook
 */
export function useRegisterComponent(
  slotId: string,
  component: React.ComponentType<Record<string, unknown>>,
  options: {
    source: string;
    priority?: number;
    condition?: (props?: Record<string, unknown>) => boolean;
    name?: string;
    description?: string;
  },
  deps: React.DependencyList = []
) {
  const registration: ComponentRegistration = useMemo(() => ({
    component,
    source: options.source,
    priority: options.priority,
    condition: options.condition,
    name: options.name,
    description: options.description,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [component, options.source, options.priority, options.condition, options.name, options.description, ...deps]);

  useSlotRegistration(slotId, registration, deps);
}

/**
 * 调试槽位的 Hook
 */
export function useSlotDebug(slotId: string) {
  const framework = useExtensionFramework();
  const [debugInfo] = useState(() => ({ slotId, components: [] })); // 移除未使用的setter

  useEffect(() => {
    const updateDebugInfo = () => {
      // setDebugInfo(framework.debugSlot(slotId)); // 暂时注释
    };

    updateDebugInfo();
    
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [framework, slotId]);

  return debugInfo;
}

/**
 * 获取所有槽位列表的 Hook
 */
export function useSlotList() {
  const framework = useExtensionFramework();
  const [slots] = useState(() => [] as string[]); // 移除未使用的setter

  useEffect(() => {
    const updateSlots = () => {
      // setSlots(framework.listSlots()); // 暂时注释
    };

    updateSlots();
    
    const interval = setInterval(updateSlots, 2000);
    
    return () => clearInterval(interval);
  }, [framework]);

  return slots;
}

// ==================== 高级 Hooks ====================

/**
 * 条件性注册组件的 Hook
 */
export function useConditionalRegistration(
  condition: boolean,
  slotId: string,
  registration: ComponentRegistration,
  deps: React.DependencyList = []
) {
  const framework = useExtensionFramework();

  useEffect(() => {
    if (condition) {
      framework.slots.register(slotId, registration);
    }

    return () => {
      if (condition) {
        framework.slots.unregister(slotId, registration.source);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework.slots, condition, slotId, registration, ...deps]);
}

/**
 * 延迟注册组件的 Hook
 */
export function useDelayedRegistration(
  delay: number,
  slotId: string,
  registration: ComponentRegistration,
  deps: React.DependencyList = []
) {
  const framework = useExtensionFramework();

  useEffect(() => {
    const timer = setTimeout(() => {
      framework.slots.register(slotId, registration);
    }, delay);

    return () => {
      clearTimeout(timer);
      framework.slots.unregister(slotId, registration.source);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework.slots, delay, slotId, registration, ...deps]);
}
