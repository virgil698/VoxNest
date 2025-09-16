import React, { useState, Suspense } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge, Typography, Spin, Alert } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Slot, ConditionalSlot } from '../../extensions';
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  TagsOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  HomeOutlined,
  ControlOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 错误边界组件
class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdminLayout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <Alert
            message="管理面板加载出错"
            description="请刷新页面重试，如果问题持续存在，请联系技术支持。"
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDeveloperModeAvailable } = useDeveloperMode();

  // 菜单项配置
  const baseMenuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '概览面板',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '站点设置',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/posts',
      icon: <FileTextOutlined />,
      label: '帖子管理',
    },
    {
      key: '/admin/tags',
      icon: <TagsOutlined />,
      label: '标签管理',
    },
    {
      key: '/admin/extensions',
      icon: <AppstoreOutlined />,
      label: '扩展管理',
    },
    {
      key: '/admin/extension-settings',
      icon: <ControlOutlined />,
      label: '扩展设置',
    },
    {
      key: '/admin/logs',
      icon: <FileTextOutlined />,
      label: '日志管理',
    },
  ];

  // 开发者模式菜单项（只有在开发者模式可用时才显示）
  const developerMenuItem = isDeveloperModeAvailable ? {
    key: '/admin/developer',
    icon: <BugOutlined />,
    label: '开发者模式',
  } : null;

  // 组合最终菜单
  const menuItems = [
    ...baseMenuItems,
    ...(developerMenuItem ? [developerMenuItem] : [])
  ];

  // 获取当前选中的菜单项和展开的菜单项
  const getSelectedAndOpenKeys = () => {
    const path = location.pathname;
    
    // 检查一级菜单项
    for (const item of menuItems) {
      // 如果有子菜单，检查子菜单项
      if ('children' in item && Array.isArray(item.children)) {
        for (const child of item.children) {
          if (path === child.key) {
            // 确保父菜单在openKeys中
            if (!openKeys.includes(item.key)) {
              setOpenKeys([...openKeys, item.key]);
            }
            return { 
              selectedKeys: [child.key], 
              openKeys: [...openKeys, item.key] 
            };
          }
        }
      } else {
        // 精确匹配或前缀匹配
        if (path === item.key || (item.key !== '/admin' && path.startsWith(item.key))) {
          return { 
            selectedKeys: [item.key], 
            openKeys: openKeys 
          };
        }
      }
    }
    
    return { 
      selectedKeys: ['/admin'], 
      openKeys: openKeys 
    };
  };

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  // 获取菜单状态
  const menuState = getSelectedAndOpenKeys();
  
  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'logout':
        logout();
        navigate('/auth/login');
        break;
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回首页',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
        theme="light"
      >
        {/* Logo区域 */}
        <div
          style={{
            height: '64px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '16px',
          }}
        >
          {collapsed ? (
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#4F46E5',
              }}
            >
              V
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '2px',
                }}
              >
                VoxNest
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                管理面板
              </Text>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={menuState.selectedKeys}
          openKeys={menuState.openKeys}
          items={menuItems}
          onClick={({ key }: { key: string }) => handleMenuClick(key)}
          onOpenChange={handleOpenChange}
          style={{
            border: 'none',
          }}
        />
      </Sider>

      {/* 主要内容区 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250 }}>
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* 左侧控制区 */}
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
              }}
            />
          </Space>

          {/* 右侧用户区 */}
          <Space size="middle">
            {/* 通知铃铛 */}
            <Badge count={0} showZero={false}>
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            
            {/* 用户导航扩展槽位 */}
            <ConditionalSlot id="nav.user" />

            {/* 用户信息 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }} align="center">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size="default"
                />
                {!collapsed && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    lineHeight: 1.2
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#262626',
                      marginBottom: '2px'
                    }}>
                      {user?.displayName || user?.username || '未知用户'}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      whiteSpace: 'nowrap'
                    }}>
                      {user && user.roles && Array.isArray(user.roles) ? (
                        user.roles.includes('Admin') ? '超级管理员' : 
                        user.roles.includes('Moderator') ? '版主' : 
                        user.roles.length > 0 ? user.roles.join(', ') : '普通用户'
                      ) : '普通用户'}
                    </div>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <AdminErrorBoundary>
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '300px' 
              }}>
                <Spin size="large" tip="加载管理面板..." />
              </div>
            }>
              <Outlet />
            </Suspense>
          </AdminErrorBoundary>
        </Content>
      </Layout>
      
      {/* 全局覆盖层 - 用于模态框、通知、Cookie横幅等 */}
      <Slot id="overlay.root" wrapper={false} />
    </Layout>
  );
};

export default AdminLayout;
