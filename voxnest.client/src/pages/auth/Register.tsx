import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import type { RegisterRequest } from '../../types/auth';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 检查用户名可用性
  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) return;
    
    try {
      setCheckingUsername(true);
      const response = await authApi.checkUsername(username);
      
      if (response.data.success && response.data.data) {
        if (!response.data.data.available) {
          return Promise.reject(new Error('用户名已存在'));
        }
      }
    } catch (error) {
      return Promise.reject(new Error('检查用户名失败'));
    } finally {
      setCheckingUsername(false);
    }
  };

  // 检查邮箱可用性
  const checkEmail = async (email: string) => {
    if (!email) return;
    
    try {
      setCheckingEmail(true);
      const response = await authApi.checkEmail(email);
      
      if (response.data.success && response.data.data) {
        if (!response.data.data.available) {
          return Promise.reject(new Error('邮箱已被注册'));
        }
      }
    } catch (error) {
      return Promise.reject(new Error('检查邮箱失败'));
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (values: RegisterRequest) => {
    try {
      await register(values);
      message.success('注册成功！请登录您的账户');
      navigate('/auth/login');
    } catch (error: any) {
      message.error(error.message || '注册失败，请稍后重试');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 140px)',
      background: '#f5f5f5'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            创建账户
          </Title>
          <Text type="secondary">
            加入 VoxNest 社区
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名最多50个字符' },
              { 
                pattern: /^[a-zA-Z0-9_]+$/, 
                message: '用户名只能包含字母、数字和下划线' 
              },
              { validator: (_, value) => checkUsername(value) },
            ]}
            hasFeedback
            validateDebounce={800}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
              suffix={checkingUsername ? <div>检查中...</div> : null}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
              { max: 255, message: '邮箱地址长度不能超过255个字符' },
              { validator: (_, value) => checkEmail(value) },
            ]}
            hasFeedback
            validateDebounce={800}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
              autoComplete="email"
              suffix={checkingEmail ? <div>检查中...</div> : null}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 100, message: '密码最多100个字符' },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不匹配'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              size="large"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text>
            已有账户？
            <Link to="/auth/login" style={{ marginLeft: '8px' }}>
              立即登录
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;