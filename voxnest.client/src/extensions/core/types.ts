/**
 * VoxNest 扩展框架核心类型定义
 * 参考 Astro Integration API 设计
 */

// ==================== 基础类型 ====================

export interface VoxNestConfig {
  /** 应用名称 */
  appName?: string;
  /** 应用版本 */
  appVersion?: string;
  /** 是否启用开发模式 */
  dev?: boolean;
  /** 日志级别 */
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** 自动注册内置集成 */
  autoRegisterBuiltins?: boolean;
  /** 自定义配置 */
  custom?: Record<string, unknown>;
}

// ==================== 组件系统 ====================

export interface ComponentRegistration {
  /** 组件实现 */
  component: React.ComponentType<Record<string, unknown>>;
  /** 注册源标识 */
  source: string;
  /** 渲染优先级 */
  priority?: number;
  /** 渲染条件 */
  condition?: (props?: Record<string, unknown>) => boolean;
  /** 组件属性 */
  props?: Record<string, unknown>;
  /** 组件名称 */
  name?: string;
  /** 组件描述 */
  description?: string;
  /** 自定义样式 */
  styles?: string | Record<string, string>;
  /** CSS类名 */
  className?: string;
  /** 是否替换现有组件 */
  replace?: boolean;
  /** 包装器配置 */
  wrapper?: {
    element?: string;
    className?: string;
    styles?: Record<string, string>;
  };
}

/** 样式注入配置 */
export interface StyleInjection {
  /** 样式内容 */
  content: string;
  /** 样式ID */
  id: string;
  /** 注册源 */
  source: string;
  /** 优先级 */
  priority?: number;
  /** 是否为主题样式 */
  isTheme?: boolean;
}

/** 界面区域枚举 */
export const UISlots = {
  // 全局区域
  APP_ROOT: 'app.root',
  APP_HEADER: 'app.header',
  APP_FOOTER: 'app.footer',
  APP_SIDEBAR: 'app.sidebar',
  APP_MAIN: 'app.main',
  
  // 导航区域
  NAV_PRIMARY: 'nav.primary',
  NAV_SECONDARY: 'nav.secondary',
  NAV_USER: 'nav.user',
  NAV_BREADCRUMB: 'nav.breadcrumb',
  
  // 内容区域
  CONTENT_HEADER: 'content.header',
  CONTENT_MAIN: 'content.main',
  CONTENT_FOOTER: 'content.footer',
  CONTENT_SIDEBAR: 'content.sidebar',
  
  // 页面特定区域
  HOME_HERO: 'home.hero',
  HOME_FEATURES: 'home.features',
  HOME_STATS: 'home.stats',
  
  POST_HEADER: 'post.header',
  POST_CONTENT: 'post.content',
  POST_ACTIONS: 'post.actions',
  POST_SIDEBAR: 'post.sidebar',
  
  // 模态框和覆盖层
  MODAL_ROOT: 'modal.root',
  OVERLAY_ROOT: 'overlay.root',
  NOTIFICATION_ROOT: 'notification.root',
  
  // 管理面板
  ADMIN_HEADER: 'admin.header',
  ADMIN_SIDEBAR: 'admin.sidebar',
  ADMIN_TOOLBAR: 'admin.toolbar',
  
  // 表单和输入
  FORM_BEFORE: 'form.before',
  FORM_AFTER: 'form.after',
  INPUT_BEFORE: 'input.before',
  INPUT_AFTER: 'input.after',
  
  // 自定义插槽
  PLUGIN_AREA: 'plugin.area',
  THEME_AREA: 'theme.area'
} as const;

export interface SlotManager {
  /** 注册组件到槽位 */
  register(slotId: string, registration: ComponentRegistration): void;
  /** 从槽位注销组件 */
  unregister(slotId: string, source: string): void;
  /** 按源注销所有槽位的组件 */
  unregisterBySource(source: string): void;
  /** 获取槽位所有组件 */
  getComponents(slotId: string): ComponentRegistration[];
  /** 检查槽位是否有组件 */
  hasComponents(slotId: string): boolean;
  /** 渲染槽位 */
  render(slotId: string, props?: Record<string, unknown>): React.ReactNode;
  /** 清空槽位 */
  clear(slotId: string): void;
  
