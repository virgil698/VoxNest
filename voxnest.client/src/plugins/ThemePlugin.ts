/**
 * VoxNest 主题插件集成
 * 连接插件系统与主题管理系统
 */

import type { ComponentType } from 'react';
import type {
  IThemePlugin,
  PluginMetadata,
  IPluginContext,
  RouteConfig,
  MenuConfig,
  ComponentConfig,
  PluginDependency,
  PluginPermission
} from './types';
import type { Theme } from '../themes/types';
import { themeManager } from '../themes/ThemeManager';

/**
 * 抽象主题插件基类
 */
export abstract class BaseThemePlugin implements IThemePlugin {
  public abstract readonly metadata: PluginMetadata;

  constructor() {
    // 基类构造函数
  }

  // ===========================================
  // 基础插件接口
  // ===========================================

  /**
   * 插件初始化
   */
  public async initialize?(context: IPluginContext): Promise<void> {
    context.log.info(`主题插件 ${this.metadata.name} 初始化`);
    
    // 注册主题
    const themes = this.getThemes();
    for (const theme of themes) {
      try {
        themeManager.registerTheme(theme);
        context.log.debug(`主题注册成功: ${theme.metadata.id}`);
      } catch (error) {
        context.log.error(`主题注册失败: ${theme.metadata.id}`, error);
      }
    }

    // 注册主题组件
    for (const theme of themes) {
      const components = this.getThemeComponents(theme.metadata.id);
      for (const component of components) {
        context.registerComponent(component);
      }
    }
  }

  /**
   * 插件启动
   */
  public async start?(): Promise<void> {
    console.log(`🎨 主题插件 ${this.metadata.name} 已启动`);
  }

  /**
   * 插件停止
   */
  public async stop?(): Promise<void> {
    console.log(`⏹️ 主题插件 ${this.metadata.name} 已停止`);
    
    // 注销主题
    const themes = this.getThemes();
    for (const theme of themes) {
      try {
        themeManager.unregisterTheme(theme.metadata.id);
        console.log(`主题 ${theme.metadata.id} 已注销`);
      } catch (error) {
        console.warn(`注销主题失败 ${theme.metadata.id}:`, error);
      }
    }
  }

  /**
   * 插件销毁
   */
  public async destroy?(): Promise<void> {
    console.log(`🗑️ 主题插件 ${this.metadata.name} 已销毁`);
  }

  /**
   * 获取插件权限要求
   */
  public getPermissions?(): PluginPermission[] {
    return [
      {
        name: 'ui.theme.register',
        description: '注册主题',
        required: true,
        level: 'medium'
      },
      {
        name: 'ui.theme.modify',
        description: '修改主题',
        required: false,
        level: 'medium'
      },
      {
        name: 'storage.theme',
        description: '存储主题数据',
        required: false,
        level: 'low'
      }
    ];
  }

  /**
   * 获取插件依赖
   */
  public getDependencies?(): PluginDependency[] {
    return [
      {
        pluginId: 'voxnest-core',
        version: '>=1.0.0',
        optional: false
      },
      {
        pluginId: 'theme-manager',
        version: '>=1.0.0',
        optional: false
      }
    ];
  }

  // ===========================================
  // UI插件接口
  // ===========================================

  /**
   * 获取路由配置
   */
  public getRoutes?(): RouteConfig[] {
    return [];
  }

  /**
   * 获取菜单配置
   */
  public getMenus?(): MenuConfig[] {
    return [
      {
        key: `theme-${this.metadata.id}`,
        title: this.metadata.name,
        icon: 'palette',
        path: `/themes/${this.metadata.id}`,
        order: 100
      }
    ];
  }

  /**
   * 获取组件配置
   */
  public getComponents?(): ComponentConfig[] {
    const themes = this.getThemes();
    const components: ComponentConfig[] = [];

    for (const theme of themes) {
      components.push(...this.getThemeComponents(theme.metadata.id));
    }

    return components;
  }

  /**
   * 获取客户端脚本
   */
  public getClientScript?(): string {
    return `
      // 主题插件客户端脚本
      console.log('主题插件 ${this.metadata.id} 客户端脚本已加载');
      
      // 导出主题管理API
      window.VoxNestThemes = window.VoxNestThemes || {};
      window.VoxNestThemes['${this.metadata.id}'] = {
        getThemes: () => ${JSON.stringify(this.getThemes().map(t => t.metadata))},
        getName: () => '${this.metadata.name}',
        getVersion: () => '${this.metadata.version}'
      };
    `;
  }

