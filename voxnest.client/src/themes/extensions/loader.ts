/**
 * VoxNest 主题扩展加载器
 * 支持动态加载、远程获取和扩展管理
 */

import { themeManager } from '../ThemeManager';
import { validateThemeExtension } from '../utils';
import type { ThemeExtension } from '../types';

// ===========================================
// 扩展加载器类
// ===========================================

export class ThemeExtensionLoader {
  private static _instance: ThemeExtensionLoader | null = null;
  private _loadedExtensions = new Set<string>();
  private _failedExtensions = new Set<string>();

  private constructor() {}

  public static getInstance(): ThemeExtensionLoader {
    if (!ThemeExtensionLoader._instance) {
      ThemeExtensionLoader._instance = new ThemeExtensionLoader();
    }
    return ThemeExtensionLoader._instance;
  }

  /**
   * 从URL加载扩展
   */
  public async loadFromURL(url: string): Promise<ThemeExtension> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const extensionData = await response.json();
      return this.loadFromData(extensionData);

    } catch (error) {
      const message = `从URL加载扩展失败: ${error instanceof Error ? error.message : '未知错误'}`;
      throw new Error(message);
    }
  }

  /**
   * 从数据对象加载扩展
   */
  public async loadFromData(data: any): Promise<ThemeExtension> {
    // 验证扩展数据
    const validation = validateThemeExtension(data);
    if (!validation.valid) {
      throw new Error(`扩展验证失败: ${validation.errors.join(', ')}`);
    }

    const extension = data as ThemeExtension;

    // 检查是否已加载
    if (this._loadedExtensions.has(extension.id)) {
      throw new Error(`扩展 "${extension.id}" 已经加载`);
    }

    // 标记为失败的扩展不允许重新加载
    if (this._failedExtensions.has(extension.id)) {
      throw new Error(`扩展 "${extension.id}" 之前加载失败，已被禁用`);
    }

    try {
      // 加载到主题管理器
      await themeManager.loadExtension(extension);
      this._loadedExtensions.add(extension.id);
      
      console.log(`✅ 扩展 "${extension.name}" 加载成功`);
      return extension;

    } catch (error) {
      this._failedExtensions.add(extension.id);
      throw error;
    }
  }

  /**
   * 从本地存储加载扩展
   */
  public async loadFromStorage(storageKey: string): Promise<ThemeExtension> {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        throw new Error(`本地存储中未找到扩展: ${storageKey}`);
      }

      const extensionData = JSON.parse(stored);
      return this.loadFromData(extensionData);

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('本地存储的扩展数据格式无效');
      }
      throw error;
    }
  }

  /**
   * 批量加载扩展
   */
  public async loadBatch(sources: Array<{
    type: 'url' | 'data' | 'storage';
    source: string | any;
  }>): Promise<{
    successful: ThemeExtension[];
    failed: Array<{ source: any; error: string }>;
  }> {
    const successful: ThemeExtension[] = [];
    const failed: Array<{ source: any; error: string }> = [];

    for (const item of sources) {
      try {
        let extension: ThemeExtension;

        switch (item.type) {
          case 'url':
            extension = await this.loadFromURL(item.source as string);
            break;
          case 'data':
            extension = await this.loadFromData(item.source);
            break;
          case 'storage':
            extension = await this.loadFromStorage(item.source as string);
            break;
          default:
            throw new Error(`不支持的加载类型: ${(item as any).type}`);
        }

        successful.push(extension);

      } catch (error) {
        failed.push({
          source: item.source,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * 卸载扩展
   */
  public unloadExtension(extensionId: string): void {
    themeManager.unloadExtension(extensionId);
    this._loadedExtensions.delete(extensionId);
    this._failedExtensions.delete(extensionId); // 允许重新加载
  }

  /**
   * 保存扩展到本地存储
   */
  public saveToStorage(extension: ThemeExtension, storageKey?: string): void {
    try {
      const key = storageKey || `voxnest-extension-${extension.id}`;
      localStorage.setItem(key, JSON.stringify(extension));
    } catch (error) {
      throw new Error(`保存扩展到本地存储失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从本地存储删除扩展
   */
  public removeFromStorage(extensionId: string, storageKey?: string): void {
    try {
      const key = storageKey || `voxnest-extension-${extensionId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('从本地存储删除扩展失败:', error);
    }
  }

  /**
   * 获取加载状态
   */
  public getLoadStatus(): {
    loaded: string[];
    failed: string[];
    total: number;
  } {
    return {
      loaded: Array.from(this._loadedExtensions),
      failed: Array.from(this._failedExtensions),
      total: this._loadedExtensions.size + this._failedExtensions.size
    };
  }

  /**
   * 清理失败记录
   */
  public clearFailedExtensions(): void {
    this._failedExtensions.clear();
  }

  /**
   * 检查扩展是否已加载
   */
  public isExtensionLoaded(extensionId: string): boolean {
    return this._loadedExtensions.has(extensionId);
  }

  /**
   * 重新加载扩展
   */
  public async reloadExtension(extensionId: string, source: {
    type: 'url' | 'data' | 'storage';
    source: string | any;
  }): Promise<ThemeExtension> {
    // 先卸载现有扩展
    if (this.isExtensionLoaded(extensionId)) {
      this.unloadExtension(extensionId);
    }

    // 重新加载
    switch (source.type) {
      case 'url':
        return this.loadFromURL(source.source as string);
      case 'data':
        return this.loadFromData(source.source);
      case 'storage':
        return this.loadFromStorage(source.source as string);
      default:
        throw new Error(`不支持的重载类型: ${source.type}`);
    }
  }
}

// 导出单例实例
export const extensionLoader = ThemeExtensionLoader.getInstance();

// ===========================================
// 便捷函数
// ===========================================

/**
 * 从URL加载扩展
 */
export async function loadExtensionFromURL(url: string): Promise<ThemeExtension> {
  return extensionLoader.loadFromURL(url);
}

/**
 * 从本地JSON文件加载扩展
 */
export async function loadExtensionFromFile(file: File): Promise<ThemeExtension> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const extensionData = JSON.parse(content);
        const extension = await extensionLoader.loadFromData(extensionData);
        resolve(extension);
      } catch (error) {
        reject(new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 从配置对象创建并加载扩展
 */
export async function createAndLoadExtension(config: {
  id: string;
  name: string;
  description?: string;
  targetThemeId?: string;
  variables?: Record<string, string>;
  customCSS?: string;
}): Promise<ThemeExtension> {
  const extension: ThemeExtension = {
    id: config.id,
    name: config.name,
    targetThemeId: config.targetThemeId,
    variables: config.variables,
    customCSS: config.customCSS
  };

  return extensionLoader.loadFromData(extension);
}

/**
 * 导出扩展为JSON字符串
 */
export function exportExtension(extensionId: string): string | null {
  const extension = themeManager.loadedExtensions.find(ext => ext.id === extensionId);
  if (!extension) {
    return null;
  }

  return JSON.stringify(extension, null, 2);
}

/**
 * 下载扩展为JSON文件
 */
export function downloadExtension(extensionId: string): void {
  const jsonString = exportExtension(extensionId);
  if (!jsonString) {
    throw new Error(`扩展 "${extensionId}" 未找到`);
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${extensionId}-theme-extension.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 自动从本地存储加载所有保存的扩展
 */
export async function loadSavedExtensions(): Promise<{
  loaded: ThemeExtension[];
  failed: string[];
}> {
  const loaded: ThemeExtension[] = [];
  const failed: string[] = [];

  // 搜索本地存储中的扩展
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('voxnest-extension-')) {
      try {
        const extension = await extensionLoader.loadFromStorage(key);
        loaded.push(extension);
      } catch (error) {
        failed.push(key);
        console.warn(`加载保存的扩展失败: ${key}`, error);
      }
    }
  }

  return { loaded, failed };
}
