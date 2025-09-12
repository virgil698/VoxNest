/**
 * 前端扩展发现和加载系统
 * 自动发现和加载 public/extensions 目录中的插件和主题
 */

import type { Logger } from '../core/types';

// 扩展元数据接口
export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  type: 'plugin' | 'theme';
  entry?: string; // 主入口文件
  styles?: string[]; // CSS 文件列表
  scripts?: string[]; // JS 文件列表
  dependencies?: string[];
  config?: Record<string, any>;
  enabled?: boolean;
}

// 发现的扩展信息
export interface DiscoveredExtension {
  manifest: ExtensionManifest;
  basePath: string;
  manifestPath: string;
}

export class ExtensionDiscovery {
  private logger: Logger;
  private extensionsBasePath: string;
  private cache = new Map<string, DiscoveredExtension>();

  constructor(logger: Logger, extensionsBasePath = '/extensions') {
    this.logger = logger.createChild('ExtensionDiscovery');
    this.extensionsBasePath = extensionsBasePath;
  }

  /**
   * 发现所有可用的插件
   */
  async discoverPlugins(): Promise<DiscoveredExtension[]> {
    try {
      this.logger.info('Discovering available plugins...');
      const plugins = await this.discoverExtensionsByType('plugin');
      this.logger.info(`Found ${plugins.length} plugins`);
      return plugins;
    } catch (error) {
      this.logger.error('Failed to discover plugins:', error);
      return [];
    }
  }

  /**
   * 发现所有可用的主题
   */
  async discoverThemes(): Promise<DiscoveredExtension[]> {
    try {
      this.logger.info('Discovering available themes...');
      const themes = await this.discoverExtensionsByType('theme');
      this.logger.info(`Found ${themes.length} themes`);
      return themes;
    } catch (error) {
      this.logger.error('Failed to discover themes:', error);
      return [];
    }
  }

  /**
   * 按类型发现扩展
   */
  private async discoverExtensionsByType(type: 'plugin' | 'theme'): Promise<DiscoveredExtension[]> {
    const extensions: DiscoveredExtension[] = [];
    const typeDir = `${this.extensionsBasePath}/${type}s`;

    try {
      // 获取插件/主题目录列表
      const extensionDirs = await this.getDirectoryList(typeDir);
      
      for (const dirName of extensionDirs) {
        try {
          const manifest = await this.loadManifestFromAPI(type, dirName);
          
          if (manifest && manifest.type === type) {
            const extension: DiscoveredExtension = {
              manifest,
              basePath: `${typeDir}/${dirName}`,
              manifestPath: `/api/extension/${type}s/${dirName}/manifest`
            };
            
            extensions.push(extension);
            this.cache.set(manifest.id, extension);
            
            this.logger.debug(`Discovered ${type}: ${manifest.name} (${manifest.id})`);
          }
        } catch (error) {
          this.logger.warn(`Failed to load manifest for ${dirName}:`, error);
        }
      }
    } catch (error) {
      this.logger.debug(`Directory ${typeDir} not found or inaccessible`);
    }

    return extensions;
  }

  /**
   * 获取目录列表（模拟实现）
   * 实际应用中需要从 API 获取可用的扩展列表
   */
  private async getDirectoryList(path: string): Promise<string[]> {
    try {
      // 尝试获取目录索引
      const response = await fetch(`${path}/index.json`);
      if (response.ok) {
        const data = await response.json();
        return data.directories || [];
      }
    } catch (error) {
      this.logger.debug(`No index.json found for ${path}`);
    }

    // 回退：从后端 API 获取已安装的扩展列表
    return await this.getInstalledExtensionsFromAPI(path);
  }

  /**
   * 从后端 API 获取已安装的扩展列表
   */
  private async getInstalledExtensionsFromAPI(path: string): Promise<string[]> {
    try {
      const type = path.includes('plugins') ? 'plugins' : 'themes';
      const endpoint = `/api/extension/${type}/index`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        if (data.isSuccess && data.data.directories) {
          return data.data.directories;
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to fetch installed extensions from API:`, error);
    }
    
    return [];
  }

  /**
   * 从 API 加载扩展清单文件
   */
  private async loadManifestFromAPI(type: 'plugin' | 'theme', extensionId: string): Promise<ExtensionManifest | null> {
    try {
      const endpoint = `/api/extension/${type}s/${extensionId}/manifest`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      if (data.isSuccess && data.data) {
        const manifest = data.data;
        return this.validateManifest(manifest) ? manifest : null;
      }
      
      return null;
    } catch (error) {
      this.logger.debug(`Failed to load manifest from API for ${extensionId}:`, error);
      return null;
    }
  }


  /**
   * 验证清单文件格式
   */
  private validateManifest(manifest: any): boolean {
    if (!manifest || typeof manifest !== 'object') {
      return false;
    }

    const required = ['id', 'name', 'version', 'author', 'type'];
    return required.every(field => manifest[field] && typeof manifest[field] === 'string');
  }

  /**
   * 根据ID获取扩展信息
   */
  getExtensionById(id: string): DiscoveredExtension | undefined {
    return this.cache.get(id);
  }

  /**
   * 获取所有已缓存的扩展
   */
  getAllCachedExtensions(): DiscoveredExtension[] {
    return Array.from(this.cache.values());
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 重新发现所有扩展
   */
  async rediscover(): Promise<void> {
    this.clearCache();
    await Promise.all([
      this.discoverPlugins(),
      this.discoverThemes()
    ]);
  }
}

export default ExtensionDiscovery;
