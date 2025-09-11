import React from 'react';
import { Form, Input, Button } from 'antd';
import { GlobalOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        borderRadius: '16px',
        color: 'var(--text-secondary)'
      }}>
        <GlobalOutlined style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
        <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
          站点配置
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
          最后一步！请配置站点基本信息，完成安装
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        marginBottom: '32px',
        color: 'var(--text-secondary)'
      }}>
        <CheckCircleOutlined style={{ fontSize: '64px', marginBottom: '16px', display: 'block', color: 'var(--primary-color)' }} />
        <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
          恭喜！系统安装即将完成
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
          数据库已成功初始化，管理员账户已创建，现在只需要完成站点配置即可开始使用
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
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
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

      <div style={{ 
        padding: '24px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
          🎆 安装完成后
        </h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          系统将自动重启并跳转到论坛首页<br />
          您可以使用刚才创建的管理员账户登录并开始管理您的论坛
        </p>
      </div>
    </div>
  );
};

export default SiteConfigStep;
