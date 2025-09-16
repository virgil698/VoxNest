import React, { useState } from 'react';
import { Card, Tabs, Typography, Space, Button, Alert, Tag, Row, Col } from 'antd';
import { 
  BugOutlined, 
  ThunderboltOutlined, 
  SettingOutlined,
  InfoCircleOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';
import HotReloadPanel from '../../components/dev/HotReloadPanel';

const { Title, Paragraph, Text } = Typography;

const DeveloperMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hot-reload');
  const { 
    isDeveloperModeAvailable,
    canShowHotReload,
    isFrameworkDebugEnabled,
    canShowPerformanceMetrics,
    isExtensionLogsEnabled,
    isAdmin,
    isDevelopment
  } = useDeveloperMode();

  // 如果开发者模式不可用，显示提示
  if (!isDeveloperModeAvailable) {
    return (
      <div>
        <Title level={2}>开发者模式</Title>
        <Alert
          type="warning"
          message="开发者模式不可用"
          description={
            <div>
              <p>要启用开发者模式，需要满足以下条件：</p>
              <ul>
                <li>在站点设置中启用开发者模式</li>
                <li>具有管理员权限，或者在开发环境下运行</li>
              </ul>
              <p>
                当前状态: {isAdmin ? '管理员' : '非管理员'} | {isDevelopment ? '开发环境' : '生产环境'}
              </p>
            </div>
          }
          showIcon
          style={{ marginTop: '24px' }}
        />
      </div>
    );
  }

  // 获取框架状态
  const getFrameworkStats = () => {
    try {
      const framework = (window as any).__VoxNestExtensions?.getFramework?.();
      return framework ? framework.getStats?.() : null;
    } catch {
      return null;
    }
  };

  const frameworkStats = getFrameworkStats();

  const tabItems = [
    // 扩展热重载
    ...(canShowHotReload ? [{
      key: 'hot-reload',
      label: (
        <Space>
          <ThunderboltOutlined />
          扩展热重载
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            message="扩展热重载"
            description="监控本地扩展文件变化，自动重载扩展。适用于扩展开发和调试。"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          <HotReloadPanel />
        </div>
      )
    }] : []),

    // 框架状态
    {
      key: 'framework',
      label: (
        <Space>
          <SettingOutlined />
          框架状态
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            message="扩展框架状态"
            description="查看 VoxNest 扩展框架的当前状态和统计信息。"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <Card title="框架信息">
            {frameworkStats ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                          {frameworkStats.status}
                        </div>
                        <div>框架状态</div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                          {frameworkStats.integrations.total}
                        </div>
                        <div>集成数量</div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                          {frameworkStats.slots.total}
                        </div>
                        <div>槽位数量</div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Card size="small" title="集成详情">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>带钩子的集成: </Text>
                      <Text>{frameworkStats.integrations.withHooks}</Text>
                    </div>
                    <div>
                      <Text strong>钩子统计: </Text>
                      {frameworkStats.integrations.hookCounts && 
                       Object.keys(frameworkStats.integrations.hookCounts).length > 0 ? (
                        Object.entries(frameworkStats.integrations.hookCounts).map(([hook, count]) => (
                          <Tag key={hook} style={{ margin: '2px' }}>
                            {hook}: {count as number}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">暂无钩子</Text>
                      )}
                    </div>
                  </Space>
                </Card>

                <Card size="small" title="槽位统计">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>总组件数: </Text>
                      <Text>{frameworkStats.slots.components}</Text>
                    </div>
                    <div>
                      <Text strong>槽位分布: </Text>
                      <div style={{ marginTop: '8px' }}>
                        {frameworkStats.slots.breakdown && 
                         Object.keys(frameworkStats.slots.breakdown).length > 0 ? (
                          Object.entries(frameworkStats.slots.breakdown).map(([slot, count]) => (
                            <Tag key={slot} color="blue" style={{ margin: '2px' }}>
                              {slot}: {count as number}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary">暂无槽位</Text>
                        )}
                      </div>
                    </div>
                  </Space>
                </Card>
              </Space>
            ) : (
              <Alert
                type="warning"
                message="无法获取框架状态"
                description="扩展框架可能未正确初始化，或者调试接口不可用。"
                showIcon
              />
            )}
          </Card>

          <Card title="调试操作" style={{ marginTop: '16px' }}>
            <Space>
              <Button 
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  const framework = (window as any).__VoxNestExtensions;
                  if (framework?.printStatus) {
                    framework.printStatus();
                  } else {
                    console.log('Framework debug interface not available');
                  }
                }}
              >
                打印框架状态
              </Button>
              <Button 
                icon={<CodeOutlined />}
                onClick={() => {
                  const framework = (window as any).__VoxNestExtensions;
                  if (framework?.listSlots) {
                    console.log('Available slots:', framework.listSlots());
                  }
                }}
              >
                列出所有槽位
              </Button>
              <Button 
                icon={<BugOutlined />}
                onClick={() => {
                  if (frameworkStats) {
                    console.group('🔍 Framework Debug Info');
                    console.log('Stats:', frameworkStats);
                    console.log('Config:', frameworkStats.config);
                    console.groupEnd();
                  }
                }}
              >
                输出调试信息
              </Button>
            </Space>
          </Card>
        </div>
      )
    },

    // 性能指标
    ...(canShowPerformanceMetrics ? [{
      key: 'performance',
      label: (
        <Space>
          <ThunderboltOutlined />
          性能指标
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            message="性能监控"
            description="查看应用的性能指标和资源使用情况。"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <Card title="页面性能">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>页面加载时间: </Text>
                <Text>{performance.timing ? `${performance.timing.loadEventEnd - performance.timing.navigationStart}ms` : '不可用'}</Text>
              </div>
              <div>
                <Text strong>DOM 解析时间: </Text>
                <Text>{performance.timing ? `${performance.timing.domContentLoadedEventEnd - performance.timing.domLoading}ms` : '不可用'}</Text>
              </div>
            </Space>
          </Card>

          <Card title="内存使用" style={{ marginTop: '16px' }}>
            {(performance as any).memory ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>已用内存: </Text>
                  <Text>{Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB</Text>
                </div>
                <div>
                  <Text strong>总内存: </Text>
                  <Text>{Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB</Text>
                </div>
                <div>
                  <Text strong>内存限制: </Text>
                  <Text>{Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB</Text>
                </div>
              </Space>
            ) : (
              <Alert
                type="info"
                message="内存信息不可用"
                description="当前浏览器不支持性能内存监控 API。"
                showIcon
              />
            )}
          </Card>

          <Card title="调试操作" style={{ marginTop: '16px' }}>
            <Space>
              <Button 
                onClick={() => {
                  const logger = (window as any).__VoxNestLogger;
                  if (logger?.logPerformanceMetrics) {
                    logger.logPerformanceMetrics();
                  } else {
                    console.log('Logger performance interface not available');
                  }
                }}
              >
                打印性能指标
              </Button>
              <Button 
                onClick={() => {
                  if ((performance as any).memory) {
                    console.log('Memory Usage:', {
                      used: `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`,
                      total: `${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB`,
                      limit: `${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB`
                    });
                  }
                }}
              >
                内存快照
              </Button>
            </Space>
          </Card>
        </div>
      )
    }] : []),

    // 开发者设置
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          设置
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            message="开发者设置"
            description="当前开发者模式的配置状态和快速设置选项。"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <Card title="当前配置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>开发者模式: </Text>
                <Tag color="green">已启用</Tag>
              </div>
              <div>
                <Text strong>热重载面板: </Text>
                <Tag color={canShowHotReload ? 'green' : 'red'}>
                  {canShowHotReload ? '可用' : '禁用'}
                </Tag>
              </div>
              <div>
                <Text strong>框架调试: </Text>
                <Tag color={isFrameworkDebugEnabled ? 'green' : 'default'}>
                  {isFrameworkDebugEnabled ? '启用' : '禁用'}
                </Tag>
              </div>
              <div>
                <Text strong>性能指标: </Text>
                <Tag color={canShowPerformanceMetrics ? 'green' : 'default'}>
                  {canShowPerformanceMetrics ? '显示' : '隐藏'}
                </Tag>
              </div>
              <div>
                <Text strong>扩展日志: </Text>
                <Tag color={isExtensionLogsEnabled ? 'green' : 'default'}>
                  {isExtensionLogsEnabled ? '启用' : '禁用'}
                </Tag>
              </div>
            </Space>
          </Card>

          <Card title="环境信息" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>运行环境: </Text>
                <Tag color={isDevelopment ? 'blue' : 'orange'}>
                  {isDevelopment ? '开发环境' : '生产环境'}
                </Tag>
              </div>
              <div>
                <Text strong>用户权限: </Text>
                <Tag color={isAdmin ? 'red' : 'default'}>
                  {isAdmin ? '管理员' : '普通用户'}
                </Tag>
              </div>
              <div>
                <Text strong>浏览器: </Text>
                <Text style={{ fontSize: '12px' }}>{navigator.userAgent}</Text>
              </div>
            </Space>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>开发者模式</Title>
        <Paragraph type="secondary">
          扩展开发和调试工具集合，帮助开发者更好地构建和维护 VoxNest 扩展。
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default DeveloperMode;