  // 样式管理
  /** 注入样式 */
  injectStyle(injection: StyleInjection): void;
  /** 移除样式 */
  removeStyle(id: string): void;
  /** 按源移除所有样式 */
  removeStylesBySource(source: string): void;
  /** 获取所有注入的样式 */
  getAllStyles(): StyleInjection[];
  
  // 高级功能
  /** 修改现有组件的属性 */
  modifyComponent(slotId: string, source: string, updates: Partial<ComponentRegistration>): void;
  /** 替换组件 */
  replaceComponent(slotId: string, oldSource: string, newRegistration: ComponentRegistration): void;
  /** 包装组件 */
  wrapComponent(slotId: string, source: string, wrapper: ComponentRegistration): void;
  /** 设置槽位可见性 */
  setSlotVisibility(slotId: string, visible: boolean): void;
  /** 获取槽位可见性 */
  getSlotVisibility(slotId: string): boolean;
  /** 获取所有槽位信息 */
  getAllSlots(): Record<string, ComponentRegistration[]>;
  /** 获取槽位统计 */
  getStats(): Record<string, number>;
}

// ==================== 集成系统 ====================

export interface Integration {
  /** 集成唯一标识 */
  name: string;
  /** 集成配置钩子 */
  hooks?: IntegrationHooks;
}

export interface IntegrationHooks {
  /** 框架初始化完成 */
  'framework:ready'?: (context: IntegrationContext) => void | Promise<void>;
  /** 组件系统就绪 */
  'components:ready'?: (context: IntegrationContext) => void | Promise<void>;
  /** 应用启动前 */
  'app:start'?: (context: IntegrationContext) => void | Promise<void>;
  /** 应用启动后 */
  'app:started'?: (context: IntegrationContext) => void | Promise<void>;
  /** 应用销毁 */
  'app:destroy'?: (context: IntegrationContext) => void | Promise<void>;
}

export interface IntegrationContext {
  /** 框架实例 */
  framework: ExtensionFramework;
  /** 配置对象 */
  config: VoxNestConfig;
  /** 日志器 */
  logger: Logger;
  /** 组件槽位管理器 */
  slots: SlotManager;
  /** 扩展配置管理器 */
  configManager?: import('./ConfigManager').ExtensionConfigManager;
  [key: string]: unknown;
}

// ==================== 扩展框架 ====================

export interface ExtensionFramework {
  /** 框架状态 */
  status: 'initializing' | 'ready' | 'error';
  /** 框架配置 */
  config: VoxNestConfig;
  /** 组件槽位管理器 */
  slots: SlotManager;
  /** 集成管理 */
  integrations: IntegrationManager;
  /** 日志器 */
  logger: Logger;

  /** 初始化框架 */
  initialize(config?: VoxNestConfig): Promise<void>;
  /** 注册集成 */
  register(integration: Integration): void;
  /** 销毁框架 */
  destroy(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Record<string, unknown>;
}

export interface IntegrationManager {
  /** 注册集成 */
  register(integration: Integration): void;
  /** 注销集成 */
  unregister(name: string): boolean;
  /** 获取所有集成 */
  getAll(): Integration[];
  /** 获取单个集成 */
  get(name: string): Integration | undefined;
  /** 执行钩子 */
  executeHook<T extends keyof IntegrationHooks>(
    hook: T, 
    context: IntegrationContext
  ): Promise<void>;
}

// ==================== 日志系统 ====================

export interface Logger {
  trace(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  createChild(name: string): Logger;
}

// ==================== 工具类型 ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ComponentProps<T = Record<string, unknown>> = T & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

// ==================== React 相关 ====================

import React from 'react';

export interface SlotProps {
  /** 槽位 ID */
  id: string;
  /** 传递给组件的属性 */
  props?: Record<string, unknown>;
  /** 无组件时的后备内容 */
  fallback?: React.ReactNode;
  /** 容器样式类 */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 是否包装在容器中 */
  wrapper?: boolean;
}

export interface ExtensionProviderProps {
  children: React.ReactNode;
  config?: VoxNestConfig;
}
