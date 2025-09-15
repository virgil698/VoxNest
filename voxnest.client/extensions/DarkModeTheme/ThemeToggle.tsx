/**
 * 主题切换器组件
 * 提供直观的明暗模式切换界面
 */

/* eslint-disable react-refresh/only-export-components */

import { useState, useEffect } from 'react';
import { Button, Dropdown, Space, Typography, Tooltip, Switch } from 'antd';
import { 
  SunOutlined, 
  MoonOutlined, 
  SettingOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { themeManager, type ThemeMode, type ThemeChangeEvent } from './ThemeManager.ts';
import { ThemeCustomizer } from './ThemeCustomizer.tsx';

const { Text } = Typography;

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  showLabel?: boolean;
  type?: 'button' | 'switch' | 'dropdown';
  position?: 'header' | 'sidebar' | 'floating' | 'inline';
  showCustomizer?: boolean;
}

export function ThemeToggle({
  size = 'middle',
  showLabel = false,
  type = 'button',
  position = 'inline',
  showCustomizer = true
}: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [currentMode, setCurrentMode] = useState<ThemeMode>('auto');
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);

  useEffect(() => {
    // 初始化状态
    setCurrentTheme(themeManager.getCurrentTheme());
    setCurrentMode(themeManager.getMode());

    // 监听主题变化
    const handleThemeChange = (event: ThemeChangeEvent) => {
      setCurrentTheme(event.currentTheme);
    };

    themeManager.addEventListener(handleThemeChange);

    return () => {
      themeManager.removeEventListener(handleThemeChange);
    };
  }, []);

  const handleToggle = () => {
    themeManager.toggleTheme('user');
  };

  const handleModeChange = (mode: ThemeMode) => {
    themeManager.setMode(mode);
    setCurrentMode(mode);
  };

  const handleShowCustomizer = () => {
    setShowCustomizerModal(true);
  };

  const getThemeIcon = (theme: 'light' | 'dark', animated = false) => {
    const iconProps = {
      style: animated ? {
        transition: 'all 0.3s ease',
        transform: currentTheme === theme ? 'scale(1.1)' : 'scale(1)'
      } : {}
    };

    return theme === 'light' ? 
      <SunOutlined {...iconProps} /> : 
      <MoonOutlined {...iconProps} />;
  };

  const getModeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      case 'auto':
        return <ThunderboltOutlined />;
      default:
        return <BulbOutlined />;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'floating':
        return {
          position: 'fixed' as const,
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        };
      case 'header':
        return {
          marginLeft: '8px',
        };
      case 'sidebar':
        return {
          width: '100%',
          marginBottom: '8px',
        };
      default:
        return {};
    }
  };

  // 开关类型组件
  if (type === 'switch') {
    return (
      <div style={getPositionStyles()}>
        <Space align="center">
          {showLabel && (
            <Text style={{ fontSize: size === 'small' ? '12px' : '14px' }}>
              {currentTheme === 'light' ? '浅色模式' : '深色模式'}
            </Text>
          )}
          <Switch
            checked={currentTheme === 'dark'}
            onChange={handleToggle}
            size={size === 'large' || size === 'middle' ? 'default' : size}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </Space>
      </div>
    );
  }

  // 下拉菜单类型组件
  if (type === 'dropdown') {
    const dropdownItems = [
      {
        key: 'light',
        label: (
          <Space>
            <SunOutlined />
            <span>浅色模式</span>
            {currentMode === 'light' && <Text type="success">✓</Text>}
          </Space>
        ),
        onClick: () => handleModeChange('light')
      },
      {
        key: 'dark',
        label: (
          <Space>
            <MoonOutlined />
            <span>深色模式</span>
            {currentMode === 'dark' && <Text type="success">✓</Text>}
          </Space>
        ),
        onClick: () => handleModeChange('dark')
      },
      {
        key: 'auto',
        label: (
          <Space>
            <ThunderboltOutlined />
            <span>跟随系统</span>
            {currentMode === 'auto' && <Text type="success">✓</Text>}
          </Space>
        ),
        onClick: () => handleModeChange('auto')
      },
      { type: 'divider' as const },
      ...(showCustomizer ? [{
        key: 'customize',
        label: (
          <Space>
            <SettingOutlined />
            <span>主题设置</span>
          </Space>
        ),
        onClick: handleShowCustomizer
      }] : [])
    ];

    return (
      <div style={getPositionStyles()}>
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            icon={getModeIcon(currentMode)}
            size={size}
            type="text"
            className="theme-toggle-dropdown"
          >
            {showLabel && (
              <span style={{ marginLeft: '4px' }}>
                {currentMode === 'light' ? '浅色' : 
                 currentMode === 'dark' ? '深色' : '自动'}
              </span>
            )}
          </Button>
        </Dropdown>
        
        {showCustomizer && (
          <ThemeCustomizer
            visible={showCustomizerModal}
            onClose={() => setShowCustomizerModal(false)}
          />
        )}
      </div>
    );
  }

  // 按钮类型组件（默认）
  return (
    <div style={getPositionStyles()}>
      <Space>
        <Tooltip title={`切换到${currentTheme === 'light' ? '深色' : '浅色'}模式`}>
          <Button
            icon={getThemeIcon(currentTheme === 'light' ? 'dark' : 'light', true)}
            onClick={handleToggle}
            size={size}
            type={position === 'floating' ? 'primary' : 'text'}
            shape={position === 'floating' ? 'circle' : 'default'}
            className="theme-toggle-button"
            style={{
              ...(position === 'floating' && {
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              })
            }}
          >
            {showLabel && position !== 'floating' && (
              <span style={{ marginLeft: '4px' }}>
                {currentTheme === 'light' ? '深色模式' : '浅色模式'}
              </span>
            )}
          </Button>
        </Tooltip>
        
        {showCustomizer && position !== 'floating' && (
          <Tooltip title="主题设置">
            <Button
              icon={<SettingOutlined />}
              onClick={handleShowCustomizer}
              size={size}
              type="text"
            />
          </Tooltip>
        )}
      </Space>
      
      {showCustomizer && (
        <ThemeCustomizer
          visible={showCustomizerModal}
          onClose={() => setShowCustomizerModal(false)}
        />
      )}
    </div>
  );
}

