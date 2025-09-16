/**
 * 前端扩展热重载管理器
 * 监控 extensions.json 变化并自动重载本地扩展
 */

import type { Logger, ExtensionFramework } from '../core/types';
import { ExtensionDiscovery, type ExtensionManifest } from './ExtensionDiscovery';
import { ExtensionLoader } from './ExtensionLoader';

interface HotReloadConfig {
  /** 监听的扩展配置文件路径 */
  configPath?: string;
  /** 本地扩展根目录 */
  localExtensionsPath?: string;
  /** 轮询间隔（毫秒） */
  pollingInterval?: number;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 是否启用热重载 */
  enabled?: boolean;
  /** 调试模式 */
  debug?: boolean;
}

interface WatchedExtension {
  id: string;
  manifest: ExtensionManifest;
  localPath: string;
  lastModified: number;
  isLocal: boolean;
}

export class ExtensionHotReload {
  private logger: Logger;
  // private framework: ExtensionFramework;
  // private discovery: ExtensionDiscovery;
  private loader: ExtensionLoader;
  private config: Required<HotReloadConfig>;
  
  private watchedExtensions = new Map<string, WatchedExtension>();
  private configLastModified = 0;
  private pollingTimer: number | null = null;
  private isRunning = false;
  private reloadTimers = new Map<string, number>();

  constructor(
    framework: ExtensionFramework,
    _discovery: ExtensionDiscovery,
    loader: ExtensionLoader,
    config: HotReloadConfig = {}
  ) {
    // this.framework = framework;
    // this.discovery = discovery;
    this.loader = loader;
    this.logger = framework.logger.createChild('ExtensionHotReload');
    
    this.config = {
      configPath: '/extensions/extensions.json',
      localExtensionsPath: '/src/extensions', // 监控实际的扩展开发目录
      pollingInterval: 5000, // 5秒，进一步降低检查频率
      debounceDelay: 2000, // 2秒防抖，避免频繁重载
      enabled: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
      ...config
    };
    
    if (this.config.debug) {
      this.logger.info('Extension hot reload initialized', {
        configPath: this.config.configPath,
        localExtensionsPath: this.config.localExtensionsPath,
        pollingInterval: this.config.pollingInterval,
        enabled: this.config.enabled
      });
    }
  }

  /**
   * 启动热重载监控
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Hot reload disabled');
      return;
    }

    if (this.isRunning) {
      this.logger.warn('Hot reload already running');
      return;
    }

    this.logger.info('Starting extension hot reload...');
    this.isRunning = true;

    try {
      // 初始化扫描
      await this.scanInitialExtensions();
      
      // 开始轮询监控
      this.startPolling();
      
      this.logger.info('Extension hot reload started successfully');
    } catch (error) {
      this.logger.error('Failed to start hot reload:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止热重载监控
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping extension hot reload...');
    this.isRunning = false;

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // 清理所有防抖定时器
    for (const timer of this.reloadTimers.values()) {
      window.clearTimeout(timer);
    }
    this.reloadTimers.clear();

    this.watchedExtensions.clear();
    this.logger.info('Extension hot reload stopped');
  }

  /**
   * 初始扫描现有扩展
   */
  private async scanInitialExtensions(): Promise<void> {
    try {
      const extensionsConfig = await this.loadExtensionsConfig();
      if (extensionsConfig?.extensions) {
        for (const extension of extensionsConfig.extensions) {
          await this.checkAndWatchExtension(extension);
        }
      }
      
      // 记录配置文件的修改时间
      this.configLastModified = Date.now();
    } catch (error) {
      this.logger.error('Failed to scan initial extensions:', error);
    }
  }

  /**
   * 开始轮询监控
   */
  private startPolling(): void {
    this.pollingTimer = window.setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkConfigChanges();
        await this.checkExtensionChanges();
      } catch (error) {
        this.logger.error('Error during hot reload polling:', error);
      }
    }, this.config.pollingInterval);
  }

  /**
   * 检查配置文件变化
   */
  private async checkConfigChanges(): Promise<void> {
    // 暂时禁用配置文件监控，避免用户操作导致的无限循环
    // 用户点击启用/禁用按钮时，后端会修改extensions.json，
    // 这会触发热重载，但这不是我们想要的行为
    return;
    
    try {
      const response = await fetch(`${this.config.configPath}?t=${Date.now()}`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        const lastModified = response.headers.get('last-modified');
        const modifiedTime = lastModified ? new Date(lastModified as string).getTime() : Date.now();
        
        if (modifiedTime > this.configLastModified) {
          this.logger.info('Extensions config file changed, reloading...');
          this.configLastModified = modifiedTime;
          await this.handleConfigChange();
        }
      }
    } catch (error) {
      if (this.config.debug) {
        this.logger.debug('Could not check config file changes:', error);
      }
    }
  }

  /**
   * 检查扩展文件变化
   */
  private async checkExtensionChanges(): Promise<void> {
    for (const [extensionId, watched] of this.watchedExtensions.entries()) {
      if (!watched.isLocal) continue;
      
      try {
        const hasChanges = await this.checkExtensionFileChanges(watched);
        if (hasChanges) {
          this.logger.info(`Local extension ${extensionId} changed, scheduling reload...`);
          this.scheduleExtensionReload(extensionId, watched);
        }
      } catch (error) {
        this.logger.error(`Error checking changes for extension ${extensionId}:`, error);
      }
    }
  }

  /**
   * 调度扩展重载（带防抖）
   */
  private scheduleExtensionReload(extensionId: string, watched: WatchedExtension): void {
    // 清除之前的定时器
    const existingTimer = this.reloadTimers.get(extensionId);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    
    // 设置新的防抖定时器
    const timer = window.setTimeout(async () => {
      this.reloadTimers.delete(extensionId);
      await this.reloadExtension(extensionId, watched);
    }, this.config.debounceDelay);
    
    this.reloadTimers.set(extensionId, timer);
  }

  /**
   * 处理配置文件变化
   */
  private async handleConfigChange(): Promise<void> {
    try {
      const extensionsConfig = await this.loadExtensionsConfig();
      if (!extensionsConfig?.extensions) return;

      // 检查新增或修改的扩展
      for (const extension of extensionsConfig.extensions) {
        const watched = this.watchedExtensions.get(extension.id);
        
        if (!watched) {
          // 新扩展
          await this.checkAndWatchExtension(extension);
          if (extension.enabled) {
            await this.loadExtensionIfLocal(extension);
          }
        } else if (JSON.stringify(watched.manifest) !== JSON.stringify(extension)) {
          // 扩展配置变化
          watched.manifest = extension;
          if (extension.enabled) {
            await this.reloadExtension(extension.id, watched);
          } else {
            await this.unloadExtension(extension.id);
          }
        }
      }

      // 检查被移除的扩展
      const currentIds = new Set(extensionsConfig.extensions.map(e => e.id));
      for (const [extensionId, _watched] of this.watchedExtensions.entries()) {
        if (!currentIds.has(extensionId)) {
          this.logger.info(`Extension ${extensionId} removed from config`);
          await this.unloadExtension(extensionId);
          this.watchedExtensions.delete(extensionId);
        }
      }
    } catch (error) {
      this.logger.error('Error handling config changes:', error);
    }
  }

  /**
   * 检查并监控扩展
   */
  private async checkAndWatchExtension(extension: ExtensionManifest): Promise<void> {
    const localPath = `${this.config.localExtensionsPath}/${extension.id}`;
    const initialModifiedTime = await this.getExtensionLastModified(localPath);
    
    if (initialModifiedTime > 0) {
      const watchedExtension: WatchedExtension = {
        id: extension.id,
        manifest: extension,
        localPath,
        lastModified: initialModifiedTime,
        isLocal: true
      };
      
      this.watchedExtensions.set(extension.id, watchedExtension);
      this.logger.info(`Watching local extension: ${extension.id} at ${localPath}`);
    }
  }

  /**
   * 获取扩展的最后修改时间
   */
  private async getExtensionLastModified(localPath: string): Promise<number> {
    try {
      const response = await fetch(`${localPath}/manifest.json?t=${Date.now()}`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        const lastModified = response.headers.get('last-modified');
        return lastModified ? new Date(lastModified as string).getTime() : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }


  /**
   * 检查扩展文件变化
   */
  private async checkExtensionFileChanges(watched: WatchedExtension): Promise<boolean> {
    try {
      // 检查manifest.json的修改时间
      const response = await fetch(`${watched.localPath}/manifest.json?t=${Date.now()}`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        const lastModified = response.headers.get('last-modified');
        const modifiedTime = lastModified ? new Date(lastModified as string).getTime() : Date.now();
        
        if (modifiedTime > watched.lastModified) {
          watched.lastModified = modifiedTime;
          return true;
        }
      }

      // TODO: 可以扩展为检查扩展目录下的所有文件
      // 如 main 入口文件、样式文件等
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 加载扩展配置
   */
  private async loadExtensionsConfig(): Promise<{ extensions: ExtensionManifest[] } | null> {
    try {
      const response = await fetch(`${this.config.configPath}?t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.logger.error('Failed to load extensions config:', error);
    }
    return null;
  }

  /**
   * 如果是本地扩展则加载
   */
  private async loadExtensionIfLocal(extension: ExtensionManifest): Promise<void> {
    const watched = this.watchedExtensions.get(extension.id);
    if (watched?.isLocal) {
      await this.loadExtension(extension.id, watched);
    }
  }

  /**
   * 重载扩展
   */
  private async reloadExtension(extensionId: string, watched: WatchedExtension): Promise<void> {
    try {
      // 先卸载现有扩展
      await this.unloadExtension(extensionId);
      
      // 等待一小段时间确保卸载完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 重新加载扩展
      await this.loadExtension(extensionId, watched);
      
      this.logger.info(`Extension ${extensionId} reloaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to reload extension ${extensionId}:`, error);
    }
  }

  /**
   * 加载扩展
   */
  private async loadExtension(extensionId: string, watched: WatchedExtension): Promise<void> {
    try {
      const discoveredExtension = {
        manifest: watched.manifest,
        basePath: watched.localPath,
        manifestPath: `${watched.localPath}/manifest.json`
      };

      if (watched.manifest.type === 'plugin') {
        await this.loader.loadPlugin(discoveredExtension);
      } else if (watched.manifest.type === 'theme') {
        await this.loader.loadTheme(discoveredExtension);
      }
      
      this.logger.info(`Loaded extension: ${extensionId}`);
    } catch (error) {
      this.logger.error(`Failed to load extension ${extensionId}:`, error);
    }
  }

  /**
   * 卸载扩展
   */
  private async unloadExtension(extensionId: string): Promise<void> {
    try {
      const success = await this.loader.unloadExtension(extensionId);
      if (success) {
        this.logger.info(`Unloaded extension: ${extensionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to unload extension ${extensionId}:`, error);
    }
  }

  /**
   * 获取监控统计信息
   */
  getStats() {
    const localExtensions = Array.from(this.watchedExtensions.values())
      .filter(w => w.isLocal);
      
    return {
      isRunning: this.isRunning,
      config: this.config,
      totalWatched: this.watchedExtensions.size,
      localExtensions: localExtensions.length,
      watchedExtensions: Array.from(this.watchedExtensions.values()).map(w => ({
        id: w.id,
        name: w.manifest.name,
        isLocal: w.isLocal,
        lastModified: new Date(w.lastModified).toISOString()
      }))
    };
  }

  /**
   * 手动触发重载检查
   */
  async checkNow(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Hot reload is not running');
    }

    this.logger.info('Manually triggering hot reload check...');
    
    try {
      await this.checkConfigChanges();
      await this.checkExtensionChanges();
      this.logger.info('Manual hot reload check completed');
    } catch (error) {
      this.logger.error('Manual hot reload check failed:', error);
      throw error;
    }
  }

  /**
   * 重置所有监控状态
   */
  reset(): void {
    this.stop();
    this.watchedExtensions.clear();
    this.configLastModified = 0;
  }
}

export default ExtensionHotReload;
