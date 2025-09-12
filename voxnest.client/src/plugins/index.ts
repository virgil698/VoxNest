/**
 * VoxNest 插件系统主入口
 * 统一导出所有插件系统相关的类型、接口和实现
 */

// ===========================================
// 类型定义
// ===========================================

export type {
  // 基础插件类型
  PluginStatus,
  PluginMetadata,
  PluginDependency,
  PluginPermission,
  PluginConfigItem,
  PluginInfo,
  PluginModule,
  PluginEventType,
  PluginEventData,
  PluginEventListener,

  // 配置类型
  RouteConfig,
  ComponentConfig,
  MenuConfig,
  ServiceConfig,

  // 接口定义
  IPlugin,
  IUIPlugin,
  IThemePlugin,
  IServicePlugin,
  IPluginContext,
  IPluginManager,
  IComponentRegistry,
  IPluginSecurity,
  IPermissionManager,

  // 安全相关
  SecurityValidationResult
} from './types';

// ===========================================
// 核心实现
// ===========================================

import { PluginManager, pluginManager } from './PluginManager';
import { ComponentRegistry, componentRegistry } from './ComponentRegistry';
import { PluginSecurity, PermissionManager, pluginSecurity, permissionManager } from './PluginSecurity';
import { themePluginManager } from './ThemePlugin';

export { PluginManager, pluginManager };
export { ComponentRegistry, componentRegistry };
export { PluginContext } from './PluginContext';
export { PluginSecurity, PermissionManager, pluginSecurity, permissionManager };

// ===========================================
// 主题插件
// ===========================================

export {
  BaseThemePlugin,
  SimpleThemePlugin,
  ThemePluginFactory,
  ThemePluginManager,
  themePluginManager
} from './ThemePlugin';

// ===========================================
// 插件系统管理器
// ===========================================

export class VoxNestPluginSystem {
  private static _instance: VoxNestPluginSystem | null = null;
  private _initialized = false;

  private constructor() {}

  public static getInstance(): VoxNestPluginSystem {
    if (!VoxNestPluginSystem._instance) {
      VoxNestPluginSystem._instance = new VoxNestPluginSystem();
    }
    return VoxNestPluginSystem._instance;
  }

  /**
   * 初始化插件系统
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      console.warn('插件系统已经初始化');
      return;
    }

    try {
      console.log('🚀 初始化 VoxNest 插件系统...');

      // 初始化组件注册器
      console.log('📦 初始化组件注册器...');
      
      // 初始化安全管理器
      console.log('🔒 初始化安全管理器...');
      
      // 初始化权限管理器
      console.log('🛡️ 初始化权限管理器...');
      
      // 初始化插件管理器
      console.log('⚙️ 初始化插件管理器...');
      await pluginManager.initialize();

      // 初始化主题插件管理器
      console.log('🎨 初始化主题插件管理器...');

      this._initialized = true;
      console.log('✅ VoxNest 插件系统初始化完成');

    } catch (error) {
      console.error('❌ 插件系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统状态
   */
  public getSystemStatus(): {
    initialized: boolean;
    pluginsCount: number;
    activePluginsCount: number;
    componentsCount: number;
    themePluginsCount: number;
    errors: string[];
  } {
    const allPlugins = pluginManager.getAllPlugins();
    const activePlugins = pluginManager.getActivePlugins();
    const allComponents = componentRegistry.getAllComponents();
    const themePlugins = themePluginManager.getAllPlugins();

    return {
      initialized: this._initialized,
      pluginsCount: allPlugins.length,
      activePluginsCount: activePlugins.length,
      componentsCount: allComponents.size,
      themePluginsCount: themePlugins.length,
      errors: allPlugins
        .filter((p: any) => p.error)
        .map((p: any) => `${p.metadata.id}: ${p.error?.message}`)
    };
  }

