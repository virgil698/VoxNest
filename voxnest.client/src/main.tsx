import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { router } from './router'
import InstallGuard from './components/InstallGuard'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={whiteTheme}>
      <InstallGuard>
        <RouterProvider router={router} />
      </InstallGuard>
    </ConfigProvider>
  </StrictMode>,
)
