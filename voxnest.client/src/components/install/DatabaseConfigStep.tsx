import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Row, Col, Alert, Space } from 'antd';
import { DatabaseOutlined, ExperimentOutlined } from '@ant-design/icons';
import { InstallApi } from '../../api/install';
import type { DatabaseConfigDto } from '../../api/install';

interface DatabaseConfigStepProps {
  onSubmit: (config: DatabaseConfigDto) => void;
  loading?: boolean;
}

const DatabaseConfigStep: React.FC<DatabaseConfigStepProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 默认配置
  const defaultConfig: DatabaseConfigDto = {
    provider: 'MySQL',
    server: 'localhost',
    port: 3306,
    database: 'voxnest',
    username: 'root',
    password: '',
    charSet: 'utf8mb4'
  };

  // 数据库提供商选项
  const providerOptions = [
    { label: 'MySQL', value: 'MySQL' },
    { label: 'MariaDB', value: 'MariaDB' },
    // { label: 'PostgreSQL', value: 'PostgreSQL' }
  ];

  // 测试数据库连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTestLoading(true);
      setTestResult(null);

      const result = await InstallApi.testDatabaseConnection(values);
      setTestResult(result);
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestResult({
        success: false,
        message: '测试连接失败，请检查网络连接'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 提交配置
  const handleSubmit = async (values: DatabaseConfigDto) => {
    // 先测试连接
    if (!testResult?.success) {
      await handleTestConnection();
      return;
    }
    
    onSubmit(values);
  };

  // 当提供商改变时更新默认端口
  const handleProviderChange = (provider: string) => {
    const defaultPorts: Record<string, number> = {
      'MySQL': 3306,
      'MariaDB': 3306,
      'PostgreSQL': 5432
    };
    
    form.setFieldsValue({
      port: defaultPorts[provider] || 3306
    });
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <DatabaseOutlined style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
          数据库配置
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
          请配置数据库连接信息，系统将在此数据库中创建必要的表结构
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultConfig}
        onFinish={handleSubmit}
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Form.Item
          label="数据库类型"
          name="provider"
          rules={[{ required: true, message: '请选择数据库类型' }]}
        >
          <Select 
            options={providerOptions}
            onChange={handleProviderChange}
            placeholder="选择数据库类型"
            style={{
              borderRadius: '12px',
              height: '48px'
            }}
            size="large"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item
              label="服务器地址"
              name="server"
              rules={[{ required: true, message: '请输入服务器地址' }]}
            >
              <Input 
                placeholder="localhost" 
                style={{
                  borderRadius: '12px',
                  height: '48px'
                }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="端口号"
              name="port"
              rules={[
                { required: true, message: '请输入端口号' },
                { type: 'number', min: 1, max: 65535, message: '端口号范围：1-65535' }
              ]}
            >
              <InputNumber
                style={{ 
                  width: '100%',
                  borderRadius: '12px',
                  height: '48px'
                }}
                placeholder="3306"
                min={1}
                max={65535}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="数据库名称"
          name="database"
          rules={[{ required: true, message: '请输入数据库名称' }]}
        >
          <Input 
            placeholder="voxnest" 
            style={{
              borderRadius: '12px',
              height: '48px'
            }}
            size="large"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                placeholder="root" 
                style={{
                  borderRadius: '12px',
                  height: '48px'
                }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                placeholder="数据库密码" 
                style={{
                  borderRadius: '12px',
                  height: '48px'
                }}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="字符集"
          name="charSet"
          tooltip="建议使用 utf8mb4 以支持完整的 Unicode 字符集"
        >
          <Input 
            placeholder="utf8mb4" 
            style={{
              borderRadius: '12px',
              height: '48px'
            }}
            size="large"
          />
        </Form.Item>

        {/* 测试结果显示 */}
        {testResult && (
          <Alert
            type={testResult.success ? 'success' : 'error'}
            message={testResult.message}
            style={{ marginBottom: 20 }}
            showIcon
          />
        )}

        <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
          <Space size="large">
            <Button
              type="default"
              icon={<ExperimentOutlined />}
              loading={testLoading}
              onClick={handleTestConnection}
              style={{
                height: '48px',
                borderRadius: '12px',
                padding: '0 32px',
                fontWeight: '600',
                fontSize: '16px'
              }}
              size="large"
            >
              测试连接
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!testResult?.success}
              style={{ 
                minWidth: 120,
                height: '48px',
                borderRadius: '12px',
                padding: '0 32px',
                fontWeight: '600',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none'
              }}
              size="large"
            >
              下一步
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DatabaseConfigStep;
