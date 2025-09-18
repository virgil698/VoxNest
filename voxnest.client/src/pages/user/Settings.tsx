import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  message, 
  Descriptions,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  DatePicker
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined,
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserProfileForm {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: dayjs.Dayjs;
  gender?: string;
}

const Settings: React.FC = () => {
  const { user, getCurrentUser } = useAuthStore();
  const [form] = Form.useForm<UserProfileForm>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        displayName: user.displayName,
        bio: undefined, // 用户基本类型中没有bio字段
        location: undefined, // 用户基本类型中没有location字段
        website: undefined, // 用户基本类型中没有website字段
        birthday: undefined, // 用户基本类型中没有birthday字段
        gender: undefined, // 用户基本类型中没有gender字段
      });
    }
  }, [user, form]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // 重置表单到原始值
    if (user) {
      form.setFieldsValue({
        displayName: user.displayName,
        bio: undefined,
        location: undefined,
        website: undefined,
        birthday: undefined,
        gender: undefined,
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: 实现更新用户资料的API调用
      console.log('保存用户资料:', values);
      
      message.success('个人资料更新成功');
      setEditing(false);
      
      // 重新获取用户信息
      await getCurrentUser();
    } catch (error) {
      console.error('保存个人资料失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (info: any) => {
    // TODO: 实现头像上传逻辑
    if (info.file.status === 'done') {
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text>用户信息加载失败</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>偏好设置</Title>
          <Text type="secondary">管理您的个人信息和账户设置</Text>
        </div>

        {/* 头像部分 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Avatar 
            size={120} 
            src={user.avatar}
            icon={<UserOutlined />}
            style={{ marginBottom: '16px' }}
          />
          <div>
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />}>更换头像</Button>
            </Upload>
          </div>
        </div>

        <Divider />

        {/* 基本信息 */}
        {!editing ? (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px' 
            }}>
              <Title level={4}>基本信息</Title>
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                编辑资料
              </Button>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="显示名称">
                {user.displayName || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="个人简介">
                {'未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="所在地">
                {'未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="个人网站">
                {'未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="生日">
                {'未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="性别">
                {'未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {user.lastLoginAt 
                  ? dayjs(user.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
                  : '从未登录'
                }
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                <Text code>{user.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="账户状态">
                <Text type={user.status === 1 ? 'success' : 'warning'}>
                  {user.status === 1 ? '正常' : '异常'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户角色">
                <Space>
                  {user.roles.map(role => (
                    <Text key={role} code>{role}</Text>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px' 
            }}>
              <Title level={4}>编辑基本信息</Title>
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={loading}
                  onClick={handleSave}
                >
                  保存
                </Button>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                displayName: user.displayName,
                bio: undefined,
                location: undefined,
                website: undefined,
                birthday: undefined,
                gender: undefined,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="显示名称"
                    name="displayName"
                    rules={[
                      { max: 100, message: '显示名称不能超过100个字符' }
                    ]}
                  >
                    <Input placeholder="请输入显示名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="性别"
                    name="gender"
                  >
                    <Input placeholder="请输入性别" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="个人简介"
                name="bio"
                rules={[
                  { max: 1000, message: '个人简介不能超过1000个字符' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入个人简介"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="所在地"
                    name="location"
                    rules={[
                      { max: 100, message: '所在地不能超过100个字符' }
                    ]}
                  >
                    <Input placeholder="请输入所在地" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="个人网站"
                    name="website"
                    rules={[
                      { type: 'url', message: '请输入有效的网站地址' },
                      { max: 500, message: '网站地址不能超过500个字符' }
                    ]}
                  >
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="生日"
                name="birthday"
              >
                <DatePicker 
                  placeholder="选择生日"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Form>

            <Divider />

            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>只读信息</Title>
              <Text type="secondary">以下信息无法修改</Text>
            </div>

            <Descriptions column={2} size="small">
              <Descriptions.Item label="用户名">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                <Text code>{user.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(user.createdAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        <Divider />

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={getCurrentUser}
            >
              刷新信息
            </Button>
            <Button 
              type="primary"
              onClick={() => window.open(`/user/${user.id}`, '_blank')}
            >
              查看我的个人主页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
