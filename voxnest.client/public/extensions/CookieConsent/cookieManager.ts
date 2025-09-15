/**
 * Cookie 管理器
 * 负责 Cookie 的存储、读取和分类管理
 */

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  providers?: string[];
}

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
  version: string;
}

export interface CookieConsentEvent {
  type: 'consent-given' | 'consent-withdrawn' | 'preferences-updated';
  preferences: CookiePreferences;
  timestamp: number;
}

export class CookieManager {
  private readonly CONSENT_KEY = 'voxnest-cookie-consent';
  private readonly PREFERENCES_KEY = 'voxnest-cookie-preferences';
  private readonly VERSION = '1.0.0';
  
  private eventListeners: Array<(event: CookieConsentEvent) => void> = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * 检查是否已有 Cookie 同意记录
   */
  hasConsent(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return consent !== null;
  }

  /**
   * 获取 Cookie 偏好设置
   */
  getPreferences(): CookiePreferences | null {
    const stored = localStorage.getItem(this.PREFERENCES_KEY);
    if (!stored) return null;

    try {
      const preferences = JSON.parse(stored) as CookiePreferences;
      
      // 检查版本兼容性
      if (preferences.version !== this.VERSION) {
        this.clearPreferences();
        return null;
      }
      
      return preferences;
    } catch (error) {
      console.error('Failed to parse cookie preferences:', error);
      this.clearPreferences();
      return null;
    }
  }

  /**
   * 保存 Cookie 偏好设置
   */
  savePreferences(preferences: Partial<CookiePreferences>): void {
    const fullPreferences: CookiePreferences = {
      essential: true, // 必需 Cookie 始终启用
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
      functional: preferences.functional ?? false,
      timestamp: Date.now(),
      version: this.VERSION
    };

    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(fullPreferences));
    localStorage.setItem(this.CONSENT_KEY, 'true');

    // 应用 Cookie 策略
    this.applyCookiePolicy(fullPreferences);

    // 触发事件
    this.dispatchEvent({
      type: 'preferences-updated',
      preferences: fullPreferences,
      timestamp: Date.now()
    });
  }

  /**
   * 接受所有 Cookie
   */
  acceptAll(): void {
    this.savePreferences({
      analytics: true,
      marketing: true,
      functional: true
    });

    this.dispatchEvent({
      type: 'consent-given',
      preferences: this.getPreferences()!,
      timestamp: Date.now()
    });
  }

  /**
   * 拒绝非必需 Cookie
   */
  rejectAll(): void {
    this.savePreferences({
      analytics: false,
      marketing: false,
      functional: false
    });

    this.dispatchEvent({
      type: 'consent-withdrawn',
      preferences: this.getPreferences()!,
      timestamp: Date.now()
    });
  }

  /**
   * 清除所有 Cookie 偏好
   */
  clearPreferences(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    localStorage.removeItem(this.PREFERENCES_KEY);
    
    // 清理非必需 Cookie
    this.clearNonEssentialCookies();
  }

  /**
   * 检查特定类别的 Cookie 是否被允许
   */
  isCategoryAllowed(category: keyof Omit<CookiePreferences, 'timestamp' | 'version'>): boolean {
    const preferences = this.getPreferences();
    if (!preferences) return false;
    
    return preferences[category];
  }

  /**
   * 获取 Cookie 分类配置
   */
  getCategories(): CookieCategory[] {
    return [
      {
        id: 'essential',
        name: '必需 Cookie',
        description: '这些 Cookie 对于网站的基本功能是必需的，无法禁用。',
        required: true,
        enabled: true
      },
      {
        id: 'analytics',
        name: '分析 Cookie',
        description: '帮助我们了解访客如何使用网站，以便改进用户体验。',
        required: false,
        enabled: this.isCategoryAllowed('analytics'),
        providers: ['Google Analytics', 'Matomo']
      },
      {
        id: 'marketing',
        name: '营销 Cookie',
        description: '用于跟踪访客行为，显示相关广告和营销内容。',
        required: false,
        enabled: this.isCategoryAllowed('marketing'),
        providers: ['Google Ads', 'Facebook Pixel']
      },
      {
        id: 'functional',
        name: '功能 Cookie',
        description: '提供增强的功能和个性化设置，如视频播放和地图服务。',
        required: false,
        enabled: this.isCategoryAllowed('functional'),
        providers: ['YouTube', 'Google Maps']
      }
    ];
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: (event: CookieConsentEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: (event: CookieConsentEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 私有方法
   */
  private applyCookiePolicy(preferences: CookiePreferences): void {
    // 根据用户偏好启用或禁用第三方脚本
    this.toggleAnalytics(preferences.analytics);
    this.toggleMarketing(preferences.marketing);
    this.toggleFunctional(preferences.functional);
  }

  private toggleAnalytics(enabled: boolean): void {
    if (enabled) {
      // 启用 Google Analytics 等
      this.loadScript('analytics');
    } else {
      // 禁用分析脚本
      this.unloadScript('analytics');
    }
  }

  private toggleMarketing(enabled: boolean): void {
    if (enabled) {
      // 启用营销脚本
      this.loadScript('marketing');
    } else {
      // 禁用营销脚本
      this.unloadScript('marketing');
    }
  }

  private toggleFunctional(enabled: boolean): void {
    if (enabled) {
      // 启用功能性脚本
      this.loadScript('functional');
    } else {
      // 禁用功能性脚本
      this.unloadScript('functional');
    }
  }

  private loadScript(category: string): void {
    // 这里实现脚本加载逻辑
    console.log(`Loading ${category} scripts`);
    
    // 触发自定义事件，让其他模块知道脚本已加载
    window.dispatchEvent(new CustomEvent(`cookie-${category}-enabled`));
  }

  private unloadScript(category: string): void {
    // 这里实现脚本卸载逻辑
    console.log(`Unloading ${category} scripts`);
    
    // 移除相关 DOM 元素
    document.querySelectorAll(`[data-cookie-category="${category}"]`).forEach(el => {
      el.remove();
    });
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent(`cookie-${category}-disabled`));
  }

  private clearNonEssentialCookies(): void {
    // 清理非必需的 Cookie
    const cookies = document.cookie.split(';');
    const essentialCookies = ['session', 'csrf', 'auth', 'voxnest-'];
    
    cookies.forEach(cookie => {
      const [name] = cookie.trim().split('=');
      const isEssential = essentialCookies.some(essential => name.startsWith(essential));
      
      if (!isEssential) {
        // 删除 Cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });
  }

  private dispatchEvent(event: CookieConsentEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in cookie consent event listener:', error);
      }
    });

    // 也触发 DOM 事件
    window.dispatchEvent(new CustomEvent('voxnest:cookie-consent', {
      detail: event
    }));
  }

  private initializeEventListeners(): void {
    // 监听页面可见性变化，在用户返回时检查 Cookie 策略
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.hasConsent()) {
        const preferences = this.getPreferences();
        if (preferences) {
          this.applyCookiePolicy(preferences);
        }
      }
    });
  }

  /**
   * 获取 Cookie 同意状态的摘要信息
   */
  getConsentSummary(): {
    hasConsent: boolean;
    preferences: CookiePreferences | null;
    categories: CookieCategory[];
    lastUpdated: Date | null;
  } {
    const preferences = this.getPreferences();
    
    return {
      hasConsent: this.hasConsent(),
      preferences,
      categories: this.getCategories(),
      lastUpdated: preferences ? new Date(preferences.timestamp) : null
    };
  }
}

// 创建全局实例
export const cookieManager = new CookieManager();
