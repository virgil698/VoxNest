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
    [key: string]: boolean | undefined;
  };
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

interface HookContext {
  logger?: {
    info: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string) => void;
  };
  slots?: {
    unregisterBySource: (source: string) => void;
  };
  [key: string]: unknown;
}

interface ExtensionFramework {
  slots: {
    register: (slotId: string, registration: unknown) => void;
    injectStyle: (injection: unknown) => void;
  };
  logger?: {
    info: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string) => void;
  };
  register?: (integration: unknown) => void;
  [key: string]: unknown;
}

interface ExtensionModule {
  default?: unknown;
  initializeCookieConsent?: (framework: ExtensionFramework) => void;
  initializeThemeToggle?: (framework: ExtensionFramework) => void;
  [key: string]: unknown;
}

export interface LoadedExtension {
  manifest: ExtensionManifest;
  module: ExtensionModule;
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
        module: { default: null },
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
        module: { default: null },
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
  private async loadTsxModule(extensionPath: string, manifest: ExtensionManifest): Promise<ExtensionModule> {
    try {
      // 尝试直接动态导入 TSX 文件（通过 Vite 的转译支持）
      console.log(`📁 正在动态加载模块: ${extensionPath}`);
      
      if (manifest.id === 'cookie-consent') {
        // 直接导入 Cookie 同意横幅插件的 TSX 文件（使用相对路径，更可靠）
        const module = await import('../../../extensions/CookieConsent/CookieConsent');
        
        return {
          ...module,
          // 确保关键导出可用
          default: module.initializeCookieConsent || module.default
        };
      } else if (manifest.id === 'dark-mode-theme') {
        // 直接导入明暗模式主题的 TSX 文件（使用相对路径，更可靠）
        const module = await import('../../../extensions/DarkModeTheme/ThemeToggle');
        
        return {
          ...module,
          // 确保关键导出可用
          default: module.initializeThemeToggle || module.default
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
  private async loadFallbackModule(manifest: ExtensionManifest): Promise<ExtensionModule> {
    if (manifest.id === 'cookie-consent') {
      return await this.loadCookieConsentPlugin();
    } else if (manifest.id === 'dark-mode-theme') {
      return await this.loadDarkModeTheme();
    } else if (manifest.id === 'back-to-top') {
      return await this.loadBackToTopPlugin();
    }
    
    throw new Error(`不支持的扩展: ${manifest.id}`);
  }

  /**
   * 加载 Cookie 同意横幅插件模块
   */
  private async loadCookieConsentPlugin(): Promise<ExtensionModule> {
    return {
      initializeCookieConsent: (framework: ExtensionFramework) => {
        console.log('🍪 初始化 Cookie 同意横幅插件...');
        
        // 创建简化的 Cookie 同意横幅组件
        function CookieConsentBanner() {
          const [visible, setVisible] = React.useState(() => {
            return !localStorage.getItem('cookie-consent');
          });

          const handleAccept = () => {
            localStorage.setItem('cookie-consent', JSON.stringify({
              accepted: true,
              timestamp: new Date().toISOString()
            }));
            setVisible(false);
            console.log('用户接受了 Cookie 策略');
          };

          const handleDecline = () => {
            localStorage.setItem('cookie-consent', JSON.stringify({
              accepted: false,
              timestamp: new Date().toISOString()
            }));
            setVisible(false);
            console.log('用户拒绝了 Cookie 策略');
          };

          if (!visible) return null;

          return React.createElement('div', {
            style: {
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              right: '20px',
              maxWidth: '600px',
              margin: '0 auto',
              background: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '16px',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }
          }, [
            React.createElement('div', {
              key: 'content',
              style: { flex: 1, fontSize: '14px', lineHeight: '1.5' }
            }, '本站使用 Cookie 以提供更好的用户体验。继续使用本站即表示您同意我们的 Cookie 政策。'),
            React.createElement('div', {
              key: 'actions',
              style: { display: 'flex', gap: '8px', flexShrink: 0 }
            }, [
              React.createElement('button', {
                key: 'decline',
                onClick: handleDecline,
                className: 'ant-btn',
                style: { fontSize: '12px', height: '32px', padding: '0 12px' }
              }, '拒绝'),
              React.createElement('button', {
                key: 'accept',
                onClick: handleAccept,
                className: 'ant-btn ant-btn-primary',
                style: { fontSize: '12px', height: '32px', padding: '0 12px' }
              }, '接受')
            ])
          ]);
        }

        // 注册到框架
        framework.slots.register('overlay.root', {
          component: CookieConsentBanner,
          source: 'cookie-consent',
          priority: 100,
          name: 'Cookie Consent Banner'
        });

        console.log('✅ Cookie 同意横幅插件初始化成功');
      }
    };
  }

  /**
   * 加载明暗模式主题模块
   */
  private async loadDarkModeTheme(): Promise<ExtensionModule> {
    return {
      // 明暗模式主题集成对象
      default: {
        id: 'voxnest-dark-mode-theme',
        name: '明暗模式主题',
        version: '2.0.0',
        type: 'integration',
        
        // 组件插槽
        slots: {
          'header.right': [
            {
              component: function ThemeToggleButton() {
                const [isDark, setIsDark] = React.useState(() => {
                  return localStorage.getItem('theme-mode') === 'dark';
                });

                const toggleTheme = () => {
                  const newMode = isDark ? 'light' : 'dark';
                  setIsDark(!isDark);
                  localStorage.setItem('theme-mode', newMode);
                  
                  // 应用主题到文档
                  document.documentElement.setAttribute('data-theme', newMode);
                  document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${newMode}`;
                  
                  console.log(`主题已切换到: ${newMode}`);
                };

                // 初始化主题
                React.useEffect(() => {
                  const currentMode = isDark ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', currentMode);
                  document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${currentMode}`;
                }, [isDark]);

                return React.createElement('button', {
                  onClick: toggleTheme,
                  className: 'ant-btn ant-btn-text',
                  style: { 
                    color: '#666', 
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  },
                  title: isDark ? '切换到亮色模式' : '切换到暗色模式'
                }, [
                  React.createElement('span', { key: 'icon' }, isDark ? '☀️' : '🌙'),
                  React.createElement('span', { key: 'text', style: { fontSize: '12px' } }, isDark ? '亮色' : '暗色')
                ]);
              },
              source: 'dark-mode-theme',
              priority: 20,
              name: 'Theme Toggle Button'
            }
          ],
          'sidebar.top': [],
          'admin.sidebar': [
            {
              component: function ThemeManagementCard() {
                const [stats] = React.useState({ totalThemes: 2, activeTheme: 'auto' });
                
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
                  }, ['🎨', '主题管理'])),
                  React.createElement('div', {
                    key: 'body',
                    className: 'ant-card-body',
                    style: { padding: '12px' }
                  }, React.createElement('div', {
                    style: { display: 'flex', flexDirection: 'column', gap: '8px' }
                  }, [
                    React.createElement('div', {
                      key: 'stats',
                      style: { fontSize: '12px', color: '#666', marginBottom: '8px' }
                    }, `可用主题: ${stats.totalThemes} | 当前: ${stats.activeTheme}`),
                    React.createElement('button', {
                      key: 'customize',
                      className: 'ant-btn ant-btn-primary ant-btn-block',
                      style: { height: '32px' }
                    }, '自定义主题'),
                    React.createElement('button', {
                      key: 'reset',
                      className: 'ant-btn ant-btn-block',
                      style: { height: '32px' }
                    }, '重置主题')
                  ]))
                ]);
              },
              source: 'dark-mode-theme',
              priority: 15,
              name: 'Theme Management Card'
            }
          ],
          'content.before': [],
          'overlay.root': [
            {
              component: function ThemeScheduler() {
                const [scheduledMode, setScheduledMode] = React.useState<'light' | 'dark' | null>(null);
                const [visible, setVisible] = React.useState(false);
                
                React.useEffect(() => {
                  const checkSchedule = () => {
                    const hour = new Date().getHours();
                    if (hour >= 20 || hour <= 7) {
                      if (localStorage.getItem('theme-mode') !== 'dark') {
                        setScheduledMode('dark');
                        setVisible(true);
                      }
                    } else {
                      if (localStorage.getItem('theme-mode') !== 'light') {
                        setScheduledMode('light');
                        setVisible(true);
                      }
                    }
                  };
                  
                  const interval = setInterval(checkSchedule, 60000); // 每分钟检查一次
                  checkSchedule(); // 立即检查一次
                  
                  return () => clearInterval(interval);
                }, []);
                
                if (!visible || !scheduledMode) return null;
                
                const handleApply = () => {
                  localStorage.setItem('theme-mode', scheduledMode);
                  document.documentElement.setAttribute('data-theme', scheduledMode);
                  document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${scheduledMode}`;
                  setVisible(false);
                  console.log(`自动切换到${scheduledMode === 'dark' ? '暗色' : '亮色'}模式`);
                };
                
                return React.createElement('div', {
                  style: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '12px 16px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px'
                  }
                }, [
                  React.createElement('span', { key: 'icon' }, scheduledMode === 'dark' ? '🌙' : '☀️'),
                  React.createElement('span', { key: 'text' }, `建议切换到${scheduledMode === 'dark' ? '暗色' : '亮色'}模式`),
                  React.createElement('button', {
                    key: 'apply',
                    onClick: handleApply,
                    className: 'ant-btn ant-btn-primary ant-btn-sm',
                    style: { height: '24px', padding: '0 8px', fontSize: '12px' }
                  }, '应用'),
                  React.createElement('button', {
                    key: 'dismiss',
                    onClick: () => setVisible(false),
                    className: 'ant-btn ant-btn-text ant-btn-sm',
                    style: { height: '24px', padding: '0 8px', fontSize: '12px' }
                  }, '忽略')
                ]);
              },
              source: 'dark-mode-theme',
              priority: 90,
              name: 'Theme Scheduler'
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
              source: 'dark-mode-theme',
              priority: 5,
              name: 'Status Indicator'
            }
          ]
        },
        
        // 生命周期钩子
        hooks: {
          'app:init': (context: HookContext) => {
            context.logger?.info('Dark Mode Theme: Initializing...');
          },
          'app:ready': (context: HookContext) => {
            context.logger?.info('Dark Mode Theme: Component system is ready!');
            
            // 初始化主题检测
            const savedMode = localStorage.getItem('theme-mode');
            if (savedMode) {
              document.documentElement.setAttribute('data-theme', savedMode);
              document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${savedMode}`;
            } else {
              // 检测系统偏好
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const mode = prefersDark ? 'dark' : 'light';
              localStorage.setItem('theme-mode', mode);
              document.documentElement.setAttribute('data-theme', mode);
              document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${mode}`;
            }
          },
          'app:start': (context: HookContext) => {
            context.logger?.debug('Dark Mode Theme: App is starting...');
          },
          'app:started': (context: HookContext) => {
            context.logger?.info('Dark Mode Theme: App has started successfully!');
          },
          'app:destroy': (context: HookContext) => {
            context.logger?.info('Dark Mode Theme: Cleaning up...');
            context.slots?.unregisterBySource('dark-mode-theme');
            context.logger?.info('Dark Mode Theme: Cleanup completed');
          }
        }
      }
    };
  }

  /**
   * 加载回到顶部插件模块
   */
  private async loadBackToTopPlugin(): Promise<ExtensionModule> {
    return {
      initializeBackToTop: (framework: ExtensionFramework) => {
        console.log('🔝 初始化回到顶部插件...');
        
        // 创建简化的回到顶部按钮组件
        function BackToTopButton() {
          const [isVisible, setIsVisible] = React.useState(false);
          const [isHovered, setIsHovered] = React.useState(false);

          React.useEffect(() => {
            const handleScroll = () => {
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              setIsVisible(scrollTop > 200);
            };

            const throttledHandleScroll = (() => {
              let isThrottling = false;
              return () => {
                if (!isThrottling) {
                  handleScroll();
                  isThrottling = true;
                  setTimeout(() => { isThrottling = false; }, 16); // ~60fps
                }
              };
            })();

            window.addEventListener('scroll', throttledHandleScroll, { passive: true });
            handleScroll(); // 初始检查
            
            return () => {
              window.removeEventListener('scroll', throttledHandleScroll);
            };
          }, []);

          const handleClick = () => {
            const startPosition = window.pageYOffset;
            const startTime = performance.now();

            const animateScroll = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / 500, 1);
              
              // 缓动函数
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              
              window.scrollTo(0, startPosition * (1 - easeOutQuart));

              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              }
            };

            requestAnimationFrame(animateScroll);
            console.log('🔝 [BackToTop] User scrolled to top');
          };

          if (!isVisible) return null;

          return React.createElement('button', {
            onClick: handleClick,
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
            'aria-label': '回到页面顶部',
            title: '回到顶部',
            style: {
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              backgroundColor: '#1890ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              opacity: isHovered ? 1.0 : 0.8,
              transform: isVisible ? 'scale(1)' : 'scale(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1000,
              outline: 'none',
              userSelect: 'none'
            }
          }, '↑');
        }

        // 注册到框架
        framework.slots.register('overlay.root', {
          component: BackToTopButton,
          source: 'back-to-top',
          name: '回到顶部按钮',
          priority: 100
        });

        console.log('✅ 回到顶部插件初始化成功');
      }
    };
  }

  /**
   * 初始化已加载的扩展
   */
  async initializeExtension(extensionId: string, framework: ExtensionFramework): Promise<boolean> {
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
        } else if (module.initializeCookieConsent && typeof module.initializeCookieConsent === 'function') {
          console.log(`🔌 调用插件初始化方法: ${extensionId}.initializeCookieConsent`);
          module.initializeCookieConsent(framework);
        } else if (module.initializeBackToTop && typeof module.initializeBackToTop === 'function') {
          console.log(`🔌 调用插件初始化方法: ${extensionId}.initializeBackToTop`);
          module.initializeBackToTop(framework);
        } else if (module.default && typeof module.default === 'object' && module.default !== null &&
                   'initialize' in module.default && typeof (module.default as Record<string, unknown>).initialize === 'function') {
          console.log(`🔌 调用插件默认初始化方法: ${extensionId}.default.initialize`);
          ((module.default as Record<string, unknown>).initialize as (framework: ExtensionFramework) => void)(framework);
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
        } else if (module.initializeThemeToggle && typeof module.initializeThemeToggle === 'function') {
          console.log(`🎨 调用主题初始化方法: ${extensionId}.initializeThemeToggle`);
          module.initializeThemeToggle(framework);
        } else if (module.default && typeof module.default === 'object' && module.default !== null &&
                   'initialize' in module.default && typeof (module.default as Record<string, unknown>).initialize === 'function') {
          console.log(`🎨 调用主题默认初始化方法: ${extensionId}.default.initialize`);
          ((module.default as Record<string, unknown>).initialize as (framework: ExtensionFramework) => void)(framework);
        } else if (module.default && typeof module.default === 'object' && module.default !== null &&
                   'slots' in module.default) {
          console.log(`🎨 注册主题集成对象: ${extensionId}.default`);
          (framework.register as ((integration: unknown) => void))?.(module.default);
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
