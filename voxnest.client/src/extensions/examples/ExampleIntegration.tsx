/**
 * VoxNest 扩展框架示例集成
 * 展示如何使用新的增强扩展框架
 */

import React, { useState } from 'react';
import { Button, Badge, Card, Space, Typography, Tag, message } from 'antd';
import { BellOutlined, FireOutlined, RocketOutlined, CloseOutlined } from '@ant-design/icons';
import type { Integration } from '../core/types';

const { Text } = Typography;

// ==================== 示例组件 ====================

const NotificationButton: React.FC = () => {
  const [count, setCount] = useState(3);

  return (
    <Badge count={count} size="small">
      <Button
        type="text"
        icon={<BellOutlined />}
        onClick={() => setCount(prev => Math.max(0, prev - 1))}
        style={{ color: '#666' }}
      />
    </Badge>
  );
};

const QuickActionsCard: React.FC = () => {
  return (
    <Card
      size="small"
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <span>快速操作</span>
        </Space>
      }
      style={{ marginBottom: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button block type="primary" ghost>
          创建新帖子
        </Button>
        <Button block>
          查看草稿
        </Button>
        <Button block>
          管理分类
        </Button>
      </Space>
    </Card>
  );
};

const FeatureHighlight: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    // 检查今日是否已关闭
    const today = new Date().toDateString();
    const closedToday = localStorage.getItem(`feature_highlight_closed_${today}`);
    return closedToday !== 'true';
  });

  // 关闭提示框
  const handleClose = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`feature_highlight_closed_${today}`, 'true');
    setIsVisible(false);
    message.success('功能提示已关闭，明天会重新显示');
  };

  // 如果不可见，不渲染组件
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px 0',
        position: 'relative',
      }}
    >
      {/* 关闭按钮 */}
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          color: 'rgba(255, 255, 255, 0.8)',
          border: 'none',
          width: '28px',
          height: '28px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        size="small"
        title="关闭提示（今日不再显示）"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
        }}
      />

      <FireOutlined style={{ fontSize: '24px', marginBottom: '12px' }} />
      <h3 style={{ color: 'white', marginBottom: '8px', marginRight: '32px' }}>
        🎉 VoxNest 扩展框架已升级！
      </h3>
      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
        现在支持优先级排序、条件渲染、生命周期钩子等高级功能
      </Text>
      <div style={{ marginTop: '12px' }}>
        <Tag color="orange">Astro 风格</Tag>
        <Tag color="blue">TypeScript</Tag>
        <Tag color="green">React 集成</Tag>
      </div>
    </div>
  );
};

const StatusIndicator: React.FC = () => {
  return (
    <Space>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#52c41a',
          animation: 'pulse 2s infinite',
        }}
      />
      <Text style={{ fontSize: '12px', color: '#666' }}>
        扩展框架活跃
      </Text>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Space>
  );
};

// ==================== 集成定义 ====================

export const ExampleIntegration: Integration = {
  name: 'voxnest:example',
  
  hooks: {
    'framework:ready': (context) => {
      context.logger.info('Example Integration: Framework is ready!');
      
      // 在开发环境下显示框架统计
      if (context.config.dev) {
        setTimeout(() => {
          const stats = context.framework.getStats();
          console.group('🚀 Example Integration - Framework Stats');
          console.log('Status:', stats.status);
          console.log('Integrations:', stats.integrations);
          console.log('Slots:', stats.slots);
          console.groupEnd();
        }, 1000);
      }
    },

    'components:ready': (context) => {
      context.logger.info('Example Integration: Component system is ready!');

      // 注册通知按钮到头部右侧
      context.slots.register('header.right', {
        component: NotificationButton,
        source: 'example-integration',
        priority: 20,
        name: 'Notification Button',
        description: '显示通知数量的按钮'
      });

      // 注册状态指示器到底部右侧
      context.slots.register('footer.right', {
        component: StatusIndicator,
        source: 'example-integration',
        priority: 1,
        name: 'Status Indicator',
        description: '显示扩展框架状态'
      });

      // 注册功能亮点到内容区域前面（仅在首页）
      context.slots.register('content.before', {
        component: FeatureHighlight,
        source: 'example-integration',
        priority: 20,
        name: 'Feature Highlight',
        description: '展示新功能的横幅',
        condition: () => window.location.pathname === '/'
      });

      // 注册快速操作卡片到侧边栏顶部（仅对已登录用户）
      context.slots.register('sidebar.top', {
        component: QuickActionsCard,
        source: 'example-integration',
        priority: 15,
        name: 'Quick Actions Card',
        description: '快速操作面板',
        condition: () => {
          // 简单检查是否有认证token（实际应用中应该更严格）
          return !!localStorage.getItem('voxnest-token');
        }
      });

      context.logger.info('Example Integration: Registered 4 components to various slots');
    },

    'app:start': (context) => {
      context.logger.debug('Example Integration: App is starting...');
    },

    'app:started': (context) => {
      context.logger.info('Example Integration: App has started successfully!');
      
      // 在开发环境下添加一些有用的全局方法
      if (context.config.dev && typeof window !== 'undefined') {
        (window as any).__exampleIntegration = {
          getSlotStats: () => context.framework.getStats().slots,
          debugSlot: (slotId: string) => {
            const components = context.slots.getComponents(slotId);
            const hasComponents = context.slots.hasComponents(slotId);
            return {
              slotId,
              hasComponents,
              componentCount: components.length,
              components: components.map(c => ({
                name: c.name,
                source: c.source,
                priority: c.priority,
                description: c.description
              }))
            };
          },
          getFrameworkStats: () => context.framework.getStats(),
          getAllSlots: () => {
            const stats = context.framework.getStats();
            return stats.slots || {};
          },
        };
        
        context.logger.debug('Example Integration: Added debug methods to window.__exampleIntegration');
      }
    },

    'app:destroy': (context) => {
      context.logger.info('Example Integration: Cleaning up...');
      
      // 清理注册的组件
      context.slots.unregisterBySource('example-integration');
      
      // 清理全局方法
      if (typeof window !== 'undefined') {
        delete (window as any).__exampleIntegration;
      }
      
      context.logger.info('Example Integration: Cleanup completed');
    },
  },
};

// ==================== 便捷导出 ====================

export function createExampleIntegration(): Integration {
  return ExampleIntegration;
}

export default ExampleIntegration;
