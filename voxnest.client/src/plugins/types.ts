/**
 * VoxNest 前端插件系统类型定义
 * 定义插件架构、接口和通信机制
 */

import type { RouteObject } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { Theme } from '../themes/types';

// ===========================================
// 插件基础接口
// ===========================================

/** 插件状态 */
export type PluginStatus = 'discovered' | 'loaded' | 'activated' | 'running' | 'deactivated' | 'unloaded' | 'error';

/** 插件元数据 */
export interface PluginMetadata {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 插件作者 */
  author: string;
  /** 插件主页 */
  homepage?: string;
  /** 许可证 */
  license?: string;
  /** 关键词 */
  keywords?: string[];
  /** 插件图标 */
  icon?: string;
  /** 是否为内置插件 */
  builtin: boolean;
}

/** 插件依赖 */
export interface PluginDependency {
  /** 依赖插件ID */
  pluginId: string;
  /** 版本要求 */
  version: string;
  /** 是否为可选依赖 */
  optional?: boolean;
}

/** 插件权限 */
export interface PluginPermission {
  /** 权限名称 */
  name: string;
  /** 权限描述 */
  description: string;
  /** 是否为必需权限 */
  required: boolean;
  /** 权限级别 */
  level: 'low' | 'medium' | 'high' | 'critical';
}

/** 插件配置项 */
export interface PluginConfigItem {
  /** 配置键 */
  key: string;
  /** 配置类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** 默认值 */
  default?: any;
  /** 配置描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

// ===========================================
// 路由和组件配置
// ===========================================

/** 路由配置 */
export interface RouteConfig extends Omit<RouteObject, 'element'> {
  /** 组件名称或组件 */
  component: string | ComponentType<any>;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 所需权限 */
  permissions?: string[];
  /** 路由元数据 */
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    [key: string]: any;
  };
}

/** 组件配置 */
export interface ComponentConfig {
  /** 组件名称 */
  name: string;
  /** 组件实现 */
  component: ComponentType<any>;
  /** 组件类型 */
  type: 'page' | 'widget' | 'modal' | 'layout' | 'theme';
  /** 组件描述 */
  description?: string;
  /** 组件属性定义 */
  props?: Record<string, any>;
  /** 组件样式 */
  styles?: string;
}

/** 菜单配置 */
export interface MenuConfig {
  /** 菜单键 */
  key: string;
  /** 菜单标题 */
  title: string;
  /** 菜单图标 */
  icon?: string;
  /** 菜单路径 */
  path?: string;
  /** 子菜单 */
  children?: MenuConfig[];
  /** 排序权重 */
  order?: number;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 所需权限 */
  permissions?: string[];
}

/** 服务配置 */
export interface ServiceConfig {
  /** 服务名称 */
  name: string;
  /** 服务实现 */
  implementation: any;
  /** 服务类型 */
  type: 'singleton' | 'transient' | 'scoped';
  /** 服务依赖 */
  dependencies?: string[];
}

// ===========================================
// 插件上下文和通信
// ===========================================

/** 插件上下文接口 */
export interface IPluginContext {
  /** 插件元数据 */
  readonly metadata: PluginMetadata;
  
  /** 插件配置 */
  readonly config: Record<string, any>;
  
  /** 应用配置 */
  readonly appConfig: any;
  
  /** 服务注册和获取 */
  registerService<T>(name: string, service: T, type?: ServiceConfig['type']): void;
  getService<T>(name: string): T | undefined;
  
  /** 事件发布和订阅 */
  emit(event: string, data?: any): void;
  on(event: string, handler: (data: any) => void): () => void;
  off(event: string, handler: (data: any) => void): void;
  
  /** 路由操作 */
  navigate(path: string, options?: any): void;
  getCurrentRoute(): any;
  
  /** 状态管理 */
  getState<T>(key: string): T | undefined;
  setState<T>(key: string, value: T): void;
  
  /** 组件注册 */
  registerComponent(config: ComponentConfig): void;
  getComponent(name: string): ComponentType<any> | undefined;
  
  /** 权限检查 */
  hasPermission(permission: string): boolean;
  requestPermission(permission: string): Promise<boolean>;
  
