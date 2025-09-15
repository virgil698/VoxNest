/**
 * Cookie 同意横幅扩展集成
 * 集成配置管理系统，支持动态配置
 */

/* eslint-disable react-refresh/only-export-components */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Space, Typography, Card, message } from 'antd';
import { SettingOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { cookieManager, type CookiePreferences } from './cookieManager.ts';
import { CookieSettings } from './CookieSettings.tsx';
import type { IntegrationContext } from '../../src/extensions/core/types';
import { createConfigManager, type ExtensionConfigManager } from '../../src/extensions/core/ConfigManager';

const { Text, Link } = Typography;

interface CookieConsentConfig {
  position: string;
  theme: string;
  showDetailsLink: boolean;
  showRejectAll: boolean;
  showAcceptAll: boolean;
  autoAcceptDelay: number;
  companyName: string;
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  essential: {
    enabled: boolean;
    required: boolean;
  };
  analytics: {
    enabled: boolean;
    required: boolean;
    providers: string[];
  };
  marketing: {
    enabled: boolean;
    required: boolean;
    providers: string[];
  };
  functional: {
    enabled: boolean;
    required: boolean;
    providers: string[];
  };
}

interface CookieConsentIntegrationProps {
  configManager: ExtensionConfigManager;
}

function CookieConsentComponent({ configManager }: CookieConsentIntegrationProps) {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [config, setConfig] = useState<CookieConsentConfig | null>(null);
  const [autoAcceptTimer, setAutoAcceptTimer] = useState<NodeJS.Timeout | null>(null);

  // 加载配置
  useEffect(() => {
    const loadedConfig = configManager.getConfig<CookieConsentConfig>();
    if (loadedConfig) {
      setConfig(loadedConfig);
    }

    // 监听配置变化
    const unsubscribe = configManager.onConfigChange((newConfig) => {
      setConfig(newConfig as unknown as CookieConsentConfig);
    });

    return unsubscribe;
  }, [configManager]);

  // 定义回调函数 - 需要在使用前定义
  const handleAcceptAll = useCallback(() => {
    if (!config) return;
    
    const allPreferences = {
      essential: config.essential.enabled,
      analytics: config.analytics.enabled,
      marketing: config.marketing.enabled,
      functional: config.functional.enabled
    };

    cookieManager.savePreferences(allPreferences);
    setVisible(false);
    setPreferences(cookieManager.getPreferences());
    
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer);
      setAutoAcceptTimer(null);
    }
  }, [config, autoAcceptTimer]);

  useEffect(() => {
    // 检查是否需要显示同意横幅
    const hasConsent = cookieManager.hasConsent();
    setVisible(!hasConsent);
    
    if (hasConsent) {
      setPreferences(cookieManager.getPreferences());
    } else if (config?.autoAcceptDelay && config.autoAcceptDelay > 0) {
      // 设置自动接受定时器
      const timer = setTimeout(() => {
        handleAcceptAll();
        message.info(`已自动接受 Cookie 设置`);
      }, config.autoAcceptDelay * 1000);
      
      setAutoAcceptTimer(timer);
    }

    // 监听同意状态变化
    const handleConsentChange = () => {
      setVisible(!cookieManager.hasConsent());
      setPreferences(cookieManager.getPreferences());
      
      // 清除自动接受定时器
      if (autoAcceptTimer) {
        clearTimeout(autoAcceptTimer);
        setAutoAcceptTimer(null);
      }
    };

    cookieManager.addEventListener(handleConsentChange);

    return () => {
      cookieManager.removeEventListener(handleConsentChange);
      if (autoAcceptTimer) {
        clearTimeout(autoAcceptTimer);
      }
    };
  }, [config, autoAcceptTimer, handleAcceptAll]);

  if (!config || !visible) {
    return null;
  }

  const handleRejectAll = () => {
    const minimalPreferences = {
      essential: true, // 必要 Cookie 不能拒绝
      analytics: false,
      marketing: false,
      functional: false
    };

    cookieManager.savePreferences(minimalPreferences);
    setVisible(false);
    setPreferences(cookieManager.getPreferences());
    
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer);
      setAutoAcceptTimer(null);
    }
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleSettingsSave = (newPreferences: Partial<CookiePreferences>) => {
    cookieManager.savePreferences(newPreferences);
    setPreferences(cookieManager.getPreferences());
    setShowSettings(false);
    setVisible(false);
    
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer);
      setAutoAcceptTimer(null);
    }
  };

  const getPositionStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    };

    switch (config.position) {
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px', right: 'auto' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '20px', right: '20px', left: 'auto' };
      case 'top-center':
        return { ...baseStyle, top: '20px', left: '50%', transform: 'translateX(-50%)' };
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px', right: 'auto' };
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px', left: 'auto' };
      case 'left-float':
        return { ...baseStyle, left: '20px', top: '50%', transform: 'translateY(-50%)', maxWidth: '300px' };
      case 'right-float':
        return { ...baseStyle, right: '20px', top: '50%', transform: 'translateY(-50%)', maxWidth: '300px' };
      case 'bottom-center':
      default:
        return { ...baseStyle, bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const isDarkTheme = config.theme === 'dark' || 
    (config.theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <>
      <Card
        style={getPositionStyle()}
        className={`cookie-consent-banner ${isDarkTheme ? 'dark' : 'light'}`}
        size="small"
      >
        <div style={{ marginBottom: '12px' }}>
          <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
            🍪 我们重视您的隐私
          </Text>
          <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {config.companyName} 使用 Cookie 来改善您的浏览体验并提供个性化内容。
            我们需要您的同意来使用某些 Cookie。
            {config.privacyPolicyUrl && (
              <>
                {' '}请查看我们的{' '}
                <Link href={config.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
                  隐私政策
                </Link>
              </>
            )}
            {config.cookiePolicyUrl && (
              <>
                {' '}和{' '}
                <Link href={config.cookiePolicyUrl} target="_blank" rel="noopener noreferrer">
                  Cookie 政策
                </Link>
              </>
            )}
            了解更多信息。
          </Text>
        </div>

        {config.autoAcceptDelay > 0 && (
          <Text type="warning" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
            ⏰ 将在 {config.autoAcceptDelay} 秒后自动接受所有 Cookie
          </Text>
        )}

        <Space wrap>
          {config.showAcceptAll && (
            <Button 
              type="primary" 
              icon={<CheckOutlined />} 
              onClick={handleAcceptAll}
            >
              接受全部
            </Button>
          )}
          
          {config.showRejectAll && (
            <Button 
              icon={<CloseOutlined />} 
              onClick={handleRejectAll}
            >
              拒绝全部
            </Button>
          )}
          
          {config.showDetailsLink && (
            <Button 
              type="link" 
              icon={<SettingOutlined />} 
              onClick={handleShowSettings}
            >
              管理设置
            </Button>
          )}
        </Space>
      </Card>

      {showSettings && (
        <CookieSettings
          visible={showSettings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          currentPreferences={preferences}
        />
      )}
    </>
  );
}

// 扩展集成定义
export const CookieConsentIntegration = {
  name: 'cookie-consent',
  hooks: {
    'framework:ready': async (context: IntegrationContext) => {
      const { logger, slots } = context;
      
      // 从 manifest 加载默认配置
      const defaultConfig = {
        position: 'bottom-center',
        theme: 'light',
        showDetailsLink: true,
        autoAcceptDelay: 0,
        showRejectAll: true,
        showAcceptAll: true,
        companyName: 'VoxNest',
        privacyPolicyUrl: '/privacy',
        cookiePolicyUrl: '/cookies',
        essential: {
          enabled: true,
          required: true
        },
        analytics: {
          enabled: true,
          required: false,
          providers: ['google-analytics', 'matomo']
        },
        marketing: {
          enabled: true,
          required: false,
          providers: ['facebook-pixel', 'google-ads']
        },
        functional: {
          enabled: true,
          required: false,
          providers: ['youtube', 'maps']
        }
      };

      // 创建配置管理器
      const configManager = createConfigManager('cookie-consent', defaultConfig, logger);
      
      // 注册到 overlay 槽位
      slots.register('overlay.root', {
        component: () => React.createElement(CookieConsentComponent, { configManager }),
        source: 'cookie-consent',
        priority: 100
      });

      logger.info('Cookie Consent integration initialized with config management');
    },

    'app:destroy': async (context: IntegrationContext) => {
      const { logger, slots } = context;
      
      // 清理注册的组件
      slots.unregisterBySource('cookie-consent');
      
      logger.info('Cookie Consent integration cleaned up');
    }
  }
};
