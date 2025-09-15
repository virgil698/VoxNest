import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../stores/authStore';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, token, getCurrentUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // 如果有token但没有用户信息，尝试获取用户信息
    if (token && !isAuthenticated && !isLoading) {
      getCurrentUser();
    }
  }, [token, isAuthenticated, isLoading, getCurrentUser]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 如果有子组件，渲染子组件，否则渲染Outlet（用于路由布局）
  if (children) {
    return <>{children}</>;
  }

  // 用于路由布局的情况
  return <Outlet />;
};
