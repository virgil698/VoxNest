import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { QueryClientProvider } from '@tanstack/react-query'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { router } from './router'
import InstallGuard from './components/InstallGuard'
import ConditionalDevTools from './components/ConditionalDevTools'
import { ExtensionProvider, initializeFramework, getFramework } from './extensions'
import { publicExtensionLoader } from './extensions/manager/PublicExtensionLoader'
import { logger } from './utils/logger'
import { queryClient } from './lib/queryClient'

// VoxNest 白色主题配置
const whiteTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#4F46E5',
    colorText: '#2D3748',
    colorTextSecondary: '#718096',
    colorTextTertiary: '#A0AEC0',
    colorBorder: '#E2E8F0',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorBgElevated: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 6px rgba(0, 0, 0, 0.07)',
  },
  components: {
    Card: {
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.06)',
      colorBorderSecondary: '#E2E8F0',
    },
    Button: {
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    },
    Input: {
      borderRadius: 8,
      colorText: '#2D3748',
    },
    Select: {
      borderRadius: 8,
    },
    Typography: {
      colorText: '#2D3748',
      colorTextSecondary: '#718096',
      colorTextDescription: '#A0AEC0',
    },
    Statistic: {
      colorText: '#2D3748',
      colorTextSecondary: '#718096',
    }
  }
};

// 初始化应用
setTimeout(async () => {
  try {
    console.log('🚀 开始初始化 VoxNest 应用...');
    
    // 初始化扩展框架
    await initializeFramework({
      appName: 'VoxNest',
      appVersion: '1.0.0',
      logLevel: 'debug',
      autoRegisterBuiltins: true,
      dev: process.env.NODE_ENV === 'development'
    });
    
    const framework = getFramework();
    
    // 初始化日志系统
    await logger.initialize();
    console.log('📊 日志系统初始化完成');
    
    // === 新的扩展加载机制 ===
    console.log('🔍 开始发现和加载 public/extensions 中的扩展...');
    
    // 发现所有可用的扩展
    const availableExtensions = await publicExtensionLoader.discoverExtensions();
    console.log(`📦 发现 ${availableExtensions.length} 个扩展:`, availableExtensions.map(e => `${e.name} (${e.type})`));
    
    // 加载并初始化每个扩展
    for (const manifest of availableExtensions) {
      try {
        console.log(`⏳ 正在加载扩展: ${manifest.name}...`);
        
        // 加载扩展模块
        const loadedExtension = await publicExtensionLoader.loadExtension(manifest);
        
        if (loadedExtension.error) {
          console.error(`❌ 扩展 ${manifest.name} 加载失败:`, loadedExtension.error);
          continue;
        }
        
        // 初始化扩展 
        const frameworkAdapter = {
          slots: {
            register: (slotId: string, registration: unknown) => framework.slots.register(slotId, registration as { component: React.ComponentType; source: string; priority?: number; name?: string; condition?: () => boolean }),
            injectStyle: (injection: unknown) => framework.slots.injectStyle(injection as { content: string; id: string; source: string; isTheme?: boolean })
          },
          logger: framework.logger,
          register: (integration: unknown) => {
            const typedIntegration = integration as { name: string; hooks?: { [key: string]: unknown } };
            framework.register(typedIntegration);
          }
        };
        const initialized = await publicExtensionLoader.initializeExtension(manifest.id, frameworkAdapter);
        
        if (initialized) {
          console.log(`✅ 扩展 ${manifest.name} 初始化成功`);
        } else {
          console.error(`❌ 扩展 ${manifest.name} 初始化失败`);
        }
      } catch (error) {
        console.error(`扩展 ${manifest.name} 处理失败:`, error);
      }
    }
    
    // === 初始化扩展配置 ===
    console.log('⚙️ 初始化扩展配置系统...');
    try {
      const { ExtensionConfigInitializer } = await import('./extensions/core/ExtensionConfigInitializer');
      
      // 创建Logger适配器
      const extensionLogger = {
        trace: (message: string, ...args: unknown[]) => console.log(`[TRACE] ${message}`, ...args),
        debug: (message: string, ...args: unknown[]) => console.log(`[DEBUG] ${message}`, ...args),
        info: (message: string, ...args: unknown[]) => console.log(`[INFO] ${message}`, ...args),
        warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
        error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
        createChild: (name: string) => ({
          trace: (message: string, ...args: unknown[]) => console.log(`[TRACE][${name}] ${message}`, ...args),
          debug: (message: string, ...args: unknown[]) => console.log(`[DEBUG][${name}] ${message}`, ...args),
          info: (message: string, ...args: unknown[]) => console.log(`[INFO][${name}] ${message}`, ...args),
          warn: (message: string, ...args: unknown[]) => console.warn(`[WARN][${name}] ${message}`, ...args),
          error: (message: string, ...args: unknown[]) => console.error(`[ERROR][${name}] ${message}`, ...args),
          createChild: (childName: string) => extensionLogger.createChild(`${name}.${childName}`)
        })
      };
      
      const configInitializer = new ExtensionConfigInitializer(extensionLogger);
      await configInitializer.initializeAllConfigs();
      console.log('✅ 扩展配置系统初始化完成');
    } catch (error) {
      console.warn('⚠️ 扩展配置初始化失败，将使用默认配置:', error);
    }
    
    // 打印扩展统计信息
    const extensionStats = publicExtensionLoader.getStats();
    console.group('📈 扩展加载统计');
    console.log('总扩展数:', extensionStats.total);
    console.log('插件数量:', extensionStats.plugins);
    console.log('主题数量:', extensionStats.themes);
    console.log('已初始化:', extensionStats.initialized);
    console.log('失败数量:', extensionStats.failed);
    console.table(extensionStats.extensions);
    console.groupEnd();
    
    // 记录性能指标
    setTimeout(() => {
      logger.logPerformanceMetrics();
    }, 2000);
    
    console.log('🎉 VoxNest 应用初始化完成！');
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    // 显示用户友好的错误信息
    if (typeof window !== 'undefined' && window.document) {
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="
          position: fixed; top: 50%; left: 50%; 
          transform: translate(-50%, -50%);
          background: #ff4d4f; color: white; 
          padding: 20px; border-radius: 8px; 
          font-family: Arial, sans-serif;
          z-index: 10000;
        ">
          <h3>应用初始化失败</h3>
          <p>VoxNest 无法正常启动，请刷新页面重试。</p>
          <p><small>错误详情: ${error instanceof Error ? error.message : '未知错误'}</small></p>
        </div>
      `;
      document.body.appendChild(errorDiv);
    }
  }
}, 500);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ExtensionProvider
        config={{
          appName: 'VoxNest',
          appVersion: '1.0.0',
          logLevel: 'debug',
          autoRegisterBuiltins: true,
          dev: process.env.NODE_ENV === 'development'
        }}
      >
        <ConfigProvider locale={zhCN} theme={whiteTheme}>
          <InstallGuard>
            <RouterProvider router={router} />
          </InstallGuard>
        </ConfigProvider>
      </ExtensionProvider>
      <ConditionalDevTools />
    </QueryClientProvider>
  </StrictMode>,
)
