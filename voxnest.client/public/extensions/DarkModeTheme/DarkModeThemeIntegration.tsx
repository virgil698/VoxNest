/**
 * 明暗模式主题扩展集成
 * 集成配置管理系统，支持动态配置的智能主题切换
 */

/* eslint-disable react-refresh/only-export-components */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Dropdown, Space, Tooltip, Switch, FloatButton } from 'antd';
import { 
  SunOutlined, 
  MoonOutlined, 
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { themeManager, type ThemeMode, type ThemeChangeEvent, type ThemeConfig } from './ThemeManager.ts';
import { ThemeCustomizer } from './ThemeCustomizer.tsx';
import type { IntegrationContext } from '../../src/extensions/core/types';
import { createConfigManager, type ExtensionConfigManager } from '../../src/extensions/core/ConfigManager';

// const { Text } = Typography;

interface DarkModeConfig {
  defaultTheme: ThemeMode;
  enableTransitions: boolean;
  transitionDuration: number;
  savePreference: boolean;
  followSystemTheme: boolean;
  showToggleButton: boolean;
  togglePosition: string;
  toggleStyle: 'switch' | 'button' | 'dropdown';
  showCustomizer: boolean;
  enableScheduler: boolean;
  enableKeyboardShortcut: boolean;
  keyboardShortcut: string;
  scheduler: {
    enabled: boolean;
    lightModeStart: string;
    darkModeStart: string;
  };
  customColors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    largerText: boolean;
    focusRing: boolean;
  };
}

interface ThemeToggleComponentProps {
  configManager: ExtensionConfigManager;
  position: string;
}

