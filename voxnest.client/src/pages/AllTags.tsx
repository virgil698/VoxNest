import React, { useEffect, useState, useCallback } from 'react';
import { 
  Typography, 
  Card, 
  Space, 
  Breadcrumb, 
  Spin,
  Row,
  Col,
  Button,
  Avatar,
  Divider,
  Tag,
  Statistic,
  message
} from 'antd';
import { 
  HomeOutlined, 
  TagsOutlined, 
  LockOutlined,
  MessageOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Users, UserCheck, FileText, BarChart3, Megaphone, Flame, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tagApi } from '../api/tag';
import { postApi } from '../api/post';
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

interface TagStats {
  totalPosts: number;
  latestPost: any | null;
}

interface TagStatsMap {
  [tagId: number]: TagStats;
}

const AllTags: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, stats, isReady } = useFrameworkStatus();

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

  // 获取常驻标签
  const { data: permanentTags = [], isLoading: loadingPermanent } = useQuery({
    queryKey: ['permanent-tags'],
    queryFn: async () => {
      const response = await tagApi.getPermanentTags();
      return response.data.data || [];
    },
  });

  // 获取动态标签
  const { data: dynamicTags = [], isLoading: loadingDynamic } = useQuery({
    queryKey: ['all-dynamic-tags'],
    queryFn: async () => {
      const response = await tagApi.getDynamicTags();
      return response.data.data || [];
    },
  });

  // 获取常驻标签的统计信息
  const { data: permanentTagsStats = {}, isLoading: loadingStats } = useQuery<TagStatsMap>({
    queryKey: ['permanent-tags-stats', permanentTags],
    queryFn: async (): Promise<TagStatsMap> => {
      if (!permanentTags.length) return {};
      
      const stats: TagStatsMap = {};
      
      // 并行获取每个常驻标签的统计信息
      const promises = permanentTags.map(async (tag: any) => {
        try {
          // 获取该标签的帖子列表（只获取第一页来统计和获取最新帖子）
          const postsResponse = await postApi.getPostsByTag(tag.id, { pageNumber: 1, pageSize: 5 });
          const postsData = postsResponse.data.data as any;
          
          stats[tag.id] = {
            totalPosts: postsData?.totalCount || 0,
            latestPost: postsData?.items?.[0] || null,
          };
        } catch (error) {
          console.warn(`Failed to fetch stats for tag ${tag.id}:`, error);
          stats[tag.id] = {
            totalPosts: 0,
            latestPost: null,
          };
        }
      });
      
      await Promise.all(promises);
      return stats;
    },
    enabled: permanentTags.length > 0,
  });

  // 获取动态标签的统计信息
  const { data: dynamicTagsStats = {}, isLoading: loadingDynamicStats } = useQuery<TagStatsMap>({
    queryKey: ['dynamic-tags-stats', dynamicTags],
    queryFn: async (): Promise<TagStatsMap> => {
      if (!dynamicTags.length) return {};
      
      const stats: TagStatsMap = {};
      
      // 并行获取每个动态标签的统计信息
      const promises = dynamicTags.map(async (tag: any) => {
        try {
          // 获取该标签的帖子列表（只获取第一页来统计和获取最新帖子）
          const postsResponse = await postApi.getPostsByTag(tag.id, { pageNumber: 1, pageSize: 5 });
          const postsData = postsResponse.data.data as any;
          
          stats[tag.id] = {
            totalPosts: postsData?.totalCount || 0,
            latestPost: postsData?.items?.[0] || null,
          };
        } catch (error) {
          console.warn(`Failed to fetch stats for tag ${tag.id}:`, error);
          stats[tag.id] = {
            totalPosts: 0,
            latestPost: null,
          };
        }
      });
      
      await Promise.all(promises);
      return stats;
    },
    enabled: dynamicTags.length > 0,
  });

  const isLoading = loadingPermanent || loadingDynamic || loadingStats || loadingDynamicStats;

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

  // 处理标签点击
  const handleTagClick = (tag: any) => {
    navigate(`/tags/${tag.slug}?name=${encodeURIComponent(tag.name)}`);
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return '今天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    }
    return date.toLocaleDateString('zh-CN');
  };

  // 渲染论坛板块样式的常驻标签
  const renderForumStylePermanentTags = () => {
    if (permanentTags.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: 32 }}>
        {/* 标题区域 - 单独的颜色背景 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px 12px 0 0',
          padding: '24px 32px',
          marginBottom: 0
        }}>
          <Title level={3} style={{ 
            margin: 0, 
            color: 'white', 
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 600
          }}>
            <LockOutlined style={{ marginRight: 12, fontSize: 24 }} />
            常驻分类
          </Title>
          <Text style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 15, 
            display: 'block', 
            marginTop: 8,
            lineHeight: 1.5
          }}>
            系统管理的分类标签，帖子必须选择至少一个分类
          </Text>
        </div>

        {/* 列表区域 - 白色背景 */}
        <Card 
          style={{
            borderRadius: '0 0 12px 12px',
            borderTop: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[0, 1]}>
            {permanentTags.map((tag, index) => {
              const stats = permanentTagsStats[tag.id] || { totalPosts: 0, latestPost: null };
              const latestPost = stats.latestPost;
              
              return (
                <Col key={tag.id} span={24}>
                  <div
                    style={{ 
                      cursor: 'pointer',
                      padding: '20px 24px',
                      borderBottom: index < permanentTags.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'all 0.2s ease',
                      borderRadius: '6px'
                    }}
                    className="tag-item"
                    onClick={() => handleTagClick(tag)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Row align="middle" style={{ minHeight: 60 }}>
                      {/* 左侧：标签信息 */}
                      <Col span={6}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            size={48}
                            style={{
                              backgroundColor: tag.color || '#52c41a',
                              marginRight: 16,
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            icon={<LockOutlined style={{ fontSize: 20 }} />}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Title level={4} style={{ 
                              margin: 0, 
                              marginBottom: 4, 
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#262626'
                            }}>
                              {tag.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              常驻分类
                            </Text>
                          </div>
                        </div>
                      </Col>

                      {/* 中间：统计信息 */}
                      <Col span={6} style={{ textAlign: 'center' }}>
                        <Row gutter={24}>
                          <Col span={12}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 600, 
                                color: '#262626',
                                marginBottom: 4
                              }}>
                                {stats.totalPosts}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FileTextOutlined style={{ marginRight: 4, fontSize: '12px' }} />
                                帖子数
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 600, 
                                color: '#262626',
                                marginBottom: 4
                              }}>
                                {tag.useCount}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <MessageOutlined style={{ marginRight: 4, fontSize: '12px' }} />
                                使用次数
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Col>

                      {/* 右侧：最新帖子 */}
                      <Col span={12} style={{ paddingLeft: '24px', borderLeft: '1px solid #f0f0f0' }}>
                        {latestPost ? (
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 13, color: '#8c8c8c' }}>最新帖子</Text>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <Paragraph
                                ellipsis={{ rows: 1 }}
                                style={{ 
                                  margin: 0, 
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  color: '#262626'
                                }}
                              >
                                {latestPost.title}
                              </Paragraph>
                            </div>
                            <Space size="small" style={{ fontSize: 12, color: '#8c8c8c' }}>
                              <UserOutlined />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {latestPost.author?.displayName || latestPost.author?.username || '未知用户'}
                              </Text>
                              <Divider type="vertical" />
                              <ClockCircleOutlined />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {latestPost.publishedAt ? formatTime(latestPost.publishedAt) : '未知时间'}
                              </Text>
                            </Space>
                          </div>
                        ) : (
                          <div style={{ color: '#bfbfbf', textAlign: 'center', fontSize: '14px' }}>
                            <Text type="secondary">暂无帖子</Text>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      </div>
    );
  };

  // 渲染论坛板块样式的动态标签
  const renderForumStyleDynamicTags = () => {
    if (dynamicTags.length === 0) {
      return null;
    }

    // 按使用次数排序动态标签
    const sortedDynamicTags = [...dynamicTags].sort((a, b) => b.useCount - a.useCount);

    return (
      <div style={{ marginBottom: 32 }}>
        {/* 标题区域 - 单独的颜色背景 */}
        <div style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          borderRadius: '12px 12px 0 0',
          padding: '24px 32px',
          marginBottom: 0
        }}>
          <Title level={3} style={{ 
            margin: 0, 
            color: 'white', 
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 600
          }}>
            <TagsOutlined style={{ marginRight: 12, fontSize: 24 }} />
            动态标签
          </Title>
          <Text style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 15, 
            display: 'block', 
            marginTop: 8,
            lineHeight: 1.5
          }}>
            用户创建的标签，可选择多个，无引用时自动清理
          </Text>
        </div>

        {/* 列表区域 - 白色背景 */}
        <Card 
          style={{
            borderRadius: '0 0 12px 12px',
            borderTop: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[0, 1]}>
            {sortedDynamicTags.map((tag, index) => {
              const stats = dynamicTagsStats[tag.id] || { totalPosts: 0, latestPost: null };
              const latestPost = stats.latestPost;
              
              return (
                <Col key={tag.id} span={24}>
                  <div
                    style={{ 
                      cursor: 'pointer',
                      padding: '20px 24px',
                      borderBottom: index < sortedDynamicTags.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'all 0.2s ease',
                      borderRadius: '6px'
                    }}
                    className="tag-item"
                    onClick={() => handleTagClick(tag)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Row align="middle" style={{ minHeight: 60 }}>
                      {/* 左侧：标签信息 */}
                      <Col span={6}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            size={48}
                            style={{
                              backgroundColor: tag.color || '#1890ff',
                              marginRight: 16,
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            icon={<TagsOutlined style={{ fontSize: 20 }} />}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Title level={4} style={{ 
                              margin: 0, 
                              marginBottom: 4, 
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#262626'
                            }}>
                              {tag.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              动态标签
                            </Text>
                          </div>
                        </div>
                      </Col>

                      {/* 中间：统计信息 */}
                      <Col span={6} style={{ textAlign: 'center' }}>
                        <Row gutter={24}>
                          <Col span={12}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 600, 
                                color: '#262626',
                                marginBottom: 4
                              }}>
                                {stats.totalPosts}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FileTextOutlined style={{ marginRight: 4, fontSize: '12px' }} />
                                帖子数
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 600, 
                                color: '#262626',
                                marginBottom: 4
                              }}>
                                {tag.useCount}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <MessageOutlined style={{ marginRight: 4, fontSize: '12px' }} />
                                使用次数
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Col>

                      {/* 右侧：最新帖子 */}
                      <Col span={12} style={{ paddingLeft: '24px', borderLeft: '1px solid #f0f0f0' }}>
                        {latestPost ? (
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 13, color: '#8c8c8c' }}>最新帖子</Text>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <Paragraph
                                ellipsis={{ rows: 1 }}
                                style={{ 
                                  margin: 0, 
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  color: '#262626'
                                }}
                              >
                                {latestPost.title}
                              </Paragraph>
                            </div>
                            <Space size="small" style={{ fontSize: 12, color: '#8c8c8c' }}>
                              <UserOutlined />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {latestPost.author?.displayName || latestPost.author?.username || '未知用户'}
                              </Text>
                              <Divider type="vertical" />
                              <ClockCircleOutlined />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {latestPost.publishedAt ? formatTime(latestPost.publishedAt) : '未知时间'}
                              </Text>
                            </Space>
                          </div>
                        ) : (
                          <div style={{ color: '#bfbfbf', textAlign: 'center', fontSize: '14px' }}>
                            <Text type="secondary">暂无帖子</Text>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>
          {/* 欢迎横幅 */}
          <div className="voxnest-compact-banner">
            <div className="voxnest-compact-content">
              <Title level={2} className="voxnest-compact-title">
                标签广场
              </Title>
              <Text className="voxnest-compact-subtitle">
                浏览所有标签，发现更多感兴趣的话题
              </Text>
            </div>
          </div>

          {/* 面包屑导航 */}
          <Breadcrumb style={{ marginBottom: 20 }}>
            <Breadcrumb.Item>
              <HomeOutlined onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <TagsOutlined />
              所有标签
            </Breadcrumb.Item>
          </Breadcrumb>


          {/* 加载状态 */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#666' }}>
                加载标签中...
              </div>
            </div>
          )}

          {/* 标签内容 */}
          {!isLoading && (
            <div>
              {/* 使用论坛板块样式渲染常驻标签 */}
              {renderForumStylePermanentTags()}
              
              {/* 使用论坛板块样式渲染动态标签 */}
              {renderForumStyleDynamicTags()}
            </div>
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

export default AllTags;
