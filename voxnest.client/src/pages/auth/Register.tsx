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
      const errorInfo = (error as any).errorInfo;
      
      if (errorInfo) {
        // 构建详细错误消息
        let errorMessage = `❌ 注册失败\n\n`;
        errorMessage += `错误信息: ${errorInfo.message}\n`;
        errorMessage += `状态码: ${errorInfo.status}`;
        if (errorInfo.statusText) errorMessage += ` (${errorInfo.statusText})`;
        errorMessage += `\n`;
        
        if (errorInfo.errorCode && errorInfo.errorCode !== 'UNKNOWN_ERROR') {
          errorMessage += `错误代码: ${errorInfo.errorCode}\n`;
        }
        
        if (errorInfo.details) {
          errorMessage += `详细信息: ${errorInfo.details}\n`;
        }
        
        if (errorInfo.traceId) {
          errorMessage += `追踪ID: ${errorInfo.traceId}\n`;
        }
        
        errorMessage += `\n💡 请检查您的输入信息，或稍后重试`;
        
        // 显示详细错误信息
        console.error('🔍 详细注册错误信息:', errorInfo);
        message.error({
          content: errorMessage,
          duration: 8,
          style: { whiteSpace: 'pre-line' }
        });
        
        // 同时在控制台输出详细信息供调试
        console.group('🚨 注册失败详细信息');
        console.log('状态码:', errorInfo.status);
        console.log('错误信息:', errorInfo.message);
        console.log('错误代码:', errorInfo.errorCode);
        console.log('详细信息:', errorInfo.details);
        console.log('追踪ID:', errorInfo.traceId);
        console.log('完整错误对象:', errorInfo);
        console.groupEnd();
      } else {
        // 降级处理：使用简单的message提示
        message.error(error.message || '注册失败，请稍后重试');
        console.error('注册错误（无详细信息）:', error);
      }
    }
  };

  return (
    <div className="voxnest-gradient-bg" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 140px)',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '480px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        {/* Logo 区域 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            V
          </div>
          <Title level={2} style={{ 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            加入 VoxNest
          </Title>
          <Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            创建您的账户，开始您的论坛之旅
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          style={{ marginBottom: '24px' }}
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
              prefix={<UserOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="用户名"
              autoComplete="username"
              suffix={checkingUsername ? <div>检查中...</div> : null}
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '12px'
              }}
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
              prefix={<MailOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="邮箱地址"
              autoComplete="email"
              suffix={checkingEmail ? <div>检查中...</div> : null}
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '12px'
              }}
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
              prefix={<LockOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="密码"
              autoComplete="new-password"
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '12px'
              }}
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
              prefix={<LockOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="确认密码"
              autoComplete="new-password"
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '12px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px', marginTop: '8px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              size="large"
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)'
              }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '15px' }}>
            已有账户？
            <Link 
              to="/auth/login" 
              style={{ 
                marginLeft: '8px',
                color: 'var(--primary-color)',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              立即登录
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;