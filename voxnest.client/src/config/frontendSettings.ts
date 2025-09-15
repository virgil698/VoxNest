// 前端设置管理器
export interface FrontendSettingProperty {
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'textarea';
  title: string;
  description?: string;
  default?: any;
  group: string;
  order?: number;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface FrontendSettingGroup {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

export interface FrontendSettingsSchema {
  groups: FrontendSettingGroup[];
  properties: Record<string, FrontendSettingProperty>;
}

// 前端配置定义
export const frontendSettingsSchema: FrontendSettingsSchema = {
  groups: [
    {
      id: 'appearance',
      title: '外观设置',
      description: '控制网站的视觉外观和主题',
      order: 1
    },
    {
      id: 'layout',
      title: '布局设置',
      description: '控制页面布局和组件显示',
      order: 2
    },
    {
      id: 'user-experience',
      title: '用户体验',
      description: '优化用户交互和使用体验',
      order: 3
    },
    {
      id: 'performance',
      title: '性能优化',
      description: '前端性能和加载优化设置',
      order: 4
    }
  ],
  properties: {
    // 外观设置
    'theme.mode': {
      type: 'select',
      title: '主题模式',
      description: '选择网站的主题模式',
      default: 'auto',
      group: 'appearance',
      order: 1,
      options: [
        { label: '自动跟随系统', value: 'auto' },
        { label: '浅色模式', value: 'light' },
        { label: '深色模式', value: 'dark' }
      ]
    },
    'theme.primaryColor': {
      type: 'color',
      title: '主题色',
      description: '网站的主要色彩',
      default: '#1890ff',
      group: 'appearance',
      order: 2
    },
    'theme.borderRadius': {
      type: 'number',
      title: '圆角大小',
      description: '组件圆角的像素值',
      default: 6,
      group: 'appearance',
      order: 3,
      min: 0,
      max: 20
    },
    'theme.compactMode': {
      type: 'boolean',
      title: '紧凑模式',
      description: '启用紧凑的界面布局',
      default: false,
      group: 'appearance',
      order: 4
    },

    // 布局设置
    'layout.sidebarCollapsed': {
      type: 'boolean',
      title: '侧边栏默认折叠',
      description: '页面加载时是否折叠侧边栏',
      default: false,
      group: 'layout',
      order: 1
    },
    'layout.headerStyle': {
      type: 'select',
      title: '头部样式',
      description: '选择头部导航的样式',
      default: 'fixed',
      group: 'layout',
      order: 2,
      options: [
        { label: '固定头部', value: 'fixed' },
        { label: '跟随滚动', value: 'static' },
        { label: '自动隐藏', value: 'auto-hide' }
      ]
    },
    'layout.showBreadcrumb': {
      type: 'boolean',
      title: '显示面包屑',
      description: '在页面中显示导航面包屑',
      default: true,
      group: 'layout',
      order: 3
    },
    'layout.maxContentWidth': {
      type: 'number',
      title: '内容最大宽度',
      description: '页面内容的最大宽度（px）',
      default: 1200,
      group: 'layout',
      order: 4,
      min: 800,
      max: 1600
    },

    // 用户体验
    'ux.enableAnimations': {
      type: 'boolean',
      title: '启用动画效果',
      description: '启用页面切换和组件动画',
      default: true,
      group: 'user-experience',
      order: 1
    },
    'ux.enableSounds': {
      type: 'boolean',
      title: '启用音效',
      description: '操作时播放提示音效',
      default: false,
      group: 'user-experience',
      order: 2
    },
    'ux.autoSaveInterval': {
      type: 'number',
      title: '自动保存间隔',
      description: '表单自动保存的时间间隔（秒）',
      default: 30,
      group: 'user-experience',
      order: 3,
      min: 10,
      max: 300
    },
    'ux.confirmOnLeave': {
      type: 'boolean',
      title: '离开确认',
      description: '有未保存内容时离开页面需要确认',
      default: true,
      group: 'user-experience',
      order: 4
    },

    // 性能优化
    'performance.lazyLoadImages': {
      type: 'boolean',
      title: '图片懒加载',
      description: '启用图片懒加载以提升性能',
      default: true,
      group: 'performance',
      order: 1
    },
    'performance.cacheStrategy': {
      type: 'select',
      title: '缓存策略',
      description: '选择前端缓存策略',
      default: 'normal',
      group: 'performance',
      order: 2,
      options: [
        { label: '正常缓存', value: 'normal' },
        { label: '积极缓存', value: 'aggressive' },
        { label: '最小缓存', value: 'minimal' }
      ]
    },
    'performance.prefetchLinks': {
      type: 'boolean',
      title: '链接预取',
      description: '预取链接资源以加快导航',
      default: true,
      group: 'performance',
      order: 3
    },
    'performance.debugMode': {
      type: 'boolean',
      title: '调试模式',
      description: '启用前端调试信息（仅开发环境）',
      default: false,
      group: 'performance',
      order: 4
    }
  }
};

// 前端设置管理器
export class FrontendSettingsManager {
  private static readonly STORAGE_KEY = 'voxnest_frontend_settings';
  private static settings: Record<string, any> = {};

  static {
    this.loadSettings();
  }

  // 加载设置
  static loadSettings(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load frontend settings:', error);
    }

    // 应用默认值
    Object.entries(frontendSettingsSchema.properties).forEach(([key, property]) => {
      if (this.settings[key] === undefined) {
        this.settings[key] = property.default;
      }
    });

    return this.settings;
  }

  // 保存设置
  static saveSettings(newSettings: Record<string, any>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      this.applySettings();
    } catch (error) {
      console.error('Failed to save frontend settings:', error);
    }
  }

