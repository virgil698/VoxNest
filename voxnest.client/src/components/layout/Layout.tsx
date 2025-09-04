import React, { useEffect, Suspense } from 'react';
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Button, Space, Spin } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  LoginOutlined,
  FileTextOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = AntdLayout;

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, getCurrentUser, token } = useAuthStore();

  // 页面加载时检查认证状态
  useEffect(() => {
    if (token && !user && !isAuthenticated) {
      getCurrentUser();
    }
  }, [token, user, isAuthenticated, getCurrentUser]);

  // 主导航菜单项
  const mainMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
  ];

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: '/user/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: '/user/posts',
      icon: <FileTextOutlined />,
      label: '我的帖子',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 处理主菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/');
    } else {
      navigate(key);
    }
  };

  // 处理发帖点击
  const handleCreatePost = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    navigate('/posts/create');
  };

  // 处理登录点击
  const handleLogin = () => {
    navigate('/auth/login');
  };

  // 获取当前选中的菜单项
  const selectedKeys = [location.pathname];

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Logo和主导航 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginRight: '32px',
              cursor: 'pointer',
              color: '#1890ff'
            }}
            onClick={() => navigate('/')}
          >
            VoxNest
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={mainMenuItems}
            onClick={handleMenuClick}
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>

        {/* 右侧操作区 */}
        <Space size="middle">
          {/* 用户已登录时显示发帖按钮和用户信息 */}
          {isAuthenticated && user ? (
            <>
              {/* 发帖按钮 */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePost}
              >
                发帖
              </Button>
              
              {/* 用户信息下拉菜单 */}
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={user.avatar} 
                    icon={<UserOutlined />}
                    size="default"
                  />
                  <span>{user.displayName || user.username}</span>
                </Space>
              </Dropdown>
            </>
          ) : (
            /* 用户未登录时显示注册和登录按钮 */
            <>
              <Button onClick={() => navigate('/auth/register')}>
                注册
              </Button>
              <Button 
                type="primary"
                icon={<LoginOutlined />}
                onClick={handleLogin}
              >
                登录
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          minHeight: 'calc(100vh - 140px)'
        }}>
          <Suspense fallback={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '200px' 
            }}>
              <Spin size="large" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0'
      }}>
        VoxNest ©2024 - 下一代CSM网络交流程序
      </Footer>
    </AntdLayout>
  );
};
