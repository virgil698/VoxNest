/**
 * VoxNest 扩展框架核心
 * 参考 Astro 架构设计，提供完整的扩展能力
 */

import type { 
  ExtensionFramework, 
  VoxNestConfig, 
  Integration,
  IntegrationContext,
  SlotManager,
  IntegrationManager,
  Logger
} from './types';

import { createLogger } from './Logger';
import { EnhancedSlotManager } from './SlotManager';
import { EnhancedIntegrationManager } from './IntegrationManager';

export class VoxNestExtensionFramework implements ExtensionFramework {
  private _status: ExtensionFramework['status'] = 'initializing';
  private _config: VoxNestConfig = {};
  private _slots: SlotManager;
  private _integrations: IntegrationManager;
  private _logger: Logger;

  constructor() {
    this._logger = createLogger('Framework');
    this._slots = new EnhancedSlotManager(this._logger);
    
    // 创建集成上下文
    const context: IntegrationContext = {
      framework: this,
      config: this._config,
      logger: this._logger,
      slots: this._slots,
    };
    
    this._integrations = new EnhancedIntegrationManager(context);
    
    this._logger.debug('Framework instance created');
  }

  get status() { return this._status; }
  get config() { return this._config; }
  get slots() { return this._slots; }
  get integrations() { return this._integrations; }
  get logger() { return this._logger; }

  async initialize(config: VoxNestConfig = {}): Promise<void> {
    try {
      this._status = 'initializing';
      this._config = { ...this._config, ...config };
      
      // 重新创建日志器如果级别改变了
      if (config.logLevel) {
        this._logger = createLogger('Framework', config.logLevel);
      }

      this._logger.info('Initializing VoxNest Extension Framework', { config: this._config });

      // 更新集成上下文
      this.updateIntegrationContext();

      // 执行框架就绪钩子
      await this._integrations.executeHook('framework:ready');

      // 执行组件系统就绪钩子
      await this._integrations.executeHook('components:ready');

      this._status = 'ready';
      
      // 执行应用启动钩子
      await this._integrations.executeHook('app:started');

      this._logger.info('Framework initialized successfully');
    } catch (error) {
      this._status = 'error';
      this._logger.error('Failed to initialize framework:', error);
      throw error;
    }
  }

  register(integration: Integration): void {
    this._logger.debug(`Registering integration: ${integration.name}`);
    this._integrations.register(integration);
  }

  async destroy(): Promise<void> {
    this._logger.info('Destroying framework...');
    
    try {
      // 执行销毁钩子
      await this._integrations.executeHook('app:destroy');
      
      // 清理所有集成
      await this._integrations.clearAll();
      
      // 清理所有槽位
      this._slots.clearAll();
      
      this._status = 'initializing';
      this._logger.info('Framework destroyed successfully');
    } catch (error) {
      this._logger.error('Error during framework destruction:', error);
      throw error;
    }
  }

  private updateIntegrationContext(): void {
    const context: IntegrationContext = {
      framework: this,
      config: this._config,
      logger: this._logger,
      slots: this._slots,
    };

    (this._integrations as EnhancedIntegrationManager).updateContext(context);
  }

  // 便捷方法
  isReady(): boolean {
    return this._status === 'ready';
  }

  getStats() {
    const integrationStats = (this._integrations as EnhancedIntegrationManager).getStats();
    const slotStats = (this._slots as EnhancedSlotManager).getSlotStats();

    return {
      status: this._status,
      config: this._config,
      integrations: integrationStats,
      slots: {
        total: Object.keys(slotStats).length,
        components: Object.values(slotStats).reduce((sum, count) => sum + count, 0),
        breakdown: slotStats,
      },
    };
  }

  // 开发者辅助方法
  listSlots(): string[] {
    return (this._slots as EnhancedSlotManager).getAllSlots();
  }

  debugSlot(slotId: string): {
    exists: boolean;
    componentCount: number;
    components: Array<{
      source: string;
      name?: string;
      priority?: number;
      hasCondition: boolean;
    }>;
  } {
    const components = this._slots.getComponents(slotId);
    
    return {
      exists: components.length > 0,
      componentCount: components.length,
      components: components.map(reg => ({
        source: reg.source,
        name: reg.name,
        priority: reg.priority,
        hasCondition: !!reg.condition,
      })),
    };
  }
}

// 全局实例
let globalFramework: VoxNestExtensionFramework | null = null;

export function getGlobalFramework(): VoxNestExtensionFramework {
  if (!globalFramework) {
    globalFramework = new VoxNestExtensionFramework();
  }
  return globalFramework;
}

export function resetGlobalFramework(): void {
  if (globalFramework) {
    globalFramework.destroy().catch(console.error);
    globalFramework = null;
  }
}
