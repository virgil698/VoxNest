/**
 * Cookie 设置详细配置组件
 * 提供细粒度的 Cookie 分类管理
 */

import { useState, useEffect } from 'react';
import { 
  Modal, 
  Switch, 
  Typography, 
  Space, 
  Button, 
  Divider, 
  Tag, 
  Alert,
  List,
  Collapse
} from 'antd';
import { 
  InfoCircleOutlined, 
  CheckOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  BulbOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { cookieManager, type CookiePreferences, type CookieCategory } from './cookieManager.ts';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface CookieSettingsProps {
  visible: boolean;
  onClose: () => void;
  onSave: (preferences: Partial<CookiePreferences>) => void;
  currentPreferences: CookiePreferences | null;
  theme?: 'light' | 'dark' | 'auto';
}

export function CookieSettings({
  visible,
  onClose,
  onSave,
  currentPreferences
}: CookieSettingsProps) {
  const [preferences, setPreferences] = useState<Partial<CookiePreferences>>({});
  const [categories, setCategories] = useState<CookieCategory[]>([]);

  useEffect(() => {
    if (visible) {
      const currentCategories = cookieManager.getCategories();
      setCategories(currentCategories);
      
      // 初始化偏好设置
      const initialPreferences = currentPreferences || {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      setPreferences(initialPreferences);
    }
  }, [visible, currentPreferences]);

  const handleToggle = (category: keyof CookiePreferences, value: boolean) => {
    if (category === 'essential') return; // 必需 Cookie 不可禁用
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = () => {
    onSave(preferences);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allAccepted);
    onSave(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    setPreferences(onlyEssential);
    onSave(onlyEssential);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'essential':
        return <SafetyCertificateOutlined style={{ color: '#52c41a' }} />;
      case 'analytics':
        return <BarChartOutlined style={{ color: '#1890ff' }} />;
      case 'marketing':
        return <ShoppingOutlined style={{ color: '#f5222d' }} />;
      case 'functional':
        return <BulbOutlined style={{ color: '#faad14' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getCategoryDescription = (category: CookieCategory) => {
    const details = {
      essential: {
        purpose: '确保网站正常运行所必需的基础功能',
        examples: ['用户会话、安全令牌、表单数据'],
        retention: '会话期间或根据功能需要',
        dataProcessing: '仅在本地处理，不传输给第三方'
      },
      analytics: {
        purpose: '帮助我们了解网站使用情况以改进用户体验',
        examples: ['页面访问量、用户行为路径、性能指标'],
        retention: '通常保留 26 个月',
        dataProcessing: '匿名化数据，不包含个人身份信息'
      },
      marketing: {
        purpose: '用于显示相关广告和营销内容',
        examples: ['广告偏好、转化跟踪、重定向'],
        retention: '通常保留 12-24 个月',
        dataProcessing: '可能与第三方广告平台共享'
      },
      functional: {
        purpose: '提供增强的功能和个性化体验',
        examples: ['语言偏好、主题设置、视频播放'],
        retention: '根据功能需要，通常 12 个月',
        dataProcessing: '可能涉及第三方服务提供商'
      }
    };

    return details[category.id as keyof typeof details] || {
      purpose: category.description,
      examples: [],
      retention: '根据功能需要',
      dataProcessing: '按照隐私政策处理'
    };
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Cookie 设置</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleRejectAll}>
            仅接受必需
          </Button>
          <Button onClick={handleAcceptAll}>
            接受全部
          </Button>
          <Button type="primary" onClick={handleSave} icon={<CheckOutlined />}>
            保存设置
          </Button>
        </Space>
      }
      className="cookie-settings-modal"
      style={{ top: 20 }}
    >
      <div className="cookie-settings-content">
        <Alert
          message="Cookie 使用说明"
          description="我们使用 Cookie 来提供更好的用户体验。您可以选择接受或拒绝不同类型的 Cookie。请注意，禁用某些 Cookie 可能会影响网站功能。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Collapse 
          defaultActiveKey={['essential']} 
          ghost
          expandIconPosition="end"
        >
          {categories.map((category) => {
            const details = getCategoryDescription(category);
                      const isEnabled = category.id === 'essential' ? true : (preferences as Record<string, boolean>)[category.id];
            
            return (
              <Panel
                key={category.id}
                header={
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      width: '100%',
                      paddingRight: '40px'
                    }}
                  >
                    <Space>
                      {getCategoryIcon(category.id)}
                      <span style={{ fontWeight: 500 }}>{category.name}</span>
                      {category.required && (
                        <Tag color="red" style={{ fontSize: '10px', lineHeight: '16px' }}>必需</Tag>
                      )}
                    </Space>
                    
                    <Switch
                      checked={isEnabled}
                      disabled={category.required}
                      onChange={(checked) => handleToggle(category.id as keyof CookiePreferences, checked)}
                      size="small"
                    />
                  </div>
                }
                className={`cookie-category-panel ${category.id}`}
              >
                <div style={{ paddingLeft: 24 }}>
                  <Paragraph style={{ marginBottom: 16 }}>
                    <Text>{category.description}</Text>
                  </Paragraph>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>用途：</Text>
                    <Text style={{ marginLeft: 8 }}>{details.purpose}</Text>
                  </div>

                  {details.examples.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>包含数据：</Text>
                      <List
                        size="small"
                        dataSource={details.examples}
                        renderItem={(item) => (
                          <List.Item style={{ padding: '4px 0', border: 'none' }}>
                            <Text style={{ fontSize: '12px' }}>• {item}</Text>
                          </List.Item>
                        )}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  )}

                  {category.providers && category.providers.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>服务提供商：</Text>
                      <div style={{ marginTop: 4 }}>
                        {category.providers.map((provider) => (
                          <Tag key={provider} style={{ fontSize: '11px', marginBottom: 4 }}>
                            {provider}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <Text strong>保留期限：</Text>
                    <Text style={{ marginLeft: 8, fontSize: '12px' }}>{details.retention}</Text>
                  </div>

                  <div>
                    <Text strong>数据处理：</Text>
                    <Text style={{ marginLeft: 8, fontSize: '12px' }}>{details.dataProcessing}</Text>
                  </div>
                </div>
              </Panel>
            );
          })}
        </Collapse>

        <Divider />

        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            您可以随时通过网站设置更改这些偏好。某些 Cookie 对于网站的基本功能是必需的，无法禁用。
            更多信息请查看我们的隐私政策和 Cookie 政策。
          </Text>
        </div>

        {currentPreferences && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              最后更新：{new Date(currentPreferences.timestamp).toLocaleString('zh-CN')}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
}
