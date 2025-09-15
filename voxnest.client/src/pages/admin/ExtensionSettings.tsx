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
  Modal,
  Typography,
  Switch,
  Form,
  InputNumber,
  ColorPicker,
  Alert,
  Empty,
  Tabs
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  CodeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/lib/table';
// import { useExtensionManager } from '../../extensions/react/extensionHooks';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ConfigProperty {
  type: 'boolean' | 'number' | 'string' | 'select' | 'array' | 'color' | 'url' | 'textarea';
  title: string;
  description?: string;
  default?: any;
  group?: string;
  order?: number;
  depends?: string;
  dependsValue?: any;
  format?: 'time' | 'tags' | string;
  pattern?: string;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  required?: boolean;
}

interface ConfigGroup {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

interface ExtensionConfig {
  id: string;
  name: string;
  type: 'plugin' | 'theme';
  version: string;
  enabled: boolean;
  configSchema?: {
    title?: string;
    description?: string;
    groups?: ConfigGroup[];
    properties?: Record<string, ConfigProperty>;
    required?: string[];
  };
  currentConfig?: Record<string, any>;
}

interface ExtensionSettingsProps {}

const ExtensionSettings: React.FC<ExtensionSettingsProps> = () => {
  // 状态管理
  const [extensions, setExtensions] = useState<ExtensionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEnabled, setFilterEnabled] = useState<boolean | undefined>(undefined);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // 扩展管理器（暂时未使用，但保留以备后用）
  // const extensionManager = useExtensionManager();

  // ID 到目录名的映射
  const extensionDirMap: { [key: string]: string } = {
    'cookie-consent': 'CookieConsent',
    'dark-mode-theme': 'DarkModeTheme'
  };

  // 获取 manifest 配置
  const fetchManifest = async (extensionId: string) => {
    const dirName = extensionDirMap[extensionId];
    if (!dirName) {
      throw new Error(`Unknown extension: ${extensionId}`);
    }

    try {
      // 使用正确的目录名获取 manifest.json
      const response = await fetch(`/extensions/${dirName}/manifest.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch manifest for ${extensionId}:`, error);
      throw error;
    }
  };

  // 获取扩展清单
  const fetchExtensionsList = async () => {
    try {
      const response = await fetch('/extensions/extensions.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch extensions.json: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch extensions.json:', error);
      throw error;
    }
  };

