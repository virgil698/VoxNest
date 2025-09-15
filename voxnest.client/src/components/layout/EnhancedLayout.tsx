/**
 * VoxNest 增强布局组件
 * 集成扩展框架的槽位系统，保持原有样式
 */

import React, { useEffect, Suspense, useState } from 'react';
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Button, Space, Spin, Input } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  LoginOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { ConditionalSlot, Slot } from '../../extensions';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = AntdLayout;

export const EnhancedLayout: React.FC = () => {
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

  // TODO: 在新的框架中实现路由集成
  // useEffect(() => {
  //   if (framework) {
  //     framework.setRouter();
  //   }
  // }, [framework]);

  // 主导航菜单项
  const mainMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
  ];

  // 动态生成用户下拉菜单（根据角色显示不同选项）
  const getUserMenuItems = (): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
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
    ];

    // 如果是管理员，添加管理面板选项
    if (user?.roles?.includes('Admin')) {
      baseItems.push({
        key: '/admin',
        icon: <SettingOutlined />,
        label: '管理面板',
      });
    }

    // 添加分隔线和退出登录
    baseItems.push(
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
      }
    );

    return baseItems;
  };

  // 处理主菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/');
    } else if (key === '/admin') {
      navigate('/admin');
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
      <Header className="voxnest-mobile-header" style={{ 
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
        <div className="voxnest-header-left" style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
          {/* Header Left Slot - 可以用于扩展Logo区域 */}
          <ConditionalSlot
            id="header.left"
            className="voxnest-header-slot-left"
          />
          
          <div 
            className="voxnest-logo"
            style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              marginRight: '48px',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            onClick={() => navigate('/')}
          >
            VoxNest
          </div>
          <Menu
            className="voxnest-header-menu"
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
        <div className="voxnest-header-search" style={{ 
          flex: '1 1 auto', 
          maxWidth: '400px', 
          minWidth: '120px', 
          display: 'flex',
          justifyContent: 'center'
        }}>
          {/* Header Center Slot - 可以替换搜索框 */}
          <ConditionalSlot
            id="header.center"
            fallback={
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
                    size="small"
                  />
                }
              />
            }
            style={{ width: '100%' }}
          />
        </div>

        {/* 右侧操作区 */}
        <Space className="voxnest-header-actions" size="middle">
          {/* Header Right Slot - 可以添加额外的按钮 */}
          <ConditionalSlot id="header.right" />
          
          {/* 用户已登录时显示发帖按钮和用户信息 */}
          {isAuthenticated && user ? (
            <>
              {/* 发帖按钮 */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePost}
                className="voxnest-create-post-btn"
              >
                <span className="voxnest-btn-text">发帖</span>
              </Button>
              
              {/* 用户导航扩展槽位 */}
              <ConditionalSlot id="nav.user" />

              {/* 用户信息下拉菜单 */}
              <Dropdown
                menu={{
                  items: getUserMenuItems(),
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                className="voxnest-user-dropdown"
              >
                      <Space style={{ cursor: 'pointer' }}>
                        <Avatar
                          src={user.avatar}
                          icon={<UserOutlined />}
                          size="default"
                        />
                        <span className="voxnest-username">{user.displayName || user.username}</span>
                      </Space>
                    </Dropdown>
            </>
          ) : (
            /* 用户未登录时显示注册和登录按钮 */
            <>
              <Button 
                onClick={() => navigate('/auth/register')}
                className="voxnest-register-btn"
              >
                <span className="voxnest-btn-text">注册</span>
              </Button>
              <Button 
                type="primary"
                icon={<LoginOutlined />}
                onClick={handleLogin}
                className="voxnest-login-btn"
              >
                <span className="voxnest-btn-text">登录</span>
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content className="voxnest-main-content" style={{ padding: '32px 24px', background: 'transparent' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          minHeight: 'calc(100vh - 160px)',
          width: '100%',
          overflowX: 'hidden'
        }}>
          {/* Content Before Slot - 在主内容之前显示 */}
          <ConditionalSlot id="content.before" />
          
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
          
          {/* Content After Slot - 在主内容之后显示 */}
          <ConditionalSlot id="content.after" />
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
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Footer Left Slot */}
          <ConditionalSlot id="footer.left" />
          
          {/* Footer Center - 默认内容或槽位 */}
          <ConditionalSlot
            id="footer.center"
            fallback="VoxNest ©2024 - 下一代论坛交流平台 | 分享知识，交流思想"
          />
          
          {/* Footer Right Slot */}
          <ConditionalSlot id="footer.right" />
        </div>
      </Footer>
      
      {/* 全局覆盖层 - 用于模态框、通知、Cookie横幅等 */}
      <Slot id="overlay.root" wrapper={false} />
    </AntdLayout>
  );
};
