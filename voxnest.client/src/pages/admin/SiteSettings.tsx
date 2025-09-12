import React, { useState, useEffect } from 'react';
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
  Spin,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { AdminApi, SiteSettingType } from '../../api/admin';
import type { SiteSetting } from '../../api/admin';
import { useLogger } from '../../hooks/useLogger';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SiteSettingsProps {}

const SiteSettings: React.FC<SiteSettingsProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsByGroup, setSettingsByGroup] = useState<Record<string, SiteSetting[]>>({});
  const [activeTab, setActiveTab] = useState<string>('基础设置');
  const logger = useLogger('Admin.SiteSettings');

  // 加载站点设置
  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getSiteSettingsByGroup();
      setSettingsByGroup(data);
      
      // 设置表单初始值
      const initialValues: Record<string, any> = {};
      Object.values(data).flat().forEach(setting => {
        initialValues[setting.key] = convertValue(setting.value, setting.type);
      });
      form.setFieldsValue(initialValues);
      
      // 设置默认活跃标签
      const groups = Object.keys(data);
      if (groups.length > 0 && !groups.includes(activeTab)) {
        setActiveTab(groups[0]);
      }
      
      logger.debug('Loaded site settings', `Loaded ${Object.values(data).flat().length} settings`);
    } catch (error) {
      message.error('加载站点设置失败');
      logger.error('Failed to load site settings', error as Error);
    } finally {
      setLoading(false);
    }
  };

  // 转换值类型
  const convertValue = (value: string | undefined, type: SiteSettingType): any => {
    if (!value) return undefined;
    
    switch (type) {
      case SiteSettingType.Boolean:
        return value === 'true';
      case SiteSettingType.Number:
        return Number(value);
      case SiteSettingType.Json:
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  // 转换值为字符串
  const convertToString = (value: any, type: SiteSettingType): string => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case SiteSettingType.Boolean:
        return String(value);
      case SiteSettingType.Number:
        return String(value);
      case SiteSettingType.Json:
        return typeof value === 'string' ? value : JSON.stringify(value);
      default:
        return String(value);
    }
  };

  // 保存设置
  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const updates: Record<string, string> = {};
      
      // 转换所有值为字符串格式
      Object.values(settingsByGroup).flat().forEach(setting => {
        if (values.hasOwnProperty(setting.key)) {
          updates[setting.key] = convertToString(values[setting.key], setting.type);
        }
      });
      
      await AdminApi.batchUpdateSiteSettings(updates);
      message.success('设置保存成功');
      logger.logUserAction('Update site settings', `Updated ${Object.keys(updates).length} settings`);
      
      // 重新加载设置
      await loadSettings();
    } catch (error) {
      message.error('保存设置失败');
      logger.error('Failed to save site settings', error as Error);
    } finally {
      setSaving(false);
    }
  };

  // 重置设置
  const handleReset = async () => {
    await loadSettings();
    message.info('设置已重置');
  };

  // 渲染设置表单项
  const renderSettingItem = (setting: SiteSetting) => {
    const commonProps = {
      placeholder: setting.description || `请输入${setting.name}`,
    };

    switch (setting.type) {
      case SiteSettingType.Boolean:
        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        );

      case SiteSettingType.Number:
        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
          >
            <InputNumber style={{ width: '100%' }} {...commonProps} />
          </Form.Item>
        );

      case SiteSettingType.Color:
        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
          >
            <ColorPicker showText />
          </Form.Item>
        );

      case SiteSettingType.RichText:
        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
          >
            <TextArea rows={6} {...commonProps} />
          </Form.Item>
        );

      case SiteSettingType.Json:
        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
          >
            <TextArea 
              rows={4} 
              {...commonProps}
              placeholder="请输入有效的JSON格式"
            />
          </Form.Item>
        );

      default:
        // 检查是否有选项配置
        if (setting.options) {
          try {
            const options = JSON.parse(setting.options);
            if (Array.isArray(options)) {
              return (
                <Form.Item
                  key={setting.key}
                  name={setting.key}
                  label={setting.name}
                  extra={setting.description}
                >
                  <Select {...commonProps}>
                    {options.map((option: any) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }
          } catch {
            // 如果解析失败，使用默认输入框
          }
        }

        return (
          <Form.Item
            key={setting.key}
            name={setting.key}
            label={setting.name}
            extra={setting.description}
          >
            <Input {...commonProps} />
          </Form.Item>
        );
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 创建标签页
  const tabItems = Object.entries(settingsByGroup).map(([group, settings]) => ({
    key: group,
    label: group,
    children: (
      <div style={{ maxWidth: '800px' }}>
        {settings.length === 0 ? (
          <Alert
            message="暂无设置项"
            description="当前分组下没有可配置的设置项。"
            type="info"
            showIcon
          />
        ) : (
          settings
            .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
            .map(setting => renderSettingItem(setting))
        )}
      </div>
    ),
  }));

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>站点设置</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            保存设置
          </Button>
        </Space>
      </div>

      {/* 设置表单 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          size="large"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Form>
      </Card>

      {/* 帮助信息 */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>设置说明</Title>
        <Divider />
        <Text type="secondary">
          <ul style={{ paddingLeft: '20px' }}>
            <li>所有设置修改后需要点击"保存设置"按钮才能生效</li>
            <li>部分设置可能需要重启应用程序才能完全生效</li>
            <li>JSON格式的设置项请确保输入有效的JSON数据</li>
            <li>颜色设置支持十六进制颜色值</li>
            <li>如需添加新的设置项，请联系系统管理员</li>
          </ul>
        </Text>
      </Card>
    </div>
  );
};

export default SiteSettings;
