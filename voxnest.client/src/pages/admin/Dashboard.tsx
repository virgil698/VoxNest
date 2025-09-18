import React, { useState, useEffect, useCallback, startTransition } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Progress,
  Typography,
  Space,
  Button,
  Spin,
  message,
  Switch,
  Tooltip,
  Drawer,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  EyeOutlined,
  ReloadOutlined,
  TagsOutlined,
  DashboardOutlined,
  BarChartOutlined,
  EditOutlined,
  SaveOutlined,
  UndoOutlined,
  DragOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { AdminApi } from '../../api/admin';
import type { SiteOverview, SystemInfo } from '../../api/admin';
import { useLogger } from '../../hooks/useLogger';
import ActivityHeatmap from '../../components/admin/ActivityHeatmap';
import RecentActivity from '../../components/admin/RecentActivity';
import dayjs from 'dayjs';
import '../../styles/drag-drop.css';

const { Title, Text, Paragraph } = Typography;

// 组件配置接口
interface ComponentConfig {
  id: string;
  type: 'statistics' | 'heatmap' | 'recent-activity' | 'time-panel' | 'system-info' | 'categories' | 'tags';
  title: string;
  order: number;
  visible: boolean;
  size?: { xs: number; sm?: number; lg?: number };
}

// 组件尺寸选项
const sizeOptions = [
  // 大尺寸选项
  { label: '全宽', value: { xs: 24, lg: 24 }, description: '占满整行', category: 'large' },
  { label: '3/4宽', value: { xs: 24, lg: 18 }, description: '占3/4行宽', category: 'large' },
  { label: '2/3宽', value: { xs: 24, lg: 16 }, description: '占2/3行宽', category: 'large' },
  
  // 中等尺寸选项
  { label: '1/2宽', value: { xs: 24, lg: 12 }, description: '占半行宽度', category: 'medium' },
  { label: '1/3宽', value: { xs: 24, lg: 8 }, description: '占1/3行宽', category: 'medium' },
  { label: '1/4宽', value: { xs: 24, lg: 6 }, description: '占1/4行宽', category: 'medium' },
  
  // 小尺寸选项 - 新增
  { label: '1/6宽', value: { xs: 12, lg: 4 }, description: '占1/6行宽，紧凑型', category: 'small' },
  { label: '1/8宽', value: { xs: 12, lg: 3 }, description: '占1/8行宽，微型', category: 'small' },
  
  // 特殊尺寸选项 - 新增
  { label: '5/12宽', value: { xs: 24, lg: 10 }, description: '占5/12行宽', category: 'custom' },
  { label: '7/12宽', value: { xs: 24, lg: 14 }, description: '占7/12行宽', category: 'custom' },
  { label: '5/6宽', value: { xs: 24, lg: 20 }, description: '占5/6行宽', category: 'custom' },
];

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<SiteOverview | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemInfoLoading, setSystemInfoLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isEditMode, setIsEditMode] = useState(false);
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const logger = useLogger('Admin.Dashboard');

  // 默认组件配置
  const defaultComponents: ComponentConfig[] = [
    {
      id: 'statistics',
      type: 'statistics',
      title: '统计卡片',
      order: 0,
      visible: true,
      size: { xs: 24, lg: 24 }  // 全宽显示主要统计数据
    },
    {
      id: 'heatmap',
      type: 'heatmap',
      title: '活动热度图',
      order: 1,
      visible: true,
      size: { xs: 24, lg: 16 }  // 2/3宽度，为右侧工具框留空间
    },
    {
      id: 'time-panel',
      type: 'time-panel',
      title: '当前时间',
      order: 2,
      visible: true,
      size: { xs: 12, lg: 4 }   // 1/6宽 - 紧凑型工具框
    },
    {
      id: 'recent-activity',
      type: 'recent-activity',
      title: '最近活动统计',
      order: 3,
      visible: true,
      size: { xs: 24, lg: 12 }  // 1/2宽度，适中尺寸
    },
    {
      id: 'system-info',
      type: 'system-info',
      title: '系统信息',
      order: 4,
      visible: true,
      size: { xs: 12, lg: 4 }   // 1/6宽 - 紧凑型工具框
    },
    {
      id: 'categories',
      type: 'categories',
      title: '分类分布',
      order: 5,
      visible: true,
      size: { xs: 24, lg: 8 }   // 1/3宽度，为其他组件留空间
    },
    {
      id: 'tags',
      type: 'tags',
      title: '热门标签',
      order: 6,
      visible: true,
      size: { xs: 24, lg: 8 }   // 1/3宽度，与分类分布形成平衡
    }
  ];

  // 加载概览数据
  const loadOverview = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
    });
    
    try {
      const data = await AdminApi.getSiteOverview();
      
      startTransition(() => {
        setOverview(data);
        setLoading(false);
      });
      
      logger.debug('Loaded admin dashboard overview');
    } catch (error) {
      message.error('加载概览数据失败');
      logger.error('Failed to load admin overview', error as Error);
      
      startTransition(() => {
        setOverview(null);
        setLoading(false);
      });
    }
  }, [logger]);

  // 加载系统信息
  const loadSystemInfo = useCallback(async () => {
    setSystemInfoLoading(true);
    
    try {
      const data = await AdminApi.getSystemInfo();
      setSystemInfo(data);
      logger.debug('Loaded system info');
    } catch (error) {
      console.error('获取系统信息失败:', error);
      logger.error('Failed to load system info', error as Error);
      // 不显示错误消息，静默失败
    } finally {
      setSystemInfoLoading(false);
    }
  }, [logger]);

  useEffect(() => {
    // 使用 startTransition 包装异步操作
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        // 避免重复加载，如果数据已存在且较新则跳过
        if (!overview) {
          await loadOverview();
        }
        if (!systemInfo) {
          await loadSystemInfo();
        }
      } catch (error) {
        // 错误已在各自的函数中处理
        console.warn('Dashboard data loading failed:', error);
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, []); // 移除依赖，避免循环加载

  // 初始化组件配置
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        // 确保所有组件都有有效的配置
        const validatedLayout = parsedLayout.map((comp: ComponentConfig) => ({
          ...comp,
          size: comp.size || { xs: 24, lg: 12 }
        }));
        setComponents(validatedLayout);
      } catch (error) {
        console.warn('Failed to parse saved layout, using default');
        setComponents(defaultComponents);
      }
    } else {
      setComponents(defaultComponents);
    }
  }, []);

  // 保存布局到本地存储
  const saveLayout = useCallback(() => {
    localStorage.setItem('dashboard-layout', JSON.stringify(components));
    message.success('布局已保存');
  }, [components]);

  // 重置确认状态的超时处理
  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => {
        setResetConfirm(false);
      }, 3000); // 3秒后自动取消确认状态
      
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  // 重置布局
  const resetLayout = useCallback(() => {
    if (!resetConfirm) {
      // 第一次点击，进入确认状态
      setResetConfirm(true);
      message.warning('再次点击确认重置布局');
      return;
    }
    
    // 第二次点击，执行重置
    setComponents(defaultComponents);
    localStorage.removeItem('dashboard-layout');
    setResetConfirm(false);
    message.success('布局已重置');
  }, [resetConfirm]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const newComponents = Array.from(components);
    const [reorderedItem] = newComponents.splice(result.source.index, 1);
    newComponents.splice(result.destination.index, 0, reorderedItem);

    // 更新 order 字段
    const updatedComponents = newComponents.map((comp, index) => ({
      ...comp,
      order: index
    }));

    setComponents(updatedComponents);
  }, [components]);

  // 切换组件可见性
  const toggleComponentVisibility = useCallback((componentId: string) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId 
        ? { ...comp, visible: !comp.visible }
        : comp
    ));
  }, []);

  // 更新组件尺寸
  const updateComponentSize = useCallback((componentId: string, size: { xs: number; lg: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId 
        ? { ...comp, size }
        : comp
    ));
  }, []);

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
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
        <Button type="primary" onClick={() => { startTransition(() => { setLoading(true); }); loadOverview(); }} style={{ marginTop: '16px' }}>
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

  // 生成合并的活动热度图数据（用户注册 + 帖子发布）
  const getCombinedHeatmapData = () => {
    const data = [];
    const today = dayjs();
    for (let i = 149; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      const userCount = overview.userStats.recentNewUsers[date] || 0;
      const postCount = overview.postStats.recentPosts[date] || 0;
      data.push({
        date,
        userCount,
        postCount,
        totalCount: userCount + postCount,
      });
    }
    return data;
  };

  // 计算统计数据
  const calculateStats = () => {
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');

    // 用户统计
    const todayRegistrations = overview.userStats.recentNewUsers[todayStr] || 0;
    let weekRegistrations = 0;
    let monthRegistrations = 0;

    for (let i = 0; i < 7; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      weekRegistrations += overview.userStats.recentNewUsers[date] || 0;
    }

    for (let i = 0; i < 30; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      monthRegistrations += overview.userStats.recentNewUsers[date] || 0;
    }

    // 帖子统计
    const todayPosts = overview.postStats.recentPosts[todayStr] || 0;
    let weekPosts = 0;
    let monthPosts = 0;

    for (let i = 0; i < 7; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      weekPosts += overview.postStats.recentPosts[date] || 0;
    }

    for (let i = 0; i < 30; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      monthPosts += overview.postStats.recentPosts[date] || 0;
    }

    return {
      userStats: { todayRegistrations, weekRegistrations, monthRegistrations },
      postStats: { todayPosts, weekPosts, monthPosts }
    };
  };

  // 根据组件类型渲染具体内容
  const renderComponent = (component: ComponentConfig) => {
    const commonCardProps = {
      style: { marginBottom: 16 }
    };

    switch (component.type) {
      case 'statistics':
        return (
          <Card {...commonCardProps}>
            <Row gutter={[16, 16]}>
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
          </Card>
        );

      case 'heatmap':
        return (
          <Card 
            title="活动热度图"
            {...commonCardProps}
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => { 
                  startTransition(() => { setLoading(true); }); 
                  loadOverview(); 
                }}
              >
                刷新数据
              </Button>
            }
          >
            <ActivityHeatmap
              data={getCombinedHeatmapData()}
              title="用户注册和帖子发布活动 (最近150天)"
              colorScheme="green"
              maxDays={150}
            />
          </Card>
        );

      case 'recent-activity':
        return (
          <Card title="最近活动统计" {...commonCardProps}>
            <RecentActivity
              recentUsers={overview.recentActivity.recentRegistrations}
              recentPosts={overview.recentActivity.recentPosts}
              userStats={calculateStats().userStats}
              postStats={calculateStats().postStats}
            />
          </Card>
        );

      case 'time-panel':
        return (
          <Card 
            {...commonCardProps}
            style={{ 
              ...commonCardProps.style,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px'
            }}
            bodyStyle={{ 
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <div style={{ color: 'white' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                marginBottom: '8px',
                fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
              }}>
                {currentTime.format('HH:mm:ss')}
              </div>
              <div style={{ 
                fontSize: '14px', 
                opacity: 0.9,
                marginBottom: '4px'
              }}>
                {currentTime.format('YYYY年MM月DD日 dddd')}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                fontStyle: 'italic'
              }}>
                {(() => {
                  const hour = currentTime.hour();
                  if (hour < 6) return '🌙 深夜时光，注意休息';
                  if (hour < 9) return '🌅 早安！新的一天开始了';
                  if (hour < 12) return '☀️ 上午好！工作顺利';
                  if (hour < 14) return '🍽️ 午餐时间，记得用餐';
                  if (hour < 18) return '📈 下午好！继续加油';
                  if (hour < 22) return '🌆 晚上好！辛苦了';
                  return '🌃 夜深了，早点休息';
                })()}
              </div>
            </div>
          </Card>
        );

      case 'system-info':
        return (
          <Card 
            title="系统信息" 
            {...commonCardProps}
            loading={systemInfoLoading}
            extra={
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={loadSystemInfo}
                size="small"
                title="刷新系统信息"
              />
            }
            style={{ height: 'auto' }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column',
              padding: '16px'
            }}
          >
            {systemInfo ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px'
              }}>
                {/* 基础系统信息 */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: '#495057', 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <DashboardOutlined style={{ color: '#1890ff' }} />
                    系统概览
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>运行时间</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500 }}>{formatUptime(systemInfo.uptime)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>在线用户</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500, color: '#28a745' }}>
                        {overview.userStats.activeUsers} 人
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>系统版本</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500 }}>{systemInfo.dotNetVersion}</Text>
                    </div>
                  </div>
                </div>

                {/* 资源使用情况 */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: '#495057', 
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BarChartOutlined style={{ color: '#52c41a' }} />
                    资源监控
                  </div>
                  
                  {/* 内存使用 */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>内存使用</Text>
                      <Text style={{ fontSize: '11px', color: '#6c757d' }}>
                        {formatBytes(systemInfo.memoryUsage)} / {formatBytes(systemInfo.totalMemory)}
                      </Text>
                    </div>
                    <Progress
                      percent={Math.round((systemInfo.memoryUsage / systemInfo.totalMemory) * 100)}
                      size="small"
                      strokeColor={{
                        '0%': '#52c41a',
                        '70%': '#faad14',
                        '90%': '#ff4d4f',
                      }}
                      showInfo={false}
                    />
                  </div>

                  {/* 存储使用 */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>存储使用</Text>
                      <Text style={{ fontSize: '11px', color: '#6c757d' }}>
                        {formatBytes(systemInfo.usedStorage)} / {formatBytes(systemInfo.totalStorage)}
                      </Text>
                    </div>
                    <Progress
                      percent={Math.round(systemInfo.storageUsagePercent)}
                      size="small"
                      strokeColor={{
                        '0%': '#52c41a',
                        '70%': '#faad14',
                        '90%': '#ff4d4f',
                      }}
                      showInfo={false}
                    />
                  </div>

                  {/* 数据库信息 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>数据库大小</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500 }}>{formatBytes(systemInfo.databaseSize)}</Text>
                    </div>
                  </div>
                </div>

                {/* 运行环境 */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: '#495057', 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    运行环境
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>操作系统</Text>
                      <Text style={{ 
                        fontSize: '11px', 
                        fontWeight: 500, 
                        textAlign: 'right',
                        maxWidth: '180px',
                        lineHeight: '1.3'
                      }}>
                        {systemInfo.operatingSystem}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>总帖子数</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500, color: '#1890ff' }}>
                        {overview.postStats.totalPosts} 篇
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>总用户数</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500, color: '#52c41a' }}>
                        {overview.userStats.totalUsers} 人
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', color: '#6c757d' }}>总评论数</Text>
                      <Text style={{ fontSize: '12px', fontWeight: 500, color: '#fa8c16' }}>
                        {overview.postStats.totalComments} 条
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexDirection: 'column',
                gap: '8px',
                padding: '40px 20px'
              }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>无法获取系统信息</Text>
                <Button 
                  size="small" 
                  onClick={loadSystemInfo}
                  loading={systemInfoLoading}
                >
                  重试
                </Button>
              </div>
            )}
          </Card>
        );

      case 'categories':
        return (
          <Card title="分类分布" {...commonCardProps}>
            {Object.keys(overview.postStats.categoryDistribution).length > 0 ? (
              <Row gutter={16}>
                {Object.entries(overview.postStats.categoryDistribution).map(([category, count]) => (
                  <Col span={12} key={category} style={{ marginBottom: 12 }}>
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
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无数据
              </div>
            )}
          </Card>
        );

      case 'tags':
        return (
          <Card title="热门标签" {...commonCardProps}>
            {Object.keys(overview.postStats.popularTags).length > 0 ? (
              <Space wrap>
                {Object.entries(overview.postStats.popularTags).map(([tag, count]) => (
                  <Tag key={tag} color="blue">
                    <TagsOutlined /> {tag} ({count})
                  </Tag>
                ))}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无数据
              </div>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* 页面标题和编辑工具栏 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <DashboardOutlined />
              概览面板
              {isEditMode && <Tag color="orange">编辑模式</Tag>}
            </Title>
            <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
              查看网站整体运营数据、系统状态和用户活动概况
            </Paragraph>
          </div>
          
          <Space>
            <Tooltip title="布局设置">
              <Button 
                icon={<SettingOutlined />} 
                onClick={() => setSettingsVisible(true)}
              >
                设置
              </Button>
            </Tooltip>
            
            <Button
              type={isEditMode ? "primary" : "default"}
              icon={<EditOutlined />}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? '退出编辑' : '编辑布局'}
            </Button>
            
            {isEditMode && (
              <>
                <Button 
                  icon={<SaveOutlined />} 
                  onClick={saveLayout}
                  type="primary"
                >
                  保存布局
                </Button>
                <Button 
                  icon={<UndoOutlined />} 
                  onClick={resetLayout}
                  danger={resetConfirm}
                  type={resetConfirm ? "primary" : "default"}
                  style={resetConfirm ? { 
                    backgroundColor: '#ff4d4f', 
                    borderColor: '#ff4d4f',
                    animation: 'pulse 1s infinite' 
                  } : {}}
                >
                  {resetConfirm ? '确认重置' : '重置布局'}
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>

      {/* 动态布局组件 */}
      <div className={isEditMode ? 'edit-mode' : ''}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-components">
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className={`drop-zone ${snapshot.isDraggingOver ? 'is-over' : ''}`}
              >
                <Row gutter={[16, 16]}>
                  {components
                    .filter(comp => comp.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((component, index) => (
                      <Draggable 
                        key={component.id} 
                        draggableId={component.id} 
                        index={index}
                        isDragDisabled={!isEditMode}
                      >
                        {(provided, snapshot) => (
                          <Col
                            {...component.size}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              marginBottom: 16
                            }}
                          >
                            <div 
                              className={`draggable-component ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              style={{ position: 'relative' }}
                            >
                              {/* 拖拽手柄和编辑控制器 */}
                              {isEditMode && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="drag-handle"
                                  title="拖拽此组件以重新排序"
                                >
                                  <DragOutlined />
                                  拖拽排序
                                </div>
                              )}
                              
                              {renderComponent(component)}
                            </div>
                          </Col>
                        )}
                      </Draggable>
                    ))}
                </Row>
                {provided.placeholder}
                
                {/* 空状态提示 */}
                {components.filter(comp => comp.visible).length === 0 && (
                  <div className="draggable-placeholder">
                    <div>
                      <DashboardOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div>暂无可显示的组件</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>请在设置中启用组件显示</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* 布局设置抽屉 */}
      <Drawer
        title="布局设置"
        placement="right"
        width={400}
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        extra={
          <Space>
            <Button onClick={saveLayout} type="primary">
              保存
            </Button>
            <Button 
              onClick={resetLayout} 
              danger={resetConfirm}
              type={resetConfirm ? "primary" : "default"}
              style={resetConfirm ? { 
                backgroundColor: '#ff4d4f', 
                borderColor: '#ff4d4f',
                animation: 'pulse 1s infinite' 
              } : {}}
            >
              {resetConfirm ? '确认重置' : '重置'}
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {components.map((component) => (
            <Card
              key={component.id}
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DragOutlined />
                  {component.title}
                </div>
              }
              extra={
                <Switch
                  checked={component.visible}
                  onChange={() => toggleComponentVisibility(component.id)}
                  checkedChildren={<EyeOutlined />}
                  unCheckedChildren={<EyeInvisibleOutlined />}
                />
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Text strong style={{ fontSize: '12px' }}>组件尺寸：</Text>
                  
                  {/* 大尺寸选项 */}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      大尺寸 (适合主要内容)
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {sizeOptions
                        .filter(option => option.category === 'large')
                        .map((option) => (
                          <Tooltip key={option.label} title={option.description} placement="top">
                            <Button
                              size="small"
                              type={component.size?.lg === option.value.lg ? 'primary' : 'default'}
                              onClick={() => updateComponentSize(component.id, option.value)}
                              style={{ fontSize: '10px' }}
                            >
                              {option.label}
                            </Button>
                          </Tooltip>
                        ))}
                    </div>
                  </div>

                  {/* 中等尺寸选项 */}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      中等尺寸 (适合统计卡片)
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {sizeOptions
                        .filter(option => option.category === 'medium')
                        .map((option) => (
                          <Tooltip key={option.label} title={option.description} placement="top">
                            <Button
                              size="small"
                              type={component.size?.lg === option.value.lg ? 'primary' : 'default'}
                              onClick={() => updateComponentSize(component.id, option.value)}
                              style={{ fontSize: '10px' }}
                            >
                              {option.label}
                            </Button>
                          </Tooltip>
                        ))}
                    </div>
                  </div>

                  {/* 小尺寸选项 */}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      小尺寸 (适合工具框)
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {sizeOptions
                        .filter(option => option.category === 'small')
                        .map((option) => (
                          <Tooltip key={option.label} title={option.description} placement="top">
                            <Button
                              size="small"
                              type={component.size?.lg === option.value.lg ? 'primary' : 'default'}
                              onClick={() => updateComponentSize(component.id, option.value)}
                              style={{ fontSize: '10px' }}
                            >
                              {option.label}
                            </Button>
                          </Tooltip>
                        ))}
                    </div>
                  </div>

                  {/* 自定义尺寸选项 */}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      自定义尺寸 (特殊布局)
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {sizeOptions
                        .filter(option => option.category === 'custom')
                        .map((option) => (
                          <Tooltip key={option.label} title={option.description} placement="top">
                            <Button
                              size="small"
                              type={component.size?.lg === option.value.lg ? 'primary' : 'default'}
                              onClick={() => updateComponentSize(component.id, option.value)}
                              style={{ fontSize: '10px' }}
                            >
                              {option.label}
                            </Button>
                          </Tooltip>
                        ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    当前尺寸: {component.size?.lg || 12}/24 列宽 ({Math.round(((component.size?.lg || 12) / 24) * 100)}%)
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Drawer>
      </div>
  );
};

export default Dashboard;
