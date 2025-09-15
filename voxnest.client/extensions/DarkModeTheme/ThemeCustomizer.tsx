/**
 * 主题定制器组件
 * 提供详细的主题配置和自定义选项
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Space,
  Switch,
  Slider,
  ColorPicker,
  TimePicker,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  Row,
  Col,
  Select,
  Badge
} from 'antd';
import {
  SettingOutlined,
  BgColorsOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  ReloadOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { themeManager, type ThemeConfig } from './ThemeManager.ts';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TabPane } = Tabs;

interface ThemeCustomizerProps {
  visible: boolean;
  onClose: () => void;
}

export function ThemeCustomizer({ visible, onClose }: ThemeCustomizerProps) {
  const [config, setConfig] = useState<ThemeConfig>(themeManager.getConfig());
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (visible) {
      const currentConfig = themeManager.getConfig();
      setConfig(currentConfig);
      setPreviewTheme(themeManager.getCurrentTheme());
      setHasChanges(false);
    }
  }, [visible]);

  const handleConfigChange = (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleColorChange = (theme: 'light' | 'dark', colorKey: string, color: string) => {
    const newConfig = {
      ...config,
      customColors: {
        ...config.customColors,
        [theme]: {
          ...config.customColors[theme],
          [colorKey]: color
        }
      }
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    themeManager.updateConfig(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultConfig = themeManager.getConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
  };

  const handlePreview = (theme: 'light' | 'dark') => {
    setPreviewTheme(theme);
    themeManager.setTheme(theme, 'user');
  };

  const renderGeneralSettings = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="基本设置" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>默认主题模式</Text>
            </Col>
            <Col span={12}>
              <Select
                value={config.mode}
                onChange={(value) => handleConfigChange({ mode: value })}
                style={{ width: '100%' }}
                options={[
                  { label: '浅色模式', value: 'light', icon: <SunOutlined /> },
                  { label: '深色模式', value: 'dark', icon: <MoonOutlined /> },
                  { label: '跟随系统', value: 'auto', icon: <ThunderboltOutlined /> }
                ]}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>启用过渡动画</Text>
            </Col>
            <Col span={12}>
              <Switch
                checked={config.enableTransitions}
                onChange={(checked) => handleConfigChange({ enableTransitions: checked })}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>动画持续时间</Text>
            </Col>
            <Col span={12}>
              <Slider
                min={100}
                max={1000}
                step={50}
                value={config.transitionDuration}
                onChange={(value) => handleConfigChange({ transitionDuration: value })}
                disabled={!config.enableTransitions}
                tooltip={{ formatter: (value) => `${value}ms` }}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>保存偏好设置</Text>
            </Col>
            <Col span={12}>
              <Switch
                checked={config.savePreference}
                onChange={(checked) => handleConfigChange({ savePreference: checked })}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>跟随系统主题</Text>
            </Col>
            <Col span={12}>
              <Switch
                checked={config.followSystemTheme}
                onChange={(checked) => handleConfigChange({ followSystemTheme: checked })}
                disabled={config.mode !== 'auto'}
              />
            </Col>
          </Row>
        </Space>
      </Card>
    </Space>
  );

  const renderColorSettings = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="颜色定制"
        description="自定义浅色和深色模式的颜色方案。修改后请点击预览按钮查看效果。"
        type="info"
        showIcon
      />

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <SunOutlined />
                <span>浅色模式</span>
                <Button
                  size="small"
                  type={previewTheme === 'light' ? 'primary' : 'default'}
                  onClick={() => handlePreview('light')}
                >
                  预览
                </Button>
              </Space>
            }
            size="small"
          >
            {Object.entries(config.customColors.light).map(([key, value]) => (
              <Row key={key} gutter={8} align="middle" style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Text style={{ fontSize: '13px' }}>
                    {getColorLabel(key)}
                  </Text>
                </Col>
                <Col span={16}>
                  <ColorPicker
                    value={value}
                    onChange={(_, hex) => handleColorChange('light', key, hex)}
                    showText
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            ))}
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title={
              <Space>
                <MoonOutlined />
                <span>深色模式</span>
                <Button
                  size="small"
                  type={previewTheme === 'dark' ? 'primary' : 'default'}
                  onClick={() => handlePreview('dark')}
                >
                  预览
                </Button>
              </Space>
            }
            size="small"
          >
            {Object.entries(config.customColors.dark).map(([key, value]) => (
              <Row key={key} gutter={8} align="middle" style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Text style={{ fontSize: '13px' }}>
                    {getColorLabel(key)}
                  </Text>
                </Col>
                <Col span={16}>
                  <ColorPicker
                    value={value}
                    onChange={(_, hex) => handleColorChange('dark', key, hex)}
                    showText
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            ))}
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const renderSchedulerSettings = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="定时切换" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>启用定时切换</Text>
            </Col>
            <Col span={12}>
              <Switch
                checked={config.enableScheduler}
                onChange={(checked) => handleConfigChange({ enableScheduler: checked })}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>激活定时器</Text>
            </Col>
            <Col span={12}>
              <Switch
                checked={config.scheduler.enabled}
                onChange={(checked) => handleConfigChange({
                  scheduler: { ...config.scheduler, enabled: checked }
                })}
                disabled={!config.enableScheduler}
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>浅色模式开始时间</Text>
            </Col>
            <Col span={12}>
              <TimePicker
                value={dayjs(config.scheduler.lightModeStart, 'HH:mm')}
                format="HH:mm"
                onChange={(time) => {
                  if (time) {
                    handleConfigChange({
                      scheduler: {
                        ...config.scheduler,
                        lightModeStart: time.format('HH:mm')
                      }
                    });
                  }
                }}
                disabled={!config.enableScheduler || !config.scheduler.enabled}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text>深色模式开始时间</Text>
            </Col>
            <Col span={12}>
              <TimePicker
                value={dayjs(config.scheduler.darkModeStart, 'HH:mm')}
                format="HH:mm"
                onChange={(time) => {
                  if (time) {
                    handleConfigChange({
                      scheduler: {
                        ...config.scheduler,
                        darkModeStart: time.format('HH:mm')
                      }
                    });
                  }
                }}
                disabled={!config.enableScheduler || !config.scheduler.enabled}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          {config.enableScheduler && config.scheduler.enabled && (
            <Alert
              message="定时切换已启用"
              description={`系统将在 ${config.scheduler.lightModeStart} 切换到浅色模式，在 ${config.scheduler.darkModeStart} 切换到深色模式。`}
              type="success"
              showIcon
            />
          )}
        </Space>
      </Card>
    </Space>
  );

  const renderAccessibilitySettings = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="辅助功能" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small">
                <Text strong>高对比度模式</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  增加颜色对比度，改善视觉可访问性
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Switch
                checked={config.accessibility.highContrast}
                onChange={(checked) => handleConfigChange({
                  accessibility: { ...config.accessibility, highContrast: checked }
                })}
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small">
                <Text strong>减少动画</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  减少或禁用动画效果，适合动作敏感用户
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Switch
                checked={config.accessibility.reducedMotion}
                onChange={(checked) => handleConfigChange({
                  accessibility: { ...config.accessibility, reducedMotion: checked }
                })}
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small">
                <Text strong>大字体模式</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  增大字体大小，提高文本可读性
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Switch
                checked={config.accessibility.largerText}
                onChange={(checked) => handleConfigChange({
                  accessibility: { ...config.accessibility, largerText: checked }
                })}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Alert
        message="辅助功能说明"
        description="这些设置将帮助有特殊需求的用户更好地使用网站。部分设置会自动检测系统偏好并应用。"
        type="info"
        showIcon
      />
    </Space>
  );

  const getColorLabel = (key: string): string => {
    const labels: Record<string, string> = {
      primary: '主色',
      secondary: '次色',
      accent: '强调色',
      background: '背景色',
      surface: '表面色',
      text: '文本色',
      textSecondary: '次要文本'
    };
    return labels[key] || key;
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>主题设置</span>
          {hasChanges && <Badge dot />}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Button onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            重置
          </Button>
          <Button 
            type="primary" 
            onClick={handleSave} 
            icon={<SaveOutlined />}
            disabled={!hasChanges}
          >
            保存设置
          </Button>
        </Space>
      }
      className="theme-customizer-modal"
      style={{ top: 20 }}
    >
      <Tabs defaultActiveKey="general" size="small">
        <TabPane
          tab={
            <Space>
              <SettingOutlined />
              <span>基本设置</span>
            </Space>
          }
          key="general"
        >
          {renderGeneralSettings()}
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BgColorsOutlined />
              <span>颜色定制</span>
            </Space>
          }
          key="colors"
        >
          {renderColorSettings()}
        </TabPane>

        <TabPane
          tab={
            <Space>
              <ClockCircleOutlined />
              <span>定时切换</span>
            </Space>
          }
          key="scheduler"
        >
          {renderSchedulerSettings()}
        </TabPane>

        <TabPane
          tab={
            <Space>
              <EyeOutlined />
              <span>辅助功能</span>
            </Space>
          }
          key="accessibility"
        >
          {renderAccessibilitySettings()}
        </TabPane>
      </Tabs>
    </Modal>
  );
}
