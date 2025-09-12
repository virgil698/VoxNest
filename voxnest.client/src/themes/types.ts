/**
 * VoxNest 主题系统类型定义
 * 定义主题结构、配色方案和扩展接口
 */

// ===========================================
// 基础颜色类型
// ===========================================

/** 颜色值类型 */
export type ColorValue = string;

/** 颜色模式 */
export type ColorMode = 'hex' | 'rgb' | 'hsl' | 'css-var';

/** 颜色配置 */
export interface ColorConfig {
  value: ColorValue;
  mode?: ColorMode;
  opacity?: number;
  description?: string;
}

// ===========================================
// 主题颜色方案
// ===========================================

/** 主色调配置 */
export interface PrimaryColors extends Record<string, ColorConfig> {
  /** 主色 */
  primary: ColorConfig;
  /** 主色悬停态 */
  primaryHover: ColorConfig;
  /** 主色按下态 */
  primaryActive: ColorConfig;
  /** 主色禁用态 */
  primaryDisabled: ColorConfig;
}

/** 中性色配置 */
export interface NeutralColors extends Record<string, ColorConfig> {
  /** 背景色 */
  background: ColorConfig;
  /** 表面色 */
  surface: ColorConfig;
  /** 卡片背景 */
  cardBackground: ColorConfig;
  /** 边框色 */
  border: ColorConfig;
  /** 分割线 */
  divider: ColorConfig;
}

/** 文本颜色配置 */
export interface TextColors extends Record<string, ColorConfig> {
  /** 主要文本 */
  primary: ColorConfig;
  /** 次要文本 */
  secondary: ColorConfig;
  /** 禁用文本 */
  disabled: ColorConfig;
  /** 反色文本 */
  inverse: ColorConfig;
}

/** 状态颜色配置 */
export interface StatusColors extends Record<string, ColorConfig> {
  /** 成功色 */
  success: ColorConfig;
  /** 警告色 */
  warning: ColorConfig;
  /** 错误色 */
  error: ColorConfig;
  /** 信息色 */
  info: ColorConfig;
}

/** 完整颜色方案 */
export interface ColorScheme {
  primary: PrimaryColors;
  neutral: NeutralColors;
  text: TextColors;
  status: StatusColors;
  /** 自定义颜色扩展 */
  custom?: Record<string, ColorConfig>;
}

// ===========================================
// 主题配置
// ===========================================

/** 字体配置 */
export interface FontConfig {
  /** 字体族 */
  family: string;
  /** 字体大小 */
  size: Record<string, string>;
  /** 字体粗细 */
  weight: Record<string, number | string>;
  /** 行高 */
  lineHeight: Record<string, string>;
}

/** 间距配置 */
export interface SpacingConfig {
  /** 基础间距单位 */
  unit: number;
  /** 间距比例 */
  scale: Record<string, number>;
}

/** 圆角配置 */
export interface BorderRadiusConfig {
  /** 小圆角 */
  small: string;
  /** 中等圆角 */
  medium: string;
  /** 大圆角 */
  large: string;
  /** 圆形 */
  full: string;
}

/** 阴影配置 */
export interface ShadowConfig {
  /** 小阴影 */
  small: string;
  /** 中等阴影 */
  medium: string;
  /** 大阴影 */
  large: string;
  /** 抬升阴影 */
  elevated: string;
}

/** 动画配置 */
export interface AnimationConfig {
  /** 动画持续时间 */
  duration: Record<string, string>;
  /** 缓动函数 */
  easing: Record<string, string>;
  /** 是否启用动画 */
  enabled: boolean;
}

// ===========================================
// 主题定义
// ===========================================

/** 主题元数据 */
export interface ThemeMetadata {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 主题版本 */
  version: string;
  /** 主题作者 */
  author?: string;
  /** 主题标签 */
  tags?: string[];
  /** 预览图 */
  preview?: string;
  /** 是否为内置主题 */
  builtin: boolean;
}

/** 页面布局配置 */
export interface LayoutConfig {
  /** 页面最大宽度 */
  maxWidth: string;
  /** 内容区域边距 */
  contentPadding: string;
  /** 侧边栏宽度 */
  sidebarWidth: string;
  /** 侧边栏折叠宽度 */
  sidebarCollapsedWidth: string;
  /** 头部高度 */
  headerHeight: string;
  /** 底部高度 */
  footerHeight: string;
}