// 主题状态指示器组件
export function ThemeStatusIndicator() {
  const [status, setStatus] = useState(themeManager.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(themeManager.getStatus());
    };

    const handleThemeChange = () => {
      updateStatus();
    };

    themeManager.addEventListener(handleThemeChange);
    
    // 定期更新状态（用于定时器）
    const interval = setInterval(updateStatus, 60000);

    return () => {
      themeManager.removeEventListener(handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="theme-status-indicator">
      <Space direction="vertical" size="small">
        <Space align="center">
          <Text strong>当前主题:</Text>
          <Space>
            {status.currentTheme === 'light' ? <SunOutlined /> : <MoonOutlined />}
            <Text>{status.currentTheme === 'light' ? '浅色模式' : '深色模式'}</Text>
          </Space>
        </Space>
        
        <Space align="center">
          <Text strong>模式:</Text>
          <Space>
            {status.mode === 'light' ? <SunOutlined /> : 
             status.mode === 'dark' ? <MoonOutlined /> : <ThunderboltOutlined />}
            <Text>
              {status.mode === 'light' ? '浅色' : 
               status.mode === 'dark' ? '深色' : '跟随系统'}
            </Text>
          </Space>
        </Space>
        
        {status.mode === 'auto' && (
          <Space align="center">
            <EyeOutlined />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              系统偏好: {status.systemTheme === 'light' ? '浅色' : '深色'}
            </Text>
          </Space>
        )}
        
        {status.isSchedulerActive && status.nextScheduledChange && (
          <Space align="center">
            <ClockCircleOutlined />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              下次切换: {status.nextScheduledChange}
            </Text>
          </Space>
        )}
      </Space>
    </div>
  );
}

// 扩展注册函数
export function initializeThemeToggle(framework: {
  slots: {
    register: (slotId: string, registration: unknown) => void;
    injectStyle: (injection: unknown) => void;
  };
}) {
  console.log('🎨 Initializing Theme Toggle Extension...');

  // 注册主题切换器到导航区域
  framework.slots.register('nav.user', {
    component: () => (
      <ThemeToggle
        type="dropdown"
        showCustomizer={true}
        position="header"
      />
    ),
    source: 'dark-mode-theme',
    name: '主题切换器',
    priority: 800,
    props: {}
  });

  // 注册浮动切换按钮（可选）
  framework.slots.register('overlay.root', {
    component: () => (
      <ThemeToggle
        type="button"
        position="floating"
        showCustomizer={false}
      />
    ),
    source: 'dark-mode-theme',
    name: '浮动主题切换',
    priority: 100,
    condition: () => {
      // 只在特定页面显示浮动按钮
      return window.location.pathname.startsWith('/admin');
    }
  });

  // 注册主题状态指示器到设置页面
  framework.slots.register('admin.sidebar', {
    component: ThemeStatusIndicator,
    source: 'dark-mode-theme',
    name: '主题状态',
    priority: 200,
    condition: () => {
      return window.location.pathname.includes('/settings');
    }
  });

  // 注入主题切换器样式
  framework.slots.injectStyle({
    id: 'theme-toggle-styles',
    source: 'dark-mode-theme',
    content: `
      .theme-toggle-button {
        transition: all 0.3s ease;
      }
      
      .theme-toggle-button:hover {
        transform: scale(1.05);
      }
      
      .theme-toggle-dropdown .anticon {
        transition: all 0.3s ease;
      }
      
      .theme-status-indicator {
        padding: 12px;
        background: var(--voxnest-color-surface);
        border-radius: 8px;
        border: 1px solid var(--voxnest-color-border);
        margin-bottom: 16px;
      }
      
      @media (max-width: 768px) {
        .theme-toggle-button[data-position="floating"] {
          bottom: 80px !important;
          right: 16px !important;
          width: 44px !important;
          height: 44px !important;
        }
      }
    `
  });

  // 设置全局主题管理器
  (window as unknown as { VoxNestTheme: typeof themeManager }).VoxNestTheme = themeManager;

  console.log('✅ Theme Toggle Extension initialized successfully');
}

export default initializeThemeToggle;
