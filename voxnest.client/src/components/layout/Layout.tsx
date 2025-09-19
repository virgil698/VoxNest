import React, { useEffect, Suspense, useState } from 'react';
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Button, Space, Spin, Input } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Slot, ConditionalSlot } from '../../extensions';
import { 
  HomeOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  LoginOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = AntdLayout;

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, getCurrentUser, token } = useAuthStore();
  const [searchValue, setSearchValue] = useState('');

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

  // 处理搜索
  const handleSearch = (value: string) => {
    if (value.trim()) {
      // TODO: 实现搜索功能，这里可以导航到搜索结果页面
      console.log('搜索内容:', value);
      // navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  // 获取当前选中的菜单项
  const selectedKeys = [location.pathname];

  return (
    <AntdLayout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        gap: '24px'
      }}>
        {/* Logo和主导航 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
          <div 
            className="voxnest-logo-gradient"
            style={{ 
              fontSize: '24px', 
              marginRight: '48px',
              cursor: 'pointer'
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
            style={{ 
              border: 'none', 
              background: 'transparent',
              fontSize: '15px',
              fontWeight: '500'
            }}
          />
        </div>

        {/* 搜索框 */}
        <div style={{ 
          flex: '1 1 auto', 
          maxWidth: '400px', 
          minWidth: '200px', 
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Input
            placeholder="搜索话题、内容或用户..."
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
            onPressEnter={() => handleSearch(searchValue)}
            className="voxnest-search-box"
            size="middle"
            allowClear
            style={{ width: '100%' }}
            suffix={
              <Button
                type="text" 
                icon={<SearchOutlined />}
                onClick={() => handleSearch(searchValue)}
                className="voxnest-search-button"
                size="middle"
              />
            }
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
              
              {/* 用户导航扩展槽位 */}
              <ConditionalSlot id="nav.user" />
              
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

      <Content style={{ padding: '32px 24px', background: 'transparent' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          minHeight: 'calc(100vh - 160px)'
        }}>
          <Suspense fallback={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px' 
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
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        padding: '20px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          VoxNest ©2024 - 下一代论坛交流平台 | 分享知识，交流思想
        </div>
      </Footer>
      
      {/* 全局覆盖层 - 用于模态框、通知、Cookie横幅等 */}
      <Slot id="overlay.root" wrapper={false} />
    </AntdLayout>
  );
};