/** 帖子样式配置 */
export interface PostStyleConfig {
  /** 帖子卡片配置 */
  card: {
    background: ColorConfig;
    border: ColorConfig;
    borderRadius: string;
    padding: string;
    marginBottom: string;
    boxShadow: string;
  };
  /** 帖子标题配置 */
  title: {
    fontSize: string;
    fontWeight: string;
    color: ColorConfig;
    lineHeight: string;
    marginBottom: string;
  };
  /** 帖子内容配置 */
  content: {
    fontSize: string;
    lineHeight: string;
    color: ColorConfig;
    marginBottom: string;
    maxHeight?: string; // 预览模式最大高度
  };
  /** 帖子元信息配置 */
  meta: {
    fontSize: string;
    color: ColorConfig;
    spacing: string;
  };
  /** 帖子标签配置 */
  tags: {
    backgroundColor: ColorConfig;
    textColor: ColorConfig;
    borderRadius: string;
    padding: string;
    fontSize: string;
    spacing: string;
  };
  /** 帖子操作按钮配置 */
  actions: {
    buttonSize: string;
    buttonSpacing: string;
    iconSize: string;
    hoverEffect: boolean;
  };
}

/** 组件样式配置 */
export interface ComponentStyleConfig {
  /** 按钮样式 */
  button: {
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
    minHeight: string;
    transition: string;
  };
  /** 输入框样式 */
  input: {
    borderRadius: string;
    padding: string;
    fontSize: string;
    height: string;
    borderWidth: string;
    transition: string;
  };
  /** 卡片样式 */
  card: {
    borderRadius: string;
    padding: string;
    backgroundColor: ColorConfig;
    borderColor: ColorConfig;
    boxShadow: string;
    hoverEffect: boolean;
  };
  /** 模态框样式 */
  modal: {
    borderRadius: string;
    maxWidth: string;
    padding: string;
    backgroundColor: ColorConfig;
    overlayColor: ColorConfig;
  };
  /** 导航样式 */
  navigation: {
    height: string;
    backgroundColor: ColorConfig;
    borderColor: ColorConfig;
    itemPadding: string;
    itemBorderRadius: string;
  };
}

/** 内容排版配置 */
export interface TypographyConfig {
  /** 标题层级配置 */
  headings: {
    h1: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
    h2: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
    h3: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
    h4: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
    h5: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
    h6: { fontSize: string; fontWeight: string; lineHeight: string; marginBottom: string; };
  };
  /** 段落配置 */
  paragraph: {
    fontSize: string;
    lineHeight: string;
    marginBottom: string;
    textIndent?: string;
  };
  /** 引用配置 */
  blockquote: {
    borderLeftWidth: string;
    borderLeftColor: ColorConfig;
    padding: string;
    backgroundColor: ColorConfig;
    fontStyle: string;
    fontSize: string;
  };
  /** 代码配置 */
  code: {
    fontSize: string;
    backgroundColor: ColorConfig;
    textColor: ColorConfig;
    borderRadius: string;
    padding: string;
    fontFamily: string;
  };
  /** 链接配置 */
  link: {
    color: ColorConfig;
    hoverColor: ColorConfig;
    textDecoration: string;
    hoverTextDecoration: string;
  };
}

/** 主题包信息 */
export interface ThemePackageInfo {
  /** 主题包名称 */
  name: string;
  /** 主题包ID */
  id: string;
  /** 版本号 */
  version: string;
  /** 作者信息 */
  author: string;
  /** 描述 */
  description: string;
  /** 主题包路径 */
  packagePath: string;
  /** 预览图路径 */
  previewImage?: string;
  /** 支持的功能特性 */
  features: string[];
  /** 包含的主题数量 */
  themesCount: number;
  /** 最后更新时间 */
  lastModified: Date;
}

/** 完整主题定义 */
export interface Theme {
  /** 主题元数据 */
  metadata: ThemeMetadata;
  /** 颜色方案 */
  colors: ColorScheme;
  /** 字体配置 */
  fonts: FontConfig;
  /** 间距配置 */
  spacing: SpacingConfig;
  /** 圆角配置 */
  borderRadius: BorderRadiusConfig;
  /** 阴影配置 */
  shadows: ShadowConfig;
  /** 动画配置 */
  animations: AnimationConfig;
  /** 页面布局配置 */
  layout: LayoutConfig;
  /** 帖子样式配置 */
  postStyles: PostStyleConfig;
  /** 组件样式配置 */
  componentStyles: ComponentStyleConfig;
  /** 内容排版配置 */
  typography: TypographyConfig;
  /** 自定义CSS变量 */
  customVariables?: Record<string, string>;
  /** 自定义CSS样式 */
  customStyles?: string;
}

// ===========================================
// 主题扩展
// ===========================================

