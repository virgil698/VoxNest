import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Typography, 
  Row, 
  Col,
  Button,
  Space,
  Spin,
  Avatar,
  Upload,
  message
} from 'antd';
import { 
  UserOutlined, 
  SafetyOutlined,
  ProfileOutlined,
  MailOutlined,
  BellOutlined,
  MessageOutlined,
  TeamOutlined,
  DesktopOutlined,
  CommentOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import AccountSettings from './preferences/AccountSettings';
import SecuritySettings from './preferences/SecuritySettings';
import ProfileSettings from './preferences/ProfileSettings';
import EmailSettings from './preferences/EmailSettings';
import NotificationSettings from './preferences/NotificationSettings';
import TopicSettings from './preferences/TopicSettings';
import UserSettings from './preferences/UserSettings';
import InterfaceSettings from './preferences/InterfaceSettings';
import ChatSettings from './preferences/ChatSettings';

const { Content, Sider } = Layout;
const { Title } = Typography;

interface PreferencesProps {}

const Preferences: React.FC<PreferencesProps> = () => {
  const { user, getCurrentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      getCurrentUser();
    }
  }, [user, getCurrentUser]);

  const menuItems = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '账户',
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: '安全',
    },
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人资料',
    },
    {
      key: 'emails',
      icon: <MailOutlined />,
      label: '电子邮件',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知',
    },
    {
      key: 'topics',
      icon: <MessageOutlined />,
      label: '话题',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户',
    },
    {
      key: 'interface',
      icon: <DesktopOutlined />,
      label: '界面',
    },
    {
      key: 'chat',
      icon: <CommentOutlined />,
      label: '聊天',
    },
  ];

  const handleAvatarUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      setLoading(false);
      getCurrentUser();
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'emails':
        return <EmailSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'topics':
        return <TopicSettings />;
      case 'users':
        return <UserSettings />;
      case 'interface':
        return <InterfaceSettings />;
      case 'chat':
        return <ChatSettings />;
      default:
        return <AccountSettings />;
    }
  };

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* 页面标题和用户信息 */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Space align="center" size={16}>
              <Avatar 
                size={64} 
                src={user.avatar}
                icon={<UserOutlined />}
              />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  {user.displayName || user.username}
                </Title>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  @{user.username}
                </div>
              </div>
            </Space>
          </Col>
          <Col flex="auto" />
          <Col>
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarUpload}
            >
              <Button 
                icon={<UploadOutlined />}
                loading={loading}
              >
                更换头像
              </Button>
            </Upload>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 */}
      <Layout 
        style={{ 
          background: 'transparent',
          minHeight: '70vh'
        }}
      >
        {/* 左侧菜单 */}
        <Sider 
          width={240}
          style={{ 
            background: '#fff',
            borderRadius: '8px',
            marginRight: '24px',
            padding: 0
          }}
        >
          <Menu
            mode="vertical"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key)}
            style={{
              border: 'none',
              height: '100%',
              borderRadius: '8px'
            }}
          />
        </Sider>

        {/* 右侧内容区域 */}
        <Content>
          <Card 
            style={{ 
              minHeight: '70vh',
              borderRadius: '8px'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            {renderContent()}
          </Card>
        </Content>
      </Layout>
    </div>
  );
};

export default Preferences;
