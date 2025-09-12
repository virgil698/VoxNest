/**
 * VoxNest 主题管理器
 * 负责主题加载、切换、扩展管理和CSS变量应用
 */

import type {
  Theme,
  ThemeExtension,
  ThemeLoadOptions,
  ThemeSwitchOptions,
  ThemeEventType,
  ThemeEventListener,
  ThemeEventData,
  IThemeManager,
  IThemePackageManager,
  ColorConfig
} from './types';

export class ThemeManager implements IThemeManager {
  private static _instance: ThemeManager | null = null;
  
  private _currentTheme: Theme | null = null;
  private _availableThemes: Map<string, Theme> = new Map();
  private _loadedExtensions: Map<string, ThemeExtension> = new Map();
  private _eventListeners: Map<ThemeEventType, ThemeEventListener[]> = new Map();
  private _cssVariablesStyleElement: HTMLStyleElement | null = null;
  private _packageManager: IThemePackageManager | null = null;
  
  private constructor() {
    this.initializeStyleElement();
    this.loadSavedTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager._instance) {
      ThemeManager._instance = new ThemeManager();
    }
    return ThemeManager._instance;
  }

  // ===========================================
  // 公共属性访问器
  // ===========================================

  public get currentTheme(): Theme | null {
    return this._currentTheme;
  }

  public get availableThemes(): Theme[] {
    return Array.from(this._availableThemes.values());
  }

  public get loadedExtensions(): ThemeExtension[] {
    return Array.from(this._loadedExtensions.values());
  }

  public get packageManager(): IThemePackageManager {
    if (!this._packageManager) {
      // 延迟加载以避免循环依赖
      const { themePackageManager } = require('./packages/ThemePackageManager');
      this._packageManager = themePackageManager;
    }
    return this._packageManager!;
  }

  // ===========================================
  // 主题管理
  // ===========================================

  /**
   * 注册主题
   */
  public registerTheme(theme: Theme): void {
    this._availableThemes.set(theme.metadata.id, theme);
    
    this.emitEvent({
      type: 'theme-loaded',
      theme,
      timestamp: Date.now()
    });
  }

  /**
   * 注销主题
   */
  public unregisterTheme(themeId: string): void {
    const theme = this._availableThemes.get(themeId);
    
    if (theme) {
      this._availableThemes.delete(themeId);
      
      // 如果注销的是当前主题，切换到默认主题
      if (this._currentTheme?.metadata.id === themeId) {
        const defaultTheme = this.findDefaultTheme();
        if (defaultTheme) {
          this.loadTheme(defaultTheme.metadata.id, { immediate: true });
        }
      }
    }
  }

  /**
   * 加载主题
   */
  public async loadTheme(themeId: string, options: ThemeLoadOptions = {}): Promise<void> {
    const {
      immediate = true,
      persist = true,
      transition = 300,
      beforeLoad,
      afterLoad
    } = options;

    try {
      this.emitEvent({
        type: 'theme-loading',
        timestamp: Date.now()
      });

      const theme = this._availableThemes.get(themeId);
      if (!theme) {
        throw new Error(`主题 "${themeId}" 未找到`);
      }

      // 执行加载前回调
      if (beforeLoad) {
        beforeLoad(theme);
      }

      // 生成CSS变量
      const cssVariables = this.generateCSSVariables(theme);

      // 应用主题
      if (immediate) {
        this.applyCSSVariables(cssVariables);
        this._currentTheme = theme;
      } else {
        // 使用过渡动画
        await this.applyThemeWithTransition(cssVariables, theme, transition);
      }

      // 持久化保存
      if (persist) {
        this.saveCurrentTheme(themeId);
      }

      // 执行加载后回调
      if (afterLoad) {
        afterLoad(theme);
      }

      this.emitEvent({
        type: 'theme-loaded',
        theme,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emitEvent({
        type: 'theme-error',
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * 切换主题
   */
  public async switchTheme(themeId: string, options: ThemeSwitchOptions = {}): Promise<void> {
    const {
      smooth = true,
      onTransitionComplete,
      ...loadOptions
    } = options;

    try {
      this.emitEvent({
        type: 'theme-switching',
        timestamp: Date.now()
      });

      // 使用平滑过渡或立即切换
      await this.loadTheme(themeId, {
        ...loadOptions,
        immediate: !smooth
      });

      if (onTransitionComplete) {
        onTransitionComplete();
      }

      this.emitEvent({
        type: 'theme-switched',
        theme: this._currentTheme!,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emitEvent({
        type: 'theme-error',
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // ===========================================
  // 扩展管理
  // ===========================================

  /**
   * 加载主题扩展
   */
  public async loadExtension(extension: ThemeExtension): Promise<void> {
    try {
      // 检查目标主题是否存在
      if (extension.targetThemeId && !this._availableThemes.has(extension.targetThemeId)) {
        throw new Error(`目标主题 "${extension.targetThemeId}" 不存在`);
      }

      this._loadedExtensions.set(extension.id, extension);

      // 如果扩展针对当前主题，立即应用
      if (this.shouldApplyExtension(extension)) {
        await this.applyExtension(extension);
      }

      this.emitEvent({
        type: 'extension-loaded',
        extension,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emitEvent({
        type: 'extension-error',
        extension,
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * 卸载主题扩展
   */
  public unloadExtension(extensionId: string): void {
    const extension = this._loadedExtensions.get(extensionId);
    
    if (extension) {
      this._loadedExtensions.delete(extensionId);
      
      // 如果当前主题正在使用此扩展，重新加载主题
      if (this._currentTheme && this.shouldApplyExtension(extension)) {
        this.reloadCurrentTheme();
      }
    }
  }

  // ===========================================
  // CSS变量管理
  // ===========================================

  /**
   * 生成CSS变量
   */
  public generateCSSVariables(theme: Theme): Record<string, string> {
    const variables: Record<string, string> = {};

    // 颜色变量
    this.addColorVariables(variables, 'primary', theme.colors.primary);
    this.addColorVariables(variables, 'neutral', theme.colors.neutral);
    this.addColorVariables(variables, 'text', theme.colors.text);
    this.addColorVariables(variables, 'status', theme.colors.status);

    // 自定义颜色
    if (theme.colors.custom) {
      for (const [key, color] of Object.entries(theme.colors.custom)) {
        variables[`--color-custom-${key}`] = this.formatColorValue(color);
      }
    }

    // 字体变量
    variables['--font-family'] = theme.fonts.family;
    for (const [size, value] of Object.entries(theme.fonts.size)) {
      variables[`--font-size-${size}`] = value;
    }
    for (const [weight, value] of Object.entries(theme.fonts.weight)) {
      variables[`--font-weight-${weight}`] = value.toString();
    }
    for (const [height, value] of Object.entries(theme.fonts.lineHeight)) {
      variables[`--line-height-${height}`] = value;
    }

    // 间距变量
    variables['--spacing-unit'] = `${theme.spacing.unit}px`;
    for (const [scale, multiplier] of Object.entries(theme.spacing.scale)) {
      variables[`--spacing-${scale}`] = `${theme.spacing.unit * multiplier}px`;
    }

    // 圆角变量
    variables['--border-radius-small'] = theme.borderRadius.small;
    variables['--border-radius-medium'] = theme.borderRadius.medium;
    variables['--border-radius-large'] = theme.borderRadius.large;
    variables['--border-radius-full'] = theme.borderRadius.full;

    // 阴影变量
    variables['--shadow-small'] = theme.shadows.small;
    variables['--shadow-medium'] = theme.shadows.medium;
    variables['--shadow-large'] = theme.shadows.large;
    variables['--shadow-elevated'] = theme.shadows.elevated;

    // 动画变量
    for (const [duration, value] of Object.entries(theme.animations.duration)) {
      variables[`--animation-duration-${duration}`] = value;
    }
    for (const [easing, value] of Object.entries(theme.animations.easing)) {
      variables[`--animation-easing-${easing}`] = value;
    }

    // 布局变量
    variables['--layout-max-width'] = theme.layout.maxWidth;
    variables['--layout-content-padding'] = theme.layout.contentPadding;
    variables['--layout-sidebar-width'] = theme.layout.sidebarWidth;
    variables['--layout-sidebar-collapsed-width'] = theme.layout.sidebarCollapsedWidth;
    variables['--layout-header-height'] = theme.layout.headerHeight;
    variables['--layout-footer-height'] = theme.layout.footerHeight;

    // 帖子样式变量
    this.addPostStyleVariables(variables, theme.postStyles);

    // 组件样式变量
    this.addComponentStyleVariables(variables, theme.componentStyles);

    // 排版变量
    this.addTypographyVariables(variables, theme.typography);

    // 自定义变量
    if (theme.customVariables) {
      Object.assign(variables, theme.customVariables);
    }

    return variables;
  }

  /**
   * 应用CSS变量
   */
  public applyCSSVariables(variables: Record<string, string>): void {
    if (!this._cssVariablesStyleElement) {
      this.initializeStyleElement();
    }

    const cssText = this.generateCSSText(variables);
    this._cssVariablesStyleElement!.textContent = cssText;
  }

  // ===========================================
  // 事件系统
  // ===========================================

  /**
   * 添加事件监听器
   */
  public addEventListener(type: ThemeEventType, listener: ThemeEventListener): void {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, []);
    }
    this._eventListeners.get(type)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(type: ThemeEventType, listener: ThemeEventListener): void {
    const listeners = this._eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 初始化样式元素
   */
  private initializeStyleElement(): void {
    this._cssVariablesStyleElement = document.createElement('style');
    this._cssVariablesStyleElement.id = 'voxnest-theme-variables';
    document.head.appendChild(this._cssVariablesStyleElement);
  }

  /**
   * 加载保存的主题
   */
  private loadSavedTheme(): void {
    try {
      const savedThemeId = localStorage.getItem('voxnest-current-theme');
      if (savedThemeId && this._availableThemes.has(savedThemeId)) {
        this.loadTheme(savedThemeId, { immediate: true, persist: false });
      }
    } catch (error) {
      console.warn('加载保存的主题失败:', error);
    }
  }

  /**
   * 保存当前主题
   */
  private saveCurrentTheme(themeId: string): void {
    try {
      localStorage.setItem('voxnest-current-theme', themeId);
    } catch (error) {
      console.warn('保存主题失败:', error);
    }
  }

  /**
   * 查找默认主题
   */
  private findDefaultTheme(): Theme | null {
    // 优先查找ID为'light'的内置主题
    for (const theme of this._availableThemes.values()) {
      if (theme.metadata.builtin && theme.metadata.id === 'light') {
        return theme;
      }
    }
    
    // 如果没有，返回第一个内置主题
    for (const theme of this._availableThemes.values()) {
      if (theme.metadata.builtin) {
        return theme;
      }
    }
    
    // 最后返回任意主题
    return this._availableThemes.values().next().value || null;
  }

  /**
   * 使用过渡动画应用主题
   */
  private async applyThemeWithTransition(
    variables: Record<string, string>,
    theme: Theme,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      // 添加过渡效果
      document.documentElement.style.transition = `all ${duration}ms ease-in-out`;
      
      // 应用变量
      this.applyCSSVariables(variables);
      this._currentTheme = theme;
      
      // 移除过渡效果
      setTimeout(() => {
        document.documentElement.style.transition = '';
        resolve();
      }, duration);
    });
  }

  /**
   * 判断是否应该应用扩展
   */
  private shouldApplyExtension(extension: ThemeExtension): boolean {
    if (!this._currentTheme) return false;
    
    return !extension.targetThemeId || 
           extension.targetThemeId === this._currentTheme.metadata.id;
  }

  /**
   * 应用扩展
   */
  private async applyExtension(extension: ThemeExtension): Promise<void> {
    if (!this._currentTheme) return;
    
    // 应用扩展的CSS变量
    if (extension.variables) {
      this.applyCSSVariables({
        ...this.generateCSSVariables(this._currentTheme),
        ...extension.variables
      });
    }
    
    // 应用自定义CSS
    if (extension.customCSS) {
      this.applyCustomCSS(extension.id, extension.customCSS);
    }
  }

  /**
   * 应用自定义CSS
   */
  private applyCustomCSS(extensionId: string, css: string): void {
    const styleId = `voxnest-extension-${extensionId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  }

  /**
   * 重新加载当前主题
   */
  private async reloadCurrentTheme(): Promise<void> {
    if (this._currentTheme) {
      await this.loadTheme(this._currentTheme.metadata.id, { 
        immediate: true, 
        persist: false 
      });
    }
  }

  /**
   * 添加颜色变量
   */
  private addColorVariables(
    variables: Record<string, string>,
    prefix: string,
    colors: Record<string, ColorConfig>
  ): void {
    for (const [key, color] of Object.entries(colors)) {
      variables[`--color-${prefix}-${key}`] = this.formatColorValue(color);
    }
  }

  /**
   * 格式化颜色值
   */
  private formatColorValue(color: ColorConfig): string {
    if (color.opacity !== undefined && color.opacity < 1) {
      // 处理透明度
      if (color.value.startsWith('#')) {
        return this.hexToRgba(color.value, color.opacity);
      }
    }
    return color.value;
  }

  /**
   * 将十六进制颜色转换为RGBA
   */
  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 生成CSS文本
   */
  private generateCSSText(variables: Record<string, string>): string {
    const variableDeclarations = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
    
    return `:root {\n${variableDeclarations}\n}`;
  }

  /**
   * 添加帖子样式变量
   */
  private addPostStyleVariables(variables: Record<string, string>, postStyles: Theme['postStyles']): void {
    // 帖子卡片样式
    variables['--post-card-background'] = this.formatColorValue(postStyles.card.background);
    variables['--post-card-border'] = this.formatColorValue(postStyles.card.border);
    variables['--post-card-border-radius'] = postStyles.card.borderRadius;
    variables['--post-card-padding'] = postStyles.card.padding;
    variables['--post-card-margin-bottom'] = postStyles.card.marginBottom;
    variables['--post-card-box-shadow'] = postStyles.card.boxShadow;

    // 帖子标题样式
    variables['--post-title-font-size'] = postStyles.title.fontSize;
    variables['--post-title-font-weight'] = postStyles.title.fontWeight;
    variables['--post-title-color'] = this.formatColorValue(postStyles.title.color);
    variables['--post-title-line-height'] = postStyles.title.lineHeight;
    variables['--post-title-margin-bottom'] = postStyles.title.marginBottom;

    // 帖子内容样式
    variables['--post-content-font-size'] = postStyles.content.fontSize;
    variables['--post-content-line-height'] = postStyles.content.lineHeight;
    variables['--post-content-color'] = this.formatColorValue(postStyles.content.color);
    variables['--post-content-margin-bottom'] = postStyles.content.marginBottom;
    if (postStyles.content.maxHeight) {
      variables['--post-content-max-height'] = postStyles.content.maxHeight;
    }

    // 帖子元信息样式
    variables['--post-meta-font-size'] = postStyles.meta.fontSize;
    variables['--post-meta-color'] = this.formatColorValue(postStyles.meta.color);
    variables['--post-meta-spacing'] = postStyles.meta.spacing;

    // 帖子标签样式
    variables['--post-tags-background-color'] = this.formatColorValue(postStyles.tags.backgroundColor);
    variables['--post-tags-text-color'] = this.formatColorValue(postStyles.tags.textColor);
    variables['--post-tags-border-radius'] = postStyles.tags.borderRadius;
    variables['--post-tags-padding'] = postStyles.tags.padding;
    variables['--post-tags-font-size'] = postStyles.tags.fontSize;
    variables['--post-tags-spacing'] = postStyles.tags.spacing;

    // 帖子操作按钮样式
    variables['--post-actions-button-size'] = postStyles.actions.buttonSize;
    variables['--post-actions-button-spacing'] = postStyles.actions.buttonSpacing;
    variables['--post-actions-icon-size'] = postStyles.actions.iconSize;
  }

  /**
   * 添加组件样式变量
   */
  private addComponentStyleVariables(variables: Record<string, string>, componentStyles: Theme['componentStyles']): void {
    // 按钮样式
    variables['--component-button-border-radius'] = componentStyles.button.borderRadius;
    variables['--component-button-padding'] = componentStyles.button.padding;
    variables['--component-button-font-size'] = componentStyles.button.fontSize;
    variables['--component-button-font-weight'] = componentStyles.button.fontWeight;
    variables['--component-button-min-height'] = componentStyles.button.minHeight;
    variables['--component-button-transition'] = componentStyles.button.transition;

    // 输入框样式
    variables['--component-input-border-radius'] = componentStyles.input.borderRadius;
    variables['--component-input-padding'] = componentStyles.input.padding;
    variables['--component-input-font-size'] = componentStyles.input.fontSize;
    variables['--component-input-height'] = componentStyles.input.height;
    variables['--component-input-border-width'] = componentStyles.input.borderWidth;
    variables['--component-input-transition'] = componentStyles.input.transition;

    // 卡片样式
    variables['--component-card-border-radius'] = componentStyles.card.borderRadius;
    variables['--component-card-padding'] = componentStyles.card.padding;
    variables['--component-card-background-color'] = this.formatColorValue(componentStyles.card.backgroundColor);
    variables['--component-card-border-color'] = this.formatColorValue(componentStyles.card.borderColor);
    variables['--component-card-box-shadow'] = componentStyles.card.boxShadow;

    // 模态框样式
    variables['--component-modal-border-radius'] = componentStyles.modal.borderRadius;
    variables['--component-modal-max-width'] = componentStyles.modal.maxWidth;
    variables['--component-modal-padding'] = componentStyles.modal.padding;
    variables['--component-modal-background-color'] = this.formatColorValue(componentStyles.modal.backgroundColor);
    variables['--component-modal-overlay-color'] = this.formatColorValue(componentStyles.modal.overlayColor);

    // 导航样式
    variables['--component-navigation-height'] = componentStyles.navigation.height;
    variables['--component-navigation-background-color'] = this.formatColorValue(componentStyles.navigation.backgroundColor);
    variables['--component-navigation-border-color'] = this.formatColorValue(componentStyles.navigation.borderColor);
    variables['--component-navigation-item-padding'] = componentStyles.navigation.itemPadding;
    variables['--component-navigation-item-border-radius'] = componentStyles.navigation.itemBorderRadius;
  }

  /**
   * 添加排版变量
   */
  private addTypographyVariables(variables: Record<string, string>, typography: Theme['typography']): void {
    // 标题样式
    Object.entries(typography.headings).forEach(([level, style]) => {
      variables[`--typography-${level}-font-size`] = style.fontSize;
      variables[`--typography-${level}-font-weight`] = style.fontWeight;
      variables[`--typography-${level}-line-height`] = style.lineHeight;
      variables[`--typography-${level}-margin-bottom`] = style.marginBottom;
    });

    // 段落样式
    variables['--typography-paragraph-font-size'] = typography.paragraph.fontSize;
    variables['--typography-paragraph-line-height'] = typography.paragraph.lineHeight;
    variables['--typography-paragraph-margin-bottom'] = typography.paragraph.marginBottom;
    if (typography.paragraph.textIndent) {
      variables['--typography-paragraph-text-indent'] = typography.paragraph.textIndent;
    }

    // 引用样式
    variables['--typography-blockquote-border-left-width'] = typography.blockquote.borderLeftWidth;
    variables['--typography-blockquote-border-left-color'] = this.formatColorValue(typography.blockquote.borderLeftColor);
    variables['--typography-blockquote-padding'] = typography.blockquote.padding;
    variables['--typography-blockquote-background-color'] = this.formatColorValue(typography.blockquote.backgroundColor);
    variables['--typography-blockquote-font-style'] = typography.blockquote.fontStyle;
    variables['--typography-blockquote-font-size'] = typography.blockquote.fontSize;

    // 代码样式
    variables['--typography-code-font-size'] = typography.code.fontSize;
    variables['--typography-code-background-color'] = this.formatColorValue(typography.code.backgroundColor);
    variables['--typography-code-text-color'] = this.formatColorValue(typography.code.textColor);
    variables['--typography-code-border-radius'] = typography.code.borderRadius;
    variables['--typography-code-padding'] = typography.code.padding;
    variables['--typography-code-font-family'] = typography.code.fontFamily;

    // 链接样式
    variables['--typography-link-color'] = this.formatColorValue(typography.link.color);
    variables['--typography-link-hover-color'] = this.formatColorValue(typography.link.hoverColor);
    variables['--typography-link-text-decoration'] = typography.link.textDecoration;
    variables['--typography-link-hover-text-decoration'] = typography.link.hoverTextDecoration;
  }

  /**
   * 发出事件
   */
  private emitEvent(data: ThemeEventData): void {
    const listeners = this._eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('主题事件监听器执行失败:', error);
        }
      });
    }
  }
}

// 导出单例实例
export const themeManager = ThemeManager.getInstance();
