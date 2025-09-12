import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Tag,
  Progress,
  Typography,
  Space,
  Button,
  Spin,
  message,
  Table,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  EyeOutlined,
  ReloadOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { AdminApi } from '../../api/admin';
import type { SiteOverview } from '../../api/admin';
import { useLogger } from '../../hooks/useLogger';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [overview, setOverview] = useState<SiteOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const logger = useLogger('Admin.Dashboard');

  // 加载概览数据
  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getSiteOverview();
      setOverview(data);
      logger.debug('Loaded admin dashboard overview');
    } catch (error) {
      message.error('加载概览数据失败');
      logger.error('Failed to load admin overview', error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">加载数据失败，请重试</Text>
        <br />
        <Button type="primary" onClick={loadOverview} style={{ marginTop: '16px' }}>
          重新加载
        </Button>
      </div>
    );
  }

  // 格式化存储大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  // 最近7天数据图表列
  const chartColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MM-DD'),
    },
    {
      title: '新用户',
      dataIndex: 'users',
      key: 'users',
    },
    {
      title: '新帖子',
      dataIndex: 'posts',
      key: 'posts',
    },
  ];

  // 生成最近7天的图表数据
  const getChartData = () => {
    const data = [];
    const today = dayjs();
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      data.push({
        key: date,
        date,
        users: overview.userStats.recentNewUsers[date] || 0,
        posts: overview.postStats.recentPosts[date] || 0,
      });
    }
    return data;
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>概览面板</Title>
        <Button icon={<ReloadOutlined />} onClick={loadOverview}>
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={overview.userStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                overview.userStats.newUsersToday > 0 && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    今日新增 {overview.userStats.newUsersToday}
                  </div>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={overview.postStats.totalPosts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                overview.postStats.newPostsToday > 0 && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    今日新增 {overview.postStats.newPostsToday}
                  </div>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={overview.postStats.totalComments}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                overview.postStats.newCommentsToday > 0 && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    今日新增 {overview.postStats.newCommentsToday}
                  </div>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={overview.userStats.activeUsers}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa541c' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#999' }}>
                  7天内活跃
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 左列 */}
        <Col xs={24} lg={16}>
          {/* 最近7天数据 */}
          <Card title="最近7天数据" style={{ marginBottom: '16px' }}>
            <Table
              dataSource={getChartData()}
              columns={chartColumns}
              pagination={false}
              size="small"
            />
          </Card>

          {/* 分类统计 */}
          <Card title="分类分布" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              {Object.entries(overview.postStats.categoryDistribution).map(([category, count]) => (
                <Col span={8} key={category} style={{ marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {category}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 热门标签 */}
          <Card title="热门标签">
            <Space wrap>
              {Object.entries(overview.postStats.popularTags).map(([tag, count]) => (
                <Tag key={tag} color="blue">
                  <TagsOutlined /> {tag} ({count})
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        {/* 右列 */}
        <Col xs={24} lg={8}>
          {/* 系统信息 */}
          <Card title="系统信息" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>运行时间：</Text>
                <Text>{formatUptime(overview.systemStats.uptime)}</Text>
              </div>
              <div>
                <Text strong>内存使用：</Text>
                <Text>{formatBytes(overview.systemStats.memoryUsage)}</Text>
              </div>
              <div>
                <Text strong>数据库大小：</Text>
                <Text>{formatBytes(overview.systemStats.databaseSize)}</Text>
              </div>
              <div>
                <Text strong>存储使用：</Text>
                <Progress
                  percent={overview.systemStats.totalStorage > 0 
                    ? Math.round((overview.systemStats.usedStorage / overview.systemStats.totalStorage) * 100)
                    : 0}
                  size="small"
                />
              </div>
            </Space>
          </Card>

          {/* 最近用户注册 */}
          <Card title="最近注册用户" style={{ marginBottom: '16px' }}>
            <List
              size="small"
              dataSource={overview.recentActivity.recentRegistrations}
              renderItem={(user) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{user.username}</Text>
                      <Tag color={user.status === 'Active' ? 'green' : 'orange'}>
                        {user.status}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(user.createdAt).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 最近帖子 */}
          <Card title="最近帖子">
            <List
              size="small"
              dataSource={overview.recentActivity.recentPosts}
              renderItem={(post) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text strong ellipsis style={{ display: 'block' }}>
                        {post.title}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {post.authorName} · {post.categoryName}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <EyeOutlined /> {post.viewCount}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(post.createdAt).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
