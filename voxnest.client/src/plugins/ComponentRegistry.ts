/**
 * VoxNest 动态组件注册器
 * 负责组件的注册、管理和动态加载
 */

import type { ComponentType } from 'react';
import type { IComponentRegistry, ComponentConfig } from './types';
import { EventEmitter } from 'events';

export class ComponentRegistry implements IComponentRegistry {
  private static _instance: ComponentRegistry | null = null;
  
  private _components = new Map<string, ComponentConfig>();
  private _eventEmitter = new EventEmitter();

  private constructor() {}

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry._instance) {
      ComponentRegistry._instance = new ComponentRegistry();
    }
    return ComponentRegistry._instance;
  }

  // ===========================================
  // 组件注册和管理
  // ===========================================

  /**
   * 注册组件
   */
  public register(config: ComponentConfig): void {
    if (this._components.has(config.name)) {
      console.warn(`组件 "${config.name}" 已存在，将被替换`);
    }

    // 验证组件配置
    this.validateComponentConfig(config);

    // 注册组件
    this._components.set(config.name, config);

    // 触发变化事件
    this._eventEmitter.emit('component-change', config.name, config);

    console.log(`✅ 组件 "${config.name}" 注册成功`);
  }

  /**
   * 批量注册组件
   */
  public registerComponents(configs: ComponentConfig[]): void {
    for (const config of configs) {
      this.register(config);
    }
  }

  /**
   * 获取组件
   */
  public getComponent<T = ComponentType<any>>(name: string): T | undefined {
    const config = this._components.get(name);
    return config?.component as T;
  }

  /**
   * 获取所有组件
   */
  public getAllComponents(): Map<string, ComponentConfig> {
    return new Map(this._components);
  }

  /**
   * 按类型获取组件
   */
  public getComponentsByType(type: ComponentConfig['type']): ComponentConfig[] {
    return Array.from(this._components.values())
      .filter(config => config.type === type);
  }

  /**
   * 注销组件
   */
  public unregister(name: string): void {
    if (this._components.delete(name)) {
      // 触发变化事件
      this._eventEmitter.emit('component-change', name, null);
      console.log(`🗑️ 组件 "${name}" 已注销`);
    }
  }

  /**
   * 检查组件是否存在
   */
  public hasComponent(name: string): boolean {
    return this._components.has(name);
  }

  /**
   * 替换组件
   */
  public replaceComponent(name: string, config: ComponentConfig): void {
    if (!this._components.has(name)) {
      throw new Error(`组件 "${name}" 不存在，无法替换`);
    }

    this.register(config);
  }

  /**
   * 组件变化事件
   */
  public onComponentChange(
    listener: (name: string, config: ComponentConfig | null) => void
  ): () => void {
    this._eventEmitter.on('component-change', listener);
    
    // 返回取消监听的函数
    return () => {
      this._eventEmitter.off('component-change', listener);
    };
  }

  // ===========================================
  // 高级功能
  // ===========================================

  /**
   * 创建组件代理
   * 支持懒加载和错误处理
   */
  public createComponentProxy<T = ComponentType<any>>(name: string): T | null {
    const config = this._components.get(name);
    if (!config) {
      console.warn(`组件 "${name}" 不存在`);
      return null;
    }

    // 创建代理组件
    const ProxyComponent: ComponentType<any> = (props) => {
      try {
        const Component = config.component;
        if (!Component) {
          return this.renderErrorComponent(`组件 "${name}" 未定义`);
        }

        // 处理函数组件和类组件
        if (typeof Component === 'function') {
          return (Component as any)(props);
        }
        return null;
      } catch (error) {
        console.error(`组件 "${name}" 渲染失败:`, error);
        return this.renderErrorComponent(`组件 "${name}" 渲染失败`);
      }
    };

    // 设置显示名称
    ProxyComponent.displayName = `Proxy(${name})`;

    return ProxyComponent as T;
  }

  /**
   * 获取组件信息
   */
  public getComponentInfo(name: string): ComponentConfig | undefined {
    return this._components.get(name);
  }

  /**
   * 列出所有组件名称
   */
  public listComponentNames(): string[] {
    return Array.from(this._components.keys());
  }

  /**
   * 按标签搜索组件
   */
  public searchComponents(query: string): ComponentConfig[] {
    const queryLower = query.toLowerCase();
    
    return Array.from(this._components.values())
      .filter(config => 
        config.name.toLowerCase().includes(queryLower) ||
        config.description?.toLowerCase().includes(queryLower) ||
        config.type.toLowerCase().includes(queryLower)
      );
  }

  /**
   * 克隆组件配置
   */
  public cloneComponent(sourceName: string, targetName: string): void {
    const sourceConfig = this._components.get(sourceName);
    if (!sourceConfig) {
      throw new Error(`源组件 "${sourceName}" 不存在`);
    }

    const clonedConfig: ComponentConfig = {
      ...sourceConfig,
      name: targetName
    };

    this.register(clonedConfig);
  }

  /**
   * 清空所有组件
   */
  public clear(): void {
    const componentNames = Array.from(this._components.keys());
    this._components.clear();
    
    // 触发变化事件
    componentNames.forEach(name => {
      this._eventEmitter.emit('component-change', name, null);
    });

    console.log('🧹 已清空所有组件');
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    total: number;
    byType: Record<string, number>;
    recentlyAdded: string[];
  } {
    const components = Array.from(this._components.values());
    
    // 按类型统计
    const byType: Record<string, number> = {};
    components.forEach(config => {
      byType[config.type] = (byType[config.type] || 0) + 1;
    });

    return {
      total: components.length,
      byType,
      recentlyAdded: Array.from(this._components.keys()).slice(-5)
    };
  }

  // ===========================================
  // 组件热重载支持
  // ===========================================

  /**
   * 热重载组件
   */
  public hotReload(name: string, newComponent: ComponentType<any>): void {
    const config = this._components.get(name);
    if (!config) {
      console.warn(`组件 "${name}" 不存在，无法热重载`);
      return;
    }

    // 更新组件实现
    const updatedConfig: ComponentConfig = {
      ...config,
      component: newComponent
    };

    this._components.set(name, updatedConfig);

    // 触发变化事件
    this._eventEmitter.emit('component-change', name, updatedConfig);

    console.log(`🔥 组件 "${name}" 热重载成功`);
  }

  /**
   * 启用组件开发模式
   */
  public enableDevMode(): void {
    if (process.env.NODE_ENV === 'development') {
      // 在开发模式下启用热重载
      if ((module as any).hot) {
        (module as any).hot.accept();
      }

      console.log('🔧 组件开发模式已启用');
    }
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 验证组件配置
   */
  private validateComponentConfig(config: ComponentConfig): void {
    if (!config.name) {
      throw new Error('组件名称不能为空');
    }

    if (!config.component) {
      throw new Error('组件实现不能为空');
    }

    if (!config.type) {
      throw new Error('组件类型不能为空');
    }

    // 验证组件名称格式
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(config.name)) {
      throw new Error('组件名称格式无效，只能包含字母、数字、下划线和连字符');
    }

    // 验证组件类型
    const validTypes = ['page', 'widget', 'modal', 'layout', 'theme'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`无效的组件类型: ${config.type}`);
    }
  }

  /**
   * 渲染错误组件
   */
  private renderErrorComponent(message: string): any {
    // 这里应该返回一个React元素
    // 为了类型简化，暂时返回null
    console.error('组件错误:', message);
    return null;
  }
}

// 导出单例实例
export const componentRegistry = ComponentRegistry.getInstance();
