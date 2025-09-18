import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Card, 
  Tag, 
  Space, 
  Breadcrumb, 
  Alert,
  Spin,
  Empty,
  Pagination,
  Button,
  Row,
  Col,
  Statistic,
  message,
  Divider
} from 'antd';
import { 
  HomeOutlined, 
  TagsOutlined, 
  LockOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  UserOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Users, UserCheck, FileText, BarChart3, Megaphone, Flame, Tags } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postApi } from '../api/post';
import { tagApi } from '../api/tag';
import { useAuthStore } from '../stores/authStore';
import { useFrameworkStatus } from '../extensions';
import { adminApi, type SiteStats } from '../api/admin';
import type { PostListItem } from '../types/post';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import '../styles/TagPosts.css';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Paragraph } = Typography;

interface TagInfo {
  id: number;
  name: string;
  slug: string;
  color?: string;
  isPermanent: boolean;
  useCount: number;
}

const TagPosts: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, stats } = useFrameworkStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 扩展框架显示状态管理
  const [showExtensionPanel, setShowExtensionPanel] = useState(() => {
    // 检查是否是管理员
    const isAdmin = user?.roles?.includes('Admin');
    if (!isAdmin) return false;
    
    // 检查今日是否已关闭
    const today = new Date().toDateString();
    const closedToday = localStorage.getItem(`extensionPanel_closed_${today}`);
    return closedToday !== 'true';
  });

  // 站点统计数据状态
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // const tagName = searchParams.get('name') || slug || '';  // 暂时不需要

  // 获取标签信息
  const { data: tagInfo, isLoading: loadingTag } = useQuery({
    queryKey: ['tag-info', slug],
    queryFn: async (): Promise<TagInfo | null> => {
      // 先尝试从常驻标签中查找
      const permanentResponse = await tagApi.getPermanentTags();
      const permanentTags = permanentResponse.data.data || [];
      const permanentTag = permanentTags.find((tag: any) => tag.slug === slug);
      
      if (permanentTag) {
        return {
          id: permanentTag.id,
          name: permanentTag.name,
          slug: (permanentTag as any).slug,
          color: permanentTag.color,
          isPermanent: true,
          useCount: permanentTag.useCount
        };
      }

      // 再从动态标签中查找
      const dynamicResponse = await tagApi.getDynamicTags();
      const dynamicTags = dynamicResponse.data.data || [];
      const dynamicTag = dynamicTags.find((tag: any) => tag.slug === slug);
      
      if (dynamicTag) {
        return {
          id: dynamicTag.id,
          name: dynamicTag.name,
          slug: (dynamicTag as any).slug,
          color: dynamicTag.color,
          isPermanent: false,
          useCount: dynamicTag.useCount
        };
      }

      return null;
    },
    enabled: !!slug,
  });

  // 获取使用该标签的帖子列表
  const { data: postsData, isLoading: loadingPosts, error } = useQuery({
    queryKey: ['tag-posts', tagInfo?.id, currentPage, pageSize],
    queryFn: async () => {
      if (!tagInfo?.id) return null;
      const response = await postApi.getPostsByTag(tagInfo.id, {
        pageNumber: currentPage,
        pageSize,
      });
      return response.data.data;
    },
    enabled: !!tagInfo?.id,
  });

  const isLoading = loadingTag || loadingPosts;

  // 当用户信息变化时更新显示状态
  useEffect(() => {
    const isAdmin = user?.roles?.includes('Admin');
    if (!isAdmin) {
      setShowExtensionPanel(false);
      return;
    }
    
    // 管理员登录时检查今日是否已关闭
    const today = new Date().toDateString();
    const closedToday = localStorage.getItem(`extensionPanel_closed_${today}`);
    setShowExtensionPanel(closedToday !== 'true');
  }, [user]);

  // 关闭扩展面板
  const handleCloseExtensionPanel = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`extensionPanel_closed_${today}`, 'true');
    setShowExtensionPanel(false);
    message.success('扩展框架面板已关闭，明天会重新显示');
  };

  // 获取站点统计数据
  const loadSiteStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await adminApi.getSiteStats();
      setSiteStats(stats);
    } catch (error) {
      console.error('获取站点统计失败:', error);
      // 不显示错误消息，使用静默失败，显示默认数据
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 优化的在线用户计算逻辑
  const calculateOnlineUsers = useCallback(() => {
    // 生成或获取设备唯一标识
    const getDeviceId = () => {
      let deviceId = localStorage.getItem('voxnest_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('voxnest_device_id', deviceId);
      }
      return deviceId;
    };

    // 更新当前会话的最后活跃时间
    const updateActiveSession = () => {
      const deviceId = getDeviceId();
      const now = Date.now();
      const activeSessions = JSON.parse(localStorage.getItem('voxnest_active_sessions') || '{}');
      
      // 清除超过5分钟未活跃的会话
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      Object.keys(activeSessions).forEach(sessionId => {
        if (activeSessions[sessionId] < fiveMinutesAgo) {
          delete activeSessions[sessionId];
        }
      });

      // 更新当前设备的活跃时间
      activeSessions[deviceId] = now;
      localStorage.setItem('voxnest_active_sessions', JSON.stringify(activeSessions));
      
      return Object.keys(activeSessions).length;
    };

    // 计算当前活跃会话数
    const activeSessionCount = updateActiveSession();
    
    // 基于真实数据和模拟数据的混合计算
    const baseOnlineUsers = Math.max(1, Math.floor((siteStats?.activeUsers || 0) * 0.08)); // 降低基础比例
    const sessionBasedUsers = Math.min(activeSessionCount, 10); // 限制最大会话贡献
    const randomVariation = Math.floor(Math.random() * 2); // 减少随机波动
    
    const totalOnlineUsers = baseOnlineUsers + sessionBasedUsers + randomVariation;
    setOnlineUsers(Math.max(1, totalOnlineUsers)); // 确保至少显示1个在线用户
  }, [siteStats, setOnlineUsers]);

  // 页面加载时获取站点统计数据
  useEffect(() => {
    loadSiteStats();
  }, []);

  // 当站点统计数据更新时，计算在线用户数
  useEffect(() => {
    if (siteStats) {
      calculateOnlineUsers();
    }
  }, [siteStats, calculateOnlineUsers]);

  // 定期更新在线用户数和活跃状态
  useEffect(() => {
    if (siteStats) {
      // 立即计算一次
      calculateOnlineUsers();
      
      // 每15秒更新一次在线用户数
      const interval = setInterval(calculateOnlineUsers, 15000);
      
      // 页面可见性变化时更新活跃状态
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // 页面变为可见时立即更新
          calculateOnlineUsers();
        }
      };
      
      // 页面获得焦点时更新
      const handleFocus = () => {
        calculateOnlineUsers();
      };
      
      // 鼠标移动或键盘活动时更新（节流）
      let activityTimeout: NodeJS.Timeout;
      const handleActivity = () => {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(calculateOnlineUsers, 1000);
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('mousemove', handleActivity);
      document.addEventListener('keydown', handleActivity);
      document.addEventListener('scroll', handleActivity);
      
      return () => {
        clearInterval(interval);
        clearTimeout(activityTimeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('mousemove', handleActivity);
        document.removeEventListener('keydown', handleActivity);
        document.removeEventListener('scroll', handleActivity);
      };
    }
  }, [siteStats, calculateOnlineUsers]);

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    if (days < 30) {
      return `${days}天前`;
    }
    return date.toLocaleDateString();
  };

  // 渲染帖子卡片
  const renderPostCard = (post: PostListItem) => (
    <Card
      key={post.id}
      className="forum-post-card"
      hoverable
      onClick={() => navigate(`/posts/${post.id}`)}
      bodyStyle={{ padding: '24px' }}
    >
      <div className="forum-post-content">
        {/* 帖子标题 */}
        <Title level={3} className="forum-post-title">
          {post.title}
        </Title>
        
        {/* 帖子摘要 */}
        {post.summary && (
          <Paragraph 
            className="forum-post-summary"
            ellipsis={{ rows: 2 }}
          >
            {post.summary}
          </Paragraph>
        )}
        
        {/* 标签区域 */}
        <div className="forum-post-tags">
          <Space wrap size={[8, 8]}>
            {post.tags?.map(tag => (
              <Tag
                key={tag.id}
                color={tag.color || 'blue'}
                className="forum-post-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tag.slug !== slug) {
                    navigate(`/tags/${tag.slug}?name=${encodeURIComponent(tag.name)}`);
                  }
                }}
              >
                {tag.name}
              </Tag>
            ))}
          </Space>
        </div>
        
        {/* 帖子元信息 */}
        <div className="forum-post-meta">
          <div className="forum-post-author">
            <UserOutlined className="forum-post-meta-icon" />
            <span className="forum-post-author-name">
              {post.author.displayName || post.author.username}
            </span>
            <span className="forum-post-time">
              • {formatTime(post.createdAt)}
            </span>
          </div>
          <div className="forum-post-stats">
            <Space size={16}>
              <span className="forum-post-stat">
                <EyeOutlined className="forum-post-stat-icon" />
                {post.viewCount}
              </span>
              <span className="forum-post-stat">
                <LikeOutlined className="forum-post-stat-icon" />
                {post.likeCount}
              </span>
              <span className="forum-post-stat">
                <MessageOutlined className="forum-post-stat-icon" />
                {post.commentCount}
              </span>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>
          正在加载标签信息和帖子列表...
        </div>
      </div>
    );
  }

  if (!tagInfo) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="标签不存在"
          description="您访问的标签不存在或已被删除。"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description="无法加载帖子列表，请稍后重试。"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              重新加载
            </Button>
          }
        />
      </div>
    );
  }

  const posts = (postsData as any)?.data || [];
  const totalCount = (postsData as any)?.totalCount || 0;

  return (
    <div>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>
          <HomeOutlined onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <AppstoreOutlined onClick={() => navigate('/tags')} style={{ cursor: 'pointer' }} />
          <span onClick={() => navigate('/tags')} style={{ cursor: 'pointer', marginLeft: 4 }}>
            标签广场
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Tag 
            color={tagInfo.color || (tagInfo.isPermanent ? 'green' : 'blue')}
            style={{ margin: 0 }}
          >
            {tagInfo.isPermanent && <LockOutlined style={{ marginRight: 4, fontSize: 10 }} />}
            {tagInfo.name}
          </Tag>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[24, 24]}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>

      {/* 标签信息头部 */}
      <div className="tag-info-header">
        {/* 标题区域 - 渐变背景 */}
        <div className="tag-info-title-section">
          <div className="tag-info-title-content">
            <div className="tag-info-left">
              <div 
                className="tag-info-avatar"
                style={{ 
                  background: tagInfo.color || (tagInfo.isPermanent ? 
                    'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' : 
                    'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)')
                }}
              >
                {tagInfo.isPermanent ? <LockOutlined /> : <TagsOutlined />}
              </div>
              <div className="tag-info-details">
                <h2>{tagInfo.name}</h2>
                <div className="tag-info-meta">
                  {tagInfo.isPermanent ? '常驻标签 (分类)' : '动态标签'}
                </div>
                <div className="tag-info-stats">
                  <div className="tag-info-stat-item">
                    <FileTextOutlined />
                    <span>共 {totalCount} 篇帖子</span>
                  </div>
                  <div className="tag-info-stat-item">
                    <ThunderboltOutlined />
                    <span>累计使用 {tagInfo.useCount} 次</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="tag-info-actions">
              <button 
                className="tag-info-btn"
                onClick={() => navigate('/tags')}
              >
                <AppstoreOutlined style={{ marginRight: 6 }} />
                浏览所有标签
              </button>
              {tagInfo.isPermanent && (
                <button 
                  className="tag-info-btn primary"
                  onClick={() => navigate('/posts/create')}
                >
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  发布帖子
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 - 白色背景 */}
        <Card className="tag-info-content-section" bodyStyle={{ padding: '24px 32px' }}>
          <Row gutter={32}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                  {totalCount}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  相关帖子
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                  {tagInfo.useCount}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  <ThunderboltOutlined style={{ marginRight: 4 }} />
                  使用次数
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                  {tagInfo.isPermanent ? '常驻' : '动态'}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  {tagInfo.isPermanent ? <LockOutlined style={{ marginRight: 4 }} /> : <TagsOutlined style={{ marginRight: 4 }} />}
                  标签类型
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 帖子列表 */}
      <div className="posts-section">
        {posts.length === 0 ? (
          <div className="posts-empty">
            <Empty
              description="暂无使用此标签的帖子"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/posts/create')}>
                <FileTextOutlined style={{ marginRight: 6 }} />
                发布第一篇帖子
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            {posts.map(renderPostCard)}
            
            {totalCount > pageSize && (
              <div className="posts-pagination">
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </div>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 扩展框架状态 - 仅管理员可见且今日未关闭 */}
          {showExtensionPanel && (
            <Card 
              style={{ 
                marginBottom: '24px', 
                border: '1px solid #52c41a',
                position: 'relative'
              }}
            >
              {/* 关闭按钮 */}
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleCloseExtensionPanel}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 1,
                  color: '#999',
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
                title="关闭面板（今日不再显示）"
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                  e.currentTarget.style.color = '#ff4d4f';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              />
              
              <div style={{ marginBottom: '16px', marginRight: '32px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#52c41a' }}>🔧</span>
                  扩展框架
                  <Tag color="success">已激活</Tag>
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    管理状态: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{status || 'ready'}</span>
                  </div>
                  <Divider type="vertical" style={{ margin: '0 8px' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    扩展数量: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{(stats as any)?.loadedExtensions || 0}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 8px 0' }}>🔥 扩展框架正常运行中，点击右上角可关闭</p>
                <p style={{ margin: '0 0 8px 0' }}>📋 开发者正在上传更多有趣的扩展</p>
                <p style={{ margin: 0 }}>🛠️ 更多功能正在路上，请持续关注</p>
              </div>
            </Card>
          )}

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
                {isLoadingStats && <Spin size="small" style={{ marginLeft: '8px' }} />}
              </Title>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="总用户数"
                  value={siteStats?.totalUsers || 0}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<Users size={20} style={{ color: 'var(--purple-primary)' }} />}
                  loading={isLoadingStats}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="在线用户"
                  value={onlineUsers}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<UserCheck size={20} style={{ color: 'var(--purple-primary)' }} />}
                  loading={isLoadingStats}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="注册用户"
                  value={siteStats?.activeUsers || 0}
                  valueStyle={{ color: 'var(--purple-primary)', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<FileText size={20} style={{ color: 'var(--purple-primary)' }} />}
                  loading={isLoadingStats}
                />
              </Col>
            </Row>
            {siteStats && (
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid #f0f0f0',
                fontSize: '12px',
                color: '#999',
                textAlign: 'center'
              }}>
                数据更新时间: {dayjs(siteStats.generatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            )}
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

export default TagPosts;
