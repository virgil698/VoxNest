/**
 * 智能主题管理器
 * 支持明暗模式切换、系统偏好检测、定时切换等高级功能
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: ThemeMode;
  enableTransitions: boolean;
  transitionDuration: number;
  savePreference: boolean;
  followSystemTheme: boolean;
  enableScheduler: boolean;
  scheduler: {
    lightModeStart: string;
    darkModeStart: string;
    enabled: boolean;
  };
  customColors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    largerText: boolean;
  };
}

export interface ThemeChangeEvent {
  previousTheme: 'light' | 'dark';
  currentTheme: 'light' | 'dark';
  trigger: 'user' | 'system' | 'scheduler' | 'api';
  timestamp: number;
}

export class ThemeManager {
  private config: ThemeConfig;
  private currentTheme: 'light' | 'dark' = 'light';
  private mediaQuery: MediaQueryList;
  private schedulerTimer: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: ThemeChangeEvent) => void> = [];
  
  private readonly STORAGE_KEY = 'voxnest-theme-preferences';
  private readonly CSS_THEME_VAR = '--voxnest-theme-mode';

  constructor(initialConfig: Partial<ThemeConfig> = {}) {
    this.config = {
      mode: 'auto',
      enableTransitions: true,
      transitionDuration: 300,
      savePreference: true,
      followSystemTheme: true,
      enableScheduler: false,
      scheduler: {
        lightModeStart: '06:00',
        darkModeStart: '18:00',
        enabled: false
      },
      customColors: {
        light: {
          primary: '#4f46e5',
          secondary: '#7c3aed',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b'
        },
        dark: {
          primary: '#6366f1',
          secondary: '#8b5cf6', 
          accent: '#67e8f9',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8'
        }
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        largerText: false
      },
      ...initialConfig
    };

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.initialize();
  }

  /**
   * 初始化主题管理器
   */
  private initialize(): void {
    // 恢复保存的偏好设置
    this.restorePreferences();
    
    // 设置系统主题监听
    this.setupSystemThemeListener();
    
    // 应用初始主题
    this.applyInitialTheme();
    
    // 设置定时切换（如果启用）
    if (this.config.enableScheduler && this.config.scheduler.enabled) {
      this.setupScheduler();
    }
    
    // 设置辅助功能监听
    this.setupAccessibilityListeners();
    
    console.log('🎨 Theme Manager initialized', {
      currentTheme: this.currentTheme,
      mode: this.config.mode
    });
  }

  /**
   * 切换主题
   */
  toggleTheme(trigger: ThemeChangeEvent['trigger'] = 'user'): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme, trigger);
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'light' | 'dark', trigger: ThemeChangeEvent['trigger'] = 'user'): void {
    const previousTheme = this.currentTheme;
    
    if (previousTheme === theme) return;
    
    this.currentTheme = theme;
    
    // 应用主题
    this.applyTheme(theme);
    
    // 保存偏好设置
    if (this.config.savePreference && trigger === 'user') {
      this.savePreferences();
    }
    
    // 触发事件
    const event: ThemeChangeEvent = {
      previousTheme,
      currentTheme: theme,
      trigger,
      timestamp: Date.now()
    };
    
    this.dispatchEvent(event);
  }

  /**
   * 设置主题模式
   */
  setMode(mode: ThemeMode): void {
    this.config.mode = mode;
    
    if (mode === 'auto') {
      this.followSystemTheme();
    } else {
      this.setTheme(mode as 'light' | 'dark');
    }
    
    if (this.config.savePreference) {
      this.savePreferences();
    }
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * 获取当前模式
   */
  getMode(): ThemeMode {
    return this.config.mode;
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<ThemeConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // 重新应用相关设置
    if (updates.enableScheduler !== undefined || updates.scheduler) {
      this.setupScheduler();
    }
    
    if (updates.customColors) {
      this.applyCustomColors();
    }
    
    if (updates.accessibility) {
      this.applyAccessibilitySettings();
    }
    
    if (this.config.savePreference) {
      this.savePreferences();
    }
  }

  /**
   * 获取配置
   */
  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: (event: ThemeChangeEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: (event: ThemeChangeEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    
    this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    this.eventListeners = [];
  }

  // ==================== 私有方法 ====================

  private restorePreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.config = { ...this.config, ...preferences };
      }
    } catch (error) {
      console.warn('Failed to restore theme preferences:', error);
    }
  }

  private savePreferences(): void {
    try {
      const preferences = {
        mode: this.config.mode,
        customColors: this.config.customColors,
        accessibility: this.config.accessibility,
        scheduler: this.config.scheduler,
        enableScheduler: this.config.enableScheduler
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  private setupSystemThemeListener(): void {
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent): void => {
    if (this.config.mode === 'auto' && this.config.followSystemTheme) {
      const systemTheme = e.matches ? 'dark' : 'light';
      this.setTheme(systemTheme, 'system');
    }
  };

  private applyInitialTheme(): void {
    let theme: 'light' | 'dark';
    
    if (this.config.mode === 'auto') {
      theme = this.mediaQuery.matches ? 'dark' : 'light';
    } else {
      theme = this.config.mode as 'light' | 'dark';
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  private followSystemTheme(): void {
    if (this.config.followSystemTheme) {
      const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
      this.setTheme(systemTheme, 'system');
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    // 设置主题类名
    root.classList.remove('voxnest-theme-light', 'voxnest-theme-dark');
    root.classList.add(`voxnest-theme-${theme}`);
    
    // 设置 CSS 变量
    root.style.setProperty(this.CSS_THEME_VAR, theme);
    
    // 应用自定义颜色
    this.applyCustomColors();
    
    // 应用辅助功能设置
    this.applyAccessibilitySettings();
    
    // 应用过渡动画
    if (this.config.enableTransitions) {
      this.applyTransitions();
    }
    
    // 更新元数据
    this.updateMetadata(theme);
  }

  private applyCustomColors(): void {
    const root = document.documentElement;
    const colors = this.config.customColors[this.currentTheme];
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--voxnest-color-${key}`, value);
    });
  }

  private applyAccessibilitySettings(): void {
    const root = document.documentElement;
    
    // 高对比度
    if (this.config.accessibility.highContrast) {
      root.classList.add('voxnest-high-contrast');
    } else {
      root.classList.remove('voxnest-high-contrast');
    }
    
    // 减少动画
    if (this.config.accessibility.reducedMotion) {
      root.classList.add('voxnest-reduced-motion');
    } else {
      root.classList.remove('voxnest-reduced-motion');
    }
    
    // 更大字体
    if (this.config.accessibility.largerText) {
      root.classList.add('voxnest-larger-text');
    } else {
      root.classList.remove('voxnest-larger-text');
    }
  }

  private applyTransitions(): void {
    const root = document.documentElement;
    root.style.setProperty('--voxnest-transition-duration', `${this.config.transitionDuration}ms`);
    
    // 临时添加过渡类
    root.classList.add('voxnest-theme-transitioning');
    
    setTimeout(() => {
      root.classList.remove('voxnest-theme-transitioning');
    }, this.config.transitionDuration);
  }

  private updateMetadata(theme: 'light' | 'dark'): void {
    // 更新状态栏颜色（移动端）
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    const themeColor = this.config.customColors[theme].background;
    metaThemeColor.content = themeColor;
    
    // 更新颜色方案
    let metaColorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;
    if (!metaColorScheme) {
      metaColorScheme = document.createElement('meta');
      metaColorScheme.name = 'color-scheme';
      document.head.appendChild(metaColorScheme);
    }
    
    metaColorScheme.content = theme;
  }

  private setupScheduler(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    
    if (!this.config.enableScheduler || !this.config.scheduler.enabled) {
      return;
    }
    
    // 每分钟检查一次
    this.schedulerTimer = setInterval(() => {
      this.checkScheduler();
    }, 60000);
    
    // 立即检查一次
    this.checkScheduler();
  }

  private checkScheduler(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { lightModeStart, darkModeStart } = this.config.scheduler;
    
    if (currentTime === lightModeStart && this.currentTheme === 'dark') {
      this.setTheme('light', 'scheduler');
    } else if (currentTime === darkModeStart && this.currentTheme === 'light') {
      this.setTheme('dark', 'scheduler');
    }
  }

  private setupAccessibilityListeners(): void {
    // 监听系统高对比度偏好
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.updateConfig({
          accessibility: {
            ...this.config.accessibility,
            highContrast: true
          }
        });
      }
    });
    
    // 监听系统减少动画偏好
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.updateConfig({
          accessibility: {
            ...this.config.accessibility,
            reducedMotion: true
          }
        });
      }
    });
  }

  private dispatchEvent(event: ThemeChangeEvent): void {
    // 内部事件监听器
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
    
    // DOM 事件
    window.dispatchEvent(new CustomEvent('voxnest:theme-change', {
      detail: event
    }));
    
    console.log('🎨 Theme changed:', event);
  }

  // ==================== 公共 API ====================

  /**
   * 获取主题状态摘要
   */
  getStatus(): {
    currentTheme: 'light' | 'dark';
    mode: ThemeMode;
    systemTheme: 'light' | 'dark';
    config: ThemeConfig;
    isSchedulerActive: boolean;
    nextScheduledChange: string | null;
  } {
    const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
    
    let nextScheduledChange: string | null = null;
    if (this.config.enableScheduler && this.config.scheduler.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const lightTime = this.parseTime(this.config.scheduler.lightModeStart);
      const darkTime = this.parseTime(this.config.scheduler.darkModeStart);
      
      const nextTime = this.currentTheme === 'light' ? darkTime : lightTime;
      const nextChange = nextTime > currentTime ? nextTime : nextTime + 24 * 60;
      
      const hours = Math.floor(nextChange / 60) % 24;
      const minutes = nextChange % 60;
      nextScheduledChange = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return {
      currentTheme: this.currentTheme,
      mode: this.config.mode,
      systemTheme,
      config: this.getConfig(),
      isSchedulerActive: Boolean(this.schedulerTimer),
      nextScheduledChange
    };
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// 创建全局实例
export const themeManager = new ThemeManager();
