/**
 * 扩展配置初始化器
 * 为已安装的扩展自动创建配置记录
 */

import { extensionConfigApi } from '../../api/extensionConfig';
import type { Logger } from './types';

export interface ExtensionManifest {
  id: string;
  name: string;
  type: 'plugin' | 'theme' | 'integration';
  version: string;
  configSchema?: unknown;
  defaultConfig?: Record<string, unknown>;
}

export class ExtensionConfigInitializer {
  private logger: Logger;
  private initialized = false;

  constructor(logger: Logger) {
    this.logger = logger.createChild('ConfigInitializer');
  }

  /**
   * 初始化所有扩展的配置
   */
  async initializeAllConfigs(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 获取扩展清单
      const manifests = await this.getExtensionManifests();
      
      for (const manifest of manifests) {
        await this.initializeExtensionConfig(manifest);
      }

      this.initialized = true;
      this.logger.info(`Initialized configs for ${manifests.length} extensions`);
    } catch (error) {
      this.logger.error('Failed to initialize extension configs:', error);
    }
  }

  /**
   * 初始化单个扩展的配置
   */
  private async initializeExtensionConfig(manifest: ExtensionManifest): Promise<void> {
    try {
      // 检查配置是否已存在
      const existingConfig = await extensionConfigApi.getConfig(manifest.id).catch(() => null);
      
      if (existingConfig) {
        this.logger.debug(`Config already exists for extension: ${manifest.id}`);
        return;
      }

      // 创建新配置
      if (manifest.configSchema && manifest.defaultConfig) {
        await extensionConfigApi.createConfig({
          extensionId: manifest.id,
          extensionType: manifest.type,
          configSchema: manifest.configSchema as unknown as import('../../api/extensionConfig').ExtensionConfigSchema,
          defaultConfig: manifest.defaultConfig
        });

        this.logger.info(`Created config for extension: ${manifest.id}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize config for extension ${manifest.id}:`, error);
    }
  }

  /**
   * 获取扩展清单列表（模拟从扩展系统获取）
   */
  private async getExtensionManifests(): Promise<ExtensionManifest[]> {
    // 在实际实现中，这里应该从扩展管理系统获取已安装扩展的清单
    // 目前返回硬编码的清单数据
    return [
      {
        id: 'cookie-consent',
        name: 'Cookie 同意横幅',
        type: 'plugin',
        version: '1.0.0',
        configSchema: {
          title: 'Cookie 同意横幅设置',
          description: '配置 Cookie 同意横幅的外观和行为，确保符合 GDPR 和 CCPA 法规要求',
          groups: [
            {
              id: 'appearance',
              title: '外观设置',
              description: '配置横幅的位置、主题和视觉效果',
              order: 1
            },
            {
              id: 'behavior',
              title: '行为设置', 
              description: '配置用户交互和自动化行为',
              order: 2
            },
            {
              id: 'categories',
              title: 'Cookie 类别',
              description: '配置不同类型的 Cookie 设置',
              order: 3
            },
            {
              id: 'legal',
              title: '法律信息',
              description: '配置隐私政策和相关法律链接',
              order: 4
            }
          ],
          properties: {
            position: {
              type: 'select',
              title: '横幅位置',
              description: '选择 Cookie 横幅在页面中的显示位置',
              default: 'bottom-center',
              required: true,
              group: 'appearance',
              order: 1,
              options: [
                { label: '底部居中', value: 'bottom-center' },
                { label: '底部左侧', value: 'bottom-left' },
                { label: '底部右侧', value: 'bottom-right' },
                { label: '顶部居中', value: 'top-center' },
                { label: '顶部左侧', value: 'top-left' },
                { label: '顶部右侧', value: 'top-right' },
                { label: '左侧浮动', value: 'left-float' },
                { label: '右侧浮动', value: 'right-float' }
              ]
            },
            theme: {
              type: 'select',
              title: '主题样式',
              description: '选择横幅的视觉主题',
              default: 'light',
              required: true,
              group: 'appearance',
              order: 2,
              options: [
                { label: '浅色主题', value: 'light' },
                { label: '深色主题', value: 'dark' },
                { label: '自动跟随系统', value: 'auto' }
              ]
            },
            showDetailsLink: {
              type: 'boolean',
              title: '显示详细设置链接',
              description: '是否在横幅中显示 \'管理 Cookie 设置\' 链接',
              default: true,
              group: 'appearance',
              order: 3
            },
            companyName: {
              type: 'string',
              title: '公司名称',
              description: '在横幅中显示的公司或网站名称',
              default: 'VoxNest',
              required: true,
              group: 'legal',
              order: 1
            },
            autoAcceptDelay: {
              type: 'number',
              title: '自动接受延迟 (秒)',
              description: '设置多少秒后自动接受 Cookie（0 表示不自动接受）',
              default: 0,
              min: 0,
              max: 300,
              group: 'behavior',
              order: 3
            }
          },
          required: ['position', 'theme', 'companyName']
        },
        defaultConfig: {
          position: 'bottom-center',
          theme: 'light',
          showDetailsLink: true,
          autoAcceptDelay: 0,
          showRejectAll: true,
          showAcceptAll: true,
          companyName: 'VoxNest',
          privacyPolicyUrl: '/privacy',
          cookiePolicyUrl: '/cookies',
          essential: {
            enabled: true,
            required: true
          },
          analytics: {
            enabled: true,
            required: false,
            providers: ['google-analytics', 'matomo']
          },
          marketing: {
            enabled: true,
            required: false,
            providers: ['facebook-pixel', 'google-ads']
          },
          functional: {
            enabled: true,
            required: false,
            providers: ['youtube', 'maps']
          }
        }
      },
      {
        id: 'dark-mode-theme',
        name: '明暗模式切换器',
        type: 'theme',
        version: '2.0.0',
        configSchema: {
          title: '明暗模式主题设置',
          description: '配置智能明暗模式切换器的外观、行为和个性化选项',
          groups: [
            {
              id: 'general',
              title: '基本设置',
              description: '配置主题的基本行为和默认选项',
              order: 1
            },
            {
              id: 'ui',
              title: '界面控制',
              description: '配置切换按钮和用户界面元素',
              order: 2
            },
            {
              id: 'automation',
              title: '自动化设置',
              description: '配置系统主题跟随和定时切换功能',
              order: 3
            },
            {
              id: 'colors',
              title: '颜色定制',
              description: '自定义明暗模式下的主题颜色',
              order: 4
            }
          ],
          properties: {
            defaultTheme: {
              type: 'select',
              title: '默认主题',
              description: '用户首次访问时的默认主题模式',
              default: 'auto',
              required: true,
              group: 'general',
              order: 1,
              options: [
                { label: '自动跟随系统', value: 'auto' },
                { label: '浅色模式', value: 'light' },
                { label: '深色模式', value: 'dark' }
              ]
            },
            showToggleButton: {
              type: 'boolean',
              title: '显示切换按钮',
              description: '是否在页面中显示主题切换按钮',
              default: true,
              group: 'ui',
              order: 1
            },
            toggleStyle: {
              type: 'select',
              title: '切换按钮样式',
              description: '选择主题切换按钮的外观样式',
              default: 'button',
              group: 'ui',
              order: 3,
              options: [
                { label: '图标按钮', value: 'button' },
                { label: '开关切换器', value: 'switch' },
                { label: '下拉选择器', value: 'dropdown' }
              ]
            },
            enableTransitions: {
              type: 'boolean',
              title: '启用切换动画',
              description: '主题切换时是否显示过渡动画效果',
              default: true,
              group: 'ui',
              order: 4
            }
          },
          required: ['defaultTheme']
        },
        defaultConfig: {
          defaultTheme: 'auto',
          enableTransitions: true,
          transitionDuration: 300,
          savePreference: true,
          followSystemTheme: true,
          showToggleButton: true,
          togglePosition: 'top-right',
          toggleStyle: 'button',
          showCustomizer: true,
          enableScheduler: true,
          enableKeyboardShortcut: true,
          keyboardShortcut: 'ctrl+shift+d',
          scheduler: {
            enabled: false,
            lightModeStart: '06:00',
            darkModeStart: '18:00'
          },
          customColors: {
            light: {
              primary: '#4f46e5',
              secondary: '#7c3aed',
              accent: '#06b6d4',
              background: '#ffffff',
              surface: '#f8fafc',
              text: '#1e293b'
            },
            dark: {
              primary: '#6366f1', 
              secondary: '#8b5cf6',
              accent: '#67e8f9',
              background: '#0f172a',
              surface: '#1e293b',
              text: '#f1f5f9'
            }
          },
          accessibility: {
            highContrast: false,
            reducedMotion: false,
            largerText: false,
            focusRing: true
          }
        }
      }
    ];
  }
}
