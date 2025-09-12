/**
 * VoxNest 插件管理器
 * 负责插件的发现、加载、激活、管理和生命周期控制
 */

import type {
  IPluginManager,
  IPlugin,
  IUIPlugin,
  PluginInfo,
  PluginModule,
  PluginEventType,
  PluginEventListener,
  PluginEventData,
  IPluginContext,
  RouteConfig,
  ServiceConfig
} from './types';
import { ComponentRegistry } from './ComponentRegistry';
import { PluginContext } from './PluginContext';
import { PluginSecurity } from './PluginSecurity';
import { EventEmitter } from 'events';

export class PluginManager implements IPluginManager {
  private static _instance: PluginManager | null = null;
  
  private _plugins = new Map<string, PluginInfo>();
  private _eventEmitter = new EventEmitter();
  private _componentRegistry: ComponentRegistry;
  private _pluginSecurity: PluginSecurity;
  private _initialized = false;
  
  // 插件发现路径
  private readonly PLUGIN_DISCOVERY_PATHS = [
    '/plugins/',
    '/themes/plugins/',
    '/extensions/'
  ];

  private constructor() {
    this._componentRegistry = ComponentRegistry.getInstance();
    this._pluginSecurity = PluginSecurity.getInstance();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager._instance) {
      PluginManager._instance = new PluginManager();
    }
    return PluginManager._instance;
  }

  // ===========================================
  // 初始化和发现
  // ===========================================

  /**
   * 初始化插件管理器
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      console.log('🔌 初始化插件管理器...');
      
      // 自动发现插件
      await this.discoverPlugins();
      
      // 加载和激活已启用的插件
      await this.loadEnabledPlugins();
      
      this._initialized = true;
      console.log('✅ 插件管理器初始化完成');

    } catch (error) {
      console.error('❌ 插件管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 发现插件
   */
  public async discoverPlugins(): Promise<PluginInfo[]> {
    const discoveredPlugins: PluginInfo[] = [];

    for (const path of this.PLUGIN_DISCOVERY_PATHS) {
      try {
        const plugins = await this.scanPluginDirectory(path);
        discoveredPlugins.push(...plugins);
      } catch (error) {
        console.warn(`扫描插件目录失败 ${path}:`, error);
      }
    }

    // 更新插件列表
    for (const plugin of discoveredPlugins) {
      if (!this._plugins.has(plugin.metadata.id)) {
        this._plugins.set(plugin.metadata.id, plugin);
        this.emitEvent('plugin-discovered', plugin.metadata.id, plugin);
      }
    }

    console.log(`🔍 发现 ${discoveredPlugins.length} 个插件`);
    return discoveredPlugins;
  }

  // ===========================================
  // 插件生命周期管理
  // ===========================================

  /**
   * 加载插件
   */
  public async loadPlugin(pluginId: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    if (pluginInfo.status !== 'discovered') {
      console.warn(`插件 ${pluginId} 已加载，当前状态: ${pluginInfo.status}`);
      return;
    }

    try {
      pluginInfo.status = 'loaded';
      const startTime = Date.now();

      // 安全验证
      if (pluginInfo.module) {
        const securityResult = this._pluginSecurity.validatePlugin(pluginInfo.module);
        if (!securityResult.valid) {
          throw new Error(`插件安全验证失败: ${securityResult.errors.join(', ')}`);
        }
      }

      // 检查依赖
      await this.checkDependencies(pluginId);

      // 创建插件上下文
      const context = this.createPluginContext(pluginInfo);

      // 初始化插件
      if (pluginInfo.instance?.initialize) {
        await pluginInfo.instance.initialize(context);
      }

      pluginInfo.loadTime = Date.now() - startTime;
      this.emitEvent('plugin-loaded', pluginId, pluginInfo);

      console.log(`✅ 插件 ${pluginId} 加载成功 (${pluginInfo.loadTime}ms)`);

    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error = error as Error;
      this.emitEvent('plugin-error', pluginId, pluginInfo);
      throw error;
    }
  }

  /**
   * 激活插件
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    if (pluginInfo.status !== 'loaded') {
      if (pluginInfo.status === 'discovered') {
        await this.loadPlugin(pluginId);
      } else {
        throw new Error(`插件 ${pluginId} 状态不正确: ${pluginInfo.status}`);
      }
    }

    try {
      pluginInfo.status = 'activated';
      const startTime = Date.now();

      // 注册组件
      await this.registerPluginComponents(pluginInfo);

      // 注册路由
      await this.registerPluginRoutes(pluginInfo);

      // 注册服务
      await this.registerPluginServices(pluginInfo);

      // 启动插件
      if (pluginInfo.instance?.start) {
        await pluginInfo.instance.start();
      }

      pluginInfo.status = 'running';
      pluginInfo.startTime = Date.now() - startTime;
      this.emitEvent('plugin-activated', pluginId, pluginInfo);

      console.log(`🚀 插件 ${pluginId} 激活成功`);

    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error = error as Error;
      this.emitEvent('plugin-error', pluginId, pluginInfo);
      throw error;
    }
  }

  /**
   * 停用插件
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo || pluginInfo.status !== 'running') {
      return;
    }

    try {
      pluginInfo.status = 'deactivated';

      // 停止插件
      if (pluginInfo.instance?.stop) {
        await pluginInfo.instance.stop();
      }

      // 注销组件
      this.unregisterPluginComponents(pluginInfo);

      // 注销路由
      this.unregisterPluginRoutes(pluginInfo);

      // 注销服务
      this.unregisterPluginServices(pluginInfo);

      this.emitEvent('plugin-deactivated', pluginId, pluginInfo);

      console.log(`⏹️ 插件 ${pluginId} 已停用`);

    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error = error as Error;
      this.emitEvent('plugin-error', pluginId, pluginInfo);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      return;
    }

    // 先停用插件
    if (pluginInfo.status === 'running') {
      await this.deactivatePlugin(pluginId);
    }

    try {
      // 销毁插件
      if (pluginInfo.instance?.destroy) {
        await pluginInfo.instance.destroy();
      }

      pluginInfo.status = 'unloaded';
      pluginInfo.instance = undefined;
      pluginInfo.module = undefined;

      this.emitEvent('plugin-unloaded', pluginId, pluginInfo);

      console.log(`🗑️ 插件 ${pluginId} 已卸载`);

    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error = error as Error;
      this.emitEvent('plugin-error', pluginId, pluginInfo);
      throw error;
    }
  }

  // ===========================================
  // 插件安装和管理
  // ===========================================

  /**
   * 安装插件
   */
  public async installPlugin(pluginPath: string): Promise<void> {
    try {
      // 从路径加载插件模块
      const module = await this.loadPluginModule(pluginPath);
      
      // 验证插件
      const securityResult = this._pluginSecurity.validatePlugin(module);
      if (!securityResult.valid) {
        throw new Error(`插件安全验证失败: ${securityResult.errors.join(', ')}`);
      }

      // 创建插件信息
      const pluginInfo: PluginInfo = {
        metadata: module.metadata,
        status: 'discovered',
        module,
        instance: module.plugin,
        config: {}
      };

      // 注册插件
      this._plugins.set(pluginInfo.metadata.id, pluginInfo);

      // 保存插件到本地存储
      this.savePluginToStorage(pluginInfo);

      this.emitEvent('plugin-installed', pluginInfo.metadata.id, pluginInfo);

      console.log(`📦 插件 ${pluginInfo.metadata.id} 安装成功`);

    } catch (error) {
      console.error('插件安装失败:', error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    // 先卸载插件
    await this.unloadPlugin(pluginId);

    // 从插件列表中移除
    this._plugins.delete(pluginId);

    // 从本地存储中移除
    this.removePluginFromStorage(pluginId);

    this.emitEvent('plugin-uninstalled', pluginId, pluginInfo);

    console.log(`🗑️ 插件 ${pluginId} 卸载成功`);
  }

  /**
   * 更新插件
   */
  public async updatePlugin(pluginId: string, _newVersion: string): Promise<void> {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    // 这里应该实现插件更新逻辑
    // 暂时抛出未实现错误
    throw new Error('插件更新功能暂未实现');
  }

  // ===========================================
  // 查询和获取
  // ===========================================

  /**
   * 获取所有插件信息
   */
  public getAllPlugins(): PluginInfo[] {
    return Array.from(this._plugins.values());
  }

  /**
   * 获取插件信息
   */
  public getPlugin(pluginId: string): PluginInfo | undefined {
    return this._plugins.get(pluginId);
  }

  /**
   * 获取激活的插件
   */
  public getActivePlugins(): PluginInfo[] {
    return Array.from(this._plugins.values())
      .filter(plugin => plugin.status === 'running');
  }

  /**
   * 按类型获取插件
   */
  public getPluginsByType<T extends IPlugin>(type: new (...args: any[]) => T): T[] {
    return Array.from(this._plugins.values())
      .filter(plugin => plugin.instance instanceof type)
      .map(plugin => plugin.instance as T);
  }

  /**
   * 获取插件依赖
   */
  public getPluginDependencies(pluginId: string): string[] {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo?.instance?.getDependencies) {
      return [];
    }

    return pluginInfo.instance.getDependencies()
      .map(dep => dep.pluginId);
  }

  /**
   * 检查插件兼容性
   */
  public checkCompatibility(pluginId: string): boolean {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo) {
      return false;
    }

    // 这里应该实现兼容性检查逻辑
    // 暂时返回 true
    return true;
  }

  /**
   * 验证插件权限
   */
  public validatePermissions(pluginId: string): boolean {
    const pluginInfo = this._plugins.get(pluginId);
    if (!pluginInfo?.instance?.getPermissions) {
      return true;
    }

    const permissions = pluginInfo.instance.getPermissions();
    return this._pluginSecurity.validatePermissions(pluginId, permissions.map(p => p.name));
  }

  // ===========================================
  // 事件管理
  // ===========================================

  /**
   * 添加事件监听器
   */
  public addEventListener(type: PluginEventType, listener: PluginEventListener): void {
    this._eventEmitter.on(type, listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(type: PluginEventType, listener: PluginEventListener): void {
    this._eventEmitter.off(type, listener);
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 扫描插件目录
   */
  private async scanPluginDirectory(dirPath: string): Promise<PluginInfo[]> {
    const plugins: PluginInfo[] = [];

    try {
      // 模拟扫描插件目录
      // 实际实现中这里需要读取文件系统或从配置中获取插件列表
      const mockPlugins = await this.getMockPluginsFromPath(dirPath);
      
      for (const mockPlugin of mockPlugins) {
        try {
          const module = await this.loadPluginModule(mockPlugin.path);
          
          const pluginInfo: PluginInfo = {
            metadata: module.metadata,
            status: 'discovered',
            module,
            instance: module.plugin,
            config: {}
          };

          plugins.push(pluginInfo);

        } catch (error) {
          console.warn(`加载插件失败 ${mockPlugin.path}:`, error);
        }
      }

    } catch (error) {
      console.warn(`扫描插件目录失败 ${dirPath}:`, error);
    }

    return plugins;
  }

  /**
   * 加载插件模块
   */
  private async loadPluginModule(pluginPath: string): Promise<PluginModule> {
    try {
      // 动态导入插件模块
      const module = await import(pluginPath);
      
      // 如果有默认导出，使用默认导出
      const pluginModule: PluginModule = module.default || module;
      
      // 验证插件模块结构
      if (!pluginModule.metadata || !pluginModule.plugin) {
        throw new Error('无效的插件模块：缺少必需的 metadata 或 plugin 属性');
      }

      return pluginModule;

    } catch (error) {
      throw new Error(`加载插件模块失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(pluginInfo: PluginInfo): IPluginContext {
    return new PluginContext(pluginInfo, this._componentRegistry);
  }

  /**
   * 检查插件依赖
   */
  private async checkDependencies(pluginId: string): Promise<void> {
    const dependencies = this.getPluginDependencies(pluginId);
    
    for (const depId of dependencies) {
      const depPlugin = this._plugins.get(depId);
      
      if (!depPlugin) {
        throw new Error(`缺少依赖插件: ${depId}`);
      }
      
      if (depPlugin.status !== 'running' && depPlugin.status !== 'loaded') {
        // 尝试自动加载依赖
        await this.loadPlugin(depId);
        await this.activatePlugin(depId);
      }
    }
  }

  /**
   * 注册插件组件
   */
  private async registerPluginComponents(pluginInfo: PluginInfo): Promise<void> {
    if (pluginInfo.module?.components) {
      this._componentRegistry.registerComponents(pluginInfo.module.components);
    }

    if (pluginInfo.instance && 'getComponents' in pluginInfo.instance) {
      const uiPlugin = pluginInfo.instance as IUIPlugin;
      const components = uiPlugin.getComponents?.();
      if (components) {
        this._componentRegistry.registerComponents(components);
      }
    }
  }

  /**
   * 注销插件组件
   */
  private unregisterPluginComponents(pluginInfo: PluginInfo): void {
    if (pluginInfo.module?.components) {
      pluginInfo.module.components.forEach(comp => {
        this._componentRegistry.unregister(comp.name);
      });
    }
  }

  /**
   * 注册插件路由
   */
  private async registerPluginRoutes(pluginInfo: PluginInfo): Promise<void> {
    // 路由注册逻辑，这里需要与 React Router 集成
    // 暂时只记录日志
    const routes = this.getPluginRoutes(pluginInfo);
    if (routes.length > 0) {
      console.log(`注册插件路由: ${pluginInfo.metadata.id}`, routes);
    }
  }

  /**
   * 注销插件路由
   */
  private unregisterPluginRoutes(pluginInfo: PluginInfo): void {
    const routes = this.getPluginRoutes(pluginInfo);
    if (routes.length > 0) {
      console.log(`注销插件路由: ${pluginInfo.metadata.id}`, routes);
    }
  }

  /**
   * 注册插件服务
   */
  private async registerPluginServices(pluginInfo: PluginInfo): Promise<void> {
    // 服务注册逻辑
    const services = this.getPluginServices(pluginInfo);
    if (services.length > 0) {
      console.log(`注册插件服务: ${pluginInfo.metadata.id}`, services);
    }
  }

  /**
   * 注销插件服务
   */
  private unregisterPluginServices(pluginInfo: PluginInfo): void {
    const services = this.getPluginServices(pluginInfo);
    if (services.length > 0) {
      console.log(`注销插件服务: ${pluginInfo.metadata.id}`, services);
    }
  }

  /**
   * 获取插件路由
   */
  private getPluginRoutes(pluginInfo: PluginInfo): RouteConfig[] {
    const routes: RouteConfig[] = [];

    if (pluginInfo.module?.routes) {
      routes.push(...pluginInfo.module.routes);
    }

    if (pluginInfo.instance && 'getRoutes' in pluginInfo.instance) {
      const uiPlugin = pluginInfo.instance as IUIPlugin;
      const pluginRoutes = uiPlugin.getRoutes?.();
      if (pluginRoutes) {
        routes.push(...pluginRoutes);
      }
    }

    return routes;
  }

  /**
   * 获取插件服务
   */
  private getPluginServices(pluginInfo: PluginInfo): ServiceConfig[] {
    const services: ServiceConfig[] = [];

    if (pluginInfo.module?.services) {
      services.push(...pluginInfo.module.services);
    }

    return services;
  }

  /**
   * 加载已启用的插件
   */
  private async loadEnabledPlugins(): Promise<void> {
    // 从本地存储获取已启用的插件列表
    const enabledPlugins = this.getEnabledPluginsFromStorage();
    
    for (const pluginId of enabledPlugins) {
      try {
        await this.loadPlugin(pluginId);
        await this.activatePlugin(pluginId);
      } catch (error) {
        console.warn(`自动加载插件失败 ${pluginId}:`, error);
      }
    }
  }

  /**
   * 保存插件到本地存储
   */
  private savePluginToStorage(pluginInfo: PluginInfo): void {
    try {
      const key = `voxnest-plugin-${pluginInfo.metadata.id}`;
      const data = {
        metadata: pluginInfo.metadata,
        config: pluginInfo.config,
        enabled: true
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('保存插件到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储移除插件
   */
  private removePluginFromStorage(pluginId: string): void {
    try {
      const key = `voxnest-plugin-${pluginId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('从本地存储移除插件失败:', error);
    }
  }

  /**
   * 从本地存储获取已启用的插件
   */
  private getEnabledPluginsFromStorage(): string[] {
    const enabledPlugins: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('voxnest-plugin-')) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.enabled) {
            enabledPlugins.push(data.metadata.id);
          }
        }
      }
    } catch (error) {
      console.warn('从本地存储获取插件列表失败:', error);
    }

    return enabledPlugins;
  }

  /**
   * 获取模拟插件列表
   */
  private async getMockPluginsFromPath(dirPath: string): Promise<Array<{ path: string }>> {
    // 模拟插件发现
    return [
      { path: `${dirPath}blog-plugin/index.js` },
      { path: `${dirPath}forum-plugin/index.js` },
      { path: `${dirPath}theme-plugin/index.js` }
    ];
  }

  /**
   * 发出事件
   */
  private emitEvent(type: PluginEventType, pluginId: string, pluginInfo?: PluginInfo): void {
    const eventData: PluginEventData = {
      type,
      pluginId,
      pluginInfo,
      timestamp: Date.now()
    };

    this._eventEmitter.emit(type, eventData);
  }
}

// 导出单例实例
export const pluginManager = PluginManager.getInstance();
