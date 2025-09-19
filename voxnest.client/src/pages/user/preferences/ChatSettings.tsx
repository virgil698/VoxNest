import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  Select,
  Card,
  Row,
  Col,
  Switch
} from 'antd';
import { 
  CommentOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const ChatSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // TODO: 实现更新聊天设置的API调用
      console.log('保存聊天设置');
      
      message.success('聊天设置更新成功');
    } catch (error) {
      console.error('保存聊天设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>聊天</Title>
      <Row justify="space-between" align="middle">
        <Col>
          <Text>启用聊天</Text>
        </Col>
        <Col>
          <Switch defaultChecked />
        </Col>
      </Row>

      <Divider />

      <Title level={4}>一键聊天回应</Title>
      <Row justify="space-between" align="middle">
        <Col>
          <Text>最常用的聊天反应</Text>
        </Col>
        <Col>
          <Switch defaultChecked />
        </Col>
      </Row>
      
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        只有在聊天频道的情况下，用户才能发送针对聊天发布的回复
      </Text>

      <Row justify="space-between" align="middle" style={{ marginTop: '16px' }}>
        <Col>
          <Text>忽略频道中范围内的提及</Text>
        </Col>
        <Col>
          <Switch />
        </Col>
      </Row>
      
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        不受诱导频道范围内提及（@here 或 @all）的通知
      </Text>

      <Divider />

      <Title level={4}>桌面聊天通知声音</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="none"
          style={{ width: '200px' }}
        >
          <Option value="none">无</Option>
          <Option value="bell">铃声</Option>
          <Option value="chime">提示音</Option>
          <Option value="ding">叮咚</Option>
        </Select>
      </div>

      <Divider />

      <Title level={4}>电子邮件通知</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="only_when_away"
          style={{ width: '300px' }}
        >
          <Option value="never">仅在离开时</Option>
          <Option value="only_when_away">仅在离开时</Option>
          <Option value="always">始终</Option>
        </Select>
      </div>
      
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        只有在15 分钟内没有访问该频道，我们才会给您发送电子邮件。
      </Text>

      <Divider />

      <Title level={4}>在标题中显示活动指示器</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="all_new_messages"
          style={{ width: '300px' }}
        >
          <Option value="all_new_messages">所有新消息</Option>
          <Option value="only_mentions">仅提及和私聊消息</Option>
          <Option value="never">从不</Option>
        </Select>
      </div>

      <Divider />

      <Title level={4}>聊天快捷键和聊天显示单独的边栏模式</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="never"
          style={{ width: '200px' }}
        >
          <Option value="always">永不</Option>
          <Option value="never">永不</Option>
          <Option value="fullscreen_only">仅全屏时</Option>
        </Select>
      </div>

      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        为论坛和聊天启用单独的边栏模式时，可以利用边栏格式来未来。
      </Text>

      <Divider />

      <Title level={4}>聊天权限</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text>允许直接消息</Text>
          </Col>
          <Col>
            <Switch defaultChecked />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>允许用户邀请我加入频道</Text>
          </Col>
          <Col>
            <Switch defaultChecked />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text>自动加入推荐频道</Text>
          </Col>
          <Col>
            <Switch />
          </Col>
        </Row>
      </Space>

      <Divider />

      <Title level={4}>聊天历史</Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <CommentOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#1890ff' }} />
              <div>私聊消息</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                0 条消息
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#52c41a' }} />
              <div>频道消息</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                0 条消息
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: '16px' }}>
        <Button>
          导出聊天记录
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

export default ChatSettings;
