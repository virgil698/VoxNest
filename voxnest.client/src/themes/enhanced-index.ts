/**
 * VoxNest 增强主题系统统一导出
 * 包含主题包管理和页面内容定制的完整功能
 */

// 重新导出原有功能
export * from './index';

// 主题包管理
export { 
  ThemePackageManager, 
  themePackageManager,
  getAllThemePackages,
  installThemePackage,
  uninstallThemePackage,
  importThemePackageFromFile,
  exportThemePackageToFile,
  getThemePackageThemes,
  isThemePackageInstalled,
  refreshThemePackages
} from './packages';

// 增强集成功能
export {
  EnhancedThemeConfigIntegration,
  enhancedThemeConfigIntegration,
  initializeEnhancedThemeSystem,
  switchThemePackage,
  getAllThemePackages as getAllThemePackagesDetailed,
  importThemePackage,
  exportThemePackage
} from './integration-enhanced';

// 扩展类型定义
export type {
  LayoutConfig,
  PostStyleConfig,
  ComponentStyleConfig,
  TypographyConfig,
  ThemePackageInfo,
  ThemePackageConfig,
  IThemePackageManager
} from './types';

// ===========================================
// 便捷配置函数
// ===========================================

/**
 * 在配置文件中设置主题包
 */
export function configureThemePackage(config: {
  themePackage: string;
  customThemeId?: string;
  enableAutoUpdate?: boolean;
}) {
  const { updateAppConfig } = require('../config');
  updateAppConfig({
    ui: {
      themePackage: config.themePackage,
      customThemeId: config.customThemeId,
      enableThemePackageAutoUpdate: config.enableAutoUpdate ?? true
    }
  });
}

/**
 * 获取当前主题包配置
 */
export function getCurrentThemePackageConfig() {
  const { getAppConfig } = require('../config');
  const config = getAppConfig();
  return {
    themePackage: config.ui.themePackage,
    customThemeId: config.ui.customThemeId,
    enableAutoUpdate: config.ui.enableThemePackageAutoUpdate
  };
}

/**
 * 创建自定义主题配置模板
 */
export function createCustomThemeTemplate(baseThemeId = 'light'): Partial<import('./types').Theme> {
  const baseTheme = baseThemeId === 'dark' 
    ? require('./builtin/dark').darkTheme 
    : require('./builtin/light').lightTheme;

  return {
    metadata: {
      id: 'custom-theme',
      name: '自定义主题',
      description: '基于 ' + baseTheme.metadata.name + ' 的自定义主题',
      version: '1.0.0',
      author: 'User',
      tags: ['custom'],
      builtin: false
    },
    colors: { ...baseTheme.colors },
    fonts: { ...baseTheme.fonts },
    spacing: { ...baseTheme.spacing },
    borderRadius: { ...baseTheme.borderRadius },
    shadows: { ...baseTheme.shadows },
    animations: { ...baseTheme.animations },
    layout: { ...baseTheme.layout },
    postStyles: { ...baseTheme.postStyles },
    componentStyles: { ...baseTheme.componentStyles },
    typography: { ...baseTheme.typography }
  };
}

// ===========================================
// CSS 工具函数
// ===========================================

/**
 * 生成帖子样式CSS
 */
export function generatePostStyleCSS(_postStyles: import('./types').PostStyleConfig): string {
  return `
/* 帖子卡片样式 */
.post-card {
  background: var(--post-card-background);
  border: 1px solid var(--post-card-border);
  border-radius: var(--post-card-border-radius);
  padding: var(--post-card-padding);
  margin-bottom: var(--post-card-margin-bottom);
  box-shadow: var(--post-card-box-shadow);
  transition: box-shadow 0.2s ease;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 帖子标题样式 */
.post-title {
  font-size: var(--post-title-font-size);
  font-weight: var(--post-title-font-weight);
  color: var(--post-title-color);
  line-height: var(--post-title-line-height);
  margin-bottom: var(--post-title-margin-bottom);
  margin-top: 0;
}

.post-title a {
  color: inherit;
  text-decoration: none;
}

.post-title a:hover {
  color: var(--color-primary-primary);
}

/* 帖子内容样式 */
.post-content {
  font-size: var(--post-content-font-size);
  line-height: var(--post-content-line-height);
  color: var(--post-content-color);
  margin-bottom: var(--post-content-margin-bottom);
}

.post-content.preview {
  max-height: var(--post-content-max-height, 200px);
  overflow: hidden;
  position: relative;
}

.post-content.preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, var(--post-card-background));
}

/* 帖子元信息样式 */
.post-meta {
  font-size: var(--post-meta-font-size);
  color: var(--post-meta-color);
  display: flex;
  align-items: center;
  gap: var(--post-meta-spacing);
  margin-bottom: var(--post-meta-spacing);
}

/* 帖子标签样式 */
.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--post-tags-spacing);
  margin-bottom: var(--post-meta-spacing);
}

.post-tag {
  background-color: var(--post-tags-background-color);
  color: var(--post-tags-text-color);
  border-radius: var(--post-tags-border-radius);
  padding: var(--post-tags-padding);
  font-size: var(--post-tags-font-size);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.post-tag:hover {
  opacity: 0.8;
}

/* 帖子操作按钮样式 */
.post-actions {
  display: flex;
  align-items: center;
  gap: var(--post-actions-button-spacing);
}

.post-action-btn {
  width: var(--post-actions-button-size);
  height: var(--post-actions-button-size);
  border: none;
  background: transparent;
  color: var(--post-meta-color);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.post-action-btn:hover {
  background-color: var(--color-neutral-surface);
  color: var(--color-primary-primary);
}

.post-action-btn svg {
  width: var(--post-actions-icon-size);
  height: var(--post-actions-icon-size);
}
`;
}

