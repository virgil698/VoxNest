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
  Modal,
  Typography,
  Switch,
  Form,
  InputNumber,
  ColorPicker,
  Alert,
  Empty,
  Tabs,
  Avatar
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
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

  // 获取扩展类型图标
  const getTypeIcon = (type: string) => {
    return type === 'plugin' ? <CodeOutlined /> : <BgColorsOutlined />;
  };

  // 获取类型标签
  const getTypeTag = (type: string) => {
    const text = type === 'plugin' ? '前端插件' : '主题';
    const color = type === 'plugin' ? 'green' : 'purple';
    return <Tag color={color} icon={getTypeIcon(type)} style={{ fontSize: '12px', padding: '2px 8px' }}>{text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<ExtensionConfig> = [
    {
      title: '扩展信息',
      key: 'info',
      width: 400,
      render: (_, record: ExtensionConfig) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            icon={getTypeIcon(record.type)}
            style={{ 
              backgroundColor: record.type === 'plugin' ? '#52c41a' : '#722ed1',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text strong style={{ fontSize: 16 }}>{record.name}</Text>
              {getTypeTag(record.type)}
            </div>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              可配置的扩展设置，支持个性化定制和实时配置
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {record.id} • v{record.version}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      align: 'center',
      render: (enabled: boolean) => (
        <Tag 
          color={enabled ? 'success' : 'default'} 
          icon={enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ 
            minWidth: '80px', 
            textAlign: 'center',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 500
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
      align: 'center',
      render: (_, record: ExtensionConfig) => {
        const count = record.configSchema?.properties ? Object.keys(record.configSchema.properties).length : 0;
        const hasConfig = count > 0;
        
        return (
          <div style={{ textAlign: 'center' }}>
            {hasConfig ? (
              <Tag color="blue" style={{ fontSize: '13px', padding: '4px 10px' }}>
                {count} 项配置
              </Tag>
            ) : (
              <Tag color="default" style={{ fontSize: '13px', padding: '4px 10px' }}>
                无配置
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record: ExtensionConfig) => {
        const hasConfig = record.configSchema?.properties && Object.keys(record.configSchema.properties).length > 0;
        
        return (
          <Space size="small">
            {hasConfig ? (
              <Tooltip title="配置扩展设置">
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => handleConfigureExtension(record)}
                >
                  配置
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="该扩展暂无可配置项">
                <Button
                  type="default"
                  icon={<SettingOutlined />}
                  disabled
                  style={{ opacity: 0.5 }}
                >
                  无配置
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const selectedExtensionData = extensions.find(ext => ext.id === selectedExtension);

  return (
    <div className="extension-settings">
      <style>
        {`
          .extension-settings-row {
            transition: all 0.2s ease;
          }
          .extension-settings-row:hover {
            background-color: #fafafa;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }
          .ant-table-tbody > tr.extension-settings-row > td {
            border-bottom: 1px solid #f0f0f0;
            padding: 20px 16px !important;
          }
        `}
      </style>
      
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SettingOutlined />
          扩展设置
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          管理和配置已安装扩展的设置，支持个性化定制和实时配置
        </Paragraph>
      </div>

      {/* 主内容区 */}
      <Card>


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
          <Col span={5}>
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
          <Col span={5}>
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
          <Col span={6}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadExtensions} 
              loading={loading}
              type="default"
            >
              刷新
            </Button>
          </Col>
        </Row>

        {/* 扩展列表 */}
        <Table
          columns={columns}
          dataSource={filteredExtensions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 760 }}
          size="large"
          rowClassName={() => 'extension-settings-row'}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个可配置扩展`,
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