  /** 日志记录 */
  log: {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  };
}

// ===========================================
// 插件接口定义
// ===========================================

/** 基础插件接口 */
export interface IPlugin {
  /** 插件元数据 */
  readonly metadata: PluginMetadata;
  
  /** 插件初始化 */
  initialize?(context: IPluginContext): Promise<void>;
  
  /** 插件启动 */
  start?(): Promise<void>;
  
  /** 插件停止 */
  stop?(): Promise<void>;
  
  /** 插件销毁 */
  destroy?(): Promise<void>;
  
  /** 获取插件配置项 */
  getConfigSchema?(): PluginConfigItem[];
  
  /** 获取插件权限要求 */
  getPermissions?(): PluginPermission[];
  
  /** 获取插件依赖 */
  getDependencies?(): PluginDependency[];
}

/** UI插件接口 */
export interface IUIPlugin extends IPlugin {
  /** 获取路由配置 */
  getRoutes?(): RouteConfig[];
  
  /** 获取菜单配置 */
  getMenus?(): MenuConfig[];
  
  /** 获取组件配置 */
  getComponents?(): ComponentConfig[];
  
  /** 获取客户端脚本 */
  getClientScript?(): string;
  
  /** 获取客户端样式 */
  getClientStyles?(): string;
}

/** 主题插件接口 */
export interface IThemePlugin extends IUIPlugin {
  /** 获取主题列表 */
  getThemes(): Theme[];
  
  /** 获取主题样式 */
  getThemeStyles(themeId: string): string;
  
  /** 获取主题组件 */
  getThemeComponents(themeId: string): ComponentConfig[];
  
  /** 主题激活回调 */
  onThemeActivated?(themeId: string): Promise<void>;
  
  /** 主题停用回调 */
  onThemeDeactivated?(themeId: string): Promise<void>;
}

/** 服务插件接口 */
export interface IServicePlugin extends IPlugin {
  /** 获取服务配置 */
  getServices(): ServiceConfig[];
  
  /** 服务初始化 */
  initializeServices?(context: IPluginContext): Promise<void>;
}

// ===========================================
// 插件模块定义
// ===========================================

/** 插件模块 */
export interface PluginModule {
  /** 插件元数据 */
  metadata: PluginMetadata;
  
  /** 插件实现 */
  plugin: IPlugin;
  
  /** 路由配置 */
  routes?: RouteConfig[];
  
  /** 组件配置 */
  components?: ComponentConfig[];
  
  /** 服务配置 */
  services?: ServiceConfig[];
  
  /** 菜单配置 */
  menus?: MenuConfig[];
  
  /** 插件样式 */
  styles?: string;
  
  /** 插件脚本 */
  scripts?: string;
  
  /** 默认导出 */
  default?: PluginModule;
}

// ===========================================
// 插件管理器接口
// ===========================================

/** 插件信息 */
export interface PluginInfo {
  /** 插件元数据 */
  metadata: PluginMetadata;
  
  /** 插件状态 */
  status: PluginStatus;
  
  /** 插件实例 */
  instance?: IPlugin;
  
  /** 插件模块 */
  module?: PluginModule;
  
  /** 加载时间 */
  loadTime?: number;
  
  /** 启动时间 */
  startTime?: number;
  
  /** 错误信息 */
  error?: Error;
  
  /** 插件配置 */
  config?: Record<string, any>;
  
  /** 插件权限 */
  permissions?: string[];
}

/** 插件管理器接口 */
export interface IPluginManager {
  /** 获取所有插件信息 */
  getAllPlugins(): PluginInfo[];
  
  /** 获取插件信息 */
  getPlugin(pluginId: string): PluginInfo | undefined;
  
  /** 获取激活的插件 */
  getActivePlugins(): PluginInfo[];
  
  /** 按类型获取插件 */
  getPluginsByType<T extends IPlugin>(type: new (...args: any[]) => T): T[];
  
  /** 发现插件 */
  discoverPlugins(): Promise<PluginInfo[]>;
  
  /** 加载插件 */
  loadPlugin(pluginId: string): Promise<void>;
  
  /** 卸载插件 */
  unloadPlugin(pluginId: string): Promise<void>;
  
