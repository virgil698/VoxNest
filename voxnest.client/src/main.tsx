import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { router } from './router'
import InstallGuard from './components/InstallGuard'
import { ExtensionProvider, initializeFramework, getFramework } from './extensions'
import { initializeDemoPlugin } from './extensions/demo/DemoPlugin'
import { ExampleIntegration } from './extensions/examples/ExampleIntegration'
import { logger } from './utils/logger'

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
    // 初始化扩展框架
    await initializeFramework({
      appName: 'VoxNest',
      appVersion: '1.0.0',
      logLevel: 'debug',
      autoRegisterBuiltins: true,
      dev: process.env.NODE_ENV === 'development'
    });
    
    // 注册示例集成
    const framework = getFramework();
    framework.register(ExampleIntegration);
    
    // 初始化日志系统
    await logger.initialize();
    
    // 初始化演示插件
    initializeDemoPlugin();
    
    // 记录性能指标
    setTimeout(() => {
      logger.logPerformanceMetrics();
    }, 2000);
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}, 500);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