  // 获取设置值
  static getSetting(key: string): any {
    return this.settings[key] ?? frontendSettingsSchema.properties[key]?.default;
  }

  // 重置设置
  static resetSettings(): void {
    const defaultSettings: Record<string, any> = {};
    Object.entries(frontendSettingsSchema.properties).forEach(([key, property]) => {
      defaultSettings[key] = property.default;
    });
    
    this.saveSettings(defaultSettings);
  }

  // 应用设置到页面
  static applySettings(): void {
    const root = document.documentElement;
    
    // 应用主题设置
    const themeMode = this.getSetting('theme.mode');
    const primaryColor = this.getSetting('theme.primaryColor');
    const borderRadius = this.getSetting('theme.borderRadius');
    const compactMode = this.getSetting('theme.compactMode');
    
    // 设置CSS变量
    root.style.setProperty('--voxnest-primary-color', primaryColor);
    root.style.setProperty('--voxnest-border-radius', `${borderRadius}px`);
    
    // 应用主题模式
    if (themeMode === 'dark') {
      root.classList.add('voxnest-theme-dark');
      root.classList.remove('voxnest-theme-light');
    } else if (themeMode === 'light') {
      root.classList.add('voxnest-theme-light');
      root.classList.remove('voxnest-theme-dark');
    } else {
      // 自动模式，根据系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('voxnest-theme-dark');
        root.classList.remove('voxnest-theme-light');
      } else {
        root.classList.add('voxnest-theme-light');
        root.classList.remove('voxnest-theme-dark');
      }
    }
    
    // 应用紧凑模式
    if (compactMode) {
      root.classList.add('voxnest-compact');
    } else {
      root.classList.remove('voxnest-compact');
    }

    // 应用布局设置
    const maxContentWidth = this.getSetting('layout.maxContentWidth');
    root.style.setProperty('--voxnest-max-content-width', `${maxContentWidth}px`);
    
    // 应用动画设置
    const enableAnimations = this.getSetting('ux.enableAnimations');
    if (!enableAnimations) {
      root.classList.add('voxnest-no-animations');
    } else {
      root.classList.remove('voxnest-no-animations');
    }
  }

  // 导出设置
  static exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // 导入设置
  static importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // 验证设置
      const validSettings: Record<string, any> = {};
      Object.entries(importedSettings).forEach(([key, value]) => {
        if (frontendSettingsSchema.properties[key]) {
          validSettings[key] = value;
        }
      });
      
      this.saveSettings(validSettings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

// 初始化设置
FrontendSettingsManager.loadSettings();
FrontendSettingsManager.applySettings();

// 监听系统主题变化
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (FrontendSettingsManager.getSetting('theme.mode') === 'auto') {
      FrontendSettingsManager.applySettings();
    }
  });
}
