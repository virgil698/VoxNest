import React, { useEffect, useState } from 'react';
import { Spin, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { InstallApi } from '../api/install';
import type { InstallStatusDto } from '../api/install';

interface InstallGuardProps {
  children: React.ReactNode;
}

/**
 * 安装守卫组件
 * 检查系统是否已安装，未安装时自动跳转到安装页面
 */
const InstallGuard: React.FC<InstallGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [installStatus, setInstallStatus] = useState<InstallStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果当前已经在安装页面，不需要检查
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/install')) {
      setLoading(false);
      return;
    }
    
    checkInstallStatus();
  }, []);

  const checkInstallStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await InstallApi.getInstallStatus();
      setInstallStatus(status);
      
      // 如果未安装，跳转到安装页面
      if (!status.isInstalled) {
        console.log('系统未安装，跳转到安装页面');
        window.location.href = '/install';
        return;
      }
      
    } catch (error) {
      console.error('检查安装状态失败:', error);
      
      // 如果是网络错误或API不可用，可能是后端未启动或处于安装模式
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network')) {
          console.log('后端可能处于安装模式，跳转到安装页面');
          window.location.href = '/install';
          return;
        }
      }
      
      setError('无法检查系统安装状态，请检查网络连接或联系管理员');
    } finally {
      setLoading(false);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: 'white' }} spin />} 
          size="large"
        />
        <div style={{ 
          marginTop: 24, 
          color: 'white', 
          fontSize: 18,
          textAlign: 'center'
        }}>
          <div>正在检查系统状态...</div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
            请稍候，系统正在初始化
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ maxWidth: 500, padding: 40 }}>
          <Result
            status="error"
            title="系统检查失败"
            subTitle={error}
            extra={
              <button
                onClick={checkInstallStatus}
                style={{
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                重试
              </button>
            }
          />
        </div>
      </div>
    );
  }

  // 如果当前在安装页面，或者已安装，显示子组件
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/install') || (installStatus && installStatus.isInstalled)) {
    return <>{children}</>;
  }

  // 其他情况不应该到达这里，但为了安全起见返回子组件
  return <>{children}</>;
};

export default InstallGuard;