  /**
   * 获取客户端样式
   */
  public getClientStyles?(): string {
    const themes = this.getThemes();
    let styles = '';

    for (const theme of themes) {
      styles += this.getThemeStyles(theme.metadata.id);
    }

    return styles;
  }

  // ===========================================
  // 主题插件接口
  // ===========================================

  /**
   * 获取主题列表
   */
  public abstract getThemes(): Theme[];

  /**
   * 获取主题样式
   */
  public getThemeStyles(themeId: string): string {
    const theme = this.getThemes().find(t => t.metadata.id === themeId);
    if (!theme) {
      return '';
    }

    // 生成CSS变量
    const variables = themeManager.generateCSSVariables(theme);
    let css = ':root {\n';
    
    for (const [key, value] of Object.entries(variables)) {
      css += `  ${key}: ${value};\n`;
    }
    
    css += '}\n';

    // 添加自定义样式
    if (theme.customStyles) {
      css += theme.customStyles;
    }

    return css;
  }

  /**
   * 获取主题组件
   */
  public getThemeComponents(_themeId: string): ComponentConfig[] {
    // 子类可以重写此方法来提供特定主题的组件
    return [];
  }

  /**
   * 主题激活回调
   */
  public async onThemeActivated?(themeId: string): Promise<void> {
    console.log(`🎨 主题 ${themeId} 已激活`);
    
    // 应用主题样式
    const styles = this.getThemeStyles(themeId);
    if (styles) {
      this.injectStyles(themeId, styles);
    }
  }

  /**
   * 主题停用回调
   */
  public async onThemeDeactivated?(themeId: string): Promise<void> {
    console.log(`⏹️ 主题 ${themeId} 已停用`);
    
    // 移除主题样式
    this.removeStyles(themeId);
  }

  // ===========================================
  // 工具方法
  // ===========================================

  /**
   * 注入样式
   */
  protected injectStyles(themeId: string, styles: string): void {
    const styleId = `theme-plugin-${this.metadata.id}-${themeId}`;
    
    // 移除旧样式
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 注入新样式
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * 移除样式
   */
  protected removeStyles(_themeId: string): void {
    const styleId = `theme-plugin-${this.metadata.id}-${_themeId}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * 创建主题预览组件
   */
  protected createThemePreview(theme: Theme): ComponentConfig {
    const PreviewComponent: ComponentType<any> = () => {
      // 这里应该返回React元素，暂时返回null
      return null;
    };

    return {
      name: `${theme.metadata.id}-preview`,
      component: PreviewComponent,
      type: 'widget',
      description: `${theme.metadata.name} 主题预览`,
      props: {
        theme: theme.metadata
      }
    };
  }

  /**
   * 验证主题配置
   */
  protected validateTheme(theme: Theme): boolean {
    try {
      // 基础验证
      if (!theme.metadata?.id || !theme.metadata?.name) {
        return false;
      }

      if (!theme.colors || !theme.fonts) {
        return false;
      }

      // 可以添加更多验证逻辑
      return true;
    } catch (error) {
      console.error('主题验证失败:', error);
      return false;
    }
  }
}

/**
 * 简单主题插件实现示例
 */
export class SimpleThemePlugin extends BaseThemePlugin {
  public readonly metadata: PluginMetadata = {
    id: 'simple-theme-plugin',
    name: '简单主题插件',
    version: '1.0.0',
    description: '提供简单的主题实现',
    author: 'VoxNest Team',
    builtin: true
  };

  private themes: Theme[] = [];

  constructor(themes: Theme[] = []) {
    super();
    this.themes = themes;
  }

  public getThemes(): Theme[] {
    return this.themes;
  }

  public addTheme(theme: Theme): void {
    if (this.validateTheme(theme)) {
      this.themes.push(theme);
    } else {
      throw new Error(`主题验证失败: ${theme.metadata?.id || '未知'}`);
    }
  }

  public removeTheme(_themeId: string): void {
    const index = this.themes.findIndex(t => t.metadata.id === _themeId);
    if (index !== -1) {
      this.themes.splice(index, 1);
    }
  }

  public getThemeComponents(themeId: string): ComponentConfig[] {
    const theme = this.themes.find(t => t.metadata.id === themeId);
    if (!theme) {
      return [];
    }

    return [
      this.createThemePreview(theme)
    ];
  }
}

/**
 * 主题插件工厂
 */
export class ThemePluginFactory {
  /**
   * 创建简单主题插件
   */
  public static createSimplePlugin(themes: Theme[]): SimpleThemePlugin {
    return new SimpleThemePlugin(themes);
  }

  /**
   * 从配置创建主题插件
   */
  public static createFromConfig(config: {
    id: string;
    name: string;
    version?: string;
    description?: string;
    author?: string;
    themes: Theme[];
  }): SimpleThemePlugin {
    const plugin = new SimpleThemePlugin(config.themes);
    
    // 更新元数据
    plugin.metadata.id = config.id;
    plugin.metadata.name = config.name;
    plugin.metadata.version = config.version || '1.0.0';
    plugin.metadata.description = config.description || '';
    plugin.metadata.author = config.author || 'Unknown';

    return plugin;
  }

  /**
   * 验证主题插件
   */
  public static validatePlugin(plugin: IThemePlugin): boolean {
    try {
      // 验证元数据
      if (!plugin.metadata?.id || !plugin.metadata?.name) {
        return false;
      }

      // 验证主题
      const themes = plugin.getThemes();
      for (const theme of themes) {
        if (!theme.metadata?.id || !theme.metadata?.name) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('主题插件验证失败:', error);
      return false;
    }
  }
}

/**
 * 主题插件管理器
 */
export class ThemePluginManager {
  private static _instance: ThemePluginManager | null = null;
  private _plugins = new Map<string, IThemePlugin>();

  private constructor() {}

  public static getInstance(): ThemePluginManager {
    if (!ThemePluginManager._instance) {
      ThemePluginManager._instance = new ThemePluginManager();
    }
    return ThemePluginManager._instance;
  }

  /**
   * 注册主题插件
   */
  public registerPlugin(plugin: IThemePlugin): void {
    if (!ThemePluginFactory.validatePlugin(plugin)) {
      throw new Error(`主题插件验证失败: ${plugin.metadata?.id || '未知'}`);
    }

    this._plugins.set(plugin.metadata.id, plugin);
    console.log(`✅ 主题插件注册成功: ${plugin.metadata.name}`);
  }

  /**
   * 注销主题插件
   */
  public unregisterPlugin(pluginId: string): void {
    if (this._plugins.delete(pluginId)) {
      console.log(`🗑️ 主题插件注销成功: ${pluginId}`);
    }
  }

  /**
   * 获取主题插件
   */
  public getPlugin(pluginId: string): IThemePlugin | undefined {
    return this._plugins.get(pluginId);
  }

  /**
   * 获取所有主题插件
   */
  public getAllPlugins(): IThemePlugin[] {
    return Array.from(this._plugins.values());
  }

  /**
   * 获取所有主题
   */
  public getAllThemes(): Theme[] {
    const themes: Theme[] = [];
    
    for (const plugin of this._plugins.values()) {
      themes.push(...plugin.getThemes());
    }

    return themes;
  }

  /**
   * 按ID查找主题
   */
  public findTheme(themeId: string): { plugin: IThemePlugin; theme: Theme } | null {
    for (const plugin of this._plugins.values()) {
      const theme = plugin.getThemes().find(t => t.metadata.id === themeId);
      if (theme) {
        return { plugin, theme };
      }
    }

    return null;
  }

  /**
   * 激活主题
   */
  public async activateTheme(themeId: string): Promise<void> {
    const result = this.findTheme(themeId);
    if (!result) {
      throw new Error(`主题不存在: ${themeId}`);
    }

    const { plugin } = result;
    if (plugin.onThemeActivated) {
      await plugin.onThemeActivated(themeId);
    }
  }

  /**
   * 停用主题
   */
  public async deactivateTheme(themeId: string): Promise<void> {
    const result = this.findTheme(themeId);
    if (!result) {
      return; // 主题不存在，无需停用
    }

    const { plugin } = result;
    if (plugin.onThemeDeactivated) {
      await plugin.onThemeDeactivated(themeId);
    }
  }

  /**
   * 清理所有插件
   */
  public clear(): void {
    this._plugins.clear();
    console.log('🧹 已清理所有主题插件');
  }
}

// 导出单例实例
export const themePluginManager = ThemePluginManager.getInstance();
