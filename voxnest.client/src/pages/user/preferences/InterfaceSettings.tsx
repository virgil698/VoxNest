import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  message,
  Divider,
  Select,
  Checkbox,
  Row,
  Col
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

const InterfaceSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // TODO: 实现更新界面设置的API调用
      console.log('保存界面设置');
      
      message.success('界面设置更新成功');
    } catch (error) {
      console.error('保存界面设置失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>主题</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          value="horizon"
          style={{ width: '200px' }}
        >
          <Option value="horizon">Horizon</Option>
          <Option value="dark">深色主题</Option>
          <Option value="light">浅色主题</Option>
          <Option value="auto">跟随系统</Option>
        </Select>
      </div>
      <div style={{ marginTop: '8px' }}>
        <Checkbox defaultChecked={false}>
          将其设为我们设备上的默认主题
        </Checkbox>
      </div>

      <Divider />

      <Title level={4}>调色板</Title>
      <Row gutter={16}>
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text>深色模式</Text>
            <div style={{ marginTop: '8px' }}>
              <Select 
                defaultValue="default"
                style={{ width: '100%' }}
              >
                <Option value="default">默认主题</Option>
                <Option value="dark_blue">深蓝主题</Option>
                <Option value="dark_green">深绿主题</Option>
              </Select>
            </div>
          </div>
        </Col>
        
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text>模式</Text>
            <div style={{ marginTop: '8px' }}>
              <Select 
                defaultValue="auto"
                style={{ width: '100%' }}
              >
                <Option value="light">浅色</Option>
                <Option value="dark">深色</Option>
                <Option value="auto">自动</Option>
              </Select>
            </div>
          </div>
        </Col>
        
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text>自动</Text>
            <div style={{ marginTop: '8px' }}>
              <Checkbox defaultChecked={true}>
                自动使用明暗配色模式
              </Checkbox>
            </div>
          </div>
        </Col>
      </Row>

      <Text type="secondary" style={{ display: 'block', marginTop: '16px', fontSize: '13px' }}>
        自动将用现其所在的系统设置表示配色模式，需要设备支持。
      </Text>

      <Divider />

      <Title level={4}>文本大小</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="normal"
          style={{ width: '150px' }}
        >
          <Option value="smallest">最小</Option>
          <Option value="smaller">较小</Option>
          <Option value="normal">正常</Option>
          <Option value="larger">较大</Option>
          <Option value="largest">最大</Option>
        </Select>
      </div>

      <Divider />

      <Title level={4}>界面语言</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="zh-CN"
          style={{ width: '200px' }}
        >
          <Option value="zh-CN">简体中文</Option>
          <Option value="zh-TW">繁體中文</Option>
          <Option value="en">English</Option>
          <Option value="ja">日本語</Option>
          <Option value="ko">한국어</Option>
        </Select>
      </div>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
        用户界面语言，将在下次刷新页面后生效。
      </Text>

      <Divider />

      <Title level={4}>默认首页</Title>
      <div style={{ marginTop: '16px' }}>
        <Select 
          defaultValue="latest"
          style={{ width: '200px' }}
        >
          <Option value="latest">最新</Option>
          <Option value="top">热门</Option>
          <Option value="categories">分类</Option>
          <Option value="unread">未读</Option>
          <Option value="new">最新</Option>
        </Select>
      </div>

      <Divider />

      <Title level={4}>其他</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Checkbox defaultChecked={true}>
          在新标签页中打开所有外部链接
        </Checkbox>
        
        <Checkbox defaultChecked={true}>
          为高亮显示的文字启用引用回复
        </Checkbox>
        
        <Checkbox defaultChecked={false}>
          在编辑器中启用的启用智能列表
        </Checkbox>
        
        <Checkbox defaultChecked={true}>
          启用网格组件记忆方式未读
        </Checkbox>
        
        <Checkbox defaultChecked={true}>
          当我到达底部时的动态背景图调整
        </Checkbox>
        
        <Checkbox defaultChecked={false}>
          在网站跃过到显示数学
        </Checkbox>
        
        <Checkbox defaultChecked={false}>
          在输入框的 Markdown 格式下使用等宽字体
        </Checkbox>
      </Space>

      <Text type="secondary" style={{ display: 'block', marginTop: '16px', fontSize: '13px' }}>
        背景图面板显示到服务器：
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Select 
          defaultValue="new_thread"
          style={{ width: '200px' }}
        >
          <Option value="new_thread">新建话题</Option>
          <Option value="save_draft">保存书草并清除线段</Option>
        </Select>
      </div>

      <Text type="secondary" style={{ display: 'block', marginTop: '16px', fontSize: '13px' }}>
        发表书定书经健康选后：
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Select 
          defaultValue="stay_composer"
          style={{ width: '200px' }}
        >
          <Option value="stay_composer">保存书草并清除线段</Option>
          <Option value="close_composer">关闭编辑器</Option>
        </Select>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Checkbox defaultChecked={false}>
          跟踪新用户进入现有和徽章
        </Checkbox>
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

export default InterfaceSettings;
