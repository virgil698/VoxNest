import React from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import type { CreateAdminDto } from '../../api/install';

interface AdminSetupStepProps {
  onSubmit: (adminInfo: CreateAdminDto) => void;
  loading?: boolean;
}

const AdminSetupStep: React.FC<AdminSetupStepProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  // 提交表单
  const handleSubmit = (values: CreateAdminDto) => {
    onSubmit(values);
  };

  // 密码强度验证
  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入密码'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码长度至少6位'));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
      return Promise.reject(new Error('密码需包含大小写字母'));
    }
    if (!/(?=.*\d)/.test(value)) {
      return Promise.reject(new Error('密码需包含数字'));
    }
    return Promise.resolve();
  };

  // 确认密码验证
  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请确认密码'));
    }
    const password = form.getFieldValue('password');
    if (value !== password) {
      return Promise.reject(new Error('两次输入的密码不一致'));
    }
    return Promise.resolve();
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        borderRadius: '16px',
        color: 'var(--text-secondary)'
      }}>
        <UserOutlined style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
        <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
          创建管理员账户
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
          请创建系统管理员账户，该账户将拥有系统的最高权限
        </p>
      </div>

      <Alert
        type="info"
        message="安全提示"
        description="请设置一个强密码，包含大小写字母、数字，长度至少6位。管理员账户具有系统最高权限，请妥善保管账户信息。"
        style={{ marginBottom: 24 }}
        showIcon
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 50, message: '用户名长度为3-50个字符' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="管理员用户名"
            autoComplete="new-username"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="邮箱地址"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="admin@example.com"
            autoComplete="new-email"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ validator: validatePassword }]}
          hasFeedback
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="请输入密码"
            autoComplete="new-password"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          rules={[{ validator: validateConfirmPassword }]}
          hasFeedback
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="请再次输入密码"
            autoComplete="new-password"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="显示名称"
          name="displayName"
          tooltip="可选，如不填写将使用用户名作为显示名称"
        >
          <Input 
            prefix={<IdcardOutlined style={{ color: 'var(--primary-color)' }} />}
            placeholder="管理员"
            autoComplete="off"
            style={{
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}
            size="large"
          >
            创建管理员账户
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdminSetupStep;
