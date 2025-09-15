/**
 * 前端扩展加载器
 * 动态加载和管理插件和主题
 */

import React from 'react';
import type { Logger, ExtensionFramework, Integration } from '../core/types';
import type { DiscoveredExtension, ExtensionManifest } from './ExtensionDiscovery';

// 加载状态
export const LoadingStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Failed: 'failed'
} as const;

export type LoadingStatus = typeof LoadingStatus[keyof typeof LoadingStatus];

// 加载的扩展信息
export interface LoadedExtension {
  manifest: ExtensionManifest;
  basePath: string;
  status: LoadingStatus;
  instance?: { init?: (framework: ExtensionFramework) => void; [key: string]: unknown }; // 加载的扩展实例
  error?: Error;
  loadedAt?: Date;
}

export class ExtensionLoader {
  private logger: Logger;
  private framework: ExtensionFramework;
  private loadedExtensions = new Map<string, LoadedExtension>();

  constructor(framework: ExtensionFramework) {
    this.framework = framework;
    this.logger = framework.logger.createChild('ExtensionLoader');
  }

  /**
   * 加载插件
   */
  async loadPlugin(extension: DiscoveredExtension): Promise<LoadedExtension> {
    const loadedExt: LoadedExtension = {
      manifest: extension.manifest,
      basePath: extension.basePath,
      status: LoadingStatus.Loading
    };

    this.loadedExtensions.set(extension.manifest.id, loadedExt);

    try {
      this.logger.info(`Loading plugin: ${extension.manifest.name}`);

      // 加载样式文件
      if (extension.manifest.styles) {
        await this.loadStyles(extension.manifest.styles, extension.basePath);
      }

      // 加载脚本文件
      if (extension.manifest.scripts) {
        await this.loadScripts(extension.manifest.scripts, extension.basePath);
      }

      // 加载主入口文件
      if (extension.manifest.entry) {
        const instance = await this.loadEntryModule(extension.manifest.entry, extension.basePath);
        loadedExt.instance = instance;

        // 如果是 React 组件或集成，注册到框架
        if (instance && typeof instance === 'object') {
          await this.registerPluginToFramework(instance, extension.manifest);
        }
      }

      loadedExt.status = LoadingStatus.Loaded;
      loadedExt.loadedAt = new Date();
      
      this.logger.info(`Plugin loaded successfully: ${extension.manifest.name}`);
      return loadedExt;

    } catch (error) {
      this.logger.error(`Failed to load plugin ${extension.manifest.name}:`, error);
      loadedExt.status = LoadingStatus.Failed;
      loadedExt.error = error instanceof Error ? error : new Error('Unknown loading error');
      return loadedExt;
    }
  }

  /**
   * 加载主题
   */
  async loadTheme(extension: DiscoveredExtension): Promise<LoadedExtension> {
    const loadedExt: LoadedExtension = {
      manifest: extension.manifest,
      basePath: extension.basePath,
      status: LoadingStatus.Loading
    };

    this.loadedExtensions.set(extension.manifest.id, loadedExt);

    try {
      this.logger.info(`Loading theme: ${extension.manifest.name}`);

      // 加载主题样式
      if (extension.manifest.styles) {
        await this.loadStyles(extension.manifest.styles, extension.basePath);
      }

      // 应用主题变量
      if (extension.manifest.config?.variables && 
          typeof extension.manifest.config.variables === 'object' &&
          extension.manifest.config.variables !== null) {
        this.applyThemeVariables(extension.manifest.config.variables as Record<string, string>);
      }

      // 加载主题脚本（如果有）
      if (extension.manifest.scripts) {
        await this.loadScripts(extension.manifest.scripts, extension.basePath);
      }

      // 加载主题入口（如果有）
      if (extension.manifest.entry) {
        const instance = await this.loadEntryModule(extension.manifest.entry, extension.basePath);
        loadedExt.instance = instance;
      }

      loadedExt.status = LoadingStatus.Loaded;
      loadedExt.loadedAt = new Date();
      
      this.logger.info(`Theme loaded successfully: ${extension.manifest.name}`);
      return loadedExt;

    } catch (error) {
      this.logger.error(`Failed to load theme ${extension.manifest.name}:`, error);
      loadedExt.status = LoadingStatus.Failed;
      loadedExt.error = error instanceof Error ? error : new Error('Unknown loading error');
      return loadedExt;
    }
  }

