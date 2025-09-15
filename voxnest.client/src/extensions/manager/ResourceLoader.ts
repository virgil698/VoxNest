/**
 * 多文件扩展资源加载器
 * 支持 TypeScript、JavaScript、CSS、SCSS 等多种文件类型
 */

import type { Logger } from '../core/types';
import type { ExtensionManifest, FileResource } from './ExtensionDiscovery';

// 加载的资源信息
export interface LoadedResource {
  path: string;
  type: FileResource['type'];
  content?: string;
  module?: unknown;
  error?: Error;
  loaded: boolean;
}

// 加载结果
export interface LoadResult {
  success: boolean;
  resources: LoadedResource[];
  entryModule?: unknown;
  styles: string[];
  errors: Error[];
}

export class ResourceLoader {
  private logger: Logger;
  private loadedResources = new Map<string, LoadedResource>();
  private styleElements = new Map<string, HTMLStyleElement>();

  constructor(logger: Logger) {
    this.logger = logger.createChild('ResourceLoader');
  }

  /**
   * 加载扩展的所有资源
   */
  async loadExtension(manifest: ExtensionManifest, basePath: string): Promise<LoadResult> {
    this.logger.info(`Loading extension "${manifest.name}" (${manifest.id})`);
    
    const result: LoadResult = {
      success: false,
      resources: [],
      styles: [],
      errors: []
    };

    try {
      // 执行加载前钩子
      if (manifest.hooks?.beforeLoad) {
        await this.executeHook(manifest.hooks.beforeLoad, 'beforeLoad');
      }

      // 准备文件列表
      const filesToLoad = this.prepareFileList(manifest);
      
      // 按优先级排序
      filesToLoad.sort((a, b) => (a.order || 0) - (b.order || 0));

      // 依次加载文件
      for (const file of filesToLoad) {
        try {
          // 检查加载条件
          if (file.condition && !this.evaluateCondition(file.condition)) {
            this.logger.debug(`Skipping file ${file.path} due to condition: ${file.condition}`);
            continue;
          }

          const resource = await this.loadFile(file, basePath);
          result.resources.push(resource);

          // 如果是样式文件，添加到样式列表
          if (this.isStyleFile(file.type) && resource.content) {
            result.styles.push(resource.content);
            this.injectStyle(resource.content, `${manifest.id}-${file.path}`, manifest.id);
          }

          // 如果是主入口文件，保存模块
          if (this.isEntryFile(file, manifest)) {
            result.entryModule = resource.module;
          }

        } catch (error) {
          this.logger.error(`Failed to load file ${file.path}:`, error);
          result.errors.push(error as Error);
        }
      }

      // 处理向后兼容的入口文件
      if (!result.entryModule && manifest.entry) {
        try {
          const entryResource = await this.loadFile({
            path: manifest.entry,
            type: this.getFileType(manifest.entry)
          }, basePath);
          result.entryModule = entryResource.module;
          result.resources.push(entryResource);
        } catch (error) {
          this.logger.error(`Failed to load entry file ${manifest.entry}:`, error);
          result.errors.push(error as Error);
        }
      }

      // 处理向后兼容的样式文件
      if (manifest.styles) {
        for (const stylePath of manifest.styles) {
          try {
            const styleContent = await this.loadStyleContent(stylePath, basePath);
            result.styles.push(styleContent);
            this.injectStyle(styleContent, `${manifest.id}-${stylePath}`, manifest.id);
          } catch (error) {
            this.logger.error(`Failed to load style ${stylePath}:`, error);
            result.errors.push(error as Error);
          }
        }
      }

      // 执行加载后钩子
      if (manifest.hooks?.afterLoad) {
        await this.executeHook(manifest.hooks.afterLoad, 'afterLoad');
      }

      result.success = result.errors.length === 0;
      this.logger.info(`Extension "${manifest.name}" loaded ${result.success ? 'successfully' : 'with errors'}`);

    } catch (error) {
      this.logger.error(`Failed to load extension "${manifest.name}":`, error);
      result.errors.push(error as Error);
    }

    return result;
  }

  /**
   * 卸载扩展资源
   */
  async unloadExtension(manifest: ExtensionManifest): Promise<void> {
    this.logger.info(`Unloading extension "${manifest.name}" (${manifest.id})`);

    try {
      // 执行卸载前钩子
      if (manifest.hooks?.beforeUnload) {
        await this.executeHook(manifest.hooks.beforeUnload, 'beforeUnload');
      }

      // 移除样式
      this.removeStylesBySource(manifest.id);

      // 清理加载的资源
      this.cleanupResources(manifest.id);

      this.logger.info(`Extension "${manifest.name}" unloaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to unload extension "${manifest.name}":`, error);
    }
  }

