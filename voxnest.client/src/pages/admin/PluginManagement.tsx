/**
 * 插件管理页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Badge,
  Drawer,
  Typography,
  Divider,
  Progress,
  Empty
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { pluginApi, type Plugin, type PluginQuery, PluginStatus, PluginType, pluginUtils } from '../../api/plugin';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PluginManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [query, setQuery] = useState<PluginQuery>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  
  // 表单
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  
  // 文件上传状态
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 加载数据
  const loadPlugins = async () => {
    try {
      setLoading(true);
      const params = { ...query, page: currentPage, pageSize };
      const response = await pluginApi.getPlugins(params);
      
      if (response.data) {
        setPlugins(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载插件列表失败:', error);
      message.error('加载插件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await pluginApi.getPluginStats();
      if (response.data?.isSuccess) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载插件统计失败:', error);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, [currentPage, query]);

  useEffect(() => {
    loadStats();
  }, []);

  // 插件操作
  const handleInstall = async (plugin: Plugin) => {
    try {
      const response = await pluginApi.installPlugin(plugin.id);
      if (response.data?.isSuccess) {
        message.success('插件安装成功');
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '安装失败');
      }
    } catch (error) {
      console.error('安装插件失败:', error);
      message.error('安装插件失败');
    }
  };

  const handleEnable = async (plugin: Plugin) => {
    try {
      const response = await pluginApi.enablePlugin(plugin.id);
      if (response.data?.isSuccess) {
        message.success('插件已启用');
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '启用失败');
      }
    } catch (error) {
      console.error('启用插件失败:', error);
      message.error('启用插件失败');
    }
  };

  const handleDisable = async (plugin: Plugin) => {
    try {
      const response = await pluginApi.disablePlugin(plugin.id);
      if (response.data?.isSuccess) {
        message.success('插件已禁用');
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '禁用失败');
      }
    } catch (error) {
      console.error('禁用插件失败:', error);
      message.error('禁用插件失败');
    }
  };

  const handleUninstall = async (plugin: Plugin) => {
    try {
      const response = await pluginApi.uninstallPlugin(plugin.id);
      if (response.data?.isSuccess) {
        message.success('插件已卸载');
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '卸载失败');
      }
    } catch (error) {
      console.error('卸载插件失败:', error);
      message.error('卸载插件失败');
    }
  };

  const handleDelete = async (plugin: Plugin) => {
    try {
      const response = await pluginApi.deletePlugin(plugin.id);
      if (response.data?.isSuccess) {
        message.success('插件已删除');
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除插件失败:', error);
      message.error('删除插件失败');
    }
  };

  // 文件上传
  const uploadProps: UploadProps = {
    name: 'pluginFile',
    fileList,
    beforeUpload: (file) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        message.error('只能上传ZIP格式的插件文件');
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小不能超过50MB');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  // 处理上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择要上传的插件文件');
      return;
    }

    try {
      setUploading(true);
      const values = await uploadForm.validateFields();
      const file = fileList[0].originFileObj!;
      
      const response = await pluginApi.uploadPlugin(file, values.description, values.tags);
      
      if (response.data?.isSuccess) {
        message.success('插件上传成功');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        loadPlugins();
        loadStats();
      } else {
        message.error(response.data?.message || '上传失败');
      }
    } catch (error) {
      console.error('上传插件失败:', error);
      message.error('上传插件失败');
    } finally {
      setUploading(false);
    }
  };

  // 查看插件详情
  const handleViewDetail = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setDetailDrawerVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Plugin> = [
    {
      title: '插件信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <AppstoreOutlined style={{ color: '#1890ff' }} />
            <Text strong>{record.name}</Text>
            {record.isBuiltIn && <Tag color="blue">内置</Tag>}
            {record.isVerified && <Tag color="gold">已验证</Tag>}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            v{record.version} • {record.author}
          </Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description.length > 50 
                  ? record.description.substring(0, 50) + '...'
                  : record.description
                }
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: PluginType) => (
        <Tag color="geekblue">{pluginUtils.getTypeText(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: PluginStatus) => (
        <Tag color={pluginUtils.getStatusColor(status)}>
          {pluginUtils.getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      width: 100,
      render: (size: number) => (
        <Text type="secondary">{pluginUtils.formatFileSize(size)}</Text>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloadCount',
      width: 80,
      render: (count: number) => (
        <Badge count={count} overflowCount={999} showZero color="green" />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          
          {record.status === PluginStatus.Uploaded && (
            <Tooltip title="安装">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => handleInstall(record)}
              />
            </Tooltip>
          )}
          
          {(record.status === PluginStatus.Installed || record.status === PluginStatus.Disabled) && (
            <Tooltip title="启用">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleEnable(record)}
              />
            </Tooltip>
          )}
          
          {record.status === PluginStatus.Enabled && !record.isBuiltIn && (
            <Tooltip title="禁用">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                style={{ color: '#faad14' }}
                onClick={() => handleDisable(record)}
              />
            </Tooltip>
          )}
          
          {!record.isBuiltIn && (
            <Popconfirm
              title="确定要删除这个插件吗？"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和统计 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>插件管理</Title>
        
        {stats && (
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={4}>
              <Card size="small">
                <Statistic title="总插件数" value={stats.totalPlugins} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已启用"
                  value={stats.enabledPlugins}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已禁用"
                  value={stats.disabledPlugins}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="内置插件" value={stats.builtInPlugins} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已验证"
                  value={stats.verifiedPlugins}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="总大小"
                  value={pluginUtils.formatFileSize(stats.totalFileSize)}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input.Search
                placeholder="搜索插件名称、作者或标签"
                style={{ width: 300 }}
                onSearch={(value) => {
                  setQuery({ ...query, search: value });
                  setCurrentPage(1);
                }}
                allowClear
              />
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => {
                  setQuery({ ...query, status: value });
                  setCurrentPage(1);
                }}
              >
                {Object.entries(PluginStatus).map(([key, value]) => (
                  <Option key={value} value={value}>
                    {pluginUtils.getStatusText(value as PluginStatus)}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="类型"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => {
                  setQuery({ ...query, type: value });
                  setCurrentPage(1);
                }}
              >
                {Object.entries(PluginType).map(([key, value]) => (
                  <Option key={value} value={value}>
                    {pluginUtils.getTypeText(value as PluginType)}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadPlugins();
                  loadStats();
                }}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传插件
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 插件列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={plugins}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个插件`,
            onChange: (page) => setCurrentPage(page),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 上传插件模态框 */}
      <Modal
        title="上传插件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
          setFileList([]);
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
        width={600}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            name="pluginFile"
            label="插件文件"
            rules={[{ required: true, message: '请选择插件文件' }]}
          >
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>选择ZIP文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              支持ZIP格式，最大50MB
            </Text>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="插件描述（可选）" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="用逗号分隔多个标签，如：工具,效率" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 插件详情抽屉 */}
      <Drawer
        title="插件详情"
        placement="right"
        size="large"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedPlugin && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>{selectedPlugin.name}</Title>
              <Space>
                <Tag color={pluginUtils.getStatusColor(selectedPlugin.status)}>
                  {pluginUtils.getStatusText(selectedPlugin.status)}
                </Tag>
                <Tag color="geekblue">
                  {pluginUtils.getTypeText(selectedPlugin.type)}
                </Tag>
                {selectedPlugin.isBuiltIn && <Tag color="blue">内置</Tag>}
                {selectedPlugin.isVerified && <Tag color="gold">已验证</Tag>}
              </Space>
            </div>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>版本：</Text>
                <Text>{selectedPlugin.version}</Text>
              </Col>
              <Col span={12}>
                <Text strong>作者：</Text>
                <Text>{selectedPlugin.author}</Text>
              </Col>
              <Col span={12}>
                <Text strong>文件大小：</Text>
                <Text>{pluginUtils.formatFileSize(selectedPlugin.fileSize)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>下载次数：</Text>
                <Text>{selectedPlugin.downloadCount}</Text>
              </Col>
              <Col span={24}>
                <Text strong>描述：</Text>
                <Paragraph>{selectedPlugin.description || '暂无描述'}</Paragraph>
              </Col>
              {selectedPlugin.tags && (
                <Col span={24}>
                  <Text strong>标签：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {pluginUtils.parseTags(selectedPlugin.tags).map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </Col>
              )}
              {selectedPlugin.homepage && (
                <Col span={24}>
                  <Text strong>主页：</Text>
                  <a href={selectedPlugin.homepage} target="_blank" rel="noopener noreferrer">
                    {selectedPlugin.homepage}
                  </a>
                </Col>
              )}
              {selectedPlugin.repository && (
                <Col span={24}>
                  <Text strong>仓库：</Text>
                  <a href={selectedPlugin.repository} target="_blank" rel="noopener noreferrer">
                    {selectedPlugin.repository}
                  </a>
                </Col>
              )}
            </Row>

            <Divider />

            <div>
              <Text strong>操作：</Text>
              <div style={{ marginTop: '12px' }}>
                <Space wrap>
                  {selectedPlugin.status === PluginStatus.Uploaded && (
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleInstall(selectedPlugin)}
                    >
                      安装
                    </Button>
                  )}
                  
                  {(selectedPlugin.status === PluginStatus.Installed || 
                    selectedPlugin.status === PluginStatus.Disabled) && (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleEnable(selectedPlugin)}
                    >
                      启用
                    </Button>
                  )}
                  
                  {selectedPlugin.status === PluginStatus.Enabled && !selectedPlugin.isBuiltIn && (
                    <Button
                      icon={<PauseCircleOutlined />}
                      onClick={() => handleDisable(selectedPlugin)}
                    >
                      禁用
                    </Button>
                  )}
                  
                  {!selectedPlugin.isBuiltIn && (
                    <Popconfirm
                      title="确定要删除这个插件吗？"
                      onConfirm={() => {
                        handleDelete(selectedPlugin);
                        setDetailDrawerVisible(false);
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PluginManagement;
