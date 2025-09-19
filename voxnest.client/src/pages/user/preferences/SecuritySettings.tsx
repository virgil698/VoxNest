import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  List,
  Modal,
  Alert,
  Badge
} from 'antd';
import { 
  LockOutlined,
  SafetyOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  DesktopOutlined,
  MobileOutlined,
  DeleteOutlined,
  PlusOutlined,
  WindowsOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SecuritySettings: React.FC = () => {
  const [form] = Form.useForm<PasswordForm>();
  const [loading, setLoading] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [add2FAModalVisible, setAdd2FAModalVisible] = useState(false);

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: 实现更改密码的API调用
      console.log('更改密码:', values);
      
      message.success('密码修改成功');
      setChangePasswordVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('密码修改失败:', error);
      message.error('密码修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const deviceData = [
    {
      id: '1',
      name: 'Windows 计算机 - 东京, 东京都, 日本',
      browser: 'Microsoft Edge',
      status: 'current',
      lastActive: '正在使用'
    },
    {
      id: '2',
      name: 'iPhone - 上海, 中国',
      browser: 'Safari',
      status: 'active',
      lastActive: '2小时前'
    }
  ];

  const handleLogoutDevice = (deviceId: string) => {
    // TODO: 实现设备登出功能
    message.info(`设备 ${deviceId} 已登出`);
  };

  const handleLogoutAll = () => {
    Modal.confirm({
      title: '确认登出所有设备？',
      content: '这将使您在所有其他设备上的登录失效。',
      onOk: () => {
        // TODO: 实现全部登出功能
        message.success('已登出所有设备');
      },
    });
  };

  return (
    <div>
      <Title level={4}>密码</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          icon={<LockOutlined />}
          onClick={() => setChangePasswordVisible(true)}
        >
          修改密码
        </Button>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          发送密码重置邮件到电子邮件
        </Text>
      </Space>

      <Divider />

      <Title level={4}>通行密钥</Title>
      <Text type="secondary">
        通行密钥是登录方式之一，可以替代生成密码（如硬件安全 ID 或者设备 ID）成功认证
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Button icon={<PlusOutlined />}>
          添加通行密钥
        </Button>
      </div>

      <Divider />

      <Title level={4}>双重身份验证</Title>
      <Text type="secondary">
        使用一次性安全令牌或来自安全设备的密码进行身份验证。
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Button 
          icon={<SafetyOutlined />}
          onClick={() => setAdd2FAModalVisible(true)}
        >
          管理双重身份验证
        </Button>
      </div>

      <Divider />

      <Title level={4}>最近使用的设备</Title>
      <Text type="secondary">
        查看最近访问此账户的设备列表
      </Text>
      
      <div style={{ marginTop: '16px' }}>
        <List
          dataSource={deviceData}
          renderItem={(device) => (
            <List.Item
              actions={[
                device.status === 'current' ? (
                  <Badge status="success" text="当前设备" />
                ) : (
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleLogoutDevice(device.id)}
                  >
                    登出
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={
                  device.name.includes('Windows') ? (
                    <WindowsOutlined style={{ fontSize: '24px' }} />
                  ) : device.name.includes('iPhone') ? (
                    <MobileOutlined style={{ fontSize: '24px' }} />
                  ) : (
                    <DesktopOutlined style={{ fontSize: '24px' }} />
                  )
                }
                title={device.name}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{device.browser}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {device.lastActive}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        
        <div style={{ marginTop: '16px' }}>
          <Button onClick={handleLogoutAll}>
            全部退出
          </Button>
        </div>
      </div>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setChangePasswordVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={handleChangePassword}
          >
            保存
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' }
            ]}
          >
            <Input.Password
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 双重验证模态框 */}
      <Modal
        title="双重身份验证"
        open={add2FAModalVisible}
        onCancel={() => setAdd2FAModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="双重身份验证功能"
          description="为了增强账户安全性，建议启用双重身份验证。此功能将要求您在登录时提供额外的验证码。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" block>
            启用短信验证
          </Button>
          <Button block>
            启用应用验证（推荐）
          </Button>
          <Button block>
            启用邮箱验证
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default SecuritySettings;
