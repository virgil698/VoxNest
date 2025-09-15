import React, { useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  ColorPicker,
  Card,
  Space,
  Typography,
  Tooltip,
  Alert,
  Tag,
  Button
} from 'antd';
import {
  InfoCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import type { FormInstance, Rule } from 'antd/lib/form';
import type { 
  ExtensionConfigSchema, 
  ExtensionConfigProperty 
} from '../../api/extensionConfig';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface ExtensionConfigFormProps {
  schema: ExtensionConfigSchema;
  initialValues?: Record<string, unknown>;
  form: FormInstance;
  onValuesChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void;
  disabled?: boolean;
}

const ExtensionConfigForm: React.FC<ExtensionConfigFormProps> = ({
  schema,
  initialValues,
  form,
  onValuesChange,
  disabled = false
}) => {
  // 按组组织属性
  const groupedProperties = useMemo(() => {
    const groups = schema.groups || [];
    const properties = Object.entries(schema.properties);

    if (groups.length === 0) {
      return [{
        id: 'default',
        title: '基本设置',
        properties,
        order: 0
      }];
    }

    const grouped = groups.map(group => ({
      ...group,
      properties: properties.filter(([, prop]) => prop.group === group.id)
    }));

    // 添加未分组的属性
    const ungroupedProperties = properties.filter(([, prop]) => 
      !prop.group || !groups.find(g => g.id === prop.group)
    );

    if (ungroupedProperties.length > 0) {
      grouped.push({
        id: 'ungrouped',
        title: '其他设置',
        properties: ungroupedProperties,
        order: 999
      });
    }

    return grouped.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [schema]);

  // 设置初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 渲染不同类型的表单字段
  const renderFormField = (key: string, property: ExtensionConfigProperty) => {
    const commonProps = {
      placeholder: property.description,
      disabled: disabled || property.hidden,
      style: { width: '100%' }
    };

    // 处理依赖字段的显示/隐藏
    const shouldShow = !property.depends || 
      form.getFieldValue(property.depends) === property.dependsValue;

    if (!shouldShow) {
      return null;
    }

    switch (property.type) {
      case 'string':
        if (property.format === 'password') {
          return <Input.Password {...commonProps} />;
        }
        if (property.format === 'email') {
          return <Input {...commonProps} type="email" />;
        }
        if (property.pattern) {
          return <Input {...commonProps} pattern={property.pattern} />;
        }
        return <Input {...commonProps} />;

      case 'textarea':
        return (
          <TextArea 
            {...commonProps} 
            rows={4}
            maxLength={property.max}
            showCount={!!property.max}
          />
        );

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            min={property.min}
            max={property.max}
            step={property.format === 'float' ? 0.1 : 1}
            precision={property.format === 'float' ? 2 : 0}
          />
        );

      case 'boolean':
        return (
          <Switch
            disabled={disabled || property.hidden}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        );

      case 'color':
        return (
          <ColorPicker
            disabled={disabled || property.hidden}
            showText
          />
        );

      case 'select': {
        const selectMode = property.format === 'multiple' ? 'multiple' : undefined;
        return (
          <Select
            {...commonProps}
            mode={selectMode}
            allowClear
          >
            {property.options?.map((option) => (
              <Option key={String(option.value)} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      }

      case 'url':
        return <Input {...commonProps} type="url" />;

      case 'array':
        if (property.format === 'tags') {
          return (
            <Select
              {...commonProps}
              mode="tags"
              tokenSeparators={[',']}
            />
          );
        }
        // 动态数组
        return (
          <Form.List name={key}>
            {(fields, { add, remove }) => (
              <div>
                {fields.map(({ key: fieldKey, name, ...restField }) => (
                  <Space key={fieldKey} align="baseline" style={{ width: '100%' }}>
                    <Form.Item
                      {...restField}
                      name={name}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="输入值" />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  添加项
                </Button>
              </div>
            )}
          </Form.List>
        );

      case 'object':
        // JSON编辑器
        return (
          <TextArea
            {...commonProps}
            rows={6}
            placeholder="请输入有效的JSON格式"
            onBlur={(e) => {
              try {
                JSON.parse(e.target.value);
              } catch {
                // 可以在这里添加验证提示
              }
            }}
          />
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  // 渲染字段标签
  const renderFieldLabel = (property: ExtensionConfigProperty) => {
    return (
      <Space>
        <span>{property.title}</span>
        {property.required && <Text type="danger">*</Text>}
        {property.description && (
          <Tooltip title={property.description}>
            <QuestionCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        )}
        {property.default !== undefined && (
          <Tag color="default">
            默认: {String(property.default)}
          </Tag>
        )}
      </Space>
    );
  };

  // 获取字段验证规则
  const getFieldRules = (property: ExtensionConfigProperty): Rule[] => {
    const rules: Rule[] = [];

    if (property.required) {
      rules.push({ required: true, message: `${property.title}是必填项` });
    }

    if (property.pattern) {
      rules.push({
        pattern: new RegExp(property.pattern),
        message: '格式不正确'
      });
    }

    if (property.min !== undefined) {
      if (property.type === 'string' || property.type === 'textarea') {
        rules.push({
          min: property.min,
          message: `最少输入${property.min}个字符`
        });
      } else if (property.type === 'number') {
        rules.push({
          type: 'number',
          min: property.min,
          message: `最小值为${property.min}`
        });
      }
    }

    if (property.max !== undefined) {
      if (property.type === 'string' || property.type === 'textarea') {
        rules.push({
          max: property.max,
          message: `最多输入${property.max}个字符`
        });
      } else if (property.type === 'number') {
        rules.push({
          type: 'number',
          max: property.max,
          message: `最大值为${property.max}`
        });
      }
    }

    if (property.type === 'url') {
      rules.push({
        type: 'url',
        message: '请输入有效的URL'
      });
    }

    if (property.format === 'email') {
      rules.push({
        type: 'email',
        message: '请输入有效的邮箱地址'
      });
    }

    if (property.type === 'object') {
      rules.push({
        validator: (_: unknown, value: string) => {
          if (!value) return Promise.resolve();
          try {
            JSON.parse(value);
            return Promise.resolve();
          } catch {
            return Promise.reject(new Error('请输入有效的JSON格式'));
          }
        }
      });
    }

    return rules;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      disabled={disabled}
    >
      {/* 配置说明 */}
      {schema.description && (
        <Alert
          message={schema.description}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 渲染分组字段 */}
      {groupedProperties.map((group) => {
        if (group.properties.length === 0) return null;

        const content = group.properties
          .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
          .map(([key, property]) => (
            <Form.Item
              key={key}
              name={key}
              label={renderFieldLabel(property)}
              rules={getFieldRules(property)}
              tooltip={property.description}
              help={property.format && `格式: ${property.format}`}
            >
              {renderFormField(key, property)}
            </Form.Item>
          ));

        // 如果只有一个默认组，不显示分组标题
        if (groupedProperties.length === 1 && group.id === 'default') {
          return content;
        }

        return (
          <Card
            key={group.id}
            type="inner"
            title={
              <Space>
                <span>{group.title}</span>
                {group.description && (
                  <Tooltip title={group.description}>
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                )}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {content}
          </Card>
        );
      })}

      {/* 必填项说明 */}
      {schema.required && schema.required.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <Text type="danger">*</Text> 表示必填项
          </Text>
        </div>
      )}
    </Form>
  );
};

export default ExtensionConfigForm;
