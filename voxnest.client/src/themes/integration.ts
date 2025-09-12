/**
 * VoxNest 主题系统与配置系统集成
 * 将主题管理与应用配置无缝结合
 */

import { themeManager } from './ThemeManager';
import { builtinThemes, getDefaultTheme } from './builtin';
import { getAppConfig, updateAppConfig } from '../config/index';
import type { AppConfig } from '../config';
import type { ThemeEventListener } from './types';

/**
 * 主题配置集成器
 */
export class ThemeConfigIntegration {
  private static _instance: ThemeConfigIntegration | null = null;
  private _initialized = false;

  private constructor() {}

  public static getInstance(): ThemeConfigIntegration {
    if (!ThemeConfigIntegration._instance) {
      ThemeConfigIntegration._instance = new ThemeConfigIntegration();
    }
    return ThemeConfigIntegration._instance;
  }

  /**
   * 初始化主题系统
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // 注册内置主题
      this.registerBuiltinThemes();

      // 设置主题事件监听器
      this.setupEventListeners();

      // 根据配置加载初始主题
      await this.loadInitialTheme();

      // 监听配置变化
      this.watchConfigChanges();

      this._initialized = true;
      console.log('🎨 主题系统初始化完成');

    } catch (error) {
      console.error('❌ 主题系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 根据配置切换主题
   */
  public async switchThemeByConfig(): Promise<void> {
    const config = getAppConfig();
    const targetTheme = this.resolveThemeFromConfig(config);
    
    if (targetTheme && themeManager.currentTheme?.metadata.id !== targetTheme) {
      await themeManager.switchTheme(targetTheme, {
        smooth: config.ui.enableAnimations,
        transition: config.ui.enableAnimations ? 300 : 0
      });
    }
  }

  /**
   * 同步主题到配置
   */
  public syncThemeToConfig(themeId: string): void {
    const config = getAppConfig();
    
    // 如果是auto模式，不更新配置
    if (config.ui.theme === 'auto') {
      return;
    }

    // 更新配置中的主题设置
    updateAppConfig({
      ui: {
        ...config.ui,
        theme: this.mapThemeIdToConfigTheme(themeId)
      }
    });
  }

  /**
   * 检测系统主题偏好
   */
  public detectSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  /**
   * 启用自动主题切换（跟随系统）
   */
  public enableAutoTheme(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      console.warn('当前环境不支持自动主题检测');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 立即应用系统主题
    this.applySystemTheme();
    
    // 监听系统主题变化
    const handleChange = () => {
      const config = getAppConfig();
      if (config.ui.theme === 'auto') {
        this.applySystemTheme();
      }
    };

    // 现代浏览器使用addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }

    // 更新配置为auto模式
    updateAppConfig({
      ui: {
        ...getAppConfig().ui,
        theme: 'auto'
      }
    });
  }

  /**
   * 禁用自动主题切换
   */
  public disableAutoTheme(): void {
    const currentTheme = themeManager.currentTheme;
    if (currentTheme) {
      updateAppConfig({
        ui: {
          ...getAppConfig().ui,
          theme: this.mapThemeIdToConfigTheme(currentTheme.metadata.id)
        }
      });
    }
  }

