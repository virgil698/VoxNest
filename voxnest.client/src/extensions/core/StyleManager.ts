/**
 * VoxNest 样式管理系统
 * 支持主题切换、CSS变量注入、动态样式管理
 */

import type { Logger } from './types';

// 主题配置
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, string>;
  styles?: string;
  dark?: boolean;
  author?: string;
  version?: string;
}

// CSS变量注入配置
export interface VariableInjection {
  id: string;
  source: string;
  variables: Record<string, string>;
  scope?: 'global' | 'component';
  priority?: number;
}

// 动态样式规则
export interface DynamicStyleRule {
  id: string;
  source: string;
  selector: string;
  properties: Record<string, string>;
  condition?: () => boolean;
  media?: string; // 媒体查询
}

export class StyleManager {
  private logger: Logger;
  private themes = new Map<string, ThemeConfig>();
  private currentTheme: string | null = null;
  private variables = new Map<string, VariableInjection>();
  private dynamicRules = new Map<string, DynamicStyleRule>();
  private styleElements = new Map<string, HTMLStyleElement>();
  private mediaObservers = new Map<string, MediaQueryList>();

  // CSS 变量前缀
  private readonly CSS_VAR_PREFIX = '--voxnest';

  constructor(logger: Logger) {
    this.logger = logger.createChild('StyleManager');
    this.initializeDefaultTheme();
    this.setupDarkModeDetection();
  }

  // ==================== 主题管理 ====================

