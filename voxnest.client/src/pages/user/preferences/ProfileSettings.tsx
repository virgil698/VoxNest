import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  Row,
  Col,
  Select,
  DatePicker,
  Checkbox
} from 'antd';
import { 
  SaveOutlined,
  GlobalOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/authStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProfileForm {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  birthday: dayjs.Dayjs | null;
  gender: string;
  title: string;
  hideProfile: boolean;
  hideEmail: boolean;
}

const ProfileSettings: React.FC = () => {
  const { user, getCurrentUser } = useAuthStore();
  const [form] = Form.useForm<ProfileForm>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        displayName: user.displayName || '',
        bio: '',
        location: 'Sichuan, China',
        website: '',
        birthday: null,
        gender: '',
        title: '',
        hideProfile: false,
        hideEmail: false
      });
    }
  }, [user, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: 实现更新个人资料的API调用
      console.log('保存个人资料:', values);
      
      message.success('个人资料更新成功');
      
      // 重新获取用户信息
      await getCurrentUser();
    } catch (error) {
      console.error('保存个人资料失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Checkbox defaultChecked={false}>
          隐藏我的公开个人资料
        </Checkbox>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Title level={4}>自我介绍</Title>
        
        <div style={{ marginBottom: '24px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fafafa', 
            borderBottom: '1px solid #d9d9d9',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}>
            <TextArea
              placeholder="Nice to meet everyone!
I am virgil698, the screen name Dong Di Kong (you can call me
Xiao Kong, both are my screen names)
Originally from Sichuan, China, I am a freelance programming
enthusiast who loves to play minecraft"
              autoSize={{ minRows: 5, maxRows: 8 }}
              style={{ border: 'none', backgroundColor: 'transparent', resize: 'none' }}
            />
          </div>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f5f5f5',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            Nice to meet everyone!
            I am virgil698, the screen name Dong Di Kong (you can call me Xiao Kong, both are my screen names)
            Originally from Sichuan, China, I am a freelance programming enthusiast who loves to play minecraft
          </div>
        </div>

        <Divider />

        <Title level={4}>时区</Title>
        <Form.Item name="timezone">
          <Select 
            defaultValue="shanghai"
            style={{ width: '300px' }}
            placeholder="选择时区"
          >
            <Option value="shanghai">上海</Option>
            <Option value="beijing">北京</Option>
            <Option value="shenzhen">深圳</Option>
            <Option value="guangzhou">广州</Option>
          </Select>
        </Form.Item>
        <div style={{ marginTop: '8px' }}>
          <Checkbox>
            使用当前的时区
          </Checkbox>
        </div>

        <Divider />

        <Title level={4}>地点</Title>
        <Form.Item name="location">
          <Input 
            defaultValue="Sichuan, China"
            style={{ width: '300px' }}
            prefix={<EnvironmentOutlined />}
          />
        </Form.Item>

        <Divider />

        <Title level={4}>网站</Title>
        <Form.Item name="website">
          <Input 
            placeholder="https://example.com"
            style={{ width: '400px' }}
            prefix={<GlobalOutlined />}
          />
        </Form.Item>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Title level={4}>性别</Title>
            <Form.Item name="gender">
              <Select 
                placeholder="选择性别"
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="male">男</Option>
                <Option value="female">女</Option>
                <Option value="other">其他</Option>
                <Option value="prefer_not_to_say">不愿透露</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Title level={4}>生日</Title>
            <Form.Item name="birthday">
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="选择生日"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>职位/头衔</Title>
        <Form.Item name="title">
          <Input 
            placeholder="例如：软件工程师、产品经理等"
            style={{ width: '400px' }}
          />
        </Form.Item>

        <Divider />

        <Title level={4}>隐私设置</Title>
        <Space direction="vertical">
          <Form.Item name="hideProfile" valuePropName="checked">
            <Checkbox>
              不在用户列表中显示我的个人资料
            </Checkbox>
          </Form.Item>
          
          <Form.Item name="hideEmail" valuePropName="checked">
            <Checkbox>
              隐藏我的邮箱地址
            </Checkbox>
          </Form.Item>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            保存更改
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProfileSettings;
