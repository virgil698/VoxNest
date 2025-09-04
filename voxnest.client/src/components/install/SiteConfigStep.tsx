import React from 'react';
import { Form, Input, Button, Result, Space } from 'antd';
import { GlobalOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { SiteConfigDto } from '../../api/install';

interface SiteConfigStepProps {
  onSubmit: (siteConfig: SiteConfigDto) => void;
  loading?: boolean;
}

const SiteConfigStep: React.FC<SiteConfigStepProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  // 默认配置
  const defaultConfig: SiteConfigDto = {
    siteName: 'VoxNest 论坛',
    siteDescription: '基于现代技术栈构建的高性能论坛系统',
    adminEmail: ''
  };

  // 提交表单
  const handleSubmit = (values: SiteConfigDto) => {
    onSubmit(values);
  };

  return (
    <div className="step-content">
      <div className="step-description">
        <h3><GlobalOutlined /> 站点配置</h3>
        <p>最后一步！请配置站点基本信息，完成安装。</p>
      </div>

      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="恭喜！系统安装即将完成"
        subTitle="数据库已成功初始化，管理员账户已创建，现在只需要完成站点配置即可开始使用。"
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultConfig}
        onFinish={handleSubmit}
        className="install-form"
      >
        <Form.Item
          label="站点名称"
          name="siteName"
          rules={[
            { required: true, message: '请输入站点名称' },
            { max: 100, message: '站点名称不能超过100个字符' }
          ]}
        >
          <Input 
            prefix={<GlobalOutlined />}
            placeholder="VoxNest 论坛"
          />
        </Form.Item>

        <Form.Item
          label="站点描述"
          name="siteDescription"
          rules={[
            { max: 500, message: '站点描述不能超过500个字符' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="请输入站点描述（可选）"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="管理员邮箱"
          name="adminEmail"
          rules={[
            { required: true, message: '请输入管理员邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
          tooltip="用于系统通知和重要信息接收"
        >
          <Input 
            prefix={<MailOutlined />}
            placeholder="admin@example.com"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 40 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ 
                height: 50, 
                fontSize: 18,
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              {loading ? '正在完成安装...' : '完成安装'}
            </Button>
            
            {loading && (
              <div style={{ textAlign: 'center', color: '#666' }}>
                <p>安装即将完成，系统将自动重启...</p>
                <p>请稍候，不要关闭浏览器窗口。</p>
              </div>
            )}
          </Space>
        </Form.Item>
      </Form>

      <div style={{ 
        marginTop: 40, 
        padding: 20, 
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <h4 style={{ color: '#389e0d', marginBottom: 8 }}>安装完成后</h4>
        <p style={{ margin: 0, color: '#666' }}>
          系统将自动重启并跳转到论坛首页。<br />
          您可以使用刚才创建的管理员账户登录并开始管理您的论坛。
        </p>
      </div>
    </div>
  );
};

export default SiteConfigStep;