  /**
   * 注册主题
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
    this.logger.info(`Registered theme: ${theme.name} (${theme.id})`);
    
    // 如果是第一个主题或当前没有活动主题，设为默认主题
    if (this.themes.size === 1 || !this.currentTheme) {
      this.applyTheme(theme.id);
    }
  }

  /**
   * 应用主题
   */
  applyTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) {
      this.logger.warn(`Theme not found: ${themeId}`);
      return false;
    }

    this.logger.info(`Applying theme: ${theme.name} (${themeId})`);
    
    // 移除当前主题样式
    if (this.currentTheme) {
      this.removeThemeStyles(this.currentTheme);
    }

    // 应用新主题
    this.applyThemeVariables(theme);
    this.applyThemeStyles(theme);
    this.currentTheme = themeId;

    // 保存主题偏好
    localStorage.setItem('voxnest-theme', themeId);
    
    // 触发主题变更事件
    this.dispatchThemeChangeEvent(theme);
    
    return true;
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme ? this.themes.get(this.currentTheme) || null : null;
  }

  /**
   * 获取所有主题
   */
  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  /**
   * 切换明暗主题
   */
  toggleDarkMode(): void {
    const themes = this.getAllThemes();
    const currentTheme = this.getCurrentTheme();
    
    if (!currentTheme) return;
    
    // 查找对应的明暗主题
    const targetDark = !currentTheme.dark;
    const targetTheme = themes.find(t => t.dark === targetDark);
    
    if (targetTheme) {
      this.applyTheme(targetTheme.id);
    } else {
      // 如果没有对应主题，动态切换当前主题的明暗模式
      this.toggleCurrentThemeDarkMode();
    }
  }

  // ==================== CSS 变量管理 ====================

  /**
   * 注入 CSS 变量
   */
  injectVariables(injection: VariableInjection): void {
    this.variables.set(injection.id, injection);
    this.logger.debug(`Injected variables: ${injection.id} from ${injection.source}`);
    
    // 立即应用变量
    this.applyVariables(injection);
  }

  /**
   * 移除 CSS 变量
   */
  removeVariables(id: string): void {
    if (this.variables.has(id)) {
      this.variables.delete(id);
      this.logger.debug(`Removed variables: ${id}`);
      this.refreshAllVariables();
    }
  }

  /**
   * 按源移除变量
   */
  removeVariablesBySource(source: string): void {
    const toRemove: string[] = [];
    this.variables.forEach((injection, id) => {
      if (injection.source === source) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this.removeVariables(id));
  }

  // ==================== 动态样式规则 ====================

  /**
   * 添加动态样式规则
   */
  addDynamicRule(rule: DynamicStyleRule): void {
    this.dynamicRules.set(rule.id, rule);
    this.logger.debug(`Added dynamic rule: ${rule.id} from ${rule.source}`);
    
    // 立即应用规则
    this.applyDynamicRule(rule);
    
    // 如果有媒体查询，设置监听器
    if (rule.media) {
      this.setupMediaObserver(rule);
    }
  }

  /**
   * 移除动态样式规则
   */
  removeDynamicRule(id: string): void {
    if (this.dynamicRules.has(id)) {
      this.dynamicRules.delete(id);
      this.logger.debug(`Removed dynamic rule: ${id}`);
      this.removeDynamicRuleFromDom(id);
    }
  }

  /**
   * 按源移除动态规则
   */
  removeDynamicRulesBySource(source: string): void {
    const toRemove: string[] = [];
    this.dynamicRules.forEach((rule, id) => {
      if (rule.source === source) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this.removeDynamicRule(id));
  }

  // ==================== 私有方法 ====================

  private initializeDefaultTheme(): void {
    // 创建默认主题
    const defaultTheme: ThemeConfig = {
      id: 'default',
      name: '默认主题',
      description: 'VoxNest 默认主题',
      variables: {
        'primary-color': '#4f46e5',
        'secondary-color': '#7c3aed',
        'background-color': '#ffffff',
        'text-color': '#1f2937',
        'border-color': '#e5e7eb',
        'border-radius': '8px',
        'spacing-sm': '8px',
        'spacing-md': '16px',
        'spacing-lg': '24px',
      },
      dark: false
    };
    
    const darkTheme: ThemeConfig = {
      id: 'dark',
      name: '暗色主题',
      description: 'VoxNest 暗色主题',
      variables: {
        'primary-color': '#6366f1',
        'secondary-color': '#8b5cf6',
        'background-color': '#1f2937',
        'text-color': '#f9fafb',
        'border-color': '#374151',
        'border-radius': '8px',
        'spacing-sm': '8px',
        'spacing-md': '16px',
        'spacing-lg': '24px',
      },
      dark: true
    };
    
    this.registerTheme(defaultTheme);
    this.registerTheme(darkTheme);
    
    // 从本地存储恢复主题
    const savedTheme = localStorage.getItem('voxnest-theme');
    if (savedTheme && this.themes.has(savedTheme)) {
      this.applyTheme(savedTheme);
    }
  }

  private setupDarkModeDetection(): void {
    // 监听系统暗模式变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('voxnest-theme')) {
        // 只在用户没有手动设置主题时才自动切换
        const targetTheme = e.matches ? 'dark' : 'default';
        if (this.themes.has(targetTheme)) {
          this.applyTheme(targetTheme);
        }
      }
    });
  }

  private applyThemeVariables(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    Object.entries(theme.variables).forEach(([key, value]) => {
      const cssVar = this.formatCSSVariable(key);
      root.style.setProperty(cssVar, value);
    });
  }

  private applyThemeStyles(theme: ThemeConfig): void {
    if (theme.styles) {
      const styleId = `theme-${theme.id}`;
      this.injectStyleContent(theme.styles, styleId, `theme-${theme.id}`);
    }
  }

  private removeThemeStyles(themeId: string): void {
    const styleId = `theme-${themeId}`;
    this.removeStyleElement(styleId);
  }

  private toggleCurrentThemeDarkMode(): void {
    const root = document.documentElement;
    const currentBg = getComputedStyle(root).getPropertyValue('--voxnest-background-color').trim();
    const isDark = currentBg.includes('#1f') || currentBg.includes('#2d') || currentBg.includes('rgb(31');
    
    if (isDark) {
      // 切换到亮色
      root.style.setProperty('--voxnest-background-color', '#ffffff');
      root.style.setProperty('--voxnest-text-color', '#1f2937');
      root.style.setProperty('--voxnest-border-color', '#e5e7eb');
    } else {
      // 切换到暗色
      root.style.setProperty('--voxnest-background-color', '#1f2937');
      root.style.setProperty('--voxnest-text-color', '#f9fafb');
      root.style.setProperty('--voxnest-border-color', '#374151');
    }
  }

  private applyVariables(injection: VariableInjection): void {
    const root = document.documentElement;
    
    Object.entries(injection.variables).forEach(([key, value]) => {
      const cssVar = this.formatCSSVariable(key);
      root.style.setProperty(cssVar, value);
    });
  }

  private refreshAllVariables(): void {
    // 清除所有自定义变量
    const root = document.documentElement;
    const styles = root.style;
    const toRemove: string[] = [];
    
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      if (prop.startsWith('--voxnest-')) {
        toRemove.push(prop);
      }
    }
    
    toRemove.forEach(prop => root.style.removeProperty(prop));
    
    // 重新应用当前主题
    if (this.currentTheme) {
      const theme = this.themes.get(this.currentTheme);
      if (theme) {
        this.applyThemeVariables(theme);
      }
    }
    
    // 重新应用所有变量注入
    this.variables.forEach(injection => {
      this.applyVariables(injection);
    });
  }

  private applyDynamicRule(rule: DynamicStyleRule): void {
    if (rule.condition && !rule.condition()) {
      return; // 条件不满足，不应用规则
    }
    
    const css = this.buildCSSRule(rule);
    const styleId = `dynamic-${rule.id}`;
    this.injectStyleContent(css, styleId, rule.source);
  }

  private buildCSSRule(rule: DynamicStyleRule): string {
    const properties = Object.entries(rule.properties)
      .map(([prop, value]) => `  ${prop}: ${value};`)
      .join('\n');
    
    let css = `${rule.selector} {\n${properties}\n}`;
    
    if (rule.media) {
      css = `@media ${rule.media} {\n  ${css.replace(/\n/g, '\n  ')}\n}`;
    }
    
    return css;
  }

  private setupMediaObserver(rule: DynamicStyleRule): void {
    if (!rule.media) return;
    
    const mediaQuery = window.matchMedia(rule.media);
    this.mediaObservers.set(rule.id, mediaQuery);
    
    mediaQuery.addEventListener('change', () => {
      this.applyDynamicRule(rule);
    });
  }

  private removeDynamicRuleFromDom(id: string): void {
    const styleId = `dynamic-${id}`;
    this.removeStyleElement(styleId);
    
    // 清理媒体查询监听器
    const observer = this.mediaObservers.get(id);
    if (observer) {
      this.mediaObservers.delete(id);
    }
  }

  private injectStyleContent(content: string, id: string, source: string): void {
    let styleElement = document.getElementById(id) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = id;
      styleElement.setAttribute('data-source', source);
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = content;
    this.styleElements.set(id, styleElement);
  }

  private removeStyleElement(id: string): void {
    const element = this.styleElements.get(id);
    if (element) {
      element.remove();
      this.styleElements.delete(id);
    }
  }

  private formatCSSVariable(name: string): string {
    // 确保变量名有正确的前缀
    if (name.startsWith('--')) {
      return name;
    }
    return `${this.CSS_VAR_PREFIX}-${name}`;
  }

  private dispatchThemeChangeEvent(theme: ThemeConfig): void {
    const event = new CustomEvent('voxnest:theme-change', {
      detail: { theme }
    });
    window.dispatchEvent(event);
  }

  // ==================== 公共接口 ====================

  /**
   * 获取 CSS 变量值
   */
  getCSSVariable(name: string): string {
    const varName = this.formatCSSVariable(name);
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  /**
   * 设置 CSS 变量值
   */
  setCSSVariable(name: string, value: string): void {
    const varName = this.formatCSSVariable(name);
    document.documentElement.style.setProperty(varName, value);
  }

  /**
   * 清理所有样式
   */
  cleanup(): void {
    this.logger.info('Cleaning up StyleManager');
    
    // 清理样式元素
    this.styleElements.forEach(element => element.remove());
    this.styleElements.clear();
    
    // 清理媒体查询监听器
    this.mediaObservers.clear();
    
    // 清理数据
    this.variables.clear();
    this.dynamicRules.clear();
  }

  /**
   * 调试信息
   */
  debug(): void {
    console.group('🎨 StyleManager Debug Info');
    console.log('Current Theme:', this.getCurrentTheme());
    console.log('All Themes:', this.getAllThemes());
    console.log('Variables:', Object.fromEntries(this.variables));
    console.log('Dynamic Rules:', Object.fromEntries(this.dynamicRules));
    console.log('Style Elements:', Object.fromEntries(this.styleElements));
    console.groupEnd();
  }
}
