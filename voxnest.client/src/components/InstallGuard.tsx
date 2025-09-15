import React, { useEffect, useState } from 'react';
import { Button, Result } from 'antd';
import { InstallApi } from '../api/install';
import type { InstallStatusDto } from '../api/install';
import { installLockManager } from '../utils/installLock';
import SimpleLoading from './common/SimpleLoading';

interface NetworkError {
  code?: string;
  response?: {
    status?: number;
  };
  status?: number;
  message?: string;
}

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
      
      console.log('🔍 开始检查系统安装状态...');
      
      // 检查后端安装状态 - 简化逻辑，直接检查后端
      console.log('🌐 请求后端安装状态...');
      const status = await InstallApi.getInstallStatus();
      console.log('📊 后端安装状态:', status);
      
      setInstallStatus(status);
      
      // 根据安装状态决定操作
      if (status.isInstalled) {
        console.log('✅ 系统已完全安装');
        // 创建或更新前端安装锁
        installLockManager.createInstallLock();
        // 缓存状态
        installLockManager.cacheInstallStatus(status);
      } else {
        console.log('❌ 系统未安装，当前步骤:', status.currentStep);
        console.log('🔄 跳转到安装页面...');
        
        // 清除可能存在的过期缓存
        installLockManager.removeInstallLock();
        
        // 跳转到安装页面
        window.location.href = '/install';
        return;
      }
      
    } catch (error) {
      console.error('💥 检查安装状态失败:', error);
      
      // 检查是否是网络问题或后端未启动
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('fetch') || 
                            errorMessage.includes('Network') || 
                            errorMessage.includes('Failed to fetch') ||
                            errorMessage.includes('ERR_CONNECTION') ||
                            (error as NetworkError)?.code === 'NETWORK_ERROR';
      
      if (isNetworkError) {
        console.log('🌐 检测到网络错误，可能是后端未启动，跳转到安装页面');
        window.location.href = '/install';
        return;
      }
      
      // 如果是API错误（404, 500等），也跳转到安装页面
      const statusCode = (error as NetworkError)?.response?.status || (error as NetworkError)?.status;
      if (statusCode) {
        console.log(`🔧 API返回状态码 ${statusCode}，跳转到安装页面`);
        window.location.href = '/install';
        return;
      }
      
      // 其他未知错误
      console.error('🚨 未知错误类型:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setError('无法检查系统安装状态，请检查网络连接或联系管理员。如果问题持续存在，请尝试手动访问 /install 页面。');
    } finally {
      setLoading(false);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <SimpleLoading 
        background="white"
        size="medium"
        showLogo={true}
        loadingType="dots"
      />
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '500px',
          width: '100%',
          padding: '48px 32px',
          animation: 'errorSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}>
          <Result
            status="error"
            title={<span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>系统检查失败</span>}
            subTitle={<span style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{error}</span>}
            extra={
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  onClick={checkInstallStatus}
                  size="large"
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.currentTarget as HTMLElement).style.animation = 'errorShake 0.3s ease-in-out';
                  }}
                  onAnimationEnd={(e: React.AnimationEvent<HTMLButtonElement>) => {
                    (e.currentTarget as HTMLElement).style.animation = '';
                  }}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)',
                    padding: '0 32px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  重新检查
                </Button>
                <Button
                  onClick={() => window.location.href = '/install'}
                  size="large"
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: '0 32px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  前往安装页面
                </Button>
              </div>
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

// 添加错误状态的动画样式
const errorAnimationStyles = `
  @keyframes errorSlideIn {
    0% {
      opacity: 0;
      transform: translateY(40px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

// 将样式注入到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = errorAnimationStyles;
  if (!document.head.querySelector('[data-error-animations]')) {
    styleElement.setAttribute('data-error-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

export default InstallGuard;
