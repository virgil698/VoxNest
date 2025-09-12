/**
 * VoxNest 演示插件
 * 展示扩展框架的基本使用方法
 */

import React from 'react';
import { Button, Tag, message } from 'antd';
import { SettingOutlined, BulbOutlined } from '@ant-design/icons';
import { registerToSlot, createComponentIntegration } from '../index';
import { useLogger } from '../../hooks/useLogger';

// 演示组件 - Header Right 区域的设置按钮
const SettingsButton: React.FC = () => {
  const logger = useLogger('DemoPlugin.SettingsButton');

  const handleSettingsClick = () => {
    console.log('演示插件：设置按钮被点击');
    
    // 记录用户操作日志
    logger.logUserAction('Click demo settings button', 'User clicked on demo plugin settings button');
    
    // 展示消息和记录信息日志
    message.success('演示插件设置已打开！');
    logger.info('Demo plugin settings opened', 'User successfully opened demo plugin settings');
    
    // 模拟一个警告场景
    setTimeout(() => {
      logger.warning('Demo warning', 'This is a demo warning message from the demo plugin');
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

// 演示组件 - Content Before 区域的欢迎横幅
const WelcomeBanner: React.FC = () => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    }}>
      <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '600' }}>
        🎉 扩展框架集成成功！
      </h3>
      <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        VoxNest 扩展框架已经成功集成到现有系统中，现在可以使用插件和主题功能了
      </p>
    </div>
  );
};

// 注册演示组件到不同的槽位
export function initializeDemoPlugin() {
  console.log('🔌 正在初始化演示插件...');
  
  try {
    // 注册设置按钮到header.right槽位
    registerToSlot('header.right', SettingsButton, {
      source: 'demo-plugin',
      priority: 10,
      name: 'Demo Settings Button'
    });
    
    // 注册版本信息到footer.right槽位  
    registerToSlot('footer.right', VersionInfo, {
      source: 'demo-plugin',
      priority: 5,
      name: 'Framework Version Info'
    });
    
    // 注册欢迎横幅到content.before槽位
    registerToSlot('content.before', WelcomeBanner, {
      source: 'demo-plugin',
      priority: 15,
      name: 'Welcome Banner',
      condition: () => window.location.pathname === '/' // 只在首页显示
    });
    
    console.log('✅ 演示插件初始化成功！');
    console.log('已注册的组件：');
    console.log('- 页面头部右侧：演示设置按钮');
    console.log('- 页面底部右侧：扩展框架版本信息');
    console.log('- 主内容区域顶部：欢迎横幅');
  } catch (error) {
    console.error('❌ 演示插件初始化失败：', error);
  }
}

// 导出插件定义（用于更高级的插件系统）
export const DemoPlugin = {
  id: 'voxnest-demo-plugin',
  name: '演示插件',
  version: '1.0.0',
  description: '展示VoxNest扩展框架基本功能的演示插件',
  
  // 初始化插件
  initialize: initializeDemoPlugin,
  
  // 插件组件
  components: {
    SettingsButton,
    VersionInfo,
    WelcomeBanner,
  },
  
  // 插件配置
  config: {
    showWelcomeBanner: true,
    showVersionInfo: true,
    showSettingsButton: true,
  },
};

export default DemoPlugin;
