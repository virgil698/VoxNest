import React from 'react';
import { Form, Input, Button } from 'antd';
import { GlobalOutlined, MailOutlined } from '@ant-design/icons';
import type { SiteConfigDto } from '../../api/install';

interface SiteConfigStepProps {
  onSubmit: (siteConfig: SiteConfigDto) => void;
  loading?: boolean;
}

const SiteConfigStep: React.FC<SiteConfigStepProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  // 默认配置
  const defaultConfig: SiteConfigDto = {
    siteName: 'VoxNest 论坛',
    siteDescription: '基于现代技术栈构建的高性能论坛系统',
    adminEmail: ''
  };

  // 提交表单
  const handleSubmit = (values: SiteConfigDto) => {
    onSubmit(values);
  };

  return (
    <div style={{ padding: '8px' }}>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultConfig}
        onFinish={handleSubmit}
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Form.Item
          label="站点名称"
          name="siteName"
          rules={[
            { required: true, message: '请输入站点名称' },
            { max: 100, message: '站点名称不能超过100个字符' }
          ]}
        >
          <Input 
            prefix={<GlobalOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="VoxNest 论坛"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="站点描述"
          name="siteDescription"
          rules={[
            { max: 500, message: '站点描述不能超过500个字符' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="请输入站点描述（可选）"
            showCount
            maxLength={500}
            style={{
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="管理员邮箱"
          name="adminEmail"
          rules={[
            { required: true, message: '请输入管理员邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
          tooltip="用于系统通知和重要信息接收"
        >
          <Input 
            prefix={<MailOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="admin@example.com"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 40, textAlign: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ 
              width: '100%',
              height: '56px', 
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}
            size="large"
          >
            {loading ? '正在完成安装...' : '🎉 完成安装'}
          </Button>
          
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px',
              padding: '20px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: '500' }}>
                安装即将完成，系统将自动重启...
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                请稍候，不要关闭浏览器窗口
              </p>
            </div>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default SiteConfigStep;