/**
 * 生成排版样式CSS
 */
export function generateTypographyCSS(_typography: import('./types').TypographyConfig): string {
  return `
/* 标题样式 */
h1, .h1 {
  font-size: var(--typography-h1-font-size);
  font-weight: var(--typography-h1-font-weight);
  line-height: var(--typography-h1-line-height);
  margin-bottom: var(--typography-h1-margin-bottom);
  margin-top: 0;
}

h2, .h2 {
  font-size: var(--typography-h2-font-size);
  font-weight: var(--typography-h2-font-weight);
  line-height: var(--typography-h2-line-height);
  margin-bottom: var(--typography-h2-margin-bottom);
  margin-top: 0;
}

h3, .h3 {
  font-size: var(--typography-h3-font-size);
  font-weight: var(--typography-h3-font-weight);
  line-height: var(--typography-h3-line-height);
  margin-bottom: var(--typography-h3-margin-bottom);
  margin-top: 0;
}

h4, .h4 {
  font-size: var(--typography-h4-font-size);
  font-weight: var(--typography-h4-font-weight);
  line-height: var(--typography-h4-line-height);
  margin-bottom: var(--typography-h4-margin-bottom);
  margin-top: 0;
}

h5, .h5 {
  font-size: var(--typography-h5-font-size);
  font-weight: var(--typography-h5-font-weight);
  line-height: var(--typography-h5-line-height);
  margin-bottom: var(--typography-h5-margin-bottom);
  margin-top: 0;
}

h6, .h6 {
  font-size: var(--typography-h6-font-size);
  font-weight: var(--typography-h6-font-weight);
  line-height: var(--typography-h6-line-height);
  margin-bottom: var(--typography-h6-margin-bottom);
  margin-top: 0;
}

/* 段落样式 */
p, .paragraph {
  font-size: var(--typography-paragraph-font-size);
  line-height: var(--typography-paragraph-line-height);
  margin-bottom: var(--typography-paragraph-margin-bottom);
  margin-top: 0;
  text-indent: var(--typography-paragraph-text-indent, 0);
}

/* 引用样式 */
blockquote, .blockquote {
  border-left: var(--typography-blockquote-border-left-width) solid var(--typography-blockquote-border-left-color);
  padding: var(--typography-blockquote-padding);
  background-color: var(--typography-blockquote-background-color);
  font-style: var(--typography-blockquote-font-style);
  font-size: var(--typography-blockquote-font-size);
  margin: 0 0 16px 0;
}

/* 代码样式 */
code, .code {
  font-size: var(--typography-code-font-size);
  background-color: var(--typography-code-background-color);
  color: var(--typography-code-text-color);
  border-radius: var(--typography-code-border-radius);
  padding: var(--typography-code-padding);
  font-family: var(--typography-code-font-family);
}

pre code {
  background: transparent;
  padding: 0;
}

/* 链接样式 */
a, .link {
  color: var(--typography-link-color);
  text-decoration: var(--typography-link-text-decoration);
  transition: color 0.2s ease;
}

a:hover, .link:hover {
  color: var(--typography-link-hover-color);
  text-decoration: var(--typography-link-hover-text-decoration);
}
`;
}

/**
 * 生成完整主题CSS
 */
export function generateCompleteThemeCSS(theme: import('./types').Theme): string {
  const postCSS = generatePostStyleCSS(theme.postStyles);
  const typographyCSS = generateTypographyCSS(theme.typography);
  
  return `
/* ${theme.metadata.name} v${theme.metadata.version} */
/* Generated by VoxNest Theme System */

${postCSS}

${typographyCSS}

/* 自定义样式 */
${theme.customStyles || ''}
`;
}

// ===========================================
// 主题包创建辅助函数
// ===========================================

/**
 * 创建主题包配置模板
 */
export function createThemePackageTemplate(packageInfo: {
  id: string;
  name: string;
  author: string;
  description: string;
  version?: string;
}): import('./types').ThemePackageConfig {
  return {
    package: {
      name: packageInfo.name,
      id: packageInfo.id,
      version: packageInfo.version || '1.0.0',
      author: packageInfo.author,
      description: packageInfo.description,
      license: 'MIT'
    },
    features: [
      'custom-colors',
      'custom-typography',
      'custom-layout',
      'post-styling'
    ],
    themes: [
      {
        id: `${packageInfo.id}-light`,
        name: `${packageInfo.name} 浅色`,
        file: 'light.json',
        default: true
      },
      {
        id: `${packageInfo.id}-dark`,
        name: `${packageInfo.name} 深色`,
        file: 'dark.json'
      }
    ],
    compatibility: {
      minVersion: '1.0.0'
    }
  };
}

// ===========================================
// 版本信息
// ===========================================

export const ENHANCED_THEME_SYSTEM_VERSION = '2.0.0';

export const ENHANCED_THEME_FEATURES = {
  themePackages: true,
  postStyling: true,
  componentStyling: true,
  typographyConfig: true,
  layoutConfig: true,
  packageManager: true,
  configIntegration: true,
  cssGeneration: true
} as const;
