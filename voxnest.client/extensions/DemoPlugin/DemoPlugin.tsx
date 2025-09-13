/**
 * VoxNest 演示插件
 * 展示扩展框架的基本使用方法
 */

import React from 'react';
import { Button, Tag, message } from 'antd';
import { SettingOutlined, BulbOutlined } from '@ant-design/icons';

// 演示组件 - Header Right 区域的设置按钮
const SettingsButton: React.FC = () => {
  const handleSettingsClick = () => {
    console.log('演示插件：设置按钮被点击');
    
    // 展示消息
    message.success('演示插件体验已开打开！');
    
    // 记录日志到控制台
    console.log('Demo plugin: Settings button clicked');
    console.log('Demo plugin: User action logged');
    
    // 模拟一个警告场景
    setTimeout(() => {
      console.warn('Demo plugin: This is a demo warning message');
    }, 1000);
  };

  return (
    <Button
      type="text"
      icon={<SettingOutlined />}
      onClick={handleSettingsClick}
      title="演示插件设置"
      style={{ 
        color: '#666',
        border: '1px solid #d9d9d9',
        borderRadius: '6px'
      }}
    >
      演示
    </Button>
  );
};

// 演示组件 - Footer 区域的版本信息
const VersionInfo: React.FC = () => {
  return (
    <div style={{ fontSize: '12px', color: '#999' }}>
      <BulbOutlined style={{ marginRight: '4px' }} />
      扩展框架已激活
      <Tag color="green" style={{ marginLeft: '8px' }}>
        v1.0.0
      </Tag>
    </div>
  );
};

// 注册演示组件到不同的槽位
export function initializeDemoPlugin(framework: any) {
  console.log('🔌 正在初始化演示插件（从 public/extensions 加载）...');
  
  try {
    // 注册设置按钮到header.right槽位
    framework.slots.register('header.right', {
      component: SettingsButton,
      source: 'demo-plugin',
      priority: 10,
      name: 'Demo Settings Button'
    });
    
    // 注册版本信息到footer.right槽位  
    framework.slots.register('footer.right', {
      component: VersionInfo,
      source: 'demo-plugin',
      priority: 5,
      name: 'Framework Version Info'
    });
    
    console.log('✅ 演示插件初始化成功！');
    console.log('已注册的组件：');
    console.log('- 页面头部右侧：演示设置按钮');
    console.log('- 页面底部右侧：扩展框架版本信息');
  } catch (error) {
    console.error('❌ 演示插件初始化失败：', error);
  }
}

// 导出插件定义（用于扩展系统）
export const DemoPlugin = {
  id: 'voxnest-demo-plugin',
  name: '演示插件',
  version: '1.0.0',
  description: '展示VoxNest扩展框架基本功能的演示插件',
  type: 'plugin',
  
  // 初始化插件
  initialize: initializeDemoPlugin,
  
  // 插件组件
  components: {
    SettingsButton,
    VersionInfo,
  },
  
  // 插件配置
  config: {
    showVersionInfo: true,
    showSettingsButton: true,
  },
};

export default DemoPlugin;
