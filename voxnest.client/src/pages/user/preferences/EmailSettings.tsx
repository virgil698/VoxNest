import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Typography, 
  message,
  Divider,
  Select,
  Checkbox,
  List,
  Tag,
  Modal,
  Input
} from 'antd';
import { 
  MailOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface EmailForm {
  frequency: string;
  digest: string;
  includeExcerpts: boolean;
}

const EmailSettings: React.FC = () => {
  const [form] = Form.useForm<EmailForm>();
  const [loading, setLoading] = useState(false);
  const [addEmailModalVisible, setAddEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const emailAddresses = [
    {
      email: 'xiaokong23357@163.com',
      primary: true,
      verified: true
    }
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: 实现更新邮件设置的API调用
      console.log('保存邮件设置:', values);
      
      message.success('邮件设置更新成功');
    } catch (error) {
      console.error('保存邮件设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail) {
      message.error('请输入邮箱地址');
      return;
    }
    
    // TODO: 实现添加邮箱的API调用
    console.log('添加邮箱:', newEmail);
    message.success('邮箱添加成功，请查收验证邮件');
    setAddEmailModalVisible(false);
    setNewEmail('');
  };

  const handleDeleteEmail = (email: string) => {
    Modal.confirm({
      title: '确认删除邮箱？',
      content: `确定要删除邮箱 ${email} 吗？`,
      onOk: () => {
        // TODO: 实现删除邮箱的API调用
        message.success('邮箱删除成功');
      },
    });
  };

  const handleSetPrimary = (email: string) => {
    Modal.confirm({
      title: '设置主要邮箱',
      content: `确定要将 ${email} 设置为主要邮箱吗？`,
      onOk: () => {
        // TODO: 实现设置主要邮箱的API调用
        message.success('主要邮箱设置成功');
      },
    });
  };

  return (
    <div>
      <Title level={4}>电子邮件</Title>
      <Text type="secondary">
        当我收到个人消息时给我发电子邮件
      </Text>

      <div style={{ marginTop: '16px' }}>
        <Form.Item>
          <Select 
            defaultValue="always"
            style={{ width: '200px' }}
          >
            <Option value="always">始终</Option>
            <Option value="when_away">当我离开时</Option>
            <Option value="never">从不</Option>
          </Select>
        </Form.Item>
      </div>

      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        当我收到引用、回复、我的用户名被提及、标题或我的主题的消息，和我被邀请到主题时，系统将发送邮件提醒给我。
      </Text>

      <Divider />

      <Title level={4}>只在离开时</Title>
      <Text type="secondary">
        只有在10 分钟内没有看到主题，我们才会给您发送电子邮件。
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Checkbox defaultChecked={false}>
          在电子邮件中包含主题和回复节选
        </Checkbox>
      </div>

      <Divider />

      <Title level={4}>活动总结</Title>
      <Text type="secondary">
        当我不访问这里时，向我发送关于热门话题和回复的电子邮件总结
      </Text>

      <div style={{ marginTop: '16px' }}>
        <Form.Item>
          <Select 
            defaultValue="weekly"
            style={{ width: '200px' }}
          >
            <Option value="daily">每日</Option>
            <Option value="weekly">每周</Option>
            <Option value="biweekly">每两周</Option>
            <Option value="monthly">每月</Option>
            <Option value="never">从不</Option>
          </Select>
        </Form.Item>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Checkbox defaultChecked={false}>
          在总结电子邮件中包含来自用户的内容
        </Checkbox>
      </div>

      <Divider />

      <Title level={4}>邮箱名单模式</Title>
      <div style={{ marginTop: '8px' }}>
        <Checkbox defaultChecked={false}>
          启用邮箱名单模式
        </Checkbox>
      </div>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        此设置将验证发送到您的论坛
      </Text>
      <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
        已设置为仅系统设置的邮件过滤器是系统发送的邮件中。
      </Text>

      <Divider />

      <Title level={4}>邮箱地址管理</Title>
      <List
        dataSource={emailAddresses}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.verified ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>已验证</Tag>
              ) : (
                <Tag color="orange" icon={<ExclamationCircleOutlined />}>待验证</Tag>
              ),
              item.primary ? (
                <Tag color="blue">主要</Tag>
              ) : (
                <Button type="link" size="small" onClick={() => handleSetPrimary(item.email)}>
                  设为主要
                </Button>
              ),
              !item.primary && (
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteEmail(item.email)}
                >
                  删除
                </Button>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={<MailOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              title={item.email}
              description={item.primary ? '主要邮箱地址' : '备用邮箱地址'}
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: '16px' }}>
        <Button 
          icon={<PlusOutlined />}
          onClick={() => setAddEmailModalVisible(true)}
        >
          添加邮箱地址
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

      {/* 添加邮箱模态框 */}
      <Modal
        title="添加新的邮箱地址"
        open={addEmailModalVisible}
        onCancel={() => setAddEmailModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddEmailModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleAddEmail}
          >
            添加
          </Button>
        ]}
      >
        <Input
          placeholder="请输入邮箱地址"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onPressEnter={handleAddEmail}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
          我们将向此邮箱发送验证邮件，请查收并点击验证链接。
        </Text>
      </Modal>
    </div>
  );
};

export default EmailSettings;