  // 加载扩展列表和配置
  const loadExtensions = useCallback(async () => {
    setLoading(true);
    try {
      // 获取扩展清单
      console.log('Loading extensions from extensions.json');
      const data = await fetchExtensionsList();
      console.log('Extensions data:', data);
      
      const extensionConfigs: ExtensionConfig[] = [];
      
      for (const ext of data.extensions) {
        try {
          console.log(`Loading manifest for extension: ${ext.id}`);
          
          // 获取 manifest.json
          const manifest = await fetchManifest(ext.id);
          console.log(`Manifest for ${ext.id}:`, manifest);
          console.log(`Config schema for ${ext.id}:`, manifest.configSchema);
          
          // 获取当前配置值
          const currentConfig = await loadExtensionConfig(ext.id);
          console.log(`Current config for ${ext.id}:`, currentConfig);
          
          extensionConfigs.push({
            id: ext.id,
            name: ext.name,
            type: ext.type,
            version: ext.version,
            enabled: ext.enabled,
            configSchema: manifest.configSchema,
            currentConfig
          });
        } catch (error) {
          console.warn(`Failed to load config for extension ${ext.id}:`, error);
          // 即使配置加载失败，也要显示扩展基本信息
          extensionConfigs.push({
            id: ext.id,
            name: ext.name,
            type: ext.type,
            version: ext.version,
            enabled: ext.enabled
          });
        }
      }
      
      console.log('Final extension configs:', extensionConfigs);
      setExtensions(extensionConfigs);
    } catch (error) {
      console.error('Failed to load extensions:', error);
      message.error('加载扩展列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载扩展配置
  const loadExtensionConfig = async (extensionId: string): Promise<Record<string, any>> => {
    try {
      const response = await fetch(`/api/extension/configs/${extensionId}`);
      if (response.ok) {
        const data = await response.json();
        return data.config || {};
      }
    } catch (error) {
      console.warn(`Failed to load config for ${extensionId}:`, error);
    }
    return {};
  };

  // 保存扩展配置
  const saveExtensionConfig = async (extensionId: string, config: Record<string, any>) => {
    try {
      const response = await fetch(`/api/extension/configs/${extensionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });
      
      if (response.ok) {
        message.success('配置保存成功');
        await loadExtensions(); // 重新加载以更新状态
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      message.error('配置保存失败');
    }
  };

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  // 统计信息
  const stats = {
    total: extensions.length,
    enabled: extensions.filter(ext => ext.enabled).length,
    plugins: extensions.filter(ext => ext.type === 'plugin').length,
    themes: extensions.filter(ext => ext.type === 'theme').length,
    configurable: extensions.filter(ext => ext.configSchema?.properties).length
  };

  // 过滤扩展
  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         ext.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || ext.type === filterType;
    const matchesEnabled = filterEnabled === undefined || ext.enabled === filterEnabled;
    
    // 显示所有扩展，但在表格中标注哪些有配置
    return matchesSearch && matchesType && matchesEnabled;
  });

  // 打开配置抽屉
  const handleConfigureExtension = (extension: ExtensionConfig) => {
    setSelectedExtension(extension.id);
    setConfigModalVisible(true);
    
    // 设置表单初始值
    if (extension.currentConfig && extension.configSchema?.properties) {
      const formValues: Record<string, any> = {};
      Object.entries(extension.configSchema.properties).forEach(([key, property]) => {
        const currentValue = extension.currentConfig![key];
        formValues[key] = currentValue !== undefined ? currentValue : property.default;
      });
      configForm.setFieldsValue(formValues);
    }
    setHasUnsavedChanges(false);
  };

  // 保存配置
  const handleSaveConfig = async () => {
    if (!selectedExtension) return;

    try {
      setSaving(true);
      const values = await configForm.validateFields();
      await saveExtensionConfig(selectedExtension, values);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // 重置配置
  const handleResetConfig = () => {
    const extension = extensions.find(ext => ext.id === selectedExtension);
    if (extension?.configSchema?.properties) {
      const defaultValues: Record<string, any> = {};
      Object.entries(extension.configSchema.properties).forEach(([key, property]) => {
        defaultValues[key] = property.default;
      });
      configForm.setFieldsValue(defaultValues);
      setHasUnsavedChanges(true);
    }
  };

  // 渲染配置表单项
  const renderConfigFormItem = (key: string, property: ConfigProperty) => {
    // 处理条件显示
    if (property.depends) {
      return (
        <Form.Item noStyle dependencies={[property.depends]}>
          {({ getFieldValue }) => {
            const shouldShow = getFieldValue(property.depends) === property.dependsValue;
            return shouldShow ? renderFormField(key, property) : null;
          }}
        </Form.Item>
      );
    }
    
    return renderFormField(key, property);
  };

  // 实际渲染表单字段
  const renderFormField = (key: string, property: ConfigProperty) => {

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
            <Switch onChange={() => setHasUnsavedChanges(true)} />
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
              onChange={() => setHasUnsavedChanges(true)}
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
            <Select 
              placeholder={property.description} 
              allowClear
              onChange={() => setHasUnsavedChanges(true)}
            >
              {property.options?.map(option => (
                <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          </Form.Item>
        );
      
      case 'array':
        if (property.format === 'tags') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={property.title}
              help={property.description}
            >
              <Select 
                mode="multiple" 
                placeholder={property.description}
                allowClear
                onChange={() => setHasUnsavedChanges(true)}
              >
                {property.options?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        }
        break;

      case 'color':
        return (
          <Form.Item
            key={key}
            name={key}
            label={property.title}
            help={property.description}
          >
            <ColorPicker 
              showText 
              format="hex"
              onChange={() => setHasUnsavedChanges(true)}
            />
          </Form.Item>
        );

      case 'url':
      case 'string':
        // 处理时间格式
        if (property.format === 'time') {
    return (
                  <Form.Item
                    key={key}
                    name={key}
                    label={property.title}
                    help={property.description}
                    rules={[
                ...(property.required ? [{ required: true, message: `请输入${property.title}` }] : []),
                      ...(property.pattern ? [{ pattern: new RegExp(property.pattern), message: '格式不正确' }] : [])
                    ]}
            >
              <Input
                type="time"
                placeholder={property.description}
                onChange={() => setHasUnsavedChanges(true)}
              />
            </Form.Item>
          );
        }
        
        // URL类型
        if (property.type === 'url') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={property.title}
              help={property.description}
              rules={[
                ...(property.required ? [{ required: true, message: `请输入${property.title}` }] : []),
                { type: 'url', message: '请输入有效的URL地址' }
              ]}
            >
              <Input
                placeholder={property.description}
                onChange={() => setHasUnsavedChanges(true)}
              />
                  </Form.Item>
          );
        }

        // 普通字符串
        return (
              <Form.Item
                key={key}
                name={key}
                label={property.title}
                help={property.description}
                rules={[
              ...(property.required ? [{ required: true, message: `请输入${property.title}` }] : []),
                  ...(property.pattern ? [{ pattern: new RegExp(property.pattern), message: '格式不正确' }] : [])
                ]}
          >
            <Input
              placeholder={property.description}
              onChange={() => setHasUnsavedChanges(true)}
            />
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
            <TextArea 
              rows={4} 
              placeholder={property.description}
              onChange={() => setHasUnsavedChanges(true)}
            />
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
            <Input
              placeholder={property.description}
              onChange={() => setHasUnsavedChanges(true)}
            />
              </Form.Item>
        );
    }
  };

  // 渲染表单字段结束

  // 表格列定义
  const columns: ColumnsType<ExtensionConfig> = [
    {
      title: '扩展名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ExtensionConfig) => (
        <Space>
          {record.type === 'plugin' ? <CodeOutlined /> : <BgColorsOutlined />}
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.id} • 版本: {record.version}
            </Text>
          </div>
        </Space>
      ),
    },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string, _record: ExtensionConfig) => {
          // 判断是否为前端扩展（基于扩展配置位置）
          const isFrontend = true; // 当前都是前端扩展
          
          return (
            <Space direction="vertical" size={2}>
              <Tag color={type === 'plugin' ? 'blue' : 'purple'}>
                {type === 'plugin' ? '插件' : '主题'}
              </Tag>
              <Tag color={isFrontend ? 'cyan' : 'orange'} style={{ fontSize: '10px' }}>
                {isFrontend ? '前端' : '后端'}
              </Tag>
            </Space>
          );
        },
      },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 140,
      render: (enabled: boolean) => (
        <Tag 
          color={enabled ? 'success' : 'default'} 
          icon={enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ 
            minWidth: '70px', 
            textAlign: 'center',
            padding: '4px 8px',
            fontSize: '12px'
          }}
        >
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
        {
          title: '配置项',
          key: 'configurable',
          width: 120,
          render: (_, record: ExtensionConfig) => {
            const count = record.configSchema?.properties ? Object.keys(record.configSchema.properties).length : 0;
            return (
              <div>
                <Text type={count > 0 ? undefined : 'secondary'}>
                  {count > 0 ? `${count} 项` : '无'}
                </Text>
                {/* 调试信息 */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                    Schema: {record.configSchema ? 'Yes' : 'No'}
                    {record.configSchema && record.configSchema.properties && (
                      <div>Properties: {Object.keys(record.configSchema.properties).join(', ')}</div>
                    )}
          </div>
        )}
              </div>
            );
          },
        },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: ExtensionConfig) => (
        <Space>
          <Tooltip title="配置扩展">
            <Button
              type="primary"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleConfigureExtension(record)}
              disabled={!record.configSchema?.properties}
            >
              配置
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const selectedExtensionData = extensions.find(ext => ext.id === selectedExtension);

  return (
    <div className="extension-settings">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={2}>扩展设置</Title>
          <Paragraph>
            管理和配置已安装扩展的设置，支持个性化定制和实时配置。
          </Paragraph>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Statistic title="总扩展" value={stats.total} prefix={<AppstoreOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="已启用" value={stats.enabled} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="插件" value={stats.plugins} prefix={<CodeOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="主题" value={stats.themes} prefix={<BgColorsOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="可配置" value={stats.configurable} prefix={<SettingOutlined />} />
          </Col>
          <Col span={4}>
            <Button icon={<ReloadOutlined />} onClick={loadExtensions} loading={loading}>
              刷新
            </Button>
          </Col>
        </Row>

        {/* 搜索和过滤 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input.Search
              placeholder="搜索扩展名称或ID"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="扩展类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="plugin">插件</Option>
              <Option value="theme">主题</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="启用状态"
              value={filterEnabled}
              onChange={setFilterEnabled}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={true}>已启用</Option>
              <Option value={false}>已禁用</Option>
            </Select>
          </Col>
        </Row>

        {/* 扩展列表 */}
        <Table
          columns={columns}
          dataSource={filteredExtensions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个扩展`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="没有找到可配置的扩展"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

        {/* 配置模态框 */}
        <Modal
          title={
            <Space>
              <SettingOutlined />
              {selectedExtensionData?.name} - 扩展配置
            </Space>
          }
          width={800}
          open={configModalVisible}
          onCancel={() => {
            if (hasUnsavedChanges) {
              Modal.confirm({
                title: '确认关闭',
                content: '您有未保存的更改，确定要关闭吗？',
                onOk: () => {
                  setConfigModalVisible(false);
                  setHasUnsavedChanges(false);
                },
              });
            } else {
              setConfigModalVisible(false);
            }
          }}
          footer={
            <Space>
              <Button icon={<UndoOutlined />} onClick={handleResetConfig}>
                重置
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveConfig}
                disabled={!hasUnsavedChanges}
              >
                保存
              </Button>
            </Space>
          }
          destroyOnClose={true}
        >
        {selectedExtensionData && (
            <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>{selectedExtensionData.configSchema?.title || selectedExtensionData.name}</Title>
              {selectedExtensionData.configSchema?.description && (
                <Paragraph type="secondary">
                  {selectedExtensionData.configSchema.description}
                </Paragraph>
                    )}
                  </div>

            {selectedExtensionData.configSchema?.properties ? (
              <Form
                form={configForm}
                layout="vertical"
                size="large"
                onValuesChange={() => setHasUnsavedChanges(true)}
              >
                {/* 如果有分组，按分组显示 */}
                {selectedExtensionData.configSchema.groups ? (
                  <Tabs
                    type="card"
                    items={selectedExtensionData.configSchema.groups
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(group => ({
                        key: group.id,
                        label: group.title,
                        children: (
                          <div>
                            {group.description && (
                <Alert
                                message={group.description}
                                type="info"
                                style={{ marginBottom: 16 }}
                  showIcon
                />
              )}
                            {Object.entries(selectedExtensionData.configSchema!.properties!)
                              .filter(([, property]) => property.group === group.id)
                              .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                              .map(([key, property]) => renderConfigFormItem(key, property))}
            </div>
                        ),
                      }))}
                  />
                ) : (
                  /* 无分组，直接显示所有配置项 */
                  Object.entries(selectedExtensionData.configSchema.properties)
                    .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                    .map(([key, property]) => renderConfigFormItem(key, property))
                )}
              </Form>
            ) : (
              <Empty
                description="此扩展没有可配置的选项"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
          )}
        </Modal>
    </div>
  );
};

export default ExtensionSettings;