  /**
   * 准备文件加载列表
   */
  private prepareFileList(manifest: ExtensionManifest): FileResource[] {
    const files: FileResource[] = [];

    // 添加新格式的文件配置
    if (manifest.files) {
      files.push(...manifest.files);
    }

    // 处理向后兼容的脚本文件
    if (manifest.scripts) {
      manifest.scripts.forEach((script, index) => {
        files.push({
          path: script,
          type: this.getFileType(script),
          order: 1000 + index // 较低优先级
        });
      });
    }

    return files;
  }

  /**
   * 加载单个文件
   */
  private async loadFile(file: FileResource, basePath: string): Promise<LoadedResource> {
    const fullPath = `${basePath}/${file.path}`;
    const resource: LoadedResource = {
      path: file.path,
      type: file.type,
      loaded: false
    };

    try {
      if (this.isStyleFile(file.type)) {
        // 加载样式文件
        resource.content = await this.loadStyleContent(file.path, basePath);
      } else if (this.isScriptFile(file.type)) {
        // 加载脚本文件
        resource.module = await this.loadScript(fullPath, file.async);
      }

      resource.loaded = true;
      this.loadedResources.set(fullPath, resource);
      this.logger.debug(`Loaded file: ${file.path}`);

    } catch (error) {
      resource.error = error as Error;
      this.logger.error(`Failed to load file ${file.path}:`, error);
    }

    return resource;
  }

  /**
   * 加载样式内容
   */
  private async loadStyleContent(stylePath: string, basePath: string): Promise<string> {
    const fullPath = `${basePath}/${stylePath}`;
    
    try {
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let content = await response.text();
      
      // 如果是 SCSS/SASS 文件，需要编译（简单处理）
      if (stylePath.endsWith('.scss') || stylePath.endsWith('.sass')) {
        content = await this.compileSass(content);
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load style ${stylePath}: ${error}`);
    }
  }

  /**
   * 加载脚本模块
   */
  private async loadScript(scriptPath: string, async = false): Promise<unknown> {
    try {
      if (async) {
        // 异步加载
        return await import(/* @vite-ignore */ scriptPath);
      } else {
        // 同步加载（使用动态导入）
        return await import(/* @vite-ignore */ scriptPath);
      }
    } catch (error) {
      throw new Error(`Failed to load script ${scriptPath}: ${error}`);
    }
  }

  /**
   * 注入样式到页面
   */
  private injectStyle(content: string, id: string, source: string): void {
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

  /**
   * 移除指定源的所有样式
   */
  private removeStylesBySource(source: string): void {
    this.styleElements.forEach((element, id) => {
      if (element.getAttribute('data-source') === source) {
        element.remove();
        this.styleElements.delete(id);
      }
    });
  }

  /**
   * 清理资源
   */
  private cleanupResources(extensionId: string): void {
    const toRemove: string[] = [];
    this.loadedResources.forEach((_, path) => {
      if (path.includes(extensionId)) {
        toRemove.push(path);
      }
    });
    
    toRemove.forEach(path => this.loadedResources.delete(path));
  }

  /**
   * 执行生命周期钩子
   */
  private async executeHook(script: string, hookName: string): Promise<void> {
    try {
      // 简单的脚本执行（在实际项目中可能需要更安全的沙箱）
      const func = new Function('return ' + script);
      await func();
      this.logger.debug(`Executed ${hookName} hook`);
    } catch (error) {
      this.logger.warn(`Failed to execute ${hookName} hook:`, error);
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string): boolean {
    try {
      // 简单的条件评估（在实际项目中需要更安全的实现）
      return new Function('return ' + condition)();
    } catch (error) {
      this.logger.warn(`Failed to evaluate condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * 简单的 SASS 编译（占位符实现）
   */
  private async compileSass(content: string): Promise<string> {
    // 这里只是一个占位符实现
    // 在实际项目中，你可能需要集成 sass.js 或其他 SASS 编译器
    this.logger.warn('SASS compilation is not fully implemented, returning raw content');
    return content;
  }

  /**
   * 工具方法
   */
  private isStyleFile(type: FileResource['type']): boolean {
    return ['css', 'scss', 'sass'].includes(type);
  }

  private isScriptFile(type: FileResource['type']): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(type);
  }

  private isEntryFile(file: FileResource, manifest: ExtensionManifest): boolean {
    return file.path === manifest.entry || file.order === 0;
  }

  private getFileType(filePath: string): FileResource['type'] {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'ts';
      case 'tsx': return 'tsx';
      case 'js': return 'js';
      case 'jsx': return 'jsx';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'sass': return 'sass';
      default: return 'js';
    }
  }

  /**
   * 调试信息
   */
  debug(): void {
    console.group('📦 ResourceLoader Debug Info');
    console.log('Loaded Resources:', Object.fromEntries(this.loadedResources));
    console.log('Style Elements:', Object.fromEntries(this.styleElements));
    console.groupEnd();
  }
}