  /**
   * 获取主题统计信息
   */
  public getThemeStats(): {
    total: number;
    builtin: number;
    custom: number;
    current: string | null;
  } {
    const themes = themeManager.availableThemes;
    const builtin = themes.filter(t => t.metadata.builtin).length;
    const custom = themes.length - builtin;

    return {
      total: themes.length,
      builtin,
      custom,
      current: themeManager.currentTheme?.metadata.id || null
    };
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 注册内置主题
   */
  private registerBuiltinThemes(): void {
    builtinThemes.forEach(theme => {
      themeManager.registerTheme(theme);
    });
  }

  /**
   * 设置主题事件监听器
   */
  private setupEventListeners(): void {
    // 主题切换完成时同步到配置
    const onThemeSwitched: ThemeEventListener = (data) => {
      if (data.theme && data.type === 'theme-switched') {
        this.syncThemeToConfig(data.theme.metadata.id);
      }
    };

    themeManager.addEventListener('theme-switched', onThemeSwitched);

    // 主题加载错误时的处理
    const onThemeError: ThemeEventListener = (data) => {
      if (data.error) {
        console.error('主题加载错误:', data.error);
        // 尝试加载默认主题
        this.loadFallbackTheme();
      }
    };

    themeManager.addEventListener('theme-error', onThemeError);
  }

  /**
   * 加载初始主题
   */
  private async loadInitialTheme(): Promise<void> {
    const config = getAppConfig();
    const themeId = this.resolveThemeFromConfig(config);
    
    try {
      await themeManager.loadTheme(themeId, {
        immediate: true,
        persist: true
      });
    } catch (error) {
      console.warn('加载初始主题失败，使用默认主题:', error);
      await this.loadFallbackTheme();
    }
  }

  /**
   * 加载备用主题
   */
  private async loadFallbackTheme(): Promise<void> {
    try {
      const defaultTheme = getDefaultTheme();
      await themeManager.loadTheme(defaultTheme.metadata.id, {
        immediate: true,
        persist: false
      });
    } catch (error) {
      console.error('加载备用主题也失败了:', error);
    }
  }

  /**
   * 从配置解析主题ID
   */
  private resolveThemeFromConfig(config: AppConfig): string {
    switch (config.ui.theme) {
      case 'auto':
        return this.detectSystemTheme();
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      default:
        // 如果配置中是其他值，尝试直接使用作为主题ID
        return config.ui.theme || 'light';
    }
  }

  /**
   * 将主题ID映射为配置主题值
   */
  private mapThemeIdToConfigTheme(themeId: string): AppConfig['ui']['theme'] {
    switch (themeId) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      default:
        return 'light';
    }
  }

  /**
   * 应用系统主题
   */
  private async applySystemTheme(): Promise<void> {
    const systemTheme = this.detectSystemTheme();
    const config = getAppConfig();
    
    try {
      await themeManager.switchTheme(systemTheme, {
        smooth: config.ui.enableAnimations,
        transition: config.ui.enableAnimations ? 300 : 0
      });
    } catch (error) {
      console.error('应用系统主题失败:', error);
    }
  }

  /**
   * 监听配置变化
   */
  private watchConfigChanges(): void {
    // 监听本地存储变化（其他标签页的配置更新）
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === getAppConfig().storage.configKey) {
          // 配置发生变化，重新同步主题
          setTimeout(() => {
            this.switchThemeByConfig();
          }, 100);
        }
      });
    }
  }
}

// 导出单例实例
export const themeConfigIntegration = ThemeConfigIntegration.getInstance();

// ===========================================
// 便捷函数
// ===========================================

/**
 * 初始化主题系统
 */
export async function initializeThemeSystem(): Promise<void> {
  await themeConfigIntegration.initialize();
}

/**
 * 切换到指定主题
 */
export async function switchToTheme(themeId: string): Promise<void> {
  await themeManager.switchTheme(themeId, {
    smooth: getAppConfig().ui.enableAnimations
  });
}

/**
 * 切换到下一个主题（循环切换）
 */
export async function switchToNextTheme(): Promise<void> {
  const themes = themeManager.availableThemes;
  const currentTheme = themeManager.currentTheme;
  
  if (themes.length === 0) return;
  
  const currentIndex = currentTheme 
    ? themes.findIndex(t => t.metadata.id === currentTheme.metadata.id)
    : -1;
  
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  
  await switchToTheme(nextTheme.metadata.id);
}

/**
 * 启用自动主题（跟随系统）
 */
export function enableAutoTheme(): void {
  themeConfigIntegration.enableAutoTheme();
}

/**
 * 禁用自动主题
 */
export function disableAutoTheme(): void {
  themeConfigIntegration.disableAutoTheme();
}

/**
 * 获取当前主题信息
 */
export function getCurrentThemeInfo(): {
  id: string;
  name: string;
  description?: string;
  builtin: boolean;
} | null {
  const theme = themeManager.currentTheme;
  return theme ? {
    id: theme.metadata.id,
    name: theme.metadata.name,
    description: theme.metadata.description,
    builtin: theme.metadata.builtin
  } : null;
}

/**
 * 获取可用主题列表
 */
export function getAvailableThemes(): Array<{
  id: string;
  name: string;
  description?: string;
  builtin: boolean;
  tags?: string[];
}> {
  return themeManager.availableThemes.map(theme => ({
    id: theme.metadata.id,
    name: theme.metadata.name,
    description: theme.metadata.description,
    builtin: theme.metadata.builtin,
    tags: theme.metadata.tags
  }));
}