  /**
   * 加载样式文件
   */
  private async loadStyles(styles: string[], basePath: string): Promise<void> {
    const extensionId = basePath.split('/').pop();
    const type = basePath.includes('plugins') ? 'plugins' : 'themes';
    
    for (const stylePath of styles) {
      try {
        const apiPath = `/api/extension/files/${type}/${extensionId}/${stylePath}`;
        
        // 检查是否已经加载
        if (document.querySelector(`link[href="${apiPath}"]`)) {
          continue;
        }

        // 创建link元素
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = apiPath;
        link.type = 'text/css';

        // 添加到头部
        document.head.appendChild(link);
        
        // 等待加载完成
        await new Promise<void>((resolve, reject) => {
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to load stylesheet: ${apiPath}`));
        });

        this.logger.debug(`Loaded stylesheet: ${apiPath}`);
      } catch (error) {
        this.logger.warn(`Failed to load stylesheet ${stylePath}:`, error);
      }
    }
  }

  /**
   * 加载脚本文件
   */
  private async loadScripts(scripts: string[], basePath: string): Promise<void> {
    const extensionId = basePath.split('/').pop();
    const type = basePath.includes('plugins') ? 'plugins' : 'themes';
    
    for (const scriptPath of scripts) {
      try {
        const apiPath = `/api/extension/files/${type}/${extensionId}/${scriptPath}`;
        
        // 检查是否已经加载
        if (document.querySelector(`script[src="${apiPath}"]`)) {
          continue;
        }

        // 创建script元素
        const script = document.createElement('script');
        script.src = apiPath;
        script.type = 'text/javascript';

        // 添加到头部
        document.head.appendChild(script);
        
        // 等待加载完成
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${apiPath}`));
        });

        this.logger.debug(`Loaded script: ${apiPath}`);
      } catch (error) {
        this.logger.warn(`Failed to load script ${scriptPath}:`, error);
      }
    }
  }

  /**
   * 加载入口模块
   */
  private async loadEntryModule(entryPath: string, basePath: string): Promise<{ init?: (framework: ExtensionFramework) => void; [key: string]: unknown }> {
    // 构建API文件访问路径
    const extensionId = basePath.split('/').pop();
    const type = basePath.includes('plugins') ? 'plugins' : 'themes';
    const apiPath = `/api/extension/files/${type}/${extensionId}/${entryPath}`;
    
    try {
      // 动态导入模块
      const module = await import(/* @vite-ignore */ apiPath);
      return module.default || module;
    } catch (error) {
      this.logger.error(`Failed to load entry module ${apiPath}:`, error);
      throw error;
    }
  }

  /**
   * 将插件注册到框架
   */
  private async registerPluginToFramework(instance: { init?: (framework: ExtensionFramework) => void; [key: string]: unknown }, manifest: ExtensionManifest): Promise<void> {
    try {
      // 如果是集成对象
      if (typeof instance === 'object' && instance !== null && 
          'name' in instance && 'hooks' in instance && 
          typeof instance.name === 'string') {
        this.framework.register(instance as unknown as Integration);
        this.logger.debug(`Registered integration: ${instance.name}`);
        return;
      }

      // 如果是组件注册函数
      if (typeof instance.register === 'function') {
        await instance.register(this.framework);
        this.logger.debug(`Executed plugin register function: ${manifest.name}`);
        return;
      }

      // 如果是直接的组件
      if (typeof instance === 'function') {
        // 注册到默认槽位
        this.framework.slots.register('plugin.components', {
          component: instance as React.ComponentType<Record<string, unknown>>,
          source: manifest.id,
          name: manifest.name,
          priority: 0
        });
        this.logger.debug(`Registered component to default slot: ${manifest.name}`);
        return;
      }

      this.logger.warn(`Unknown plugin format for: ${manifest.name}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin ${manifest.name}:`, error);
      throw error;
    }
  }

  /**
   * 应用主题变量
   */
  private applyThemeVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    
    for (const [name, value] of Object.entries(variables)) {
      const cssVarName = name.startsWith('--') ? name : `--${name}`;
      root.style.setProperty(cssVarName, value);
    }

    this.logger.debug('Applied theme variables:', variables);
  }

  /**
   * 卸载扩展
   */
  async unloadExtension(id: string): Promise<boolean> {
    const loadedExt = this.loadedExtensions.get(id);
    if (!loadedExt) {
      return false;
    }

    try {
      this.logger.info(`Unloading extension: ${loadedExt.manifest.name}`);

      // 如果是插件，从框架中注销
      if (loadedExt.manifest.type === 'plugin') {
        this.framework.slots.unregisterBySource(id);
        this.framework.integrations.unregister(id);
      }

      // 移除样式
      if (loadedExt.manifest.styles) {
        this.removeStyles(loadedExt.manifest.styles, loadedExt.basePath);
      }

      // 移除脚本（注意：已加载的脚本无法完全移除）
      if (loadedExt.manifest.scripts) {
        this.removeScripts(loadedExt.manifest.scripts, loadedExt.basePath);
      }

      this.loadedExtensions.delete(id);
      this.logger.info(`Extension unloaded: ${loadedExt.manifest.name}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to unload extension ${id}:`, error);
      return false;
    }
  }

  /**
   * 移除样式
   */
  private removeStyles(styles: string[], basePath: string): void {
    const extensionId = basePath.split('/').pop();
    const type = basePath.includes('plugins') ? 'plugins' : 'themes';
    
    for (const stylePath of styles) {
      const apiPath = `/api/extension/files/${type}/${extensionId}/${stylePath}`;
      const link = document.querySelector(`link[href="${apiPath}"]`);
      if (link) {
        link.remove();
        this.logger.debug(`Removed stylesheet: ${apiPath}`);
      }
    }
  }

  /**
   * 移除脚本标签（注意：不能撤销脚本的执行效果）
   */
  private removeScripts(scripts: string[], basePath: string): void {
    const extensionId = basePath.split('/').pop();
    const type = basePath.includes('plugins') ? 'plugins' : 'themes';
    
    for (const scriptPath of scripts) {
      const apiPath = `/api/extension/files/${type}/${extensionId}/${scriptPath}`;
      const script = document.querySelector(`script[src="${apiPath}"]`);
      if (script) {
        script.remove();
        this.logger.debug(`Removed script tag: ${apiPath}`);
      }
    }
  }

  /**
   * 获取已加载的扩展
   */
  getLoadedExtension(id: string): LoadedExtension | undefined {
    return this.loadedExtensions.get(id);
  }

  /**
   * 获取所有已加载的扩展
   */
  getAllLoadedExtensions(): LoadedExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  /**
   * 获取加载统计
   */
  getLoadingStats() {
    const extensions = this.getAllLoadedExtensions();
    return {
      total: extensions.length,
      loaded: extensions.filter(e => e.status === LoadingStatus.Loaded).length,
      failed: extensions.filter(e => e.status === LoadingStatus.Failed).length,
      loading: extensions.filter(e => e.status === LoadingStatus.Loading).length,
    };
  }
}

export default ExtensionLoader;
