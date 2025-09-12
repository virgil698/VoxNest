/**
 * VoxNest 插件上下文
 * 提供插件运行时的环境和API访问
 */

import type { ComponentType } from 'react';
import type { 
  IPluginContext, 
  PluginInfo, 
  ComponentConfig, 
  ServiceConfig 
} from './types';
import type { ComponentRegistry } from './ComponentRegistry';
import { EventEmitter } from 'events';
import { getAppConfig } from '../config/index';

export class PluginContext implements IPluginContext {
  private _pluginInfo: PluginInfo;
  private _componentRegistry: ComponentRegistry;
  private _eventEmitter = new EventEmitter();
  private _services = new Map<string, any>();
  private _state = new Map<string, any>();
  private _config: Record<string, any>;

  constructor(pluginInfo: PluginInfo, componentRegistry: ComponentRegistry) {
    this._pluginInfo = pluginInfo;
    this._componentRegistry = componentRegistry;
    this._config = pluginInfo.config || {};
  }

  // ===========================================
  // 基础属性
  // ===========================================

  /**
   * 插件元数据
   */
  public get metadata() {
    return this._pluginInfo.metadata;
  }

  /**
   * 插件配置
   */
  public get config() {
    return this._config;
  }

  /**
   * 应用配置
   */
  public get appConfig() {
    return getAppConfig();
  }

  // ===========================================
  // 服务管理
  // ===========================================

  /**
   * 注册服务
   */
  public registerService<T>(
    name: string, 
    service: T, 
    type: ServiceConfig['type'] = 'singleton'
  ): void {
    if (this._services.has(name)) {
      console.warn(`服务 "${name}" 已存在，将被替换`);
    }

    // 根据类型处理服务
    switch (type) {
      case 'singleton':
        this._services.set(name, service);
        break;
      case 'transient':
        // 对于瞬态服务，存储工厂函数
        this._services.set(name, () => service);
        break;
      case 'scoped':
        // 对于作用域服务，可以根据需要实现更复杂的逻辑
        this._services.set(name, service);
        break;
    }

    this.log.debug(`服务 "${name}" 注册成功 (类型: ${type})`);
  }

  /**
   * 获取服务
   */
  public getService<T>(name: string): T | undefined {
    const service = this._services.get(name);
    
    if (typeof service === 'function') {
      // 对于瞬态服务，每次调用工厂函数
      return service() as T;
    }
    
    return service as T;
  }

  // ===========================================
  // 事件系统
  // ===========================================

  /**
   * 发布事件
   */
  public emit(event: string, data?: any): void {
    this._eventEmitter.emit(event, data);
    this.log.debug(`事件发布: ${event}`, data);
  }

  /**
   * 订阅事件
   */
  public on(event: string, handler: (data: any) => void): () => void {
    this._eventEmitter.on(event, handler);
    this.log.debug(`事件订阅: ${event}`);
    
    // 返回取消订阅的函数
    return () => {
      this._eventEmitter.off(event, handler);
    };
  }

  /**
   * 取消订阅事件
   */
  public off(event: string, handler: (data: any) => void): void {
    this._eventEmitter.off(event, handler);
    this.log.debug(`取消订阅: ${event}`);
  }

  // ===========================================
  // 路由操作
  // ===========================================

