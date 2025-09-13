import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Spin, 
  message,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Users, UserCheck, FileText, BarChart3, Megaphone, Flame, Tags, Calendar, BookOpen, Hash, Clock, Type } from 'lucide-react';
import { usePostStore } from '../../stores/postStore';
import { useAuthStore } from '../../stores/authStore';
import { adminApi, type SiteStats } from '../../api/admin';
import dayjs from 'dayjs';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize from 'rehype-sanitize';
import { videoEmbedSchema, processAllVideoEmbeds } from '../../utils/videoEmbedConfig';

const { Title, Text } = Typography;

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, isLoadingDetail, loadPost, deletePost, clearCurrentPost } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();

  // 站点统计数据状态
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

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

  useEffect(() => {
    if (id) {
      const postId = parseInt(id, 10);
      if (!isNaN(postId)) {
        loadPost(postId).catch(() => {
          message.error('加载帖子详情失败');
          navigate('/');
        });
      } else {
        message.error('无效的帖子ID');
        navigate('/');
      }
    }

    return () => {
      clearCurrentPost();
    };
  }, [id, loadPost, clearCurrentPost, navigate]);

  // 获取站点统计数据
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

  const handleBack = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!currentPost) return;
    
    try {
      await deletePost(currentPost.id);
      message.success('帖子删除成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '删除帖子失败');
    }
  };

  if (isLoadingDetail) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text>帖子不存在</Text>
        <br />
        <Button onClick={handleBack} style={{ marginTop: '16px' }}>
          返回
        </Button>
      </div>
    );
  }

  const isAuthor = isAuthenticated && user && user.id === currentPost.author.id;

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>
          {/* 顶部操作栏 */}
          <Card style={{ 
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0'
            }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
                style={{ borderRadius: '8px' }}
              >
                返回
              </Button>
              
              {isAuthor && (
                <Space>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => message.info('编辑功能暂未实现')}
                    style={{ borderRadius: '8px' }}
                  >
                    编辑
                  </Button>
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    style={{ borderRadius: '8px' }}
                  >
                    删除
                  </Button>
                </Space>
              )}
            </div>
          </Card>

      <Card className="voxnest-post-card" style={{ marginBottom: '24px' }}>
        {/* 帖子标题 - 优化样式 */}
        <div style={{ 
          position: 'relative',
          marginBottom: '24px'
        }}>
          {/* 左侧蓝色边框条 - 紧贴标题 */}
          <div style={{
            position: 'absolute',
            left: '-24px',
            top: '8px',
            bottom: '8px',
            width: '4px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: '2px'
          }} />
          
          <Title level={1} style={{ 
            margin: '0 0 12px 0',
            fontSize: '28px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: 'var(--text-primary)'
          }}>
            {currentPost.title}
          </Title>
          
          {/* 元信息：参考图二样式 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            flexWrap: 'wrap',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            {/* 字数统计 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Type size={16} style={{ color: '#666' }} />
              <span>{currentPost.content?.length || 0} 字</span>
            </div>
            
            {/* 阅读时间 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: '#666' }} />
              <span>{Math.ceil((currentPost.content?.length || 0) / 400)} 分钟</span>
            </div>
            
            {/* 发布日期 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} style={{ color: '#666' }} />
              <span>{dayjs(currentPost.publishedAt || currentPost.createdAt).format('YYYY-MM-DD')}</span>
            </div>
            
            {/* 分类 */}
            {currentPost.category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} style={{ color: '#666' }} />
                <span>{currentPost.category.name}</span>
              </div>
            )}
            
            {/* 标签 */}
            {currentPost.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} style={{ color: '#666' }} />
                <span>{currentPost.tags.map(tag => tag.name).join(' / ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 作者和发布时间信息 */}
        <div style={{ 
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Avatar 
            src={currentPost.author.avatar} 
            size={64}
            style={{
              border: '3px solid var(--primary-color)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}
          >
            {currentPost.author.displayName?.[0] || currentPost.author.username[0]}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ 
                fontSize: '18px',
                color: 'var(--text-primary)'
              }}>
                {currentPost.author.displayName || currentPost.author.username}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                发布于 {dayjs(currentPost.publishedAt || currentPost.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
              {currentPost.updatedAt !== currentPost.createdAt && (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>•</span>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    更新于 {dayjs(currentPost.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 帖子内容 */}
        <div style={{ 
          marginBottom: '32px',
          lineHeight: '1.8',
          fontSize: '16px',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            fontSize: '16px',
            lineHeight: '1.8',
            margin: 0
          }}>
            <MDEditor.Markdown 
              source={processAllVideoEmbeds(currentPost.content || '')}
              style={{ 
                backgroundColor: 'transparent',
                fontSize: '16px',
                lineHeight: '1.8',
                color: 'var(--text-primary)'
              }}
              rehypePlugins={[[rehypeSanitize, videoEmbedSchema]]}
            />
          </div>
        </div>

        <Divider style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />

        {/* 统计信息 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <Space size="large">
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <EyeOutlined style={{ color: 'var(--primary-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.viewCount}</Text>
            </Space>
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <LikeOutlined style={{ color: 'var(--error-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.likeCount}</Text>
            </Space>
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <MessageOutlined style={{ color: 'var(--success-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.commentCount}</Text>
            </Space>
          </Space>
          
          <Space>
            <Button 
              icon={<LikeOutlined />}
              style={{
                borderRadius: '12px',
                padding: '8px 20px',
                fontWeight: '500',
                border: '2px solid var(--primary-color)',
                color: 'var(--primary-color)'
              }}
            >
              点赞
            </Button>
            <Button 
              type="primary"
              style={{
                borderRadius: '12px',
                padding: '8px 20px',
                fontWeight: '500',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none'
              }}
            >
              评论
            </Button>
          </Space>
        </div>
      </Card>

      {/* 评论区域 */}
      <Card 
        className="voxnest-post-card"
        style={{ marginTop: '24px' }}
        title={
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💬 全部回复 (0)
          </div>
        }
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <Text style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '8px'
          }}>
            还没有评论，快来抢沙发吧！
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            评论功能正在开发中...
          </Text>
        </div>
      </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
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

export default PostDetail;
