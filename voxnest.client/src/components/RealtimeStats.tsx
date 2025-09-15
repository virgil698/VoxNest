import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Switch, Tag, Space, Tooltip, Timeline, Avatar } from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  MessageOutlined,
  DashboardOutlined,
  WifiOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSiteStatsQuery, useRealtimeStatsQuery } from '../hooks/useSiteStatsQuery';
import { useApiStateManagement } from '../hooks/useApiState';

interface RealtimeStatsProps {
  showRealtimeData?: boolean;
  compact?: boolean;
}

const RealtimeStats: React.FC<RealtimeStatsProps> = ({ 
  showRealtimeData = false, 
  compact = false 
}) => {
  const [enableRealtime, setEnableRealtime] = useState(showRealtimeData);
  const [isVisible, setIsVisible] = useState(true);

  // 基础统计数据（轮询更新）
  const siteStatsQuery = useSiteStatsQuery();
  const siteStatsState = useApiStateManagement(siteStatsQuery);

  // 实时统计数据（高频轮询，可控制开关）
  const realtimeQuery = useRealtimeStatsQuery(enableRealtime);
  const realtimeState = useApiStateManagement(realtimeQuery, { staleThreshold: 30000 }); // 30秒


  // 页面可见性检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const siteStats = siteStatsQuery.data;
  const realtimeStats = realtimeQuery.data;

  // 状态指示器
  const StatusIndicator: React.FC<{ 
    isLoading: boolean; 
    isError: boolean; 
    isStale: boolean;
    label: string;
  }> = ({ isLoading, isError, isStale, label }) => {
    let color = 'green';
    let icon = <WifiOutlined />;
    let text = '正常';

    if (isError) {
      color = 'red';
      text = '错误';
    } else if (isLoading) {
      color = 'blue';
      icon = <ReloadOutlined spin />;
      text = '更新中';
    } else if (isStale) {
      color = 'orange';
      text = '数据过期';
    }

    return (
      <Tooltip title={`${label}: ${text}`}>
        <Tag color={color} icon={icon}>
          {compact ? '' : text}
        </Tag>
      </Tooltip>
    );
  };

  if (compact) {
    return (
      <Space wrap>
        <Statistic
          title="在线用户"
          value={realtimeStats?.activeUsers || siteStats?.onlineUsers || 0}
          prefix={<UserOutlined />}
          loading={siteStatsState.isLoadingInitial}
        />
        <Statistic
          title="总帖子"
          value={siteStats?.totalPosts || 0}
          loading={siteStatsState.isLoadingInitial}
        />
        <Statistic
          title="总浏览"
          value={siteStats?.totalViews || 0}
          loading={siteStatsState.isLoadingInitial}
        />
        <StatusIndicator
          isLoading={siteStatsState.isFetching}
          isError={siteStatsState.isError}
          isStale={siteStatsState.isStale}
          label="数据状态"
        />
      </Space>
    );
  }

  return (
    <div>
      {/* 控制面板 */}
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <DashboardOutlined />
            <span>实时统计</span>
          </Space>
        }
        extra={
          <Space>
            <StatusIndicator
              isLoading={siteStatsState.isFetching}
              isError={siteStatsState.isError}
              isStale={siteStatsState.isStale}
              label="基础数据"
            />
            {enableRealtime && (
              <StatusIndicator
                isLoading={realtimeState.isFetching}
                isError={realtimeState.isError}
                isStale={realtimeState.isStale}
                label="实时数据"
              />
            )}
            <Space>
              <span>实时更新</span>
              <Switch
                checked={enableRealtime}
                onChange={setEnableRealtime}
                size="small"
              />
            </Space>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="页面可见性"
              value={isVisible ? '可见' : '隐藏'}
              valueStyle={{ color: isVisible ? '#3f8600' : '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="轮询状态"
              value={enableRealtime ? '开启' : '关闭'}
              valueStyle={{ color: enableRealtime ? '#3f8600' : '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="数据年龄"
              value={`${siteStatsState.ageInMinutes || 0}分钟`}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="缓存状态"
              value={siteStatsState.isStale ? '过期' : '新鲜'}
              valueStyle={{ color: siteStatsState.isStale ? '#cf1322' : '#3f8600' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 基础统计 */}
      <Card title="站点统计" style={{ marginBottom: 16 }} loading={siteStatsState.isLoadingInitial}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总帖子数"
              value={siteStats?.totalPosts || 0}
              prefix={<MessageOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总用户数"
              value={siteStats?.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总浏览量"
              value={siteStats?.totalViews || 0}
              prefix={<EyeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在线用户"
              value={realtimeStats?.activeUsers || siteStats?.onlineUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Statistic
              title="今日新帖"
              value={siteStats?.todayPosts || 0}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="今日新用户"
              value={siteStats?.todayUsers || 0}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="今日浏览"
              value={siteStats?.todayViews || 0}
            />
          </Col>
        </Row>

        {siteStats?.lastUpdated && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Tag>
              最后更新: {dayjs(siteStats.lastUpdated).format('HH:mm:ss')}
            </Tag>
          </div>
        )}
      </Card>

      {/* 实时统计（仅在开启时显示） */}
      {enableRealtime && (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="实时数据" loading={realtimeState.isLoadingInitial}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="活跃用户"
                    value={realtimeStats?.activeUsers || 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="活跃会话"
                    value={realtimeStats?.activeSessions || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Statistic
                  title="当前页面浏览"
                  value={realtimeStats?.currentPageViews || 0}
                  prefix={<EyeOutlined />}
                />
              </div>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="最近活动" loading={realtimeState.isLoadingInitial}>
              <Timeline
                items={realtimeStats?.recentActivities?.slice(0, 5).map((activity, index) => ({
                  children: (
                    <div key={index}>
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span>{activity.username || '匿名用户'}</span>
                        <Tag color="blue">{activity.type}</Tag>
                      </Space>
                      {activity.postTitle && (
                        <div style={{ marginLeft: 24, color: '#666' }}>
                          {activity.postTitle}
                        </div>
                      )}
                      <div style={{ marginLeft: 24, fontSize: '12px', color: '#999' }}>
                        {dayjs(activity.timestamp).format('HH:mm:ss')}
                      </div>
                    </div>
                  ),
                })) || []
              }
            />
          </Card>
        </Col>
        </Row>
      )}
    </div>
  );
};

export default RealtimeStats;
