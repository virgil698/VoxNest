/**
 * VoxNest 集成管理器
 * 参考 Astro Integration API 设计
 */

import type { 
  Integration, 
  IntegrationManager, 
  IntegrationHooks, 
  IntegrationContext,
  Logger 
} from './types';

export class EnhancedIntegrationManager implements IntegrationManager {
  private integrations = new Map<string, Integration>();
  private logger: Logger;
  private context: IntegrationContext;

  constructor(context: IntegrationContext) {
    this.context = context;
    this.logger = context.logger.createChild('IntegrationManager');
  }

  register(integration: Integration): void {
    if (this.integrations.has(integration.name)) {
      this.logger.warn(`Integration "${integration.name}" is already registered, replacing...`);
    }

    this.integrations.set(integration.name, integration);
    this.logger.info(`Registered integration: ${integration.name}`);

    // 如果框架已就绪，立即执行相关钩子
    if (this.context.framework.status === 'ready') {
      this.executeIntegrationHooks(integration, [
        'framework:ready',
        'components:ready',
        'app:started'
      ]);
    }
  }

  getAll(): Integration[] {
    return Array.from(this.integrations.values());
  }

  get(name: string): Integration | undefined {
    return this.integrations.get(name);
  }

  async executeHook<T extends keyof IntegrationHooks>(
    hook: T,
    context?: IntegrationContext
  ): Promise<void> {
    const hookContext = context || this.context;
    const promises: Promise<void>[] = [];

    this.logger.debug(`Executing hook: ${hook}`);

    for (const integration of this.integrations.values()) {
      if (integration.hooks?.[hook]) {
        try {
          const result = integration.hooks[hook]!(hookContext);
          if (result && typeof result.then === 'function') {
            promises.push(result as Promise<void>);
          }
        } catch (error) {
          this.logger.error(`Error executing hook "${hook}" in integration "${integration.name}":`, error);
        }
      }
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch (error) {
        this.logger.error(`Error in parallel execution of hook "${hook}":`, error);
      }
    }

    this.logger.debug(`Completed hook: ${hook}`);
  }

  private async executeIntegrationHooks(
    integration: Integration,
    hooks: (keyof IntegrationHooks)[]
  ): Promise<void> {
    for (const hook of hooks) {
      if (integration.hooks?.[hook]) {
        try {
          const result = integration.hooks[hook]!(this.context);
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (error) {
          this.logger.error(
            `Error executing hook "${hook}" in integration "${integration.name}":`, 
            error
          );
        }
      }
    }
  }

  // 获取集成统计信息
  getStats(): {
    total: number;
    withHooks: number;
    hookCounts: Record<keyof IntegrationHooks, number>;
  } {
    const stats = {
      total: this.integrations.size,
      withHooks: 0,
      hookCounts: {} as Record<keyof IntegrationHooks, number>
    };

    const hookNames: (keyof IntegrationHooks)[] = [
      'framework:ready',
      'components:ready',
      'app:start',
      'app:started',
      'app:destroy'
    ];

    hookNames.forEach(hook => {
      stats.hookCounts[hook] = 0;
    });

    this.integrations.forEach(integration => {
      if (integration.hooks) {
        stats.withHooks++;
        hookNames.forEach(hook => {
          if (integration.hooks![hook]) {
            stats.hookCounts[hook]++;
          }
        });
      }
    });

    return stats;
  }

  // 移除集成
  unregister(name: string): boolean {
    const integration = this.integrations.get(name);
    if (integration) {
      // 执行销毁钩子
      if (integration.hooks?.['app:destroy']) {
        try {
          const result = integration.hooks['app:destroy'](this.context);
          if (result && typeof result.then === 'function') {
            result.catch(error => 
              this.logger.error(`Error in destroy hook for integration "${name}":`, error)
            );
          }
        } catch (error) {
          this.logger.error(`Error in destroy hook for integration "${name}":`, error);
        }
      }

      this.integrations.delete(name);
      this.logger.info(`Unregistered integration: ${name}`);
      return true;
    }
    return false;
  }

  // 清理所有集成
  async clearAll(): Promise<void> {
    this.logger.info('Clearing all integrations...');
    
    // 执行所有销毁钩子
    await this.executeHook('app:destroy');
    
    this.integrations.clear();
    this.logger.info('All integrations cleared');
  }

  updateContext(context: IntegrationContext): void {
    this.context = context;
  }
}
