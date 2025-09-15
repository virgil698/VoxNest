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
} from 'antd';
import { SaveOutlined, ReloadOutlined, ExportOutlined, ImportOutlined, UndoOutlined } from '@ant-design/icons';
import { 
  FrontendSettingsManager, 
  frontendSettingsSchema, 
  type FrontendSettingProperty 
} from '../../config/frontendSettings';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SiteSettingsProps {}

const SiteSettings: React.FC<SiteSettingsProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');

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
  const handleReset = useCallback(() => {
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

  // 初始化
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 表单值变化
  const handleFormChange = useCallback(() => {
    setHasChanges(true);
  }, []);

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
      {/* 页面标题和操作按钮 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>站点设置</Title>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
            导入
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
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
      </div>


      <Alert
        message="前端配置说明"
        description="这些设置控制网站的前端行为和外观，保存在浏览器本地存储中。配置会立即生效，影响当前浏览器的使用体验。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 设置表单 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          size="large"
          onValuesChange={handleFormChange}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={frontendSettingsSchema.groups
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(group => ({
                key: group.id,
                label: group.title,
                children: (
                  <div style={{ maxWidth: '800px' }}>
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
                  </div>
                ),
              }))}
          />
        </Form>
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

    </div>
  );
};

export default SiteSettings;