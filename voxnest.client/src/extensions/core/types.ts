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
  custom?: Record<string, any>;
}

// ==================== 组件系统 ====================

export interface ComponentRegistration {
  /** 组件实现 */
  component: React.ComponentType<any>;
  /** 注册源标识 */
  source: string;
  /** 渲染优先级 */
  priority?: number;
  /** 渲染条件 */
  condition?: (props?: any) => boolean;
  /** 组件属性 */
  props?: Record<string, any>;
  /** 组件名称 */
  name?: string;
  /** 组件描述 */
  description?: string;
}

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
  render(slotId: string, props?: any): React.ReactNode;
  /** 清空槽位 */
  clear(slotId: string): void;
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
  getStats(): any;
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
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  createChild(name: string): Logger;
}

// ==================== 工具类型 ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ComponentProps<T = any> = T & {
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
  props?: any;
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