  /** 激活插件 */
  activatePlugin(pluginId: string): Promise<void>;
  
  /** 停用插件 */
  deactivatePlugin(pluginId: string): Promise<void>;
  
  /** 安装插件 */
  installPlugin(pluginPath: string): Promise<void>;
  
  /** 卸载插件 */
  uninstallPlugin(pluginId: string): Promise<void>;
  
  /** 更新插件 */
  updatePlugin(pluginId: string, newVersion: string): Promise<void>;
  
  /** 获取插件依赖 */
  getPluginDependencies(pluginId: string): string[];
  
  /** 检查插件兼容性 */
  checkCompatibility(pluginId: string): boolean;
  
  /** 验证插件权限 */
  validatePermissions(pluginId: string): boolean;
}

// ===========================================
// 插件事件
// ===========================================

/** 插件事件类型 */
export type PluginEventType = 
  | 'plugin-discovered'
  | 'plugin-loaded'
  | 'plugin-activated'
  | 'plugin-deactivated'
  | 'plugin-unloaded'
  | 'plugin-error'
  | 'plugin-installed'
  | 'plugin-uninstalled'
  | 'plugin-updated';

/** 插件事件数据 */
export interface PluginEventData {
  type: PluginEventType;
  pluginId: string;
  pluginInfo?: PluginInfo;
  error?: Error;
  timestamp: number;
}

/** 插件事件监听器 */
export type PluginEventListener = (data: PluginEventData) => void;

// ===========================================
// 组件注册器接口
// ===========================================

/** 动态组件注册器 */
export interface IComponentRegistry {
  /** 注册组件 */
  register(config: ComponentConfig): void;
  
  /** 批量注册组件 */
  registerComponents(configs: ComponentConfig[]): void;
  
  /** 获取组件 */
  getComponent<T = ComponentType<any>>(name: string): T | undefined;
  
  /** 获取所有组件 */
  getAllComponents(): Map<string, ComponentConfig>;
  
  /** 按类型获取组件 */
  getComponentsByType(type: ComponentConfig['type']): ComponentConfig[];
  
  /** 注销组件 */
  unregister(name: string): void;
  
  /** 检查组件是否存在 */
  hasComponent(name: string): boolean;
  
  /** 替换组件 */
  replaceComponent(name: string, config: ComponentConfig): void;
  
  /** 组件变化事件 */
  onComponentChange(listener: (name: string, config: ComponentConfig | null) => void): () => void;
}

// ===========================================
// 安全和权限
// ===========================================

/** 安全验证结果 */
export interface SecurityValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  
  /** 验证错误 */
  errors: string[];
  
  /** 安全等级 */
  securityLevel: 'safe' | 'warning' | 'danger' | 'critical';
  
  /** 风险评估 */
  risks: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
}

/** 插件安全管理器接口 */
export interface IPluginSecurity {
  /** 验证插件安全性 */
  validatePlugin(plugin: IPlugin | PluginModule): SecurityValidationResult;
  
  /** 验证插件代码 */
  validateCode(code: string): SecurityValidationResult;
  
  /** 验证插件权限 */
  validatePermissions(pluginId: string, permissions: string[]): boolean;
  
  /** 清理危险代码 */
  sanitizeCode(code: string): string;
  
  /** 检查恶意行为 */
  detectMaliciousBehavior(plugin: IPlugin): boolean;
  
  /** 获取插件风险评级 */
  getRiskRating(pluginId: string): number;
}

/** 权限管理器接口 */
export interface IPermissionManager {
  /** 检查权限 */
  hasPermission(pluginId: string, permission: string): boolean;
  
  /** 授予权限 */
  grantPermission(pluginId: string, permission: string): void;
  
  /** 撤销权限 */
  revokePermission(pluginId: string, permission: string): void;
  
  /** 获取插件权限 */
  getPluginPermissions(pluginId: string): string[];
  
  /** 获取所有权限 */
  getAllPermissions(): string[];
  
  /** 请求权限 */
  requestPermission(pluginId: string, permission: string): Promise<boolean>;
  
  /** 权限变化事件 */
  onPermissionChange(listener: (pluginId: string, permission: string, granted: boolean) => void): () => void;
}
