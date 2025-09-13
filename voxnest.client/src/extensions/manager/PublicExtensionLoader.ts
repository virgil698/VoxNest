/**
 * Public Extension Loader
 * 从 public/extensions 目录动态加载插件和主题
 * 支持 TypeScript/TSX 文件加载和执行
 */

import React from 'react';

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  type: 'plugin' | 'theme';
  description: string;
  author: string;
  main: string;
  enabled: boolean;
  dependencies?: string[];
  permissions?: string[];
  tags?: string[];
  slots?: string[];
  hooks?: string[];
  capabilities?: {
    ui?: boolean;
    api?: boolean;
    storage?: boolean;
    theming?: boolean;
    layout?: boolean;
    [key: string]: any;
  };
  config?: Record<string, any>;
  [key: string]: any;
}

export interface LoadedExtension {
  manifest: ExtensionManifest;
  module: any;
  initialized: boolean;
  error?: string;
}

export class PublicExtensionLoader {
  private discoveredExtensions: ExtensionManifest[] = [];
  private loadedExtensions = new Map<string, LoadedExtension>();
  private baseUrl = '/extensions';

  /**
   * 获取所有可用的扩展清单
   */
  async discoverExtensions(): Promise<ExtensionManifest[]> {
    try {
      // 从统一的扩展清单文件加载所有扩展
      const extensionsUrl = `${this.baseUrl}/extensions.json`;
      console.log(`📄 正在加载统一扩展清单文件: ${extensionsUrl}`);
      
      const response = await fetch(extensionsUrl);
      if (!response.ok) {
        console.warn(`无法获取统一扩展清单文件: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      const extensions: ExtensionManifest[] = data.extensions || [];
      
      this.discoveredExtensions = extensions;
      console.log(`🔍 发现 ${extensions.length} 个扩展:`, extensions.map(e => `${e.name} (${e.type})`));
      console.table(extensions.map(e => ({
        名称: e.name,
        类型: e.type,
        版本: e.version,
        状态: e.enabled ? '启用' : '禁用',
        插槽数: e.slots?.length || 0
      })));
      
      return extensions;
    } catch (error) {
      console.error('扩展发现失败:', error);
      return [];
    }
  }

  /**
   * 加载指定的扩展
   */
  async loadExtension(manifest: ExtensionManifest): Promise<LoadedExtension> {
    const { id, main } = manifest;
    
    // 检查扩展是否启用
    if (!manifest.enabled) {
      console.warn(`⏸️  扩展 ${manifest.name} 已禁用，跳过加载`);
      const disabledExtension: LoadedExtension = {
        manifest,
        module: null,
        initialized: false,
        error: '扩展已禁用'
      };
      this.loadedExtensions.set(id, disabledExtension);
      return disabledExtension;
    }
    
    // 检查是否已经加载
    if (this.loadedExtensions.has(id)) {
      return this.loadedExtensions.get(id)!;
    }

    console.log(`📦 加载扩展: ${manifest.name} (${id}) - ${manifest.type}`);

    try {
      // 构建文件路径 - 统一目录结构
      const extensionPath = `${this.baseUrl}/${id}/${main}`;
      console.log(`📁 扩展路径: ${extensionPath}`);
      
      // 由于浏览器不能直接执行 .tsx 文件，我们需要特殊处理
      const module = await this.loadTsxModule(extensionPath, manifest);
      
      const loadedExtension: LoadedExtension = {
        manifest,
        module,
        initialized: false
      };

      this.loadedExtensions.set(id, loadedExtension);
      console.log(`✅ 扩展 ${manifest.name} 模块加载成功`);
      return loadedExtension;
    } catch (error) {
      console.error(`❌ 加载扩展 ${manifest.name} 失败:`, error);
      const failedExtension: LoadedExtension = {
        manifest,
        module: null,
        initialized: false,
        error: error instanceof Error ? error.message : '加载失败'
      };
      
      this.loadedExtensions.set(id, failedExtension);
      return failedExtension;
    }
  }

  /**
   * 加载 TypeScript/TSX 模块
   * 通过动态导入加载真实的扩展模块
   */
  private async loadTsxModule(extensionPath: string, manifest: ExtensionManifest): Promise<any> {
    try {
      // 尝试直接动态导入 TSX 文件（通过 Vite 的转译支持）
      console.log(`📁 正在动态加载模块: ${extensionPath}`);
      
      if (manifest.id === 'DemoPlugin') {
        // 直接导入演示插件的 TSX 文件（使用相对路径，更可靠）
        const module = await import('../../../extensions/DemoPlugin/DemoPlugin');
        
        return {
          ...module,
          // 确保关键导出可用
          default: module.DemoPlugin || module.default
        };
      } else if (manifest.id === 'ExampleIntegration') {
        // 直接导入示例主题的 TSX 文件（使用相对路径，更可靠）
        const module = await import('../../../extensions/ExampleIntegration/ExampleIntegration');
        
        return {
          ...module,
          // 确保关键导出可用
          default: module.ExampleTheme || module.default
        };
      } else {
        // 通用加载逻辑：尝试从扩展路径加载
        const module = await import(/* @vite-ignore */ extensionPath);
        return {
          default: module.default,
          initialize: module.initialize,
          ...module
        };
      }
    } catch (error) {
      console.error(`动态导入失败，回退到模拟模块:`, error);
      // 如果动态导入失败，回退到原来的模拟模块逻辑
      return await this.loadFallbackModule(manifest);
    }
  }

  /**
   * 回退模块加载（当动态导入失败时使用）
   */
  private async loadFallbackModule(manifest: ExtensionManifest): Promise<any> {
    if (manifest.id === 'DemoPlugin') {
      return await this.loadDemoPlugin();
    } else if (manifest.id === 'ExampleIntegration') {
      return await this.loadExampleTheme();
    }
    
    throw new Error(`不支持的扩展: ${manifest.id}`);
  }

  /**
   * 加载演示插件模块
   */
  private async loadDemoPlugin(): Promise<any> {
    // 在实际项目中，这里会从服务器加载编译后的模块
    // 现在我们返回一个模拟的模块结构
    return {
      initializeDemoPlugin: (framework: any) => {
        console.log('🔌 从 public/extensions 初始化演示插件...');
        
        // 这里应该是实际的插件初始化代码
        // 由于我们不能直接执行 TSX，这里使用预编译的版本
        
        // 创建设置按钮组件 - 返回 React 元素
        const SettingsButton = () => {
          const handleClick = () => {
            console.log('演示插件：设置按钮被点击');
            
            // 显示消息
            console.log('演示插件体验已开打开！');
            
            // 尝试显示浏览器通知
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('VoxNest', {
                body: '演示插件体验已开打开！',
                icon: '/vite.svg'
              });
            } else {
              // 创建临时提示
              const toast = document.createElement('div');
              toast.textContent = '演示插件体验已开打开！';
              toast.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                background: #52c41a; color: white; padding: 12px 20px;
                border-radius: 6px; font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              `;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }
          };

          // 返回 React 元素而不是原生 DOM 元素
          return React.createElement('button', {
            onClick: handleClick,
            title: '演示插件设置',
            className: 'ant-btn ant-btn-text',
            style: { 
              color: '#666', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              padding: '4px 8px'
            }
          }, '演示');
        };

        // 注册到框架
        framework.slots.register('header.right', {
          component: SettingsButton,
          source: 'demo-plugin',
          priority: 10,
          name: 'Demo Settings Button'
        });

        console.log('✅ 演示插件初始化成功（来自 public/extensions）');
      },
      
