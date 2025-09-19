import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  Select,
  Checkbox,
  Card,
  Row,
  Col,
  Switch,
  List
} from 'antd';
import { 
  SoundOutlined,
  DesktopOutlined,
  MobileOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface NotificationForm {
  desktop: boolean;
  email: boolean;
  mobile: boolean;
  sound: boolean;
}

const NotificationSettings: React.FC = () => {
  const [form] = Form.useForm<NotificationForm>();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: 实现更新通知设置的API调用
      console.log('保存通知设置:', values);
      
      message.success('通知设置更新成功');
    } catch (error) {
      console.error('保存通知设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    {
      title: '新回复',
      description: '当有人回复您的话题时',
      key: 'replies'
    },
    {
      title: '提及',
      description: '当有人@您时',
      key: 'mentions'
    },
    {
      title: '私信',
      description: '当收到私人消息时',
      key: 'messages'
    },
    {
      title: '新话题',
      description: '当关注的分类中有新话题时',
      key: 'new_topics'
    },
    {
      title: '点赞',
      description: '当有人给您的帖子点赞时',
      key: 'likes'
    }
  ];

  return (
    <div>
      <Title level={4}>通知</Title>
      <Text type="secondary">
        被阅读时通知
      </Text>

      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="every_post"
          style={{ width: '300px' }}
        >
          <Option value="every_post">每日贴子第一次被读</Option>
          <Option value="first_unread">首次未读</Option>
          <Option value="never">从不</Option>
        </Select>
      </div>

      <Divider />

      <Title level={4}>实时通知</Title>
      
      <List
        dataSource={notificationTypes}
        renderItem={(item) => (
          <List.Item>
            <Row style={{ width: '100%' }} justify="space-between" align="middle">
              <Col>
                <div>
                  <Text strong>{item.title}</Text>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {item.description}
                  </div>
                </div>
              </Col>
              <Col>
                <Space>
                  <div style={{ textAlign: 'center' }}>
                    <DesktopOutlined style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }} />
                    <Switch defaultChecked size="small" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <SoundOutlined style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }} />
                    <Switch defaultChecked size="small" />
                  </div>
                </Space>
              </Col>
            </Row>
          </List.Item>
        )}
      />

      <Divider />

      <Title level={4}>桌面通知设置</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text>启用桌面通知</Text>
          </Col>
          <Col>
            <Switch defaultChecked />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>显示通知详细内容</Text>
          </Col>
          <Col>
            <Switch defaultChecked />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>通知声音</Text>
          </Col>
          <Col>
            <Switch defaultChecked />
          </Col>
        </Row>
      </Space>

      <Divider />

      <Title level={4}>通知时间表</Title>
      <div style={{ marginTop: '8px' }}>
        <Checkbox defaultChecked={false}>
          启用自定义通知时间
        </Checkbox>
      </div>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        设置每日接收通知的时间范围
      </Text>

      <Divider />

      <Title level={4}>推送设备</Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <DesktopOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>桌面浏览器</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                已启用
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <MobileOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>移动设备</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                未连接
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={4}>通知历史</Title>
      <Text type="secondary">
        查看最近的通知记录
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Button>
          查看通知历史
        </Button>
      </div>

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

export default NotificationSettings;
