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
  SettingOutlined,
  AppstoreOutlined,
  FilterOutlined,
  ClockCircleOutlined
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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // 页面加载时检查认证状态
  useEffect(() => {
    if (token && !user && !isAuthenticated) {
      getCurrentUser();
    }
  }, [token, user, isAuthenticated, getCurrentUser]);

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('voxnest-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(Array.isArray(history) ? history.slice(0, 5) : []); // 最多保存5条
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  // 保存搜索记录
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('voxnest-search-history', JSON.stringify(newHistory));
  };

  // 获取当前页面位置信息
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return '首页';
    if (path.startsWith('/tags')) return '分类';
    if (path.startsWith('/posts')) return '帖子';
    if (path.startsWith('/user')) return '用户';
    if (path.startsWith('/admin')) return '管理';
    if (path.startsWith('/search')) return '搜索';
    return '全站';
  };

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
    {
      key: '/tags',
      icon: <AppstoreOutlined />,
      label: '类别',
    },
  ];

  // 动态生成用户下拉菜单（根据角色显示不同选项）
  const getUserMenuItems = (): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: user ? `/user/${user.id}` : '/user/profile',
        icon: <UserOutlined />,
        label: '个人资料',
      },
      {
        key: '/user/posts',
        icon: <FileTextOutlined />,
        label: '我的帖子',
      },
      {
        key: '/user/preferences',
        icon: <SettingOutlined />,
        label: '偏好设置',
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
      saveSearchHistory(value.trim());
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setSearchValue(''); // 清空搜索框
      setSearchDropdownOpen(false); // 关闭下拉菜单
    }
  };

  // 跳转到搜索页面（筛选按钮）
  const handleGoToSearchPage = () => {
    navigate('/search');
    setSearchDropdownOpen(false);
  };


  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    
    // 如果是标签相关页面（/tags 或 /tags/xxx），激活分类菜单项
    if (pathname === '/tags' || pathname.startsWith('/tags/')) {
      return ['/tags'];
    }
    
    // 其他页面使用精确匹配
    return [pathname];
  };
  
  const selectedKeys = getSelectedKeys();

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
        gap: '0'
      }}>
        {/* Logo和主导航 */}
        <div className="voxnest-header-left" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: '1 1 0',
          minWidth: '0',
          justifyContent: 'flex-start'
        }}>
          {/* Header Left Slot - 可以用于扩展Logo区域 */}
          <ConditionalSlot
            id="header.left"
            className="voxnest-header-slot-left"
          />
          
          <div 
            className="voxnest-logo voxnest-logo-gradient"
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
          flex: '1 1 0',
          maxWidth: '800px', 
          minWidth: '320px', 
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          {/* Header Center Slot - 可以替换搜索框 */}
          <ConditionalSlot
            id="header.center"
            fallback={
              <div className="voxnest-search-container">
                <SearchOutlined 
                  className="voxnest-search-icon"
                  onClick={() => handleSearch(searchValue)}
                />
                <Input
                  placeholder="搜索话题、内容或用户..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={() => handleSearch(searchValue)}
                  onFocus={() => setSearchDropdownOpen(true)}
                  onBlur={() => {
                    // 延迟关闭，允许点击下拉选项
                    setTimeout(() => setSearchDropdownOpen(false), 200);
                  }}
                  className="voxnest-search-box"
                  style={{ width: '100%' }}
                />
                <FilterOutlined 
                  className="voxnest-search-filter"
                  onClick={handleGoToSearchPage}
                  title="高级搜索"
                />
                
                {searchDropdownOpen && (
                  <div className="voxnest-search-dropdown">
                    {/* 位置信息 */}
                    <div className="voxnest-search-dropdown-item voxnest-search-dropdown-disabled voxnest-location-info">
                      <SearchOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                      位置
                      <span className="voxnest-location-badge">
                        {getCurrentPageInfo()}
                      </span>
                    </div>
                    
                    {/* 搜索历史 */}
                    {searchHistory.length > 0 ? (
                      <>
                        <div className="voxnest-search-dropdown-item voxnest-search-dropdown-disabled">
                          <div className="voxnest-search-history-title">
                            最近的搜索
                          </div>
                        </div>
                        {searchHistory.map((item, index) => (
                          <div 
                            key={index}
                            className="voxnest-search-dropdown-item"
                            onClick={() => handleSearch(item)}
                          >
                            <div className="voxnest-search-history-item">
                              <ClockCircleOutlined className="voxnest-search-history-icon" />
                              <span>{item}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="voxnest-search-dropdown-item voxnest-search-dropdown-disabled">
                        <div className="voxnest-no-history">
                          暂无搜索记录
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            }
            style={{ width: '100%' }}
          />
        </div>

        {/* 右侧操作区 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: '1 1 0',
          minWidth: '0',
          justifyContent: 'flex-end'
        }}>
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
        </div>
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
