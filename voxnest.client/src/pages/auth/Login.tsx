import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { LoginRequest } from '../../types/auth';

interface ErrorInfo {
  message?: string;
  status?: number;
  statusText?: string;
  errors?: string[];
  details?: string;
  errorCode?: string;
  traceId?: string;
}

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();

  // 如果已登录，重定向到首页或来源页面
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (values: LoginRequest) => {
    try {
      await login(values);
      message.success('登录成功！');
      
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const errorInfo = (error as { errorInfo?: ErrorInfo })?.errorInfo;
      
      if (errorInfo) {
        // 构建详细错误消息
        let errorMessage = `❌ 登录失败\n\n`;
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
        
        errorMessage += `\n💡 请检查用户名/邮箱和密码是否正确`;
        
        // 显示详细错误信息
        console.error('🔍 详细登录错误信息:', errorInfo);
        message.error({
          content: errorMessage,
          duration: 8,
          style: { whiteSpace: 'pre-line' }
        });
        
        // 同时在控制台输出详细信息供调试
        console.group('🚨 登录失败详细信息');
        console.log('状态码:', errorInfo.status);
        console.log('错误信息:', errorInfo.message);
        console.log('错误代码:', errorInfo.errorCode);
        console.log('详细信息:', errorInfo.details);
        console.log('追踪ID:', errorInfo.traceId);
        console.log('完整错误对象:', errorInfo);
        console.groupEnd();
      } else {
        // 降级处理：使用简单的message提示
        message.error((error as Error).message || '登录失败，请稍后重试');
        console.error('登录错误（无详细信息）:', error);
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
        maxWidth: '420px',
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
            欢迎回来
          </Title>
          <Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            登录您的VoxNest账户
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            name="usernameOrEmail"
            rules={[
              { required: true, message: '请输入用户名或邮箱' },
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="用户名或邮箱"
              autoComplete="username"
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
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--primary-color)' }} />}
              placeholder="密码"
              autoComplete="current-password"
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '12px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px' }}>
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
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '15px' }}>
            还没有账户？
            <Link 
              to="/auth/register" 
              style={{ 
                marginLeft: '8px',
                color: 'var(--primary-color)',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              立即注册
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
