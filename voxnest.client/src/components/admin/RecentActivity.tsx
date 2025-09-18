import React from 'react';
import {
  Card,
  List,
  Avatar,
  Tag,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Empty,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  CommentOutlined,
  LikeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// 与admin.ts中的接口保持一致
interface UserActivity {
  id: number;
  username: string;
  displayName?: string;
  email?: string; // 可选字段，与admin.ts一致
  status: string;
  createdAt: string;
  avatar?: string;
}

interface PostActivity {
  id: number;
  title: string;
  authorName: string;
  categoryName?: string; // 可选字段
  viewCount: number;
  commentCount?: number; // 可选字段
  likeCount?: number; // 可选字段
  createdAt: string;
  status?: string; // 可选字段
}

interface RecentActivityProps {
  recentUsers: UserActivity[];
  recentPosts: PostActivity[];
  userStats?: {
    todayRegistrations: number;
    weekRegistrations: number;
    monthRegistrations: number;
  };
  postStats?: {
    todayPosts: number;
    weekPosts: number;
    monthPosts: number;
  };
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  recentUsers,
  recentPosts,
  userStats = { todayRegistrations: 0, weekRegistrations: 0, monthRegistrations: 0 },
  postStats = { todayPosts: 0, weekPosts: 0, monthPosts: 0 }
}) => {
  
  // 获取用户状态标签
  const getUserStatusTag = (status: string) => {
    const statusConfig = {
      'Active': { color: 'success', text: '正常' },
      'Pending': { color: 'warning', text: '待验证' },
      'Disabled': { color: 'error', text: '已禁用' },
      'Deleted': { color: 'default', text: '已删除' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取帖子状态标签
  const getPostStatusTag = (status: string) => {
    const statusConfig = {
      'Published': { color: 'success', text: '已发布' },
      'Draft': { color: 'default', text: '草稿' },
      'Locked': { color: 'warning', text: '已锁定' },
      'Deleted': { color: 'error', text: '已删除' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <Row gutter={[16, 16]}>
      {/* 用户注册统计 */}
      <Col xs={24} lg={12}>
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>用户注册趋势</span>
            </Space>
          }
          style={{ height: '100%' }}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="今日"
                value={userStats.todayRegistrations}
                valueStyle={{ fontSize: 16, color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本周"
                value={userStats.weekRegistrations}
                valueStyle={{ fontSize: 16, color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本月"
                value={userStats.monthRegistrations}
                valueStyle={{ fontSize: 16, color: '#fa8c16' }}
              />
            </Col>
          </Row>

          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>最近注册用户</Text>
          </div>

          {recentUsers.length > 0 ? (
            <List
              size="small"
              dataSource={recentUsers.slice(0, 6)}
              renderItem={(user) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={32}
                        src={user.avatar}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 13 }}>
                          {user.displayName || user.username}
                        </Text>
                        {getUserStatusTag(user.status)}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>
                          @{user.username}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ClockCircleOutlined />
                          <Tooltip title={dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                            {dayjs(user.createdAt).fromNow()}
                          </Tooltip>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无新用户注册"
              style={{ margin: '20px 0' }}
            />
          )}
        </Card>
      </Col>

      {/* 帖子发布统计 */}
      <Col xs={24} lg={12}>
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <span>帖子发布趋势</span>
            </Space>
          }
          style={{ height: '100%' }}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="今日"
                value={postStats.todayPosts}
                valueStyle={{ fontSize: 16, color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本周"
                value={postStats.weekPosts}
                valueStyle={{ fontSize: 16, color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本月"
                value={postStats.monthPosts}
                valueStyle={{ fontSize: 16, color: '#fa8c16' }}
              />
            </Col>
          </Row>

          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>最近发布帖子</Text>
          </div>

          {recentPosts.length > 0 ? (
            <List
              size="small"
              dataSource={recentPosts.slice(0, 6)}
              renderItem={(post) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={32}
                        icon={<FileTextOutlined />}
                        style={{ backgroundColor: '#52c41a' }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Tooltip title={post.title}>
                          <Text 
                            strong 
                            style={{ fontSize: 13 }} 
                            ellipsis={{ tooltip: true }}
                          >
                            {post.title}
                          </Text>
                        </Tooltip>
                        {post.status && getPostStatusTag(post.status)}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                          作者：{post.authorName}
                          {post.categoryName && ` · ${post.categoryName}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#999' }}>
                          <Space size={8}>
                            <span><EyeOutlined /> {post.viewCount || 0}</span>
                            <span><CommentOutlined /> {post.commentCount || 0}</span>
                            <span><LikeOutlined /> {post.likeCount || 0}</span>
                          </Space>
                          <div style={{ flex: 1 }}></div>
                          <Tooltip title={dayjs(post.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined />
                              {dayjs(post.createdAt).fromNow()}
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无新帖子发布"
              style={{ margin: '20px 0' }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default RecentActivity;