/** 主题扩展接口 */
export interface ThemeExtension {
  /** 扩展ID */
  id: string;
  /** 扩展名称 */
  name: string;
  /** 目标主题ID（如果为空则应用到所有主题） */
  targetThemeId?: string;
  /** CSS变量覆盖 */
  variables?: Record<string, string>;
  /** 自定义CSS */
  customCSS?: string;
  /** 组件样式覆盖 */
  componentOverrides?: Record<string, any>;
}

/** 主题加载选项 */
export interface ThemeLoadOptions {
  /** 是否立即应用 */
  immediate?: boolean;
  /** 是否保存到本地存储 */
  persist?: boolean;
  /** 动画过渡时间 */
  transition?: number;
  /** 加载前回调 */
  beforeLoad?: (theme: Theme) => void;
  /** 加载后回调 */
  afterLoad?: (theme: Theme) => void;
}

/** 主题切换选项 */
export interface ThemeSwitchOptions extends ThemeLoadOptions {
  /** 是否使用渐变过渡 */
  smooth?: boolean;
  /** 过渡完成回调 */
  onTransitionComplete?: () => void;
}

// ===========================================
// 主题加载器事件
// ===========================================

/** 主题事件类型 */
export type ThemeEventType = 
  | 'theme-loading'
  | 'theme-loaded'
  | 'theme-error'
  | 'theme-switching'
  | 'theme-switched'
  | 'extension-loaded'
  | 'extension-error';

/** 主题事件数据 */
export interface ThemeEventData {
  type: ThemeEventType;
  theme?: Theme;
  extension?: ThemeExtension;
  error?: Error;
  timestamp: number;
}

/** 主题事件监听器 */
export type ThemeEventListener = (data: ThemeEventData) => void;

// ===========================================
// 主题管理器接口
// ===========================================

/** 主题包管理器接口 */
export interface IThemePackageManager {
  /** 获取所有主题包 */
  getAllPackages(): Promise<ThemePackageInfo[]>;
  
  /** 根据ID获取主题包 */
  getPackage(packageId: string): Promise<ThemePackageInfo | null>;
  
  /** 安装主题包 */
  installPackage(packagePath: string): Promise<boolean>;
  
  /** 卸载主题包 */
  uninstallPackage(packageId: string): Promise<boolean>;
  
  /** 刷新主题包列表 */
  refreshPackages(): Promise<void>;
  
  /** 导入主题包 */
  importPackage(packageData: ArrayBuffer | string): Promise<string>;
  
  /** 导出主题包 */
  exportPackage(packageId: string): Promise<ArrayBuffer>;
}

/** 主题包配置文件 */
export interface ThemePackageConfig {
  /** 包信息 */
  package: {
    name: string;
    id: string;
    version: string;
    author: string;
    description: string;
    homepage?: string;
    repository?: string;
    license?: string;
  };
  
  /** 功能特性 */
  features: string[];
  
  /** 主题列表 */
  themes: Array<{
    id: string;
    name: string;
    file: string;
    preview?: string;
    default?: boolean;
  }>;
  
  /** 资源文件 */
  assets?: Array<{
    type: 'css' | 'font' | 'image';
    file: string;
    target?: string;
  }>;
  
  /** 依赖包 */
  dependencies?: Record<string, string>;
  
  /** 兼容性 */
  compatibility: {
    minVersion: string;
    maxVersion?: string;
  };
}

/** 主题管理器接口 */
export interface IThemeManager {
  /** 当前主题 */
  readonly currentTheme: Theme | null;
  
  /** 可用主题列表 */
  readonly availableThemes: Theme[];
  
  /** 已加载扩展列表 */
  readonly loadedExtensions: ThemeExtension[];
  
  /** 主题包管理器 */
  readonly packageManager: IThemePackageManager;
  
  /** 加载主题 */
  loadTheme(themeId: string, options?: ThemeLoadOptions): Promise<void>;
  
  /** 切换主题 */
  switchTheme(themeId: string, options?: ThemeSwitchOptions): Promise<void>;
  
  /** 注册主题 */
  registerTheme(theme: Theme): void;
  
  /** 注销主题 */
  unregisterTheme(themeId: string): void;
  
  /** 加载扩展 */
  loadExtension(extension: ThemeExtension): Promise<void>;
  
  /** 卸载扩展 */
  unloadExtension(extensionId: string): void;
  
  /** 添加事件监听器 */
  addEventListener(type: ThemeEventType, listener: ThemeEventListener): void;
  
  /** 移除事件监听器 */
  removeEventListener(type: ThemeEventType, listener: ThemeEventListener): void;
  
  /** 生成CSS变量 */
  generateCSSVariables(theme: Theme): Record<string, string>;
  
  /** 应用CSS变量 */
  applyCSSVariables(variables: Record<string, string>): void;
}
