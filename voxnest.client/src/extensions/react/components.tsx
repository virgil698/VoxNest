/**
 * VoxNest 扩展框架 React 组件
 * 提供槽位和集成的 React 集成
 */

import React, { useContext, useEffect, useState, useMemo } from 'react';
import type { 
  ExtensionFramework, 
  VoxNestConfig, 
  SlotProps,
  ExtensionProviderProps,
  ComponentRegistration
} from '../core/types';
import { getGlobalFramework } from '../core/ExtensionFramework';

// ==================== Context ====================

const ExtensionContext = React.createContext<ExtensionFramework | null>(null);

export function useExtensionFramework(): ExtensionFramework {
  const framework = useContext(ExtensionContext);
  if (!framework) {
    throw new Error('useExtensionFramework must be used within ExtensionProvider');
  }
  return framework;
}

// ==================== Provider ====================

export function ExtensionProvider({ 
  children, 
  config = {} 
}: ExtensionProviderProps) {
  const [framework] = useState(() => getGlobalFramework());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeFramework() {
      try {
        await framework.initialize(config);
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown initialization error'));
        }
      }
    }

    initializeFramework();

    return () => {
      mounted = false;
      // 注意: 不在这里销毁框架，因为它可能被其他组件使用
    };
  }, [framework, config]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#fee', 
        color: '#c00',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '10px'
      }}>
        <h3>Extension Framework Error</h3>
        <p>{error.message}</p>
        <details>
          <summary>Stack Trace</summary>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {error.stack}
          </pre>
        </details>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#f9f9f9',
        color: '#666',
        textAlign: 'center' as const
      }}>
        Initializing Extension Framework...
      </div>
    );
  }

  return (
    <ExtensionContext.Provider value={framework}>
      {children}
    </ExtensionContext.Provider>
  );
}

// ==================== Slot 组件 ====================

export function Slot({ 
  id, 
  props, 
  fallback, 
  className, 
  style, 
  wrapper = true 
}: SlotProps) {
  const framework = useExtensionFramework();
  const [components, setComponents] = useState<ComponentRegistration[]>([]);

  useEffect(() => {
    // 获取组件并监听变化
    const updateComponents = () => {
      const newComponents = framework.slots.getComponents(id);
      setComponents(newComponents);
    };

    updateComponents();

    // TODO: 实现组件变化监听
    // 现在简单地定期检查（后续可以改为事件驱动）
    const interval = setInterval(updateComponents, 1000);
    
    return () => clearInterval(interval);
  }, [framework.slots, id]);

  const content = useMemo(() => {
    if (components.length === 0) {
      return fallback || null;
    }

    return framework.slots.render(id, props);
  }, [framework.slots, id, props, components.length, fallback]);

  if (!wrapper && !content) {
    return null;
  }

  if (!wrapper) {
    return <>{content}</>;
  }

  return (
    <div className={className} style={style} data-slot={id}>
      {content}
    </div>
  );
}

// ==================== 条件槽位组件 ====================

export function ConditionalSlot({
  id,
  props,
  fallback,
  className,
  style,
}: SlotProps) {
  const framework = useExtensionFramework();
  const hasComponents = framework.slots.hasComponents(id);

  if (!hasComponents) {
    return fallback ? (
      <div className={className} style={style} data-slot={id}>
        {fallback}
      </div>
    ) : null;
  }

  return (
    <Slot 
      id={id} 
      props={props} 
      className={className} 
      style={style} 
      wrapper={true}
    />
  );
}

// ==================== 槽位调试组件 ====================

export function SlotDebugger({ slotId }: { slotId: string }) {
  const framework = useExtensionFramework();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo(framework.debugSlot(slotId));
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    
    return () => clearInterval(interval);
  }, [framework, slotId]);

  if (!debugInfo || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <details 
      style={{ 
        margin: '10px', 
        padding: '10px', 
        background: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '12px'
      }}
    >
      <summary>🔍 Slot Debug: {slotId}</summary>
      <pre style={{ margin: '10px 0', overflow: 'auto' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </details>
  );
}

// ==================== 框架状态组件 ====================

export function FrameworkStatus() {
  const framework = useExtensionFramework();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(framework.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    
    return () => clearInterval(interval);
  }, [framework]);

  if (!stats || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <details 
      style={{ 
        position: 'fixed' as const,
        top: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'white',
        border: '2px solid #007acc',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        🚀 VoxNest Extensions ({stats.status})
      </summary>
      <div style={{ marginTop: '10px' }}>
        <h4>Integrations: {stats.integrations.total}</h4>
        <ul>
          <li>With Hooks: {stats.integrations.withHooks}</li>
          <li>Hook Counts: {JSON.stringify(stats.integrations.hookCounts)}</li>
        </ul>
        <h4>Slots: {stats.slots.total}</h4>
        <ul>
          <li>Total Components: {stats.slots.components}</li>
          <li>Breakdown: {JSON.stringify(stats.slots.breakdown)}</li>
        </ul>
      </div>
    </details>
  );
}
