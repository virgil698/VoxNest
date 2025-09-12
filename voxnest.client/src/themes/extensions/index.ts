/**
 * VoxNest 主题扩展系统导出
 * 统一导出扩展相关的所有功能
 */

// 扩展加载器
export { 
  ThemeExtensionLoader, 
  extensionLoader,
  loadExtensionFromURL,
  loadExtensionFromFile,
  createAndLoadExtension,
  exportExtension,
  downloadExtension,
  loadSavedExtensions
} from './loader';

// 示例扩展
export {
  exampleExtensions,
  extensionCategories,
  getRecommendedExtensions,
  
  // 个别扩展导出
  highContrastExtension,
  warmToneExtension,
  coolToneExtension,
  roundedExtension,
  enhancedShadowExtension,
  compactLayoutExtension,
  darkModeExtension,
  festivalExtension,
  accessibilityExtension,
  printFriendlyExtension
} from './examples';

// ===========================================
// 扩展管理器 API
// ===========================================

/**
 * 扩展管理器 - 提供高级扩展管理功能
 */
export class ExtensionManager {
  private static _instance: ExtensionManager | null = null;
  private _loader: import('./loader').ThemeExtensionLoader;

  private constructor() {
    const { extensionLoader } = require('./loader');
    this._loader = extensionLoader;
  }

  public static getInstance(): ExtensionManager {
    if (!ExtensionManager._instance) {
      ExtensionManager._instance = new ExtensionManager();
    }
    return ExtensionManager._instance;
  }

  /**
   * 初始化扩展系统
   */
  public async initialize(): Promise<void> {
    try {
      // 自动加载保存的扩展
      const { loaded, failed } = await this.loadAllSavedExtensions();
      
      if (loaded.length > 0) {
        console.log(`📦 已自动加载 ${loaded.length} 个保存的扩展`);
      }
      
      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} 个扩展加载失败`);
      }

    } catch (error) {
      console.error('扩展系统初始化失败:', error);
    }
  }

  /**
   * 加载所有保存的扩展
   */
  private async loadAllSavedExtensions(): Promise<{
    loaded: import('../types').ThemeExtension[];
    failed: string[];
  }> {
    const loaded: import('../types').ThemeExtension[] = [];
    const failed: string[] = [];

    // 搜索本地存储中的扩展
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voxnest-extension-')) {
        try {
          const extension = await this._loader.loadFromStorage(key);
          loaded.push(extension);
        } catch (error) {
          failed.push(key);
          console.warn(`加载保存的扩展失败: ${key}`, error);
        }
      }
    }

    return { loaded, failed };
  }

  /**
   * 安装扩展包
   */
  public async installExtensionPack(urls: string[]): Promise<{
    installed: string[];
    failed: Array<{ url: string; error: string }>;
  }> {
    const installed: string[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
      try {
        const extension = await this._loader.loadFromURL(url);
        this._loader.saveToStorage(extension);
        installed.push(extension.id);
      } catch (error) {
        failed.push({
          url,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return { installed, failed };
  }

  /**
   * 卸载扩展
   */
  public uninstallExtension(extensionId: string): void {
    this._loader.unloadExtension(extensionId);
    this._loader.removeFromStorage(extensionId);
  }

  /**
   * 获取扩展统计信息
   */
  public getStats(): {
    total: number;
    active: number;
    stored: number;
    failed: number;
  } {
    const status = this._loader.getLoadStatus();
    let stored = 0;

    // 计算本地存储的扩展数量
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voxnest-extension-')) {
        stored++;
      }
    }

    return {
      total: status.total,
      active: status.loaded.length,
      stored,
      failed: status.failed.length
    };
  }

  /**
   * 清理失效的扩展
   */
  public cleanup(): void {
    this._loader.clearFailedExtensions();
    
    // 清理无效的本地存储扩展
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voxnest-extension-')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            JSON.parse(stored); // 验证是否为有效JSON
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 已清理 ${keysToRemove.length} 个无效扩展`);
    }
  }
}

// 导出单例实例
export const extensionManager = ExtensionManager.getInstance();

// ===========================================
// 便捷初始化函数
// ===========================================

/**
 * 初始化扩展系统
 */
export async function initializeExtensionSystem(): Promise<void> {
  await extensionManager.initialize();
}

/**
 * 获取推荐的扩展配置
 */
export function getExtensionRecommendations(): {
  accessibility: string[];
  performance: string[];
  design: string[];
  utility: string[];
} {
  return {
    accessibility: ['high-contrast', 'accessibility-enhanced'],
    performance: ['compact-layout'],
    design: ['rounded-corners', 'enhanced-shadows', 'warm-tone'],
    utility: ['print-friendly', 'dark-mode-override']
  };
}

/**
 * 快速应用推荐扩展组合
 */
export async function applyRecommendedExtensions(
  category: 'accessibility' | 'performance' | 'design' | 'utility'
): Promise<void> {
  const recommendations = getExtensionRecommendations();
  const extensionIds = recommendations[category];

  // 导入示例扩展
  const { exampleExtensions } = await import('./examples');

  for (const id of extensionIds) {
    const extension = exampleExtensions.find((ext: any) => ext.id === id);
    if (extension) {
      try {
        const { extensionLoader } = require('./loader');
        await extensionLoader.loadFromData(extension);
      } catch (error) {
        console.warn(`应用推荐扩展 ${id} 失败:`, error);
      }
    }
  }
}
