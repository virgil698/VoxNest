/**
 * 统一扩展管理页面 - 管理插件和主题
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
  Drawer,
  Typography,
  Tabs,
  Switch,
  Avatar,
  Empty,
  List,
  Descriptions,
  Modal
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/lib/table';
import { type UnifiedExtension, type UnifiedExtensionQuery, type ExtensionInstallResult } from '../../api/unifiedExtension';
import { fileSystemExtensionApi, fileSystemExtensionUtils } from '../../api/fileSystemExtension';
import ExtensionUploader from '../../components/admin/ExtensionUploader';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 使用统一扩展接口
type Extension = UnifiedExtension;

// 扩展统计信息
interface ExtensionStats {
  total: number;
  plugins: number;
  themes: number;
  frontendPlugins: number;
  backendPlugins: number;
  active: number;
  inactive: number;
  errors: number;
}

const ExtensionManagement: React.FC = () => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [filteredExtensions, setFilteredExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ExtensionStats>({
    total: 0,
    plugins: 0,
    themes: 0,
    frontendPlugins: 0,
    backendPlugins: 0,
    active: 0,
    inactive: 0,
    errors: 0
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  // 跟踪正在进行的操作
  const [operatingExtensions, setOperatingExtensions] = useState<Set<string>>(new Set());

  // 加载扩展列表
  const loadExtensions = useCallback(async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const query: UnifiedExtensionQuery = {
        search: searchText || undefined,
        type: typeFilter === 'all' ? undefined : (typeFilter as 'plugin' | 'theme'),
        status: statusFilter === 'all' ? undefined : (statusFilter as 'active' | 'inactive' | 'error'),
        page: 1,
        pageSize: 1000 // 获取所有数据用于前端筛选和统计
      };

      // 获取扩展列表 - 使用文件系统API
      const extensionResult = await fileSystemExtensionApi.getExtensions(query);
      if (extensionResult.isSuccess) {
        setExtensions(extensionResult.data);
      } else {
        message.error('加载扩展失败');
        setExtensions([]);
      }

      // 从扩展列表计算统计信息（备用方案）
      if (extensionResult.isSuccess && extensionResult.data) {
        const extensionData = extensionResult.data;
        const calculatedStats: ExtensionStats = {
          total: extensionData.length,
          plugins: extensionData.filter(e => e.type === 'plugin').length,
          themes: extensionData.filter(e => e.type === 'theme').length,
          frontendPlugins: extensionData.filter(e => e.type === 'plugin').length, // 目前所有插件都是前端插件
          backendPlugins: 0, // 暂时没有后端插件
          active: extensionData.filter(e => e.status === 'active').length,
          inactive: extensionData.filter(e => e.status === 'inactive').length,
          errors: extensionData.filter(e => e.status === 'error').length
        };
        setStats(calculatedStats);
      }
      
      // 尝试获取后端统计信息
      try {
        const statsResult = await fileSystemExtensionApi.getExtensionStats();
        if (statsResult.isSuccess) {
          const apiStats = statsResult.data;
          const newStats: ExtensionStats = {
            total: apiStats.totalExtensions,
            plugins: apiStats.totalPlugins,
            themes: apiStats.totalThemes,
            frontendPlugins: apiStats.totalPlugins, // 目前所有插件都是前端插件
            backendPlugins: 0, // 暂时没有后端插件
            active: apiStats.activeExtensions,
            inactive: apiStats.inactiveExtensions,
            errors: apiStats.errorExtensions
          };
          setStats(newStats);
        }
      } catch (error) {
        console.warn('获取后端统计失败，使用前端计算结果:', error);
      }
      
    } catch (error) {
      console.error('加载扩展失败:', error);
      message.error('加载扩展失败');
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, typeFilter, statusFilter]);

  // 筛选扩展
  const filterExtensions = useCallback(() => {
    let filtered = [...extensions];

    // 按标签页筛选
    if (activeTab !== 'all') {
      if (activeTab === 'frontend-plugins') {
        // 目前所有插件都是前端插件
        filtered = filtered.filter(ext => ext.type === 'plugin');
      } else if (activeTab === 'backend-plugins') {
        // 暂时没有后端插件，返回空数组
        filtered = [];
      } else if (activeTab === 'themes') {
        filtered = filtered.filter(ext => ext.type === 'theme');
      }
    }

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(ext => 
        ext.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ext.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        ext.author.toLowerCase().includes(searchText.toLowerCase()) ||
        fileSystemExtensionUtils.parseTags(ext.tags || '[]').some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ext => ext.status === statusFilter);
    }

    // 按类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ext => ext.type === typeFilter);
    }

    setFilteredExtensions(filtered);
  }, [extensions, searchText, statusFilter, typeFilter, activeTab]);

  // 初始化加载扩展列表（避免频繁重载）
  useEffect(() => {
    // 只在扩展列表为空时加载
    if (extensions.length === 0) {
      loadExtensions();
    }
  }, []); // 移除依赖，避免循环加载

  // 筛选扩展
  useEffect(() => {
    filterExtensions();
  }, [extensions, searchText, statusFilter, typeFilter, activeTab, filterExtensions]);

  // 启用/禁用扩展
  const handleToggleExtension = useCallback(async (extension: Extension) => {
    try {
      const isCurrentlyActive = extension.status === 'active';

      // 添加到操作中列表
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));

      // 立即更新本地状态为 loading，提供即时视觉反馈
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      // 使用文件系统API启用/禁用扩展
      const result = isCurrentlyActive 
        ? await fileSystemExtensionApi.disableExtension(extension.uniqueId)
        : await fileSystemExtensionApi.enableExtension(extension.uniqueId);
      
      if (result.isSuccess) {
        message.success(`扩展 ${extension.name} ${isCurrentlyActive ? '已禁用' : '已启用'}`);
        // 重新加载扩展列表获取最新状态
        await loadExtensions();
      } else {
        message.error(result.message || '操作失败');
        // 操作失败时恢复原状态
        setExtensions(prevExtensions => 
          prevExtensions.map(ext => 
            ext.uniqueId === extension.uniqueId 
              ? { ...ext, status: isCurrentlyActive ? 'active' : 'inactive' }
              : ext
          )
        );
      }
      
    } catch (error) {
      console.error('切换扩展状态失败:', error);
      message.error('操作失败');
      // 异常时恢复原状态
      const isCurrentlyActive = extension.status === 'active';
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: isCurrentlyActive ? 'active' : 'inactive' }
            : ext
        )
      );
    } finally {
      // 从操作中列表移除
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions]);

  // 重新加载扩展
  const handleReloadExtension = useCallback(async (extension: Extension) => {
    try {
      // 添加到操作中列表
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));
      
      // 立即更新本地状态为 loading，提供即时视觉反馈
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      const result = await fileSystemExtensionApi.reloadExtension(extension.uniqueId);
      if (result.isSuccess) {
        message.success(`扩展 ${extension.name} 已重载`);
        // 重新加载扩展列表获取最新状态
        await loadExtensions();
      } else {
        message.error(result.message || '重载失败');
        // 操作失败时恢复原状态
        setExtensions(prevExtensions => 
          prevExtensions.map(ext => 
            ext.uniqueId === extension.uniqueId 
              ? { ...ext, status: extension.status }
              : ext
          )
        );
      }
    } catch (error) {
      console.error('重新加载扩展失败:', error);
      message.error('重新加载失败');
      // 异常时恢复原状态
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: extension.status }
            : ext
        )
      );
    } finally {
      // 从操作中列表移除
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions]);

  // 查看扩展详情
  const handleViewDetail = (extension: Extension) => {
    setSelectedExtension(extension);
    setDetailVisible(true);
  };

  // 处理扩展安装成功
  const handleInstallSuccess = async (result: ExtensionInstallResult) => {
    message.success(`${result.extensionName} 安装成功！`);
    setUploadVisible(false);
    // 触发热重载
    try {
      await fileSystemExtensionApi.triggerHotReload();
    } catch (error) {
      console.warn('触发热重载失败:', error);
    }
    // 重新加载扩展列表
    await loadExtensions();
  };

  // 卸载扩展（完全删除）
  const handleUninstallExtension = useCallback(async (extension: Extension) => {
    try {
      // 添加到操作中列表
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));
      
      // 立即更新本地状态为 loading，提供即时视觉反馈
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      const result = await fileSystemExtensionApi.uninstallExtension(extension.uniqueId);
      if (result.isSuccess) {
        message.success(`扩展 ${extension.name} 已卸载`);
        // 重新加载扩展列表获取最新状态
        await loadExtensions();
      } else {
        message.error(result.message || '卸载失败');
        // 操作失败时恢复原状态
        setExtensions(prevExtensions => 
          prevExtensions.map(ext => 
            ext.uniqueId === extension.uniqueId 
              ? { ...ext, status: extension.status }
              : ext
          )
        );
      }
    } catch (error) {
      console.error('卸载扩展失败:', error);
      message.error('卸载失败');
      // 异常时恢复原状态
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: extension.status }
            : ext
        )
      );
    } finally {
      // 从操作中列表移除
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions]);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const text = fileSystemExtensionUtils.formatStatus(status);
    const color = fileSystemExtensionUtils.getStatusColor(status);
    return <Tag color={color}>{text}</Tag>;
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    return type === 'plugin' ? <CodeOutlined /> : <BgColorsOutlined />;
  };

  // 获取类型标签
  const getTypeTag = (type: string, isBackend = false) => {
    let text = type === 'plugin' ? '插件' : '主题';
    let color = type === 'plugin' ? 'blue' : 'purple';
    
    // 区分前端和后端插件
    if (type === 'plugin') {
      if (isBackend) {
        text = '后端插件';
        color = 'orange';
      } else {
        text = '前端插件';
        color = 'green';
      }
    }
    
    return <Tag color={color} icon={getTypeIcon(type)}>{text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<Extension> = [
    {
      title: '扩展信息',
      key: 'info',
      width: 300,
      render: (_: unknown, record: Extension) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            icon={getTypeIcon(record.type)}
            style={{ 
              backgroundColor: record.type === 'plugin' ? '#1890ff' : '#722ed1',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
              {getTypeTag(record.type, false)} {/* 目前都是前端扩展 */}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                by {record.author} • v{record.version}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '运行中', value: 'active' },
        { text: '未启用', value: 'inactive' },
        { text: '错误', value: 'error' },
      ],
    },
    {
      title: '功能',
      key: 'features',
      width: 200,
      render: (_: unknown, record: Extension) => (
        <div>
            {record.capabilities?.slots && record.capabilities.slots.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  插槽: {record.capabilities.slots.length}
                </Text>
              </div>
            )}
            {record.capabilities?.hooks && record.capabilities.hooks.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  钩子: {record.capabilities.hooks.length}
                </Text>
              </div>
            )}
            <div>
              {fileSystemExtensionUtils.parseTags(record.tags || '[]').slice(0, 3).map((tag: string) => (
                <Tag key={tag} style={{ fontSize: 10, margin: '0 2px 2px 0' }}>
                  {tag}
                </Tag>
              ))}
              {fileSystemExtensionUtils.parseTags(record.tags || '[]').length > 3 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  +{fileSystemExtensionUtils.parseTags(record.tags || '[]').length - 3}
                </Text>
              )}
            </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Extension) => {
        const isOperating = operatingExtensions.has(record.uniqueId);
        return (
          <Space size="small">
            <Switch
              size="small"
              checked={record.status === 'active'}
              loading={record.status === 'loading'}
              disabled={isOperating}
              onChange={() => handleToggleExtension(record)}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
            <Tooltip title="重新加载">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={isOperating && record.status === 'loading'}
                disabled={isOperating}
                onClick={() => handleReloadExtension(record)}
              />
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                size="small"
                icon={<EyeOutlined />}
                disabled={isOperating}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="卸载扩展">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={isOperating && record.status === 'loading'}
                disabled={isOperating}
                onClick={() => {
                  Modal.confirm({
                    title: '确认卸载',
                    content: `确定要卸载扩展 ${record.name} 吗？这将删除所有相关文件。`,
                    onOk: () => handleUninstallExtension(record)
                  });
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppstoreOutlined />
          扩展管理
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          统一管理前端插件和主题扩展，控制扩展的启用状态和配置
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总扩展数"
              value={stats.total}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="前端插件"
              value={stats.frontendPlugins}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="后端插件"
              value={stats.backendPlugins}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="主题"
              value={stats.themes}
              prefix={<BgColorsOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行中"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容区 */}
      <Card>
        {/* 工具栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="搜索扩展名称、描述或标签"
              style={{ width: 300 }}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">运行中</Option>
              <Option value="inactive">未启用</Option>
              <Option value="error">错误</Option>
            </Select>
            <Select
              placeholder="筛选类型"
              style={{ width: 120 }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="all">全部类型</Option>
              <Option value="plugin">插件</Option>
              <Option value="theme">主题</Option>
            </Select>
          </div>
          <div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadExtensions}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setUploadVisible(true)}
              >
                安装扩展
              </Button>
            </Space>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
            items={[
            {
              label: `全部 (${stats.total})`,
              key: 'all',
            },
            {
              label: `前端插件 (${stats.frontendPlugins})`,
              key: 'frontend-plugins',
            },
            {
              label: `后端插件 (${stats.backendPlugins})`,
              key: 'backend-plugins',
            },
            {
              label: `主题 (${stats.themes})`,
              key: 'themes',
            },
          ]}
        />

        {/* 扩展列表 */}
        <Table
          rowKey="uniqueId"
          columns={columns}
          dataSource={filteredExtensions}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            total: filteredExtensions.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无扩展数据"
              />
            ),
          }}
        />
      </Card>

      {/* 扩展详情抽屉 */}
      <Drawer
        title="扩展详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedExtension && (
            <Space>
              <Switch
                checked={selectedExtension.status === 'active'}
                onChange={() => {
                  handleToggleExtension(selectedExtension);
                  setDetailVisible(false);
                }}
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedExtension) {
                    handleReloadExtension(selectedExtension);
                    setDetailVisible(false);
                  }
                }}
              >
                重新加载
              </Button>
            </Space>
          )
        }
      >
        {selectedExtension && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={64}
                icon={getTypeIcon(selectedExtension.type)}
                style={{ 
                  backgroundColor: selectedExtension.type === 'plugin' ? '#1890ff' : '#722ed1',
                  marginBottom: 16
                }}
              />
              <Title level={4}>{selectedExtension.name}</Title>
              <div style={{ marginBottom: 8 }}>
                {getTypeTag(selectedExtension.type, false)} {/* 目前都是前端扩展 */}
                {getStatusTag(selectedExtension.status || 'inactive')}
              </div>
              <Text type="secondary">{selectedExtension.description}</Text>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="扩展ID">
                <Text code>{selectedExtension.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="版本">{selectedExtension.version}</Descriptions.Item>
              <Descriptions.Item label="作者">{selectedExtension.author}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {getTypeTag(selectedExtension.type, false)} {/* 目前都是前端扩展 */}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedExtension.status || 'inactive')}
              </Descriptions.Item>
              {selectedExtension.uniqueId && (
                <Descriptions.Item label="扩展路径">
                  <Text code>extensions/{selectedExtension.uniqueId}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedExtension.tags && fileSystemExtensionUtils.parseTags(selectedExtension.tags).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>标签</Title>
                <div>
                  {fileSystemExtensionUtils.parseTags(selectedExtension.tags).map((tag: string) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            {selectedExtension.capabilities?.slots && selectedExtension.capabilities.slots.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>使用的插槽</Title>
                <List
                  size="small"
                  dataSource={selectedExtension.capabilities.slots}
                  renderItem={(slot: string) => (
                    <List.Item>
                      <Text code>{slot}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {selectedExtension.capabilities?.hooks && selectedExtension.capabilities.hooks.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>生命周期钩子</Title>
                <List
                  size="small"
                  dataSource={selectedExtension.capabilities.hooks}
                  renderItem={(hook: string) => (
                    <List.Item>
                      <Text code>{hook}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {selectedExtension.capabilities && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>能力声明</Title>
                <Row gutter={[8, 8]}>
                  {Object.entries(selectedExtension.capabilities).map(([key, value]) => (
                    value && (
                      <Col key={key}>
                        <Tag color={value ? 'success' : 'default'}>
                          {key}
                        </Tag>
                      </Col>
                    )
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 扩展上传器 */}
      <ExtensionUploader
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onInstallSuccess={handleInstallSuccess}
      />
    </div>
  );
};

export default ExtensionManagement;