  /**
   * 导航到指定路径
   */
  public navigate(path: string, options?: any): void {
    try {
      // 这里需要与React Router集成
      // 暂时使用window.location进行导航
      if (options?.replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
      
      this.log.info(`导航到: ${path}`, options);
    } catch (error) {
      this.log.error('导航失败:', error);
    }
  }

  /**
   * 获取当前路由
   */
  public getCurrentRoute(): any {
    return {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state
    };
  }

  // ===========================================
  // 状态管理
  // ===========================================

  /**
   * 获取状态
   */
  public getState<T>(key: string): T | undefined {
    return this._state.get(key) as T;
  }

  /**
   * 设置状态
   */
  public setState<T>(key: string, value: T): void {
    this._state.set(key, value);
    
    // 发布状态变化事件
    this.emit('state-changed', { key, value });
    
    this.log.debug(`状态更新: ${key}`, value);
  }

  // ===========================================
  // 组件管理
  // ===========================================

  /**
   * 注册组件
   */
  public registerComponent(config: ComponentConfig): void {
    // 为组件名称添加插件前缀，避免冲突
    const namespacedConfig: ComponentConfig = {
      ...config,
      name: `${this.metadata.id}:${config.name}`
    };

    this._componentRegistry.register(namespacedConfig);
    this.log.info(`组件注册成功: ${namespacedConfig.name}`);
  }

  /**
   * 获取组件
   */
  public getComponent(name: string): ComponentType<any> | undefined {
    // 先尝试获取带命名空间的组件
    let component = this._componentRegistry.getComponent(`${this.metadata.id}:${name}`);
    
    // 如果没有找到，尝试获取全局组件
    if (!component) {
      component = this._componentRegistry.getComponent(name);
    }
    
    return component;
  }

  // ===========================================
  // 权限管理
  // ===========================================

  /**
   * 检查权限
   */
  public hasPermission(permission: string): boolean {
    // 这里需要与权限管理系统集成
    // 暂时返回true
    const granted = this._pluginInfo.permissions?.includes(permission) ?? false;
    
    this.log.debug(`权限检查: ${permission} = ${granted}`);
    return granted;
  }

  /**
   * 请求权限
   */
  public async requestPermission(permission: string): Promise<boolean> {
    try {
      // 这里应该实现权限请求逻辑
      // 可能需要显示权限请求对话框
      
      this.log.info(`请求权限: ${permission}`);
      
      // 暂时模拟权限授予
      if (!this._pluginInfo.permissions) {
        this._pluginInfo.permissions = [];
      }
      
      if (!this._pluginInfo.permissions.includes(permission)) {
        this._pluginInfo.permissions.push(permission);
      }
      
      return true;
    } catch (error) {
      this.log.error(`权限请求失败: ${permission}`, error);
      return false;
    }
  }

  // ===========================================
  // 日志系统
  // ===========================================

  /**
   * 日志记录器
   */
  public log = {
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[${this.metadata.id}] ${message}`, ...args);
      }
    },

    info: (message: string, ...args: any[]) => {
      console.info(`[${this.metadata.id}] ${message}`, ...args);
    },

    warn: (message: string, ...args: any[]) => {
      console.warn(`[${this.metadata.id}] ${message}`, ...args);
    },

    error: (message: string, ...args: any[]) => {
      console.error(`[${this.metadata.id}] ${message}`, ...args);
    }
  };

  // ===========================================
  // 高级功能
  // ===========================================

  /**
   * 创建子上下文
   */
  public createChildContext(namespace: string): IPluginContext {
    const childPluginInfo: PluginInfo = {
      ...this._pluginInfo,
      metadata: {
        ...this._pluginInfo.metadata,
        id: `${this._pluginInfo.metadata.id}.${namespace}`
      }
    };

    return new PluginContext(childPluginInfo, this._componentRegistry);
  }

  /**
   * 销毁上下文
   */
  public destroy(): void {
    // 清理事件监听器
    this._eventEmitter.removeAllListeners();
    
    // 清理服务
    this._services.clear();
    
    // 清理状态
    this._state.clear();
    
    this.log.info('插件上下文已销毁');
  }

  /**
   * 获取上下文信息
   */
  public getContextInfo(): {
    pluginId: string;
    servicesCount: number;
    eventsCount: number;
    stateKeys: string[];
  } {
    return {
      pluginId: this.metadata.id,
      servicesCount: this._services.size,
      eventsCount: this._eventEmitter.listenerCount('*'),
      stateKeys: Array.from(this._state.keys())
    };
  }

  /**
   * 插件间通信
   */
  public sendMessage(targetPluginId: string, message: any): void {
    // 发布插件间通信事件
    this.emit('plugin-message', {
      from: this.metadata.id,
      to: targetPluginId,
      message,
      timestamp: Date.now()
    });

    this.log.debug(`发送消息到插件 ${targetPluginId}:`, message);
  }

  /**
   * 监听插件消息
   */
  public onMessage(handler: (from: string, message: any) => void): () => void {
    const messageHandler = (data: any) => {
      if (data.to === this.metadata.id) {
        handler(data.from, data.message);
      }
    };

    return this.on('plugin-message', messageHandler);
  }

  /**
   * 获取插件配置
   */
  public getPluginConfig<T = any>(key: string, defaultValue?: T): T {
    const value = this._config[key];
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * 设置插件配置
   */
  public setPluginConfig(key: string, value: any): void {
    this._config[key] = value;
    
    // 发布配置变化事件
    this.emit('config-changed', { key, value });
    
    this.log.debug(`配置更新: ${key}`, value);
  }

  /**
   * 保存插件配置
   */
  public savePluginConfig(): void {
    try {
      const key = `voxnest-plugin-config-${this.metadata.id}`;
      localStorage.setItem(key, JSON.stringify(this._config));
      this.log.info('插件配置已保存');
    } catch (error) {
      this.log.error('保存插件配置失败:', error);
    }
  }

  /**
   * 加载插件配置
   */
  public loadPluginConfig(): void {
    try {
      const key = `voxnest-plugin-config-${this.metadata.id}`;
      const configStr = localStorage.getItem(key);
      
      if (configStr) {
        this._config = { ...this._config, ...JSON.parse(configStr) };
        this.log.info('插件配置已加载');
      }
    } catch (error) {
      this.log.error('加载插件配置失败:', error);
    }
  }
}
