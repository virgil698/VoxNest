/**
 * 扩展热重载调试面板
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Badge, Table, Tooltip, Alert } from 'antd';
import { 
  ReloadOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  // CheckCircleOutlined,
  // ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface HotReloadPanelProps {
  className?: string;
}

interface HotReloadStats {
  isRunning: boolean;
  totalWatched: number;
  localExtensions: number;
  watchedExtensions: Array<{
    id: string;
    name: string;
    isLocal: boolean;
    lastModified: string;
  }>;
  config: {
    enabled: boolean;
    pollingInterval: number;
    configPath: string;
    localExtensionsPath: string;
  };
}

declare global {
  interface Window {
    __VoxNestHotReload?: {
      getStats(): HotReloadStats;
      checkNow(): Promise<void>;
      start(): Promise<void>;
      stop(): void;
      reset(): void;
    };
  }
}

export const HotReloadPanel: React.FC<HotReloadPanelProps> = ({ className }) => {
  const [stats, setStats] = useState<HotReloadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const hotReload = window.__VoxNestHotReload;

  const updateStats = () => {
    if (hotReload) {
      try {
        const newStats = hotReload.getStats();
        setStats(newStats);
      } catch (error) {
        console.error('Failed to get hot reload stats:', error);
      }
    }
  };

  useEffect(() => {
    // 初始加载
    updateStats();

    // 定期更新
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [hotReload]);

  const handleManualCheck = async () => {
    if (!hotReload) return;
    
    setLoading(true);
    try {
      await hotReload.checkNow();
      setLastCheck(new Date());
      updateStats();
    } catch (error) {
      console.error('Manual check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!hotReload || !stats) return;
    
    setLoading(true);
    try {
      if (stats.isRunning) {
        hotReload.stop();
      } else {
        await hotReload.start();
      }
      updateStats();
    } catch (error) {
      console.error('Failed to toggle hot reload:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!hotReload) return;
    
    hotReload.reset();
    updateStats();
  };

  if (!hotReload) {
    return (
      <Card className={className}>
        <Alert 
          type="warning" 
          message="扩展热重载功能未启用" 
          description="请在开发环境下启动应用以启用热重载功能。"
          showIcon
        />
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className} loading>
        <Title level={4}>扩展热重载</Title>
      </Card>
    );
  }

  const columns = [
    {
      title: '扩展ID',
      dataIndex: 'id',
      key: 'id',
      width: '25%',
      render: (id: string) => <Text code>{id}</Text>
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: '类型',
      dataIndex: 'isLocal',
      key: 'isLocal',
      width: '20%',
      render: (isLocal: boolean) => (
        <Badge 
          status={isLocal ? 'success' : 'default'} 
          text={isLocal ? '本地' : '远程'} 
        />
      )
    },
    {
      title: '最后修改',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: '25%',
      render: (time: string) => {
        const date = new Date(time);
        return (
          <Tooltip title={date.toLocaleString()}>
            <Text type="secondary">
              {date.toLocaleTimeString()}
            </Text>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Card 
      className={className}
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            扩展热重载
          </Title>
          <Badge 
            status={stats.isRunning ? 'processing' : 'default'} 
            text={stats.isRunning ? '运行中' : '已停止'}
          />
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="手动检查更新">
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={handleManualCheck}
              disabled={!stats.isRunning}
            />
          </Tooltip>
          <Button
            type={stats.isRunning ? 'default' : 'primary'}
            icon={stats.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            loading={loading}
            onClick={handleToggle}
          >
            {stats.isRunning ? '停止' : '启动'}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 统计信息 */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <Text type="secondary">监控扩展</Text>
            <div>
              <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                {stats.totalWatched}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary">本地扩展</Text>
            <div>
              <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                {stats.localExtensions}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary">轮询间隔</Text>
            <div>
              <Text strong style={{ fontSize: '24px' }}>
                {stats.config.pollingInterval}ms
              </Text>
            </div>
          </div>
        </div>

        {/* 配置信息 */}
        <Card size="small" title="配置信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>配置文件: </Text>
              <Text code>{stats.config.configPath}</Text>
            </div>
            <div>
              <Text strong>本地扩展目录: </Text>
              <Text code>{stats.config.localExtensionsPath}</Text>
            </div>
            <div>
              <Text strong>启用状态: </Text>
              <Badge 
                status={stats.config.enabled ? 'success' : 'error'} 
                text={stats.config.enabled ? '已启用' : '已禁用'}
              />
            </div>
          </Space>
        </Card>

        {/* 扩展列表 */}
        <div>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong>监控的扩展</Text>
            {lastCheck && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                最后检查: {lastCheck.toLocaleTimeString()}
              </Text>
            )}
          </div>
          
          {stats.watchedExtensions.length > 0 ? (
            <Table
              dataSource={stats.watchedExtensions}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 240 }}
            />
          ) : (
            <Alert
              type="info"
              message="没有监控的扩展"
              description="当前没有找到本地扩展文件夹或 extensions.json 中没有扩展配置。"
              showIcon
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button 
              icon={<InfoCircleOutlined />}
              onClick={() => console.log('Hot Reload Stats:', stats)}
            >
              查看详细信息
            </Button>
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => console.table(stats.watchedExtensions)}
            >
              打印扩展列表
            </Button>
            <Button 
              danger
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </div>

        {/* 使用提示 */}
        <Alert
          type="info"
          message="使用提示"
          description={
            <ul style={{ paddingLeft: '16px', margin: 0 }}>
              <li>修改 extensions.json 文件会自动触发扩展重载</li>
              <li>修改本地扩展文件（如 manifest.json）会触发该扩展重载</li>
              <li>只有本地存在扩展文件夹的扩展才会被监控</li>
              <li>开发环境下热重载自动启用，生产环境下自动禁用</li>
            </ul>
          }
          showIcon
          style={{ fontSize: '12px' }}
        />
      </Space>
    </Card>
  );
};

export default HotReloadPanel;
