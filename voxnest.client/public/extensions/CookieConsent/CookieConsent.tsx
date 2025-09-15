/**
 * Cookie 同意横幅组件
 * 符合 GDPR 和 CCPA 规定的 Cookie 同意界面
 */

/* eslint-disable react-refresh/only-export-components */

import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Card } from 'antd';
import { SettingOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { cookieManager, type CookiePreferences } from './cookieManager.ts';
import { CookieSettings } from './CookieSettings.tsx';

const { Text, Link } = Typography;

interface CookieConsentProps {
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center';
  theme?: 'light' | 'dark' | 'auto';
  showDetailsLink?: boolean;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
}

export function CookieConsent({
  position = 'bottom-center',
  theme = 'light',
  showDetailsLink = true,
  privacyPolicyUrl = '/privacy-policy',
  cookiePolicyUrl = '/cookie-policy'
}: CookieConsentProps) {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    // 检查是否需要显示同意横幅
    const hasConsent = cookieManager.hasConsent();
    setVisible(!hasConsent);
    
    if (hasConsent) {
      setPreferences(cookieManager.getPreferences());
    }

    // 监听同意状态变化
    const handleConsentChange = () => {
      setVisible(!cookieManager.hasConsent());
      setPreferences(cookieManager.getPreferences());
    };

    cookieManager.addEventListener(handleConsentChange);

    return () => {
      cookieManager.removeEventListener(handleConsentChange);
    };
  }, []);

  const handleAcceptAll = () => {
    cookieManager.acceptAll();
    setVisible(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    cookieManager.rejectAll();
    setVisible(false);
    setShowSettings(false);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleSettingsSave = (newPreferences: Partial<CookiePreferences>) => {
    cookieManager.savePreferences(newPreferences);
    setVisible(false);
    setShowSettings(false);
  };

  if (!visible) {
    return null;
  }

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10000,
      maxWidth: '600px',
      margin: '0 auto',
    };

    switch (position) {
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '20px',
          width: '400px',
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: '20px',
          right: '20px',
          width: '400px',
        };
      case 'top-center':
        return {
          ...baseStyles,
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
        };
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
        };
      default:
        return baseStyles;
    }
  };

  const getThemeStyles = (): React.CSSProperties => {
    const isDark = theme === 'dark' || 
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      return {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        color: '#f9fafb',
      };
    }

    return {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      color: '#1f2937',
    };
  };

  return (
    <>
      <Card
        className="cookie-consent-banner"
        style={{
          ...getPositionStyles(),
          ...getThemeStyles(),
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          border: '1px solid',
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <div className="cookie-consent-content">
          <div className="cookie-consent-text" style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
              🍪 Cookie 使用通知
            </Text>
            <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
              我们使用 Cookie 来改善您的浏览体验，分析网站流量，并为您提供个性化内容。
              {showDetailsLink && (
                <>
                  了解更多信息，请查看我们的{' '}
                  <Link href={privacyPolicyUrl} target="_blank">隐私政策</Link>
                  {cookiePolicyUrl && (
                    <>
                      {' '}和{' '}
                      <Link href={cookiePolicyUrl} target="_blank">Cookie 政策</Link>
                    </>
                  )}
                  。
                </>
              )}
            </Text>
          </div>

          <div className="cookie-consent-actions">
            <Space wrap size="small">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleAcceptAll}
                size="small"
              >
                接受全部
              </Button>
              
              <Button
                onClick={handleRejectAll}
                size="small"
                icon={<CloseOutlined />}
              >
                拒绝非必需
              </Button>
              
              <Button
                onClick={handleShowSettings}
                size="small"
                icon={<SettingOutlined />}
                ghost
              >
                自定义设置
              </Button>
            </Space>
          </div>

          <div className="cookie-consent-footer" style={{ 
            marginTop: '12px', 
            fontSize: '12px', 
            opacity: 0.7 
          }}>
            <Text style={{ fontSize: '12px' }}>
              您可以随时在设置中更改您的 Cookie 偏好。
            </Text>
          </div>
        </div>
      </Card>

      {/* Cookie 设置弹窗 */}
      <CookieSettings
        visible={showSettings}
        onClose={handleSettingsClose}
        onSave={handleSettingsSave}
        currentPreferences={preferences}
        theme={theme}
      />
    </>
  );
}

// 扩展注册函数
export function initializeCookieConsent(framework: {
  slots: {
    register: (slotId: string, registration: unknown) => void;
    injectStyle: (injection: unknown) => void;
  };
}) {
  console.log('🍪 Initializing Cookie Consent Plugin...');

  // 注册到全局覆盖层槽位
  framework.slots.register('overlay.root', {
    component: CookieConsent,
    source: 'cookie-consent',
    name: 'Cookie 同意横幅',
    priority: 1000, // 高优先级确保显示在最前面
    props: {
      position: 'bottom-center',
      theme: 'auto',
      showDetailsLink: true,
      companyName: 'VoxNest'
    },
    condition: () => {
      // 只在没有同意记录时显示
      return !cookieManager.hasConsent();
    }
  });

  // 注入样式
  framework.slots.injectStyle({
    id: 'cookie-consent-styles',
    source: 'cookie-consent',
    content: `
      .cookie-consent-banner {
        animation: slideInUp 0.3s ease-out;
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(100%) translateX(-50%);
          opacity: 0;
        }
        to {
          transform: translateY(0) translateX(-50%);
          opacity: 1;
        }
      }
      
      .cookie-consent-banner .ant-card-body {
        padding: 20px !important;
      }
      
      .cookie-consent-text {
        margin-bottom: 16px;
      }
      
      .cookie-consent-actions .ant-btn {
        margin-right: 8px;
        margin-bottom: 8px;
      }
      
      @media (max-width: 768px) {
        .cookie-consent-banner {
          width: 95% !important;
          margin: 0 auto;
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%);
        }
        
        .cookie-consent-actions .ant-space {
          width: 100%;
        }
        
        .cookie-consent-actions .ant-btn {
          flex: 1;
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    `
  });

  // 导出全局 API
  (window as unknown as { VoxNestCookieManager: typeof cookieManager }).VoxNestCookieManager = cookieManager;

  console.log('✅ Cookie Consent Plugin initialized successfully');
}

export default initializeCookieConsent;
