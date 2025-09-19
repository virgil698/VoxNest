import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Select,
  ColorPicker,
  InputNumber,
  Tabs,
  Space,
  message,
  Typography,
  Alert,
  Modal,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  List
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  UndoOutlined,
  WarningOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  SettingOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  ThunderboltOutlined,
  BugOutlined,
  AppstoreOutlined,
  HddOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { 
  FrontendSettingsManager, 
  frontendSettingsSchema, 
  type FrontendSettingProperty 
} from '../../config/frontendSettings';
import { useServerConfig } from '../../hooks/useServerConfig';
import type { ServerConfig, CorsConfig, LoggingConfig } from '../../api/serverConfig';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SiteSettingsProps {}

const SiteSettings: React.FC<SiteSettingsProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('interface');
  const [serverResetModalVisible, setServerResetModalVisible] = useState(false);
  const [resetCategory, setResetCategory] = useState<string>('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');

  // Redis配置状态
  const [redisConfig, setRedisConfig] = useState({
    enabled: false,
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
    database: 0,
    connectionTimeout: 5000,
    commandTimeout: 5000,
    retryAttempts: 3
  });
  const [redisStatus, setRedisStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [redisError, setRedisError] = useState<string>('');
  const [redisTestLoading, setRedisTestLoading] = useState(false);
  const [redisInitLoading, setRedisInitLoading] = useState(false);
  const [showRedisPassword, setShowRedisPassword] = useState(false);
  const [redisDisableModal, setRedisDisableModal] = useState(false);
  const [redisDisableStep, setRedisDisableStep] = useState<'warning' | 'confirm1' | 'confirm2' | 'password'>('warning');
  const [adminPassword, setAdminPassword] = useState('');

  // 后端配置相关hooks
  const {
    serverConfig,
    databaseConfig,
    corsConfig,
    loggingConfig,
    currentTimeZone,
    availableTimeZones,
    updateServerConfig,
    updateCorsConfig,
    updateLoggingConfig,
    setTimeZone,
    backupConfig,
    resetConfig,
    refetchAll: refetchServerConfig,
    isLoading: serverConfigLoading
  } = useServerConfig();

  const [serverForm] = Form.useForm();
  const [corsForm] = Form.useForm();
  const [loggingForm] = Form.useForm();
  const [redisForm] = Form.useForm();

  // 初始化后端配置表单数据
  useEffect(() => {
    if (serverConfig.data) {
      serverForm.setFieldsValue(serverConfig.data);
    }
  }, [serverConfig.data, serverForm]);

  useEffect(() => {
    if (corsConfig.data) {
      corsForm.setFieldsValue(corsConfig.data);
    }
  }, [corsConfig.data, corsForm]);

  useEffect(() => {
    if (loggingConfig.data) {
      // 设置日志配置数据，确保enableDebugMode有默认值
      loggingForm.setFieldsValue({
        ...loggingConfig.data,
        enableDebugMode: loggingConfig.data.enableDebugMode ?? false
      });
    }
  }, [loggingConfig.data, loggingForm]);

  // 加载设置
  const loadSettings = useCallback(() => {
    setLoading(true);
    try {
      const settings = FrontendSettingsManager.loadSettings();
      form.setFieldsValue(settings);
      setHasChanges(false);
    } catch (error) {
      message.error('加载设置失败');
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // 保存设置
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      FrontendSettingsManager.saveSettings(values);
      setHasChanges(false);
      message.success('设置已保存');
    } catch (error) {
      message.error('保存设置失败');
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }, [form]);

  // 重置设置
  const handleFrontendReset = useCallback(() => {
    Modal.confirm({
      title: '确认重置',
      content: '这将重置所有设置为默认值，确定要继续吗？',
      onOk: () => {
        FrontendSettingsManager.resetSettings();
        loadSettings();
        message.success('设置已重置');
      },
    });
  }, [loadSettings]);

  // 导出设置
  const handleExport = useCallback(() => {
    const data = FrontendSettingsManager.exportSettings();
    setExportData(data);
    setExportModalVisible(true);
  }, []);

  // 导入设置
  const handleImport = useCallback(() => {
    if (!importData.trim()) {
      message.error('请输入要导入的设置数据');
      return;
    }

    const success = FrontendSettingsManager.importSettings(importData);
    if (success) {
      loadSettings();
      setImportModalVisible(false);
      setImportData('');
      message.success('设置导入成功');
    } else {
      message.error('设置导入失败，请检查数据格式');
    }
  }, [importData, loadSettings]);

  // 复制导出数据
  const handleCopyExport = useCallback(() => {
    navigator.clipboard.writeText(exportData).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  }, [exportData]);

  // Redis配置处理函数
  const handleRedisConfigChange = useCallback((field: string, value: any) => {
    setRedisConfig(prev => ({
      ...prev,
      [field]: value
    }));
    redisForm.setFieldsValue({ [field]: value });
  }, [redisForm]);

  const handleRedisTestConnection = useCallback(async () => {
    try {
      setRedisTestLoading(true);
      setRedisError('');

      // 模拟Redis连接测试 (后端接口实现后替换)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里将来会调用真实的API
      // const response = await fetch('/api/admin/redis/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(redisConfig)
      // });

      // 模拟成功响应
      const success = Math.random() > 0.3; // 70% 成功率用于演示
      
      if (success) {
        setRedisStatus('connected');
        message.success('Redis连接测试成功！');
      } else {
        throw new Error('连接超时或认证失败');
      }
    } catch (error: any) {
      setRedisStatus('error');
      setRedisError(error.message || '连接测试失败');
      message.error(`Redis连接测试失败: ${error.message || '未知错误'}`);
    } finally {
      setRedisTestLoading(false);
    }
  }, [redisConfig]);

  const handleRedisInitialize = useCallback(async () => {
    try {
      setRedisInitLoading(true);
      setRedisError('');

      // 模拟Redis初始化过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 这里将来会调用真实的API
      // const response = await fetch('/api/admin/redis/initialize', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(redisConfig)
      // });

      setRedisStatus('connected');
      handleRedisConfigChange('enabled', true);
      message.success('Redis服务初始化成功！');
    } catch (error: any) {
      setRedisStatus('error');
      setRedisError(error.message || '初始化失败');
      message.error(`Redis初始化失败: ${error.message || '未知错误'}`);
    } finally {
      setRedisInitLoading(false);
    }
  }, [redisConfig, handleRedisConfigChange]);

  const handleRedisDisable = useCallback(() => {
    // 如果Redis未连接，可以直接关闭，不需要复杂确认流程
    if (redisStatus !== 'connected') {
      Modal.confirm({
        title: '确认关闭Redis服务',
        content: 'Redis服务尚未初始化连接，确定要关闭吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          handleRedisConfigChange('enabled', false);
          setRedisStatus('disconnected');
          message.success('Redis服务已关闭');
        }
      });
      return;
    }

    // 如果Redis已连接，需要完整的确认流程
    setRedisDisableModal(true);
    setRedisDisableStep('warning');
    setAdminPassword('');
  }, [redisStatus, handleRedisConfigChange]);

  const handleRedisDisableNextStep = useCallback(() => {
    switch (redisDisableStep) {
      case 'warning':
        setRedisDisableStep('confirm1');
        break;
      case 'confirm1':
        setRedisDisableStep('confirm2');
        break;
      case 'confirm2':
        setRedisDisableStep('password');
        break;
      case 'password':
        // 验证当前登录管理员的密码并关闭Redis
        if (!adminPassword.trim()) {
          message.error('请输入管理员密码');
          return;
        }
        
        // 验证当前登录管理员的密码
        handleVerifyAdminPasswordAndDisableRedis();
        break;
    }
  }, [redisDisableStep, adminPassword]);

  const handleVerifyAdminPasswordAndDisableRedis = useCallback(async () => {
    try {
      // 验证当前登录管理员的密码
      // 这里将来会调用真实的API验证当前用户密码
      // const response = await fetch('/api/admin/verify-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password: adminPassword })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('密码验证失败');
      // }

      // 模拟API调用 - 实际实现时替换为真实的密码验证API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 临时演示：这里应该调用真实的用户密码验证API
      // 实际实现时，后端应该验证当前登录用户的密码
      const isValidPassword = adminPassword === 'admin123'; // 临时演示，实际应该从API获取验证结果
      
      if (!isValidPassword) {
        message.error('管理员密码错误，请重新输入');
        return;
      }
      
      // 密码验证成功，执行Redis关闭
      handleRedisConfigChange('enabled', false);
      setRedisStatus('disconnected');
      setRedisDisableModal(false);
      setAdminPassword('');
      message.success('Redis服务已关闭');
      
    } catch (error: any) {
      message.error(`密码验证失败: ${error.message || '网络错误'}`);
    }
  }, [adminPassword, handleRedisConfigChange]);

  // 后端配置相关处理函数
  const handleServerConfigSave = async () => {
    try {
      const values = await serverForm.validateFields();
      updateServerConfig.mutate(values as ServerConfig);
    } catch (_error) {
      message.error('请检查表单输入');
    }
  };

  const handleCorsConfigSave = async () => {
    try {
      const values = await corsForm.validateFields();
      updateCorsConfig.mutate(values as CorsConfig);
    } catch (_error) {
      message.error('请检查表单输入');
    }
  };

  const handleLoggingConfigSave = async () => {
    try {
      const values = await loggingForm.validateFields();
      updateLoggingConfig.mutate(values as LoggingConfig);
    } catch (_error) {
      message.error('请检查表单输入');
    }
  };

  const handleTimeZoneChange = (timeZoneId: string) => {
    setTimeZone.mutate({ timeZoneId });
  };

  const handleServerReset = (category: string) => {
    setResetCategory(category);
    setServerResetModalVisible(true);
  };

  const confirmServerReset = () => {
    resetConfig.mutate({ category: resetCategory });
    setServerResetModalVisible(false);
  };

  const handleBackup = () => {
    backupConfig.mutate();
  };

  // 初始化
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 表单值变化
  const handleFormChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  // 后端配置标签页渲染函数
  const renderServerConfigTab = () => (
    <div style={{ maxWidth: '800px' }}>
      <Alert
        message="后端配置说明"
        description="这些设置影响后端的运行行为，保存在后端配置文件中。修改后可能需要重启服务才能生效。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form form={serverForm} layout="vertical" size="large">
        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="服务器名称"
              rules={[{ required: true, message: '请输入服务器名称' }]}
              extra="服务器的显示名称"
            >
              <Input placeholder="VoxNest Server" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="version"
              label="版本号"
              rules={[{ required: true, message: '请输入版本号' }]}
              extra="当前服务器版本"
            >
              <Input placeholder="1.0.0" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="environment"
              label="运行环境"
              rules={[{ required: true, message: '请选择运行环境' }]}
              extra="当前运行环境"
            >
              <Select placeholder="选择运行环境">
                <Option value="Development">开发环境</Option>
                <Option value="Staging">测试环境</Option>
                <Option value="Production">生产环境</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="timeZone"
              label={
                <Space>
                  <GlobalOutlined />
                  时区设置
                </Space>
              }
              rules={[{ required: true, message: '请选择时区' }]}
              extra="服务器时区，影响日志记录和数据显示的时间"
            >
              <Select
                placeholder="选择时区"
                showSearch
                filterOption={(input, option) => {
                  if (option && 'label' in option && typeof option.label === 'string') {
                    return option.label.toLowerCase().includes(input.toLowerCase());
                  }
                  return false;
                }}
                onChange={handleTimeZoneChange}
              >
                {availableTimeZones.data?.map(tz => (
                  <Option key={tz.id} value={tz.id}>
                    <Space>
                      <span>{tz.displayName}</span>
                      <Tag color="blue">
                        UTC{tz.baseUtcOffset}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="maxRequestBodySize"
              label="最大请求体大小"
              rules={[{ required: true, message: '请输入最大请求体大小' }]}
              extra="单位：MB，影响文件上传大小限制"
            >
              <InputNumber
                min={1}
                max={1024}
                style={{ width: '100%' }}
                placeholder="30"
                addonAfter="MB"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="enableHttpsRedirection"
                label="启用HTTPS重定向"
                valuePropName="checked"
                extra="自动将HTTP请求重定向到HTTPS"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="enableDetailedErrors"
                label="启用详细错误信息"
                valuePropName="checked"
                extra="在开发环境下显示详细的错误堆栈信息"
              >
                <Switch />
              </Form.Item>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={updateServerConfig.isPending}
            onClick={handleServerConfigSave}
          >
            保存配置
          </Button>
          <Button
            danger
            icon={<UndoOutlined />}
            onClick={() => handleServerReset('server')}
          >
            重置为默认
          </Button>
        </Space>
      </Form>

      {currentTimeZone.data && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message={
            <Space>
              <span>当前时区: {currentTimeZone.data.displayName}</span>
              <Tag color="blue">UTC{currentTimeZone.data.baseUtcOffset}</Tag>
            </Space>
          }
        />
      )}
    </div>
  );

  const renderDatabaseConfigTab = () => (
    <div style={{ maxWidth: '800px' }}>
      {/* 主数据库配置 */}
      <Alert
        type="info"
        showIcon
        icon={<DatabaseOutlined />}
        message="主数据库配置"
        description="数据库配置包含敏感信息，只能通过后端配置文件修改。这里显示的连接字符串已脱敏处理。"
        style={{ marginBottom: 24 }}
      />

      {databaseConfig.data && (
        <List size="large" style={{ marginBottom: 32 }}>
          <List.Item>
            <List.Item.Meta
              title="数据库提供商"
              description={
                <Tag color="blue" style={{ fontSize: '14px' }}>
                  {databaseConfig.data.provider}
                </Tag>
              }
            />
          </List.Item>
          <List.Item>
            <List.Item.Meta
              title="连接字符串"
              description={
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {databaseConfig.data.connectionString}
                </span>
              }
            />
          </List.Item>
          <List.Item>
            <List.Item.Meta
              title="连接池配置"
              description={
                <Space>
                  <Tag>最大连接数: {databaseConfig.data.maxPoolSize}</Tag>
                  <Tag>连接超时: {databaseConfig.data.connectionTimeout}秒</Tag>
                </Space>
              }
            />
          </List.Item>
          <List.Item>
            <List.Item.Meta
              title="调试选项"
              description={
                <Space>
                  <Tag color={databaseConfig.data.enableSensitiveDataLogging ? 'red' : 'default'}>
                    敏感数据日志: {databaseConfig.data.enableSensitiveDataLogging ? '启用' : '禁用'}
                  </Tag>
                  <Tag color={databaseConfig.data.enableDetailedErrors ? 'orange' : 'default'}>
                    详细错误: {databaseConfig.data.enableDetailedErrors ? '启用' : '禁用'}
                  </Tag>
                </Space>
              }
            />
          </List.Item>
        </List>
      )}

      <Divider />

      {/* Redis缓存配置 */}
      <div style={{ marginTop: 32 }}>
        <Alert
          type="warning"
          showIcon
          icon={<HddOutlined />}
          message="Redis 缓存配置"
          description={
            <div>
              <p>Redis用于缓存、会话存储和实时功能支持。配置Redis前请确保Redis服务器已安装并运行。</p>
              <p style={{ margin: '8px 0 0 0', color: '#1890ff', fontSize: '13px' }}>
                💡 <strong>提示：</strong>使用Docker安装的VoxNest程序会自动包含Redis服务，无需单独安装。
              </p>
            </div>
          }
          style={{ marginBottom: 24 }}
        />

        <Card
          title={
            <Space>
              <HddOutlined style={{ color: '#dc382d' }} />
              <span>Redis 服务配置</span>
              <Tag color={redisConfig.enabled ? (redisStatus === 'connected' ? 'green' : 'orange') : 'default'}>
                {redisConfig.enabled ? (redisStatus === 'connected' ? '已连接' : '已启用') : '已禁用'}
              </Tag>
            </Space>
          }
          extra={
            <Switch
              checked={redisConfig.enabled}
              onChange={(checked) => {
                if (!checked && redisConfig.enabled) {
                  handleRedisDisable();
                } else {
                  handleRedisConfigChange('enabled', checked);
                  if (!checked) {
                    setRedisStatus('disconnected');
                  }
                }
              }}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          }
        >
          {redisConfig.enabled && (
            <Form
              form={redisForm}
              layout="vertical"
              initialValues={redisConfig}
              disabled={redisStatus === 'connected'}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="host"
                    label="Redis 服务器地址"
                    rules={[{ required: true, message: '请输入Redis服务器地址' }]}
                  >
                    <Input
                      placeholder="localhost"
                      onChange={(e) => handleRedisConfigChange('host', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="port"
                    label="端口号"
                    rules={[{ required: true, message: '请输入端口号' }]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      placeholder="6379"
                      style={{ width: '100%' }}
                      onChange={(value) => handleRedisConfigChange('port', value || 6379)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="username" label="用户名 (可选)">
                    <Input
                      placeholder="留空表示不使用用户名认证"
                      onChange={(e) => handleRedisConfigChange('username', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="password" label="密码 (可选)">
                    <Input.Password
                      placeholder="留空表示不使用密码认证"
                      visibilityToggle={{
                        visible: showRedisPassword,
                        onVisibleChange: setShowRedisPassword,
                      }}
                      onChange={(e) => handleRedisConfigChange('password', e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="database" label="数据库编号">
                    <InputNumber
                      min={0}
                      max={15}
                      placeholder="0"
                      style={{ width: '100%' }}
                      onChange={(value) => handleRedisConfigChange('database', value || 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="connectionTimeout" label="连接超时 (毫秒)">
                    <InputNumber
                      min={1000}
                      max={30000}
                      placeholder="5000"
                      style={{ width: '100%' }}
                      onChange={(value) => handleRedisConfigChange('connectionTimeout', value || 5000)}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="retryAttempts" label="重试次数">
                    <InputNumber
                      min={0}
                      max={10}
                      placeholder="3"
                      style={{ width: '100%' }}
                      onChange={(value) => handleRedisConfigChange('retryAttempts', value || 3)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {redisError && (
                <Alert
                  type="error"
                  message="Redis连接错误"
                  description={redisError}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Space style={{ marginTop: 16 }}>
                {redisStatus !== 'connected' && (
                  <>
                    <Button
                      type="default"
                      icon={redisTestLoading ? <LoadingOutlined /> : <CheckCircleOutlined />}
                      loading={redisTestLoading}
                      onClick={handleRedisTestConnection}
                    >
                      测试连接
                    </Button>
                    <Button
                      type="primary"
                      icon={redisInitLoading ? <LoadingOutlined /> : <PlayCircleOutlined />}
                      loading={redisInitLoading}
                      onClick={handleRedisInitialize}
                      disabled={redisStatus === 'error' || redisTestLoading}
                    >
                      开始初始化连接
                    </Button>
                  </>
                )}
                {redisStatus === 'connected' && (
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleRedisDisable}
                  >
                    关闭 Redis 服务
                  </Button>
                )}
                {redisStatus !== 'connected' && redisConfig.enabled && (
                  <Button
                    type="default"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleRedisDisable}
                  >
                    关闭 Redis 配置
                  </Button>
                )}
              </Space>
            </Form>
          )}

          {!redisConfig.enabled && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8c8c8c' }}>
              <HddOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
              <p>Redis服务未启用</p>
              <p style={{ fontSize: '12px', marginBottom: '8px' }}>启用Redis服务以支持缓存、会话存储和实时功能</p>
              <p style={{ fontSize: '11px', color: '#1890ff' }}>
                💡 Docker安装用户：Redis服务已预装，直接配置即可使用
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const renderCorsConfigTab = () => (
    <div style={{ maxWidth: '800px' }}>
      <Alert
        type="info"
        showIcon
        icon={<SecurityScanOutlined />}
        message="跨域资源共享(CORS)配置"
        description="配置允许访问API的域名、方法和头部信息。请谨慎配置以确保安全性。"
        style={{ marginBottom: 24 }}
      />

      <Form form={corsForm} layout="vertical" size="large">
        <Form.Item
          name="allowedOrigins"
          label="允许的来源域名"
          rules={[{ required: true, message: '请至少配置一个允许的来源域名' }]}
          extra="允许访问API的域名列表，支持具体域名和通配符"
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入域名并按回车添加，如: http://localhost:3000"
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="allowedMethods"
              label="允许的HTTP方法"
              rules={[{ required: true, message: '请至少选择一个HTTP方法' }]}
              extra="允许的HTTP请求方法"
            >
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="选择HTTP方法"
              >
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
                <Option value="OPTIONS">OPTIONS</Option>
                <Option value="HEAD">HEAD</Option>
                <Option value="PATCH">PATCH</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="allowedHeaders"
              label="允许的请求头"
              rules={[{ required: true, message: '请至少配置一个允许的请求头' }]}
              extra="允许客户端发送的请求头"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="输入请求头名称"
                tokenSeparators={[',']}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="allowCredentials"
          label="允许凭据"
          valuePropName="checked"
          extra="是否允许发送Cookie和Authorization头等凭据信息"
        >
          <Switch />
        </Form.Item>

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={updateCorsConfig.isPending}
            onClick={handleCorsConfigSave}
          >
            保存配置
          </Button>
          <Button
            danger
            icon={<UndoOutlined />}
            onClick={() => handleServerReset('cors')}
          >
            重置为默认
          </Button>
        </Space>
      </Form>
    </div>
  );

  const renderLoggingConfigTab = () => (
    <div style={{ maxWidth: '800px' }}>
      <Alert
        type="warning"
        showIcon
        icon={<FileTextOutlined />}
        message="日志配置"
        description="修改日志配置需要重启服务才能完全生效。请谨慎修改生产环境的日志级别。"
        style={{ marginBottom: 24 }}
      />

      <Form form={loggingForm} layout="vertical" size="large">
        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="level"
              label="日志级别"
              rules={[{ required: true, message: '请选择日志级别' }]}
              extra="控制记录的日志详细程度"
            >
              <Select placeholder="选择日志级别">
                <Option value="Trace">Trace (最详细)</Option>
                <Option value="Debug">Debug (调试)</Option>
                <Option value="Information">Information (信息)</Option>
                <Option value="Warning">Warning (警告)</Option>
                <Option value="Error">Error (错误)</Option>
                <Option value="Critical">Critical (严重错误)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="filePath"
              label="日志文件路径"
              rules={[{ required: true, message: '请输入日志文件路径' }]}
              extra="相对于服务器根目录的日志文件路径"
            >
              <Input placeholder="logs/voxnest.log" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="maxFileSize"
              label="单个日志文件最大大小"
              rules={[{ required: true, message: '请输入文件大小' }]}
              extra="单位：MB，超过此大小会创建新文件"
            >
              <InputNumber
                min={1}
                max={1024}
                style={{ width: '100%' }}
                placeholder="100"
                addonAfter="MB"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="retainedFileCount"
              label="保留文件数量"
              rules={[{ required: true, message: '请输入保留文件数量' }]}
              extra="最多保留的历史日志文件数量"
            >
              <InputNumber
                min={1}
                max={100}
                style={{ width: '100%' }}
                placeholder="30"
                addonAfter="个"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 0]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="enableConsole"
                label="启用控制台输出"
                valuePropName="checked"
                extra="是否在控制台输出日志"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="enableFile"
                label="启用文件日志"
                valuePropName="checked"
                extra="是否将日志写入文件"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="enableDebugMode"
                label="启用 Debug 日志模式"
                valuePropName="checked"
                extra={
                  <span>
                    开启后会记录更详细的调试信息，包括SQL查询、性能指标等
                    <br />
                    <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                      ⚠️ 仅建议在开发环境使用，生产环境请谨慎开启
                    </span>
                  </span>
                }
              >
                <Switch 
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              </Form.Item>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={updateLoggingConfig.isPending}
            onClick={handleLoggingConfigSave}
          >
            保存配置
          </Button>
          <Button
            danger
            icon={<UndoOutlined />}
            onClick={() => handleServerReset('logging')}
          >
            重置为默认
          </Button>
        </Space>
      </Form>
    </div>
  );

  // 渲染表单项
  const renderFormItem = (key: string, property: FrontendSettingProperty) => {
    switch (property.type) {
      case 'boolean':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            valuePropName="checked"
            help={property.description}
          >
            <Switch />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
            rules={[
              ...(property.required ? [{ required: true, message: `请输入${property.title}` }] : []),
              ...(property.min !== undefined ? [{ type: 'number' as const, min: property.min }] : []),
              ...(property.max !== undefined ? [{ type: 'number' as const, max: property.max }] : [])
            ]}
          >
            <InputNumber
              min={property.min}
              max={property.max}
              style={{ width: '100%' }}
              placeholder={property.description}
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
            rules={property.required ? [{ required: true, message: `请选择${property.title}` }] : []}
          >
            <Select placeholder={property.description} allowClear>
              {property.options?.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'color':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
          >
            <ColorPicker showText format="hex" />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
            rules={property.required ? [{ required: true, message: `请输入${property.title}` }] : []}
          >
            <TextArea rows={4} placeholder={property.description} />
          </Form.Item>
        );

      default:
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
            rules={property.required ? [{ required: true, message: `请输入${property.title}` }] : []}
          >
            <Input placeholder={property.description} />
          </Form.Item>
        );
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SettingOutlined />
          站点设置
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          管理网站的各项配置设置，包括外观、功能和后端配置
        </Paragraph>
      </div>

      {/* 主内容区 */}
      <Card
        extra={
          <Space>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
              导入
            </Button>
            <Button icon={<UndoOutlined />} onClick={handleFrontendReset}>
              重置
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadSettings} loading={loading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              保存设置
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            // 前端配置标签页 - 重新设计后的分组
            ...frontendSettingsSchema.groups
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(group => {
                // 为不同的组选择不同的图标
                const getGroupIcon = (groupId: string) => {
                  switch (groupId) {
                    case 'interface':
                      return <BgColorsOutlined />;
                    case 'experience':
                      return <ThunderboltOutlined />;
                    case 'developer':
                      return <BugOutlined />;
                    default:
                      return <SettingOutlined />;
                  }
                };

                return {
                  key: group.id,
                  label: (
                    <Space>
                      {getGroupIcon(group.id)}
                      {group.title}
                    </Space>
                  ),
                  children: (
                    <div style={{ maxWidth: '800px' }}>
                      <Alert
                        message="前端配置说明"
                        description="这些设置控制网站的前端行为和外观，保存在浏览器本地存储中。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <Form
                        form={form}
                        layout="vertical"
                        size="large"
                        onValuesChange={handleFormChange}
                      >
                        {group.description && (
                          <Alert
                            message={group.description}
                            type="info"
                            style={{ marginBottom: 16 }}
                            showIcon
                          />
                        )}
                        {Object.entries(frontendSettingsSchema.properties)
                          .filter(([, property]) => property.group === group.id)
                          .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                          .map(([key, property]) => renderFormItem(key, property))}
                      </Form>
                    </div>
                  ),
                };
              }),
            // 后端配置 - 统一的主标签，包含子标签
            {
              key: 'server-config',
              label: (
                <Space>
                  <AppstoreOutlined />
                  后端配置
                </Space>
              ),
              children: (
                <div style={{ maxWidth: '1000px' }}>
                  <Alert
                    message="后端配置说明"
                    description="这些设置控制后端的核心功能，修改后可能需要重启服务才能生效。建议在修改前先备份配置。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Tabs
                    type="card"
                    size="small"
                    defaultActiveKey="general"
                    items={[
                      {
                        key: 'general',
                        label: (
                          <Space>
                            <SettingOutlined />
                            基础设置
                          </Space>
                        ),
                        children: renderServerConfigTab(),
                      },
                      {
                        key: 'database',
                        label: (
                          <Space>
                            <DatabaseOutlined />
                            数据库
                          </Space>
                        ),
                        children: renderDatabaseConfigTab(),
                      },
                      {
                        key: 'cors',
                        label: (
                          <Space>
                            <SecurityScanOutlined />
                            CORS
                          </Space>
                        ),
                        children: renderCorsConfigTab(),
                      },
                      {
                        key: 'logging',
                        label: (
                          <Space>
                            <FileTextOutlined />
                            日志
                          </Space>
                        ),
                        children: renderLoggingConfigTab(),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
          tabBarExtraContent={
            <Space>
              {activeTab === 'server-config' && (
                <>
                  <Tooltip title="备份后端配置">
                    <Button
                      icon={<ExportOutlined />}
                      loading={backupConfig.isPending}
                      onClick={handleBackup}
                      size="small"
                    >
                      备份配置
                    </Button>
                  </Tooltip>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={refetchServerConfig}
                    loading={serverConfigLoading}
                    size="small"
                  >
                    刷新
                  </Button>
                </>
              )}
            </Space>
          }
        />
      </Card>

      {/* 导出模态框 */}
      <Modal
        title="导出设置"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="copy" onClick={handleCopyExport}>
            复制到剪贴板
          </Button>,
          <Button key="close" onClick={() => setExportModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <Paragraph>
          以下是您当前的设置配置，您可以复制这些数据用于备份或迁移到其他浏览器：
        </Paragraph>
        <TextArea
          value={exportData}
          rows={10}
          readOnly
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 导入模态框 */}
      <Modal
        title="导入设置"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportData('');
        }}
        onOk={handleImport}
        okText="导入"
        cancelText="取消"
        width={600}
      >
        <Paragraph>
          请粘贴要导入的设置配置。注意：这将覆盖当前的所有设置。
        </Paragraph>
        <TextArea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          rows={10}
          placeholder="在此粘贴设置配置..."
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 后端配置重置确认模态框 */}
      <Modal
        title="确认重置配置"
        open={serverResetModalVisible}
        onOk={confirmServerReset}
        onCancel={() => setServerResetModalVisible(false)}
        okText="确认重置"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="此操作将重置配置为系统默认值，所有自定义设置将丢失！"
          />
          <Paragraph>
            你确定要重置 <strong>{resetCategory}</strong> 配置吗？此操作不可撤销。
          </Paragraph>
        </Space>
      </Modal>

      {/* Redis关闭确认模态框 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>关闭 Redis 服务</span>
          </Space>
        }
        open={redisDisableModal}
        onCancel={() => {
          setRedisDisableModal(false);
          setRedisDisableStep('warning');
          setAdminPassword('');
        }}
        footer={null}
        width={600}
      >
        {redisDisableStep === 'warning' && (
          <div>
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              message="严重警告"
              description="关闭Redis服务将影响系统的缓存、会话管理和实时功能。请确保没有插件或其他服务正在使用Redis。"
              style={{ marginBottom: 16 }}
            />
            <Typography.Title level={5} style={{ color: '#ff4d4f' }}>
              关闭Redis服务可能导致：
            </Typography.Title>
            <ul style={{ color: '#8c8c8c', paddingLeft: 20 }}>
              <li>用户会话丢失，需要重新登录</li>
              <li>缓存数据清空，系统性能下降</li>
              <li>实时通知和消息功能停止</li>
              <li>依赖Redis的扩展插件无法正常工作</li>
            </ul>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button onClick={() => setRedisDisableModal(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" danger onClick={handleRedisDisableNextStep}>
                我已了解，继续
              </Button>
            </div>
          </div>
        )}

        {redisDisableStep === 'confirm1' && (
          <div>
            <Alert
              type="warning"
              showIcon
              message="第一次确认"
              description="请再次确认您真的要关闭Redis服务。此操作将立即生效，无法撤销。"
              style={{ marginBottom: 16 }}
            />
            <Typography.Paragraph>
              <Typography.Text strong>请在下方输入 "确认关闭" 来继续：</Typography.Text>
            </Typography.Paragraph>
            <Input
              placeholder="请输入：确认关闭"
              onChange={(e) => {
                if (e.target.value === '确认关闭') {
                  setTimeout(() => handleRedisDisableNextStep(), 500);
                }
              }}
              style={{ marginBottom: 16 }}
            />
            <div style={{ textAlign: 'center' }}>
              <Button onClick={() => setRedisDisableModal(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
            </div>
          </div>
        )}

        {redisDisableStep === 'confirm2' && (
          <div>
            <Alert
              type="error"
              showIcon
              message="最后确认"
              description="这是最后一次确认。关闭Redis后，您需要重新配置才能恢复服务。"
              style={{ marginBottom: 16 }}
            />
            <Typography.Paragraph>
              <Typography.Text strong style={{ color: '#ff4d4f' }}>
                请再次确认：您确定要关闭Redis服务吗？
              </Typography.Text>
            </Typography.Paragraph>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button onClick={() => setRedisDisableModal(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" danger onClick={handleRedisDisableNextStep}>
                确定关闭
              </Button>
            </div>
          </div>
        )}

        {redisDisableStep === 'password' && (
          <div>
            <Alert
              type="error"
              showIcon
              message="身份验证"
              description="请输入您当前登录账户的密码以完成Redis服务关闭操作。"
              style={{ marginBottom: 16 }}
            />
            <Typography.Paragraph>
              <Typography.Text strong>输入您的账户密码：</Typography.Text>
            </Typography.Paragraph>
            <Input.Password
              placeholder="您的账户密码"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onPressEnter={handleRedisDisableNextStep}
              style={{ marginBottom: 16 }}
            />
            <div style={{ textAlign: 'center' }}>
              <Button onClick={() => setRedisDisableModal(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button 
                type="primary" 
                danger 
                onClick={handleRedisDisableNextStep}
                disabled={!adminPassword.trim()}
              >
                关闭Redis服务
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 配置修改注意事项 - 移至底部 */}
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message="注意事项"
        description={
          <ul style={{ paddingLeft: '16px', margin: '8px 0' }}>
            <li>前端设置保存在浏览器本地存储中，仅影响当前浏览器</li>
            <li>后端配置保存在服务器端，影响所有用户和全站功能</li>
            <li>端口配置只能通过后端配置文件修改，不能通过此界面更改</li>
            <li>部分后端配置更改需要重启服务才能生效</li>
            <li>建议在修改前先备份当前配置</li>
          </ul>
        }
        style={{ marginTop: 24 }}
      />

    </div>
  );
};

export default SiteSettings;