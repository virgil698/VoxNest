import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  Checkbox,
  Card,
  Row,
  Col,
  Switch
} from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  BlockOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const UserSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // TODO: 实现更新用户设置的API调用
      console.log('保存用户设置');
      
      message.success('用户设置更新成功');
    } catch (error) {
      console.error('保存用户设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>用户</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Checkbox defaultChecked={false}>
          已忽略
        </Checkbox>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          禁止来自这些用户的所有帖子、个人消息、通知、个人消息或有关的直接消息。
        </Text>
        
        <div style={{ marginTop: '16px' }}>
          <Button icon={<BlockOutlined />}>
            添加...
          </Button>
        </div>
      </Space>

      <Divider />

      <Title level={4}>已设为免打扰</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">
          选择...
        </Text>
        <Button size="small">
          +
        </Button>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          禁止来自这些用户的所有个人消息，个人消息或通知关键消息。
        </Text>
      </Space>

      <Divider />

      <Title level={4}>消息</Title>
      <Row justify="space-between" align="middle">
        <Col>
          <Text>允许其他用户向我发送个人消息和聊天邀请</Text>
        </Col>
        <Col>
          <Switch defaultChecked />
        </Col>
      </Row>
      
      <Row justify="space-between" align="middle" style={{ marginTop: '16px' }}>
        <Col>
          <Text>只允许特定用户向我发送消息或聊天邀请</Text>
        </Col>
        <Col>
          <Switch />
        </Col>
      </Row>

      <Divider />

      <Title level={4}>关注的用户</Title>
      <Text type="secondary">
        您可以关注您感兴趣的用户，获取他们的最新动态通知。
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Button icon={<UserOutlined />}>
          添加关注用户
        </Button>
      </div>

      <Divider />

      <Title level={4}>隐私设置</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text>隐藏我的在线状态</Text>
          </Col>
          <Col>
            <Switch />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>隐藏我的活动状态</Text>
          </Col>
          <Col>
            <Switch />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>隐藏我的点赞记录</Text>
          </Col>
          <Col>
            <Switch />
          </Col>
        </Row>
      </Space>

      <Divider />

      <Title level={4}>用户列表</Title>
      <Text type="secondary">
        管理您与其他用户的互动关系
      </Text>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#52c41a' }} />
              <div>关注的用户</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                0 位用户
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <EyeInvisibleOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#faad14' }} />
              <div>忽略的用户</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                0 位用户
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <BlockOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ff4d4f' }} />
              <div>屏蔽的用户</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                0 位用户
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button 
          type="primary" 
          loading={loading}
          onClick={handleSave}
          size="large"
        >
          保存更改
        </Button>
      </div>
    </div>
  );
};

export default UserSettings;
