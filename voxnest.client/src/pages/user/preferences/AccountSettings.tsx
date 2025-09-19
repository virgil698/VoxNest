import React from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  Descriptions, 
  Divider,
  Row,
  Col
} from 'antd';
import { useAuthStore } from '../../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AccountSettings: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Title level={4}>用户名</Title>
      <Text type="secondary">
        xiaokong23357
      </Text>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        其他人可以使用 @xiaokong23357 来提及您
      </Text>

      <Divider />

      <Title level={4}>个人资料照片</Title>
      <Text type="secondary">
        您可以通过右上角的"更换头像"按钮来更新您的个人资料照片。
      </Text>

      <Divider />

      <Title level={4}>电子邮件</Title>
      <Text>{user.email}</Text>
      <div style={{ marginTop: '8px' }}>
        <Text type="success">已用</Text>
      </div>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        您的主要邮箱地址
      </Text>

      <Divider />

      <Title level={4}>关联账户</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>Discourse ID</Text>
              <Button type="link" size="small">连接</Button>
            </Space>
          </Col>
        </Row>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>Facebook</Text>
              <Button type="link" size="small">连接</Button>
            </Space>
          </Col>
        </Row>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>Google</Text>
              <Button type="link" size="small">连接</Button>
            </Space>
          </Col>
        </Row>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>GitHub</Text>
              <Text type="secondary">{user.email}</Text>
              <Button type="link" danger size="small">取消连接</Button>
            </Space>
          </Col>
        </Row>
      </Space>

      <Divider />

      <Title level={4}>账户信息</Title>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="用户ID">
          <Text code>{user.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="注册时间">
          {dayjs(user.createdAt).format('YYYY年MM月DD日')}
        </Descriptions.Item>
        <Descriptions.Item label="最后活动时间">
          {dayjs(user.createdAt).format('YYYY年MM月DD日 HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="角色">
          <Text>普通用户</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={4}>账户删除</Title>
      <Text type="secondary">
        如果您想要删除您的账户，可以联系管理员。请注意，这个操作是不可逆的。
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Button danger>
          请求删除账户
        </Button>
      </div>
    </div>
  );
};

export default AccountSettings;
