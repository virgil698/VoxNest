/**
 * VoxNest 扩展框架统一入口
 * 参考 Astro API 设计，提供完整的扩展能力
 */

// ==================== 核心导出 ====================

// 类型定义
export type {
  VoxNestConfig,
  Integration,
  IntegrationHooks,
  IntegrationContext,
  ExtensionFramework,
  ComponentRegistration,
  SlotManager,
  IntegrationManager,
  Logger,
  SlotProps,
  ExtensionProviderProps,
} from './core/types';

// 核心框架
export { 
  VoxNestExtensionFramework,
  getGlobalFramework,
  resetGlobalFramework 
} from './core/ExtensionFramework';

export { createLogger } from './core/Logger';
export { EnhancedSlotManager } from './core/SlotManager';
export { EnhancedIntegrationManager } from './core/IntegrationManager';

// ==================== React 集成 ====================

// React 组件
export {
  ExtensionProvider,
  Slot,
  ConditionalSlot,
  SlotDebugger,
  FrameworkStatus,
  useExtensionFramework,
} from './react/components';

// React Hooks
export {
  useSlotRegistration,
  useSlot,
  useBulkSlotRegistration,
  useIntegration,
  useIntegrations,
  useFrameworkStatus,
  useFrameworkReady,
  useRegisterComponent,
  useSlotDebug,
  useSlotList,
  useConditionalRegistration,
  useDelayedRegistration,
} from './react/hooks';

// ==================== 内置集成 ====================

export {
  createReactIntegration,
  createDevToolsIntegration,
  createLayoutIntegration,
  createStyleIntegration,
  createRouterIntegration,
  getBuiltinIntegrations,
  createCustomIntegration,
  createSimpleIntegration,
  createComponentIntegration,
} from './integrations/builtin';

// ==================== 扩展管理 ====================

export {
  ExtensionDiscovery,
  type ExtensionManifest,
  type DiscoveredExtension,
} from './manager/ExtensionDiscovery';

export {
  ExtensionLoader,
  LoadingStatus,
  type LoadedExtension,
} from './manager/ExtensionLoader';

// ==================== 便捷函数 ====================

import { getGlobalFramework } from './core/ExtensionFramework';
import { getBuiltinIntegrations } from './integrations/builtin';
import type { ComponentRegistration, VoxNestConfig } from './core/types';

/**
 * 快速注册组件到槽位
 */
export function registerToSlot(
  slotId: string, 
  component: React.ComponentType<Record<string, unknown>>,
  options: {
    source?: string;
    priority?: number;
    condition?: (props?: Record<string, unknown>) => boolean;
    name?: string;
  } = {}
): void {
  const framework = getGlobalFramework();
  
  const registration: ComponentRegistration = {
    component,
    source: options.source || 'global',
    priority: options.priority || 0,
    condition: options.condition,
    name: options.name,
  };

  framework.slots.register(slotId, registration);
}

/**
 * 从槽位注销组件
 */
export function unregisterFromSlot(slotId: string, source: string): void {
  const framework = getGlobalFramework();
  framework.slots.unregister(slotId, source);
}

/**
 * 检查槽位是否有组件
 */
export function hasSlotComponents(slotId: string): boolean {
  const framework = getGlobalFramework();
  return framework.slots.hasComponents(slotId);
}

/**
 * 获取槽位组件数量
 */
export function getSlotComponentCount(slotId: string): number {
  const framework = getGlobalFramework();
  return framework.slots.getComponents(slotId).length;
}

/**
 * 初始化扩展框架
 */
export async function initializeFramework(config: VoxNestConfig = {}): Promise<void> {
  const framework = getGlobalFramework();
  
  // 注册内置集成
  if (config.autoRegisterBuiltins !== false) {
    const builtinIntegrations = getBuiltinIntegrations();
    builtinIntegrations.forEach(integration => {
      framework.register(integration);
    });
  }

  // 初始化框架
  await framework.initialize(config);
}

/**
 * 获取框架实例
 */
export function getFramework() {
  return getGlobalFramework();
}

/**
 * 销毁框架
 */
export async function destroyFramework(): Promise<void> {
  const framework = getGlobalFramework();
  await framework.destroy();
}

// ==================== 调试工具 ====================

/**
 * 获取所有槽位列表
 */
export function listAllSlots(): string[] {
  const framework = getGlobalFramework();
  return framework.listSlots();
}

/**
 * 调试槽位
 */
export function debugSlot(slotId: string) {
  const framework = getGlobalFramework();
  return framework.debugSlot(slotId);
}

/**
 * 获取框架统计信息
 */
export function getFrameworkStats() {
  const framework = getGlobalFramework();
  return framework.getStats();
}

/**
 * 打印框架状态到控制台
 */
export function printFrameworkStatus(): void {
  const framework = getGlobalFramework();
  const stats = framework.getStats();
  
  console.group('🚀 VoxNest Extension Framework Status');
  console.log('Status:', stats.status);
  console.log('Config:', stats.config);
  console.group('Integrations');
  console.log('Total:', stats.integrations.total);
  console.log('With Hooks:', stats.integrations.withHooks);
  console.log('Hook Counts:', stats.integrations.hookCounts);
  console.groupEnd();
  console.group('Slots');
  console.log('Total Slots:', stats.slots.total);
  console.log('Total Components:', stats.slots.components);
  console.log('Breakdown:', stats.slots.breakdown);
  console.groupEnd();
  console.groupEnd();
}

// ==================== 全局快捷键 (开发环境) ====================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('keydown', (event) => {
    // Ctrl+Shift+V: 打印 VoxNest 状态
    if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      printFrameworkStatus();
    }
  });
  
  // 暴露调试方法到全局
  (window as unknown as Record<string, unknown>).__VoxNestExtensions = {
    getFramework,
    getStats: getFrameworkStats,
    printStatus: printFrameworkStatus,
    listSlots: listAllSlots,
    debugSlot,
  };
}

// ==================== 默认导出 ====================

export default {
  // 核心功能
  getFramework,
  initializeFramework,
  destroyFramework,
  
  // 组件注册
  registerToSlot,
  unregisterFromSlot,
  
  // 调试功能
  getStats: getFrameworkStats,
  printStatus: printFrameworkStatus,
  listSlots: listAllSlots,
  debugSlot,
};
