/**
 * 主题管理页面
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
  Switch,
  Avatar,
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
  BgColorsOutlined,
  StarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { themeApi, type Theme, type ThemeQuery, ThemeStatus, ThemeType, themeUtils } from '../../api/theme';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ThemeManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [query, setQuery] = useState<ThemeQuery>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  
  // 表单
  const [uploadForm] = Form.useForm();
  
  // 文件上传状态
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 加载数据
  const loadThemes = async () => {
    try {
      setLoading(true);
      const params = { ...query, page: currentPage, pageSize };
      const response = await themeApi.getThemes(params);
      
      if (response.data) {
        setThemes(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载主题列表失败:', error);
      message.error('加载主题列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await themeApi.getThemeStats();
      if (response.data?.isSuccess) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载主题统计失败:', error);
    }
  };

  useEffect(() => {
    loadThemes();
  }, [currentPage, query]);

  useEffect(() => {
    loadStats();
  }, []);

  // 主题操作
  const handleInstall = async (theme: Theme) => {
    try {
      const response = await themeApi.installTheme(theme.id);
      if (response.data?.isSuccess) {
        message.success('主题安装成功');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '安装失败');
      }
    } catch (error) {
      console.error('安装主题失败:', error);
      message.error('安装主题失败');
    }
  };

  const handleActivate = async (theme: Theme) => {
    try {
      const response = await themeApi.activateTheme(theme.id);
      if (response.data?.isSuccess) {
        message.success('主题已激活');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '激活失败');
      }
    } catch (error) {
      console.error('激活主题失败:', error);
      message.error('激活主题失败');
    }
  };

  const handleDisable = async (theme: Theme) => {
    try {
      const response = await themeApi.disableTheme(theme.id);
      if (response.data?.isSuccess) {
        message.success('主题已禁用');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '禁用失败');
      }
    } catch (error) {
      console.error('禁用主题失败:', error);
      message.error('禁用主题失败');
    }
  };

  const handleUninstall = async (theme: Theme) => {
    try {
      const response = await themeApi.uninstallTheme(theme.id);
      if (response.data?.isSuccess) {
        message.success('主题已卸载');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '卸载失败');
      }
    } catch (error) {
      console.error('卸载主题失败:', error);
      message.error('卸载主题失败');
    }
  };

  const handleDelete = async (theme: Theme) => {
    try {
      const response = await themeApi.deleteTheme(theme.id);
      if (response.data?.isSuccess) {
        message.success('主题已删除');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除主题失败:', error);
      message.error('删除主题失败');
    }
  };

  const handleResetToDefault = async () => {
    try {
      const response = await themeApi.resetToDefaultTheme();
      if (response.data?.isSuccess) {
        message.success('已重置为默认主题');
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '重置失败');
      }
    } catch (error) {
      console.error('重置主题失败:', error);
      message.error('重置主题失败');
    }
  };

  // 文件上传
  const uploadProps: UploadProps = {
    name: 'themeFile',
    fileList,
    beforeUpload: (file) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        message.error('只能上传ZIP格式的主题文件');
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        message.error('文件大小不能超过20MB');
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
      message.error('请选择要上传的主题文件');
      return;
    }

    try {
      setUploading(true);
      const values = await uploadForm.validateFields();
      const file = fileList[0].originFileObj!;
      
      const response = await themeApi.uploadTheme(
        file, 
        values.description, 
        values.tags,
        values.setAsDefault || false
      );
      
      if (response.data?.isSuccess) {
        message.success('主题上传成功');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        loadThemes();
        loadStats();
      } else {
        message.error(response.data?.message || '上传失败');
      }
    } catch (error) {
      console.error('上传主题失败:', error);
      message.error('上传主题失败');
    } finally {
      setUploading(false);
    }
  };

  // 查看主题详情
  const handleViewDetail = (theme: Theme) => {
    setSelectedTheme(theme);
    setDetailDrawerVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Theme> = [
    {
      title: '主题信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {record.previewImagePath ? (
              <Avatar src={record.previewImagePath} size="small" />
            ) : (
              <Avatar icon={<BgColorsOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
            )}
            <Text strong>{record.name}</Text>
            {record.isBuiltIn && <Tag color="blue">内置</Tag>}
            {record.isVerified && <Tag color="gold">已验证</Tag>}
            {record.isDefault && <Tag color="green">默认</Tag>}
            {record.status === ThemeStatus.Active && (
              <Tag color="success" icon={<CheckCircleOutlined />}>当前</Tag>
            )}
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
      render: (type: ThemeType) => (
        <Tag color="purple">{themeUtils.getTypeText(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: ThemeStatus) => (
        <Tag color={themeUtils.getStatusColor(status)}>
          {themeUtils.getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      width: 100,
      render: (size: number) => (
        <Text type="secondary">{themeUtils.formatFileSize(size)}</Text>
      ),
    },
    {
      title: '使用量',
      dataIndex: 'useCount',
      width: 80,
      render: (count: number) => (
        <Badge count={count} overflowCount={999} showZero color="blue" />
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
          
          {record.status === ThemeStatus.Uploaded && (
            <Tooltip title="安装">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => handleInstall(record)}
              />
            </Tooltip>
          )}
          
          {(record.status === ThemeStatus.Installed) && (
            <Tooltip title="激活">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleActivate(record)}
              />
            </Tooltip>
          )}
          
          {record.status === ThemeStatus.Active && !record.isDefault && (
            <Tooltip title="禁用">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                style={{ color: '#faad14' }}
                onClick={() => handleDisable(record)}
              />
            </Tooltip>
          )}
          
          {!record.isDefault && (
            <Popconfirm
              title="确定要删除这个主题吗？"
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
        <Title level={2}>主题管理</Title>
        
        {stats && (
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={4}>
              <Card size="small">
                <Statistic title="总主题数" value={stats.totalThemes} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已激活"
                  value={stats.activeThemes}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已禁用"
                  value={stats.disabledThemes}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="内置主题" value={stats.builtInThemes} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="已验证"
                  value={stats.verifiedThemes}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="当前主题"
                  value={stats.currentActiveTheme || '未设置'}
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
                placeholder="搜索主题名称、作者或标签"
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
                {Object.entries(ThemeStatus).map(([key, value]) => (
                  <Option key={value} value={value}>
                    {themeUtils.getStatusText(value as ThemeStatus)}
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
                {Object.entries(ThemeType).map(([key, value]) => (
                  <Option key={value} value={value}>
                    {themeUtils.getTypeText(value as ThemeType)}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<StarOutlined />}
                onClick={handleResetToDefault}
              >
                重置为默认
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadThemes();
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
                上传主题
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主题列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={themes}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个主题`,
            onChange: (page) => setCurrentPage(page),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 上传主题模态框 */}
      <Modal
        title="上传主题"
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
            name="themeFile"
            label="主题文件"
            rules={[{ required: true, message: '请选择主题文件' }]}
          >
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>选择ZIP文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              支持ZIP格式，最大20MB
            </Text>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="主题描述（可选）" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="用逗号分隔多个标签，如：深色,现代" />
          </Form.Item>

          <Form.Item
            name="setAsDefault"
            label="设为默认主题"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 主题详情抽屉 */}
      <Drawer
        title="主题详情"
        placement="right"
        size="large"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedTheme && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              {selectedTheme.previewImagePath && (
                <div style={{ marginBottom: '16px' }}>
                  <img 
                    src={selectedTheme.previewImagePath} 
                    alt={selectedTheme.name}
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                  />
                </div>
              )}
              <Title level={4}>{selectedTheme.name}</Title>
              <Space>
                <Tag color={themeUtils.getStatusColor(selectedTheme.status)}>
                  {themeUtils.getStatusText(selectedTheme.status)}
                </Tag>
                <Tag color="purple">
                  {themeUtils.getTypeText(selectedTheme.type)}
                </Tag>
                {selectedTheme.isBuiltIn && <Tag color="blue">内置</Tag>}
                {selectedTheme.isVerified && <Tag color="gold">已验证</Tag>}
                {selectedTheme.isDefault && <Tag color="green">默认</Tag>}
                {selectedTheme.status === ThemeStatus.Active && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>当前主题</Tag>
                )}
              </Space>
            </div>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>版本：</Text>
                <Text>{selectedTheme.version}</Text>
              </Col>
              <Col span={12}>
                <Text strong>作者：</Text>
                <Text>{selectedTheme.author}</Text>
              </Col>
              <Col span={12}>
                <Text strong>文件大小：</Text>
                <Text>{themeUtils.formatFileSize(selectedTheme.fileSize)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>使用次数：</Text>
                <Text>{selectedTheme.useCount}</Text>
              </Col>
              <Col span={24}>
                <Text strong>描述：</Text>
                <Paragraph>{selectedTheme.description || '暂无描述'}</Paragraph>
              </Col>
              {selectedTheme.tags && (
                <Col span={24}>
                  <Text strong>标签：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {themeUtils.parseTags(selectedTheme.tags).map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </Col>
              )}
              {selectedTheme.supportedModes && (
                <Col span={24}>
                  <Text strong>支持模式：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {themeUtils.parseSupportedModes(selectedTheme.supportedModes).map(mode => (
                      <Tag key={mode} color="cyan">{mode}</Tag>
                    ))}
                  </div>
                </Col>
              )}
              {selectedTheme.homepage && (
                <Col span={24}>
                  <Text strong>主页：</Text>
                  <a href={selectedTheme.homepage} target="_blank" rel="noopener noreferrer">
                    {selectedTheme.homepage}
                  </a>
                </Col>
              )}
              {selectedTheme.repository && (
                <Col span={24}>
                  <Text strong>仓库：</Text>
                  <a href={selectedTheme.repository} target="_blank" rel="noopener noreferrer">
                    {selectedTheme.repository}
                  </a>
                </Col>
              )}
            </Row>

            <Divider />

            <div>
              <Text strong>操作：</Text>
              <div style={{ marginTop: '12px' }}>
                <Space wrap>
                  {selectedTheme.status === ThemeStatus.Uploaded && (
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleInstall(selectedTheme)}
                    >
                      安装
                    </Button>
                  )}
                  
                  {selectedTheme.status === ThemeStatus.Installed && (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleActivate(selectedTheme)}
                    >
                      激活
                    </Button>
                  )}
                  
                  {selectedTheme.status === ThemeStatus.Active && !selectedTheme.isDefault && (
                    <Button
                      icon={<PauseCircleOutlined />}
                      onClick={() => handleDisable(selectedTheme)}
                    >
                      禁用
                    </Button>
                  )}
                  
                  {!selectedTheme.isDefault && (
                    <Popconfirm
                      title="确定要删除这个主题吗？"
                      onConfirm={() => {
                        handleDelete(selectedTheme);
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

export default ThemeManagement;
