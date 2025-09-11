import React, { useEffect, useState } from 'react';
import { Button, Result } from 'antd';
import { InstallApi } from '../api/install';
import type { InstallStatusDto } from '../api/install';
import { installLockManager } from '../utils/installLock';
import SimpleLoading from './common/SimpleLoading';

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
      
      // 首先检查前端本地的安装锁
      console.log('🔍 检查前端安装锁文件...');
      if (installLockManager.hasInstallLock()) {
        const lockData = installLockManager.getInstallLock();
        console.log('✅ 发现本地安装锁，系统已安装:', lockData);
        
        // 验证安装锁是否有效
        const validation = await installLockManager.validateInstallation();
        if (validation.isValid && !validation.shouldRecheck) {
          console.log('✅ 安装锁验证通过，跳过后端检查');
          setInstallStatus({ 
            isInstalled: true, 
            currentStep: 3, // InstallStep.Completed
            configExists: true,
            databaseConnected: true,
            databaseInitialized: true,
            hasAdminUser: true
          });
          setLoading(false);
          return;
        }
        
        console.log('⚠️ 安装锁需要重新验证，检查后端状态');
      } else {
        console.log('❌ 未发现本地安装锁，检查后端安装状态');
      }
      
      // 尝试从缓存获取状态
      const cachedStatus = installLockManager.getCachedInstallStatus();
      if (cachedStatus && cachedStatus.isInstalled) {
        console.log('📋 使用缓存的安装状态');
        setInstallStatus(cachedStatus);
        setLoading(false);
        return;
      }
      
      // 检查后端安装状态
      console.log('🌐 请求后端安装状态...');
      const status = await InstallApi.getInstallStatus();
      setInstallStatus(status);
      
      // 缓存后端状态
      installLockManager.cacheInstallStatus(status);
      
      // 如果后端已安装，创建前端安装锁
      if (status.isInstalled) {
        console.log('✅ 后端已安装，创建前端安装锁');
        installLockManager.createInstallLock();
      } else {
        console.log('❌ 系统未安装，跳转到安装页面');
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
              <Button
                type="primary"
                onClick={checkInstallStatus}
                size="large"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.animation = 'errorShake 0.3s ease-in-out';
                }}
                onAnimationEnd={(e) => {
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
