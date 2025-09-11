import React, { useEffect } from 'react';
import { Card, List, Avatar, Tag, Space, Typography, Button, Spin, Empty, message, Row, Col, Statistic } from 'antd';
import { 
  EyeOutlined, 
  LikeOutlined, 
  MessageOutlined,
  PushpinOutlined,
  LockOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../stores/postStore';
import { useAuthStore } from '../stores/authStore';

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { 
    posts, 
    isLoadingList, 
    currentPage, 
    hasNextPage, 
    loadPosts 
  } = usePostStore();

  // 页面加载时获取帖子列表
  useEffect(() => {
    loadPosts({ pageNumber: 1, pageSize: 10 }).catch(() => {
      message.error('加载帖子列表失败');
    });
  }, [loadPosts]);

  // 加载更多帖子
  const handleLoadMore = async () => {
    try {
      await loadPosts({ pageNumber: currentPage + 1, pageSize: 10 });
    } catch (error) {
      message.error('加载更多帖子失败');
    }
  };

  // 跳转到帖子详情
  const handlePostClick = (postId: number) => {
    navigate(`/posts/${postId}`);
  };

  // 处理发帖按钮点击
  const handleCreatePostClick = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    navigate('/posts/create');
  };

  // 渲染帖子状态图标
  const renderStatusIcon = (post: any) => {
    const icons = [];
    
    if (post.isPinned) {
      icons.push(
        <Tag color="gold" key="pinned" icon={<PushpinOutlined />}>
          置顶
        </Tag>
      );
    }
    
    if (post.isLocked) {
      icons.push(
        <Tag color="default" key="locked" icon={<LockOutlined />}>
          已锁定
        </Tag>
      );
    }
    
    return icons;
  };

  // 渲染帖子项
  const renderPostItem = (post: any) => (
    <List.Item key={post.id}>
      <Card 
        hoverable 
        className="voxnest-post-card"
        style={{ width: '100%' }}
        onClick={() => handlePostClick(post.id)}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {renderStatusIcon(post)}
          </Space>
        </div>
        
        <Title level={4} style={{ marginBottom: '8px', cursor: 'pointer' }}>
          {post.title}
        </Title>
        
        {post.summary && (
          <Paragraph 
            ellipsis={{ rows: 2 }} 
            style={{ marginBottom: '12px', color: '#666' }}
          >
            {post.summary}
          </Paragraph>
        )}
        
        {/* 分类和标签 */}
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {post.category && (
              <Tag color="blue">{post.category.name}</Tag>
            )}
            {post.tags.map((tag: any) => (
              <Tag key={tag.id} color={tag.color || 'default'}>
                {tag.name}
              </Tag>
            ))}
          </Space>
        </div>
        
        {/* 帖子信息 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Space>
            <Avatar 
              src={post.author.avatar} 
              size="small"
            >
              {post.author.displayName?.[0] || post.author.username[0]}
            </Avatar>
            <Text strong>{post.author.displayName || post.author.username}</Text>
            <Text type="secondary">•</Text>
            <Text type="secondary">
              {dayjs(post.publishedAt || post.createdAt).fromNow()}
            </Text>
          </Space>
          
          <Space size="large">
            <Space size="small">
              <EyeOutlined />
              <span>{post.viewCount}</span>
            </Space>
            <Space size="small">
              <LikeOutlined />
              <span>{post.likeCount}</span>
            </Space>
            <Space size="small">
              <MessageOutlined />
              <span>{post.commentCount}</span>
            </Space>
          </Space>
        </div>
      </Card>
    </List.Item>
  );

  return (
    <div>
      {/* 欢迎横幅 */}
      <div className="voxnest-banner">
        <Title level={1} style={{ color: 'white', marginBottom: '16px', fontSize: '32px' }}>
          欢迎来到VoxNest
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
          分享你的奇思妙想
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>

      {isLoadingList && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : posts.length === 0 ? (
        <Empty 
          description="暂无帖子"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '48px 0' }}
        >
          <Button type="primary" onClick={handleCreatePostClick}>
            {isAuthenticated ? '发布第一篇帖子' : '登录后发布帖子'}
          </Button>
        </Empty>
      ) : (
        <>
          <List
            dataSource={posts}
            renderItem={renderPostItem}
            style={{ background: 'transparent' }}
          />
          
          {hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button 
                size="large"
                loading={isLoadingList}
                onClick={handleLoadMore}
              >
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 站点统计 */}
          <Card className="voxnest-stats-card" style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                📊 站点统计
              </Title>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="总用户数"
                  value={5}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="在线用户"
                  value={0}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="注册用户"
                  value={2}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 热门话题 */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 热门话题
              </Title>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                还没有评论，快来抢沙发吧！
              </p>
            </div>
          </Card>

          {/* 随机标签 */}
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0 }}>
                🏷️ 随机标签
              </Title>
            </div>
            <Space wrap>
              <Tag color="#4F46E5">#VoxNest</Tag>
              <Tag color="#7C3AED">#论坛</Tag>
              <Tag color="#0EA5E9">#技术</Tag>
              <Tag color="#10B981">#分享</Tag>
              <Tag color="#F59E0B">#交流</Tag>
              <Tag color="#EF4444">#讨论</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
