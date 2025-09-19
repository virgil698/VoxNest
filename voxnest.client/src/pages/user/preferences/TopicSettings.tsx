import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  message,
  Divider,
  Select,
  Checkbox,
  Card,
  Row,
  Col
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

const TopicSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // TODO: 实现更新话题设置的API调用
      console.log('保存话题设置');
      
      message.success('话题设置更新成功');
    } catch (error) {
      console.error('保存话题设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>话题</Title>
      <Text type="secondary">
        何时视为新话题
      </Text>

      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="created_in_last_2_days"
          style={{ width: '300px' }}
        >
          <Option value="not_viewed">在过去 2 天内创建</Option>
          <Option value="created_in_last_2_days">在过去 2 天内创建</Option>
          <Option value="created_in_last_week">在过去 1 周内创建</Option>
          <Option value="created_in_last_month">在过去 1 月内创建</Option>
        </Select>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">
          自动跟踪我进入的话题
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Select 
            defaultValue="4_minutes"
            style={{ width: '200px' }}
          >
            <Option value="never">从不</Option>
            <Option value="30_seconds">30 秒后</Option>
            <Option value="1_minute">1 分钟后</Option>
            <Option value="4_minutes">4 分钟后</Option>
            <Option value="10_minutes">10 分钟后</Option>
          </Select>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">
          关于时
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Select 
            defaultValue="always"
            style={{ width: '200px' }}
          >
            <Option value="always">跟踪话题</Option>
            <Option value="new_topic_only">只有新话题</Option>
            <Option value="never">从不</Option>
          </Select>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">
          指定后
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Select 
            defaultValue="close_topic"
            style={{ width: '200px' }}
          >
            <Option value="close_topic">关注话题</Option>
            <Option value="track_topic">跟踪话题</Option>
            <Option value="watch_topic">观察话题</Option>
            <Option value="nothing">什么都不做</Option>
          </Select>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Checkbox defaultChecked={true}>
          话题关闭时视为未读
        </Checkbox>
      </div>

      <Divider />

      <Title level={4}>类别</Title>
      <Row gutter={[24, 16]}>
        <Col span={12}>
          <Card size="small" title="已关注" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些类别中的所有新话题。您将收到有关所有新帖子和话题的通知，同时新话题会在该类别旁边显示计数。
            </Text>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="已跟踪" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些类别中的新话题。您将收到有关新话题和话题回复的通知，同时新话题和帖子数量会在该类别旁边显示。
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card size="small" title="已跟踪" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些类别中的热门话题。新帖子数量会在该类别旁边显示。
            </Text>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="关注第一个帖子" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些类别中的新话题。你收不到其他的通知。
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={4}>标签</Title>
      <Row gutter={[24, 16]}>
        <Col span={12}>
          <Card size="small" title="已关注" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些标签的新话题。您将收到有关新话题和话题的通知，新的话题会在该标签旁边显示计数。
            </Text>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="已跟踪" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您将看到这些标签的新话题。新话题的数量会显示在标签旁边。
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card size="small" title="已设为免打扰" bordered={false}>
            <div style={{ marginTop: '8px' }}>
              <Text>broken, contributor-interviews, deprecated, unmaintained...</Text>
              <Button type="link" size="small">+</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您不会收到有关这些标签的新话题的任何通知，它们不会出现在任何话题列表的最新。
            </Text>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="发打开" bordered={false}>
            <Text type="secondary">显示</Text>
            <div style={{ marginTop: '8px' }}>
              <Button size="small">选择...</Button>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
              您不会收到有关这些标签的任何通知，它们不会出现在任何话题列表的最新。
            </Text>
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

export default TopicSettings;