function ThemeToggleComponent({ configManager, position }: ThemeToggleComponentProps) {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [currentMode, setCurrentMode] = useState<ThemeMode>('auto');
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [config, setConfig] = useState<DarkModeConfig | null>(null);

  // 加载配置
  useEffect(() => {
    const loadedConfig = configManager.getConfig<DarkModeConfig>();
    if (loadedConfig) {
      setConfig(loadedConfig);
      
      // 应用配置到主题管理器
      const themeConfig: Partial<ThemeConfig> = {
        mode: loadedConfig.defaultTheme,
        enableTransitions: loadedConfig.enableTransitions,
        transitionDuration: loadedConfig.transitionDuration,
        savePreference: loadedConfig.savePreference,
        followSystemTheme: loadedConfig.followSystemTheme,
        enableScheduler: loadedConfig.enableScheduler,
        scheduler: loadedConfig.scheduler,
        customColors: loadedConfig.customColors,
        accessibility: loadedConfig.accessibility
      };
      
      themeManager.updateConfig(themeConfig);
    }

    // 监听配置变化
    const unsubscribe = configManager.onConfigChange((newConfig) => {
      const config = newConfig as unknown as DarkModeConfig;
      setConfig(config);
      
      // 应用新配置到主题管理器
      const themeConfig: Partial<ThemeConfig> = {
        mode: config.defaultTheme,
        enableTransitions: config.enableTransitions,
        transitionDuration: config.transitionDuration,
        savePreference: config.savePreference,
        followSystemTheme: config.followSystemTheme,
        enableScheduler: config.enableScheduler,
        scheduler: config.scheduler,
        customColors: config.customColors,
        accessibility: config.accessibility
      };
      
      themeManager.updateConfig(themeConfig);
    });

    return unsubscribe;
  }, [configManager]);

  // 定义回调函数 - 需要在使用前定义
  const handleToggleTheme = useCallback(() => {
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 
                              currentMode === 'dark' ? 'auto' : 'light';
    themeManager.setMode(newMode);
  }, [currentMode]);

  useEffect(() => {
    if (!config) return;

    // 设置键盘快捷键
    if (config.enableKeyboardShortcut) {
      const handleKeyboardShortcut = (event: KeyboardEvent) => {
        const shortcut = config.keyboardShortcut.toLowerCase();
        const keys = shortcut.split('+');
        
        let matches = true;
        if (keys.includes('ctrl') && !event.ctrlKey) matches = false;
        if (keys.includes('shift') && !event.shiftKey) matches = false;
        if (keys.includes('alt') && !event.altKey) matches = false;
        if (keys.includes('meta') && !event.metaKey) matches = false;
        
        const key = keys[keys.length - 1];
        if (event.key.toLowerCase() !== key) matches = false;
        
        if (matches) {
          event.preventDefault();
          handleToggleTheme();
        }
      };

      document.addEventListener('keydown', handleKeyboardShortcut);
      
      return () => {
        document.removeEventListener('keydown', handleKeyboardShortcut);
      };
    }
  }, [config, handleToggleTheme]);

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

  if (!config || !config.showToggleButton) {
    return null;
  }

  const handleModeSelect = (mode: ThemeMode) => {
    themeManager.setMode(mode);
  };

  const getThemeIcon = () => {
    switch (currentMode) {
      case 'light': return <SunOutlined />;
      case 'dark': return <MoonOutlined />;
      case 'auto': return <BulbOutlined />;
      default: return <SunOutlined />;
    }
  };

  const getThemeText = () => {
    switch (currentMode) {
      case 'light': return '浅色';
      case 'dark': return '深色';
      case 'auto': return '自动';
      default: return '浅色';
    }
  };

  const dropdownItems = [
    {
      key: 'light',
      label: (
        <Space>
          <SunOutlined />
          <span>浅色模式</span>
        </Space>
      ),
      onClick: () => handleModeSelect('light')
    },
    {
      key: 'dark',
      label: (
        <Space>
          <MoonOutlined />
          <span>深色模式</span>
        </Space>
      ),
      onClick: () => handleModeSelect('dark')
    },
    {
      key: 'auto',
      label: (
        <Space>
          <BulbOutlined />
          <span>跟随系统</span>
        </Space>
      ),
      onClick: () => handleModeSelect('auto')
    },
    ...(config.showCustomizer ? [{
      key: 'divider',
      type: 'divider' as const
    }, {
      key: 'customize',
      label: (
        <Space>
          <SettingOutlined />
          <span>主题定制</span>
        </Space>
      ),
      onClick: () => setShowCustomizerModal(true)
    }] : [])
  ];

  // 根据位置渲染不同的组件
  const renderToggleButton = () => {
    const commonProps = {
      style: config.togglePosition.includes('float') ? { 
        position: 'fixed' as const,
        ...getFloatingPosition()
      } : undefined
    };

    switch (config.toggleStyle) {
      case 'switch':
        return (
          <Tooltip title={`当前主题: ${getThemeText()}`}>
            <Space {...commonProps}>
              {getThemeIcon()}
              <Switch
                checked={currentTheme === 'dark'}
                onChange={handleToggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </Space>
          </Tooltip>
        );

      case 'dropdown':
        return (
          <Dropdown
            menu={{ items: dropdownItems }}
            placement="bottomLeft"
            arrow
            trigger={['click']}
          >
            <Button icon={getThemeIcon()} {...commonProps}>
              {getThemeText()}
            </Button>
          </Dropdown>
        );

      case 'button':
      default:
        if (config.togglePosition.includes('float')) {
          return (
            <FloatButton
              icon={getThemeIcon()}
              onClick={handleToggleTheme}
              tooltip={`切换到${currentMode === 'light' ? '深色' : currentMode === 'dark' ? '自动' : '浅色'}模式`}
              style={getFloatingPosition()}
            />
          );
        }
        
        return (
          <Tooltip title={`切换到${currentMode === 'light' ? '深色' : currentMode === 'dark' ? '自动' : '浅色'}模式`}>
            <Button
              icon={getThemeIcon()}
              onClick={handleToggleTheme}
              type="text"
              {...commonProps}
            >
              {position !== 'floating' && getThemeText()}
            </Button>
          </Tooltip>
        );
    }
  };

  const getFloatingPosition = (): React.CSSProperties => {
    switch (config.togglePosition) {
      case 'top-left':
        return { top: 20, left: 20 };
      case 'top-right':
        return { top: 20, right: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'bottom-right':
        return { bottom: 20, right: 20 };
      default:
        return { bottom: 24, right: 24 };
    }
  };

  return (
    <>
      {renderToggleButton()}
      
      {config.showCustomizer && (
        <ThemeCustomizer
          visible={showCustomizerModal}
          onClose={() => setShowCustomizerModal(false)}
        />
      )}
    </>
  );
}

// 扩展集成定义
export const DarkModeThemeIntegration = {
  name: 'dark-mode-theme',
  hooks: {
    'framework:ready': async (context: IntegrationContext) => {
      const { logger, slots } = context;
      
      // 默认配置
      const defaultConfig: DarkModeConfig = {
        defaultTheme: 'auto',
        enableTransitions: true,
        transitionDuration: 300,
        savePreference: true,
        followSystemTheme: true,
        showToggleButton: true,
        togglePosition: 'top-right',
        toggleStyle: 'button',
        showCustomizer: true,
        enableScheduler: true,
        enableKeyboardShortcut: true,
        keyboardShortcut: 'ctrl+shift+d',
        scheduler: {
          enabled: false,
          lightModeStart: '06:00',
          darkModeStart: '18:00'
        },
        customColors: {
          light: {
            primary: '#4f46e5',
            secondary: '#7c3aed',
            accent: '#06b6d4',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#1e293b'
          },
          dark: {
            primary: '#6366f1', 
            secondary: '#8b5cf6',
            accent: '#67e8f9',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f1f5f9'
          }
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          largerText: false,
          focusRing: true
        }
      };

      // 创建配置管理器
      const configManager = createConfigManager('dark-mode-theme', defaultConfig as unknown as Record<string, unknown>, logger);
      
      // 根据配置注册到不同的槽位
      const config = configManager.getConfig<DarkModeConfig>() || defaultConfig;
      
      let targetSlot = 'nav.user'; // 默认槽位
      let position = 'inline';
      
      switch (config.togglePosition) {
        case 'nav-user':
          targetSlot = 'nav.user';
          position = 'nav';
          break;
        case 'admin-sidebar':
          targetSlot = 'admin.sidebar';
          position = 'sidebar';
          break;
        case 'top-right':
        case 'top-left':
        case 'bottom-right':
        case 'bottom-left':
          targetSlot = 'overlay.root';
          position = 'floating';
          break;
        default:
          targetSlot = 'nav.user';
          position = 'inline';
      }

      // 注册主题切换器
      slots.register(targetSlot, {
        component: () => React.createElement(ThemeToggleComponent, { configManager, position }),
        source: 'dark-mode-theme',
        priority: 200
      });

      logger.info(`Dark Mode Theme integration initialized with config management (position: ${config.togglePosition})`);
    },

    'app:destroy': async (context: IntegrationContext) => {
      const { logger, slots } = context;
      
      // 清理注册的组件
      slots.unregisterBySource('dark-mode-theme');
      
      // 清理主题管理器
      themeManager.cleanup();
      
      logger.info('Dark Mode Theme integration cleaned up');
    }
  }
};