  /**
   * 重置插件系统
   */
  public async reset(): Promise<void> {
    console.log('🔄 重置插件系统...');

    // 停用所有插件
    const activePlugins = pluginManager.getActivePlugins();
    for (const plugin of activePlugins) {
      try {
        await pluginManager.deactivatePlugin(plugin.metadata.id);
        await pluginManager.unloadPlugin(plugin.metadata.id);
      } catch (error) {
        console.warn(`卸载插件失败 ${plugin.metadata.id}:`, error);
      }
    }

    // 清理组件注册器
    componentRegistry.clear();

    // 清理主题插件管理器
    themePluginManager.clear();

    this._initialized = false;
    console.log('✅ 插件系统重置完成');
  }

  /**
   * 开发者工具
   */
  public getDevTools(): {
    listPlugins: () => void;
    listComponents: () => void;
    inspectPlugin: (pluginId: string) => void;
    debugMode: (enabled: boolean) => void;
  } {
    return {
      listPlugins: () => {
        console.table(
          pluginManager.getAllPlugins().map((p: any) => ({
            ID: p.metadata.id,
            名称: p.metadata.name,
            版本: p.metadata.version,
            状态: p.status,
            错误: p.error?.message || '无'
          }))
        );
      },

      listComponents: () => {
        const components = Array.from(componentRegistry.getAllComponents().entries());
        console.table(
          components.map(([name, config]: [any, any]) => ({
            名称: name,
            类型: config.type,
            描述: config.description || '无'
          }))
        );
      },

      inspectPlugin: (pluginId: string) => {
        const plugin = pluginManager.getPlugin(pluginId);
        if (plugin) {
          console.log(`🔍 插件详情: ${pluginId}`, plugin);
        } else {
          console.warn(`插件不存在: ${pluginId}`);
        }
      },

      debugMode: (enabled: boolean) => {
        if (enabled) {
          console.log('🐛 插件系统调试模式已启用');
          // 启用详细日志
        } else {
          console.log('🐛 插件系统调试模式已禁用');
        }
      }
    };
  }

  /**
   * 获取版本信息
   */
  public getVersion(): string {
    return '1.0.0';
  }

  /**
   * 检查兼容性
   */
  public checkCompatibility(): {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查浏览器兼容性
    if (!window.customElements) {
      issues.push('浏览器不支持 Custom Elements');
    }

    if (!window.Proxy) {
      issues.push('浏览器不支持 Proxy');
    }

    if (!window.fetch) {
      issues.push('浏览器不支持 Fetch API');
    }

    // 检查模块系统
    try {
      // 尝试检测动态导入支持
      eval('import')
    } catch {
      issues.push('不支持动态 import()');
      recommendations.push('请使用支持 ES2020 的现代浏览器');
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// ===========================================
// 便捷函数
// ===========================================

/**
 * 初始化插件系统
 */
export async function initializePluginSystem(): Promise<void> {
  const system = VoxNestPluginSystem.getInstance();
  await system.initialize();
}

/**
 * 获取插件系统实例
 */
export function getPluginSystem(): VoxNestPluginSystem {
  return VoxNestPluginSystem.getInstance();
}

/**
 * 快速注册组件
 */
export function registerComponent(config: import('./types').ComponentConfig): void {
  componentRegistry.register(config);
}

/**
 * 快速获取组件
 */
export function getComponent<T = any>(name: string): T | undefined {
  return componentRegistry.getComponent<T>(name);
}

/**
 * 创建插件开发工具
 */
export function createPluginDevTools() {
  const system = VoxNestPluginSystem.getInstance();
  return system.getDevTools();
}

// ===========================================
// 全局导出
// ===========================================

// 导出单例实例
export const pluginSystem = VoxNestPluginSystem.getInstance();

// 在开发环境下将插件系统暴露到全局
if (process.env.NODE_ENV === 'development') {
  (window as any).VoxNestPlugins = {
    system: pluginSystem,
    manager: pluginManager,
    componentRegistry: componentRegistry,
    themePluginManager: themePluginManager,
    devTools: createPluginDevTools()
  };
}
