import React, { useEffect } from 'react';
import { Card, List, Avatar, Tag, Space, Typography, Button, Spin, Empty, message, Row, Col, Statistic } from 'antd';
import { 
  EyeOutlined, 
  LikeOutlined, 
  MessageOutlined,
  PushpinOutlined,
  LockOutlined
} from '@ant-design/icons';
import { Users, UserCheck, FileText, BarChart3, Megaphone, Flame, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../stores/postStore';
import { useAuthStore } from '../stores/authStore';
import { useFrameworkStatus } from '../extensions';

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
  const { status, stats, isReady } = useFrameworkStatus();
  const { 
    posts, 
    isLoadingList, 
    currentPage, 
    hasNextPage, 
    loadPosts 
  } = usePostStore();

  // 页面加载时获取帖子列表
  useEffect(() => {
    loadPosts({ pageNumber: 1, pageSize: 10 }).catch((error) => {
      // 404错误已经在store中处理了，不显示错误信息
      if (error.response?.status !== 404 && error.status !== 404) {
        message.error('加载帖子列表失败');
      }
    });
  }, [loadPosts]);

  // 加载更多帖子
  const handleLoadMore = async () => {
    try {
      await loadPosts({ pageNumber: currentPage + 1, pageSize: 10 });
    } catch (error: any) {
      // 404错误已经在store中处理了，不显示错误信息
      if (error.response?.status !== 404 && error.status !== 404) {
        message.error('加载更多帖子失败');
      }
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
      <Row gutter={[24, 24]}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>
          {/* 欢迎横幅 */}
          <div className="voxnest-compact-banner">
            <div className="voxnest-compact-content">
              <Title level={2} className="voxnest-compact-title">
                欢迎来到VoxNest论坛
              </Title>
              <Text className="voxnest-compact-subtitle">
                分享你的想法和故事
              </Text>
            </div>
          </div>

      {isLoadingList && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : posts.length === 0 ? (
        <Empty 
          description={
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
                还没有任何帖子
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                成为第一个分享想法的人吧！
              </p>
            </div>
          }
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
          {/* 扩展框架状态 */}
          <Card style={{ marginBottom: '24px', border: '1px solid #52c41a' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#52c41a' }}>🔧</span>
                扩展框架
                <Tag color="success">已激活</Tag>
              </Title>
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                ✅ 框架状态: <Tag color={isReady ? "green" : "orange"}>{status}</Tag>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                🔌 集成数量: <strong>{stats?.integrations?.total || 0}个</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                🎯 活跃槽位: <strong>{stats?.slots?.total || 0}个</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                📦 组件数量: <strong>{stats?.slots?.components || 0}个</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                📊 日志系统: <Tag color="cyan">已激活</Tag>
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                📍 查看头部右侧演示按钮，点击后将生成日志记录
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999' }}>
                  🛠️ 开发模式：按 Ctrl+Shift+V 查看详细统计
                </p>
              )}
            </div>
          </Card>

          {/* 站点公告 */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} style={{ color: 'var(--primary-color)' }} />
                站点公告
              </Title>
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 12px 0' }}>欢迎来到VoxNest论坛！</p>
              <p style={{ margin: '0 0 12px 0' }}>• 请遵守社区规则，友好交流</p>
              <p style={{ margin: '0 0 12px 0' }}>• 发帖前请搜索是否有相似话题</p>
              <p style={{ margin: 0 }}>• 有问题请联系管理员</p>
            </div>
          </Card>

          {/* 站点统计 */}
          <Card className="voxnest-stats-card" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <Title level={4} style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} style={{ color: 'var(--purple-primary)' }} />
                站点统计
              </Title>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="总用户数"
                  value={5}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<Users size={20} style={{ color: 'var(--purple-primary)' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="在线用户"
                  value={0}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<UserCheck size={20} style={{ color: 'var(--purple-primary)' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="注册用户"
                  value={2}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<FileText size={20} style={{ color: 'var(--purple-primary)' }} />}
                />
              </Col>
            </Row>
          </Card>

          {/* 热门话题 */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} style={{ color: '#F59E0B' }} />
                热门话题
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
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tags size={18} style={{ color: '#10B981' }} />
                随机标签
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
