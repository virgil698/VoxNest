import React from 'react';
import { Card, Avatar, Typography, Space, Button, Descriptions, message } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text>用户信息加载失败</Text>
      </div>
    );
  }

  const handleEdit = () => {
    message.info('编辑个人资料功能暂未实现');
  };

  return (
    <div>
      <Card>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <Space size="large">
            <Avatar 
              size={80} 
              src={user.avatar}
              icon={<UserOutlined />}
            />
            <div>
              <Title level={2} style={{ marginBottom: '4px' }}>
                {user.displayName || user.username}
              </Title>
              <Text type="secondary">@{user.username}</Text>
              <br />
              <Space style={{ marginTop: '8px' }}>
                {user.roles.map(role => (
                  <Text key={role} code>{role}</Text>
                ))}
              </Space>
            </div>
          </Space>
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
          <Descriptions.Item label="注册时间">
            {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user.lastLoginAt 
              ? dayjs(user.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
              : '从未登录'
            }
          </Descriptions.Item>
          <Descriptions.Item label="账户状态">
            <Text type={user.status === 1 ? 'success' : 'warning'}>
              {user.status === 1 ? '正常' : '异常'}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