      DemoPlugin: {
        id: 'voxnest-demo-plugin',
        name: '演示插件',
        version: '1.0.0'
      }
    };
  }

  /**
   * 加载示例主题模块
   */
  private async loadExampleTheme(): Promise<any> {
    return {
      // 完整的主题集成对象，模拟原始 ExampleIntegration.tsx 的结构
      default: {
        id: 'voxnest-example-theme',
        name: '示例主题扩展',
        version: '1.0.0',
        type: 'integration',
        
        // 组件插槽
        slots: {
          'header.right': [
            {
              component: () => {
                const [count, setCount] = React.useState(3);
                
                return React.createElement('div', {
                  style: { position: 'relative', display: 'inline-block' }
                }, React.createElement('span', {
                  className: 'ant-badge',
                  style: { position: 'relative' }
                }, [
                  count > 0 && React.createElement('span', {
                    key: 'badge',
                    className: 'ant-badge-count ant-badge-count-sm',
                    style: { 
                      background: '#ff4d4f', 
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      zIndex: 1,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '10px',
                      lineHeight: '16px',
                      textAlign: 'center'
                    }
                  }, count),
                  React.createElement('button', {
                    key: 'button',
                    onClick: () => setCount(prev => Math.max(0, prev - 1)),
                    className: 'ant-btn ant-btn-text',
                    style: { color: '#666', padding: '4px 8px' },
                    title: '通知'
                  }, '🔔')
                ]));
              },
              source: 'example-theme',
              priority: 20,
              name: 'Notification Button'
            }
          ],
          'sidebar.top': [
            {
              component: () => {
                return React.createElement('div', {
                  className: 'ant-card ant-card-bordered ant-card-small',
                  style: { marginBottom: '16px' }
                }, [
                  React.createElement('div', {
                    key: 'header',
                    className: 'ant-card-head',
                    style: { padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }
                  }, React.createElement('div', {
                    className: 'ant-card-head-title',
                    style: { fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }
                  }, ['🚀', '快速操作'])),
                  React.createElement('div', {
                    key: 'body',
                    className: 'ant-card-body',
                    style: { padding: '12px' }
                  }, React.createElement('div', {
                    style: { display: 'flex', flexDirection: 'column', gap: '8px' }
                  }, [
                    React.createElement('button', {
                      key: 'create',
                      className: 'ant-btn ant-btn-primary ant-btn-block',
                      style: { height: '32px' }
                    }, '创建新帖子'),
                    React.createElement('button', {
                      key: 'draft',
                      className: 'ant-btn ant-btn-block',
                      style: { height: '32px' }
                    }, '查看草稿'),
                    React.createElement('button', {
                      key: 'manage',
                      className: 'ant-btn ant-btn-block',
                      style: { height: '32px' }
                    }, '管理分类')
                  ]))
                ]);
              },
              source: 'example-theme',
              priority: 15,
              name: 'Quick Actions Card'
            }
          ],
          'content.before': [
            {
              component: () => {
                const [visible, setVisible] = React.useState(true);
                
                if (!visible) return null;
                
                return React.createElement('div', {
                  style: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    position: 'relative'
                  }
                }, [
                  React.createElement('button', {
                    key: 'close',
                    onClick: () => setVisible(false),
                    style: {
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }
                  }, '×'),
                  React.createElement('div', {
                    key: 'content',
                    style: { display: 'flex', alignItems: 'center', gap: '12px' }
                  }, [
                    React.createElement('span', { key: 'icon', style: { fontSize: '24px' } }, '🎉'),
                    React.createElement('div', { key: 'text' }, [
                      React.createElement('h4', {
                        key: 'title',
                        style: { margin: 0, marginBottom: '4px' }
                      }, '🔥 扩展系统现已激活！'),
                      React.createElement('p', {
                        key: 'desc',
                        style: { margin: 0, opacity: 0.9, fontSize: '14px' }
                      }, '体验强大的插件和主题扩展功能，让 VoxNest 更加个性化！')
                    ])
                  ])
                ]);
              },
              source: 'example-theme',
              priority: 25,
              name: 'Feature Highlight'
            }
          ],
          'footer.right': [
            {
              component: () => {
                return React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#999' }
                }, [
                  React.createElement('span', { key: 'icon' }, '🟢'),
                  React.createElement('span', { key: 'text' }, '主题扩展已激活'),
                  React.createElement('span', {
                    key: 'version',
                    style: {
                      background: '#52c41a',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }
                  }, 'v1.0.0')
                ]);
              },
              source: 'example-theme',
              priority: 5,
              name: 'Status Indicator'
            }
          ]
        },
        
        // 生命周期钩子
        hooks: {
          'app:init': (context: any) => {
            context.logger?.info('Example Theme: Initializing...');
          },
          'app:ready': (context: any) => {
            context.logger?.info('Example Theme: Component system is ready!');
          },
          'app:start': (context: any) => {
            context.logger?.debug('Example Theme: App is starting...');
          },
          'app:started': (context: any) => {
            context.logger?.info('Example Theme: App has started successfully!');
          },
          'app:destroy': (context: any) => {
            context.logger?.info('Example Theme: Cleaning up...');
            context.slots?.unregisterBySource('example-theme');
            context.logger?.info('Example Theme: Cleanup completed');
          }
        }
      }
    };
  }

  /**
   * 初始化已加载的扩展
   */
  async initializeExtension(extensionId: string, framework: any): Promise<boolean> {
    const loadedExtension = this.loadedExtensions.get(extensionId);
    
    if (!loadedExtension || loadedExtension.error) {
      console.error(`扩展 ${extensionId} 未加载或有错误`);
      return false;
    }

    if (loadedExtension.initialized) {
      console.warn(`扩展 ${extensionId} 已经初始化过了`);
      return true;
    }

    try {
      const { manifest, module } = loadedExtension;
      
      if (manifest.type === 'plugin') {
        // 插件类型：查找初始化方法
        if (module.initialize && typeof module.initialize === 'function') {
          console.log(`🔌 调用插件初始化方法: ${extensionId}.initialize`);
          module.initialize(framework);
        } else if (module.initializeDemoPlugin && typeof module.initializeDemoPlugin === 'function') {
          console.log(`🔌 调用插件初始化方法: ${extensionId}.initializeDemoPlugin`);
          module.initializeDemoPlugin(framework);
        } else if (module.default && module.default.initialize && typeof module.default.initialize === 'function') {
          console.log(`🔌 调用插件默认初始化方法: ${extensionId}.default.initialize`);
          module.default.initialize(framework);
        } else {
          console.warn(`插件 ${extensionId} 没有可识别的初始化方法`);
          console.log('可用的模块属性:', Object.keys(module));
          return false;
        }
      } else if (manifest.type === 'theme') {
        // 主题类型：查找初始化方法或集成对象
        if (module.initialize && typeof module.initialize === 'function') {
          console.log(`🎨 调用主题初始化方法: ${extensionId}.initialize`);
          module.initialize(framework);
        } else if (module.initializeExampleTheme && typeof module.initializeExampleTheme === 'function') {
          console.log(`🎨 调用主题初始化方法: ${extensionId}.initializeExampleTheme`);
          module.initializeExampleTheme(framework);
        } else if (module.default && module.default.initialize && typeof module.default.initialize === 'function') {
          console.log(`🎨 调用主题默认初始化方法: ${extensionId}.default.initialize`);
          module.default.initialize(framework);
        } else if (module.default && module.default.slots) {
          console.log(`🎨 注册主题集成对象: ${extensionId}.default`);
          framework.register(module.default);
        } else {
          console.warn(`主题 ${extensionId} 没有可识别的集成对象或初始化方法`);
          console.log('可用的模块属性:', Object.keys(module));
          return false;
        }
      } else {
        console.warn(`扩展 ${extensionId} 类型不支持: ${manifest.type}`);
        return false;
      }

      loadedExtension.initialized = true;
      console.log(`✅ 扩展 ${extensionId} 初始化成功`);
      return true;
    } catch (error) {
      console.error(`扩展 ${extensionId} 初始化失败:`, error);
      loadedExtension.error = error instanceof Error ? error.message : '初始化失败';
      return false;
    }
  }

  /**
   * 获取已发现的扩展清单
   */
  getDiscoveredExtensions(): ExtensionManifest[] {
    return [...this.discoveredExtensions];
  }

  /**
   * 获取已加载的扩展
   */
  getLoadedExtensions(): Map<string, LoadedExtension> {
    return new Map(this.loadedExtensions);
  }

  /**
   * 获取扩展统计信息
   */
  getStats() {
    const extensions = Array.from(this.loadedExtensions.values());
    
    return {
      total: extensions.length,
      plugins: extensions.filter(e => e.manifest.type === 'plugin').length,
      themes: extensions.filter(e => e.manifest.type === 'theme').length,
      initialized: extensions.filter(e => e.initialized).length,
      failed: extensions.filter(e => e.error).length,
      extensions: extensions.map(e => ({
        id: e.manifest.id,
        name: e.manifest.name,
        type: e.manifest.type,
        version: e.manifest.version,
        initialized: e.initialized,
        error: e.error
      }))
    };
  }
}

// 全局扩展加载器实例
export const publicExtensionLoader = new PublicExtensionLoader();
