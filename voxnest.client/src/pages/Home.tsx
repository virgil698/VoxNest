import React, { useEffect, useState } from 'react';
import { Card, List, Avatar, Tag, Space, Typography, Button, Spin, Empty, message, Row, Col, Statistic } from 'antd';
import { 
  EyeOutlined, 
  LikeOutlined, 
  MessageOutlined,
  PushpinOutlined,
  LockOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Users, UserCheck, FileText, BarChart3, Megaphone, Flame, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../stores/postStore';
import { useAuthStore } from '../stores/authStore';
import { useFrameworkStatus } from '../extensions';
import { adminApi, type SiteStats } from '../api/admin';

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { status, stats, isReady } = useFrameworkStatus();
  const { 
    posts, 
    isLoadingList, 
    currentPage, 
    hasNextPage, 
    loadPosts 
  } = usePostStore();

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
  const calculateOnlineUsers = () => {
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
  };

  // 页面加载时获取帖子列表
  useEffect(() => {
    loadPosts({ pageNumber: 1, pageSize: 10 }).catch((error) => {
      // 404错误已经在store中处理了，不显示错误信息
      if (error.response?.status !== 404 && error.status !== 404) {
        message.error('加载帖子列表失败');
      }
    });
  }, [loadPosts]);

  // 页面加载时获取站点统计数据
  useEffect(() => {
    loadSiteStats();
  }, []);

  // 当站点统计数据更新时，计算在线用户数
  useEffect(() => {
    if (siteStats) {
      calculateOnlineUsers();
    }
  }, [siteStats]);

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
  }, [siteStats]);

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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                  e.currentTarget.style.color = '#ff4d4f';
                }}
                onMouseLeave={(e) => {
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
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    管理员专用
                  </Text>
                  <Text type="secondary" style={{ fontSize: '10px', color: '#bbb' }}>
                    • 点击右上角 ✕ 今日隐藏
                  </Text>
                </div>
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

export default Home;
