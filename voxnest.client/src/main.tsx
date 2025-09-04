import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { router } from './router'
import InstallGuard from './components/InstallGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <InstallGuard>
        <RouterProvider router={router} />
      </InstallGuard>
    </ConfigProvider>
  </StrictMode>,
)
