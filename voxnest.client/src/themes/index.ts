/**
 * VoxNest 主题系统统一导出
 * 提供主题系统的所有公共 API
 */

// 核心类和管理器
export { ThemeManager, themeManager } from './ThemeManager';

// 内置主题
export { 
  builtinThemes, 
  lightTheme, 
  darkTheme, 
  builtinThemeMap,
  getBuiltinTheme,
  isBuiltinTheme,
  getDefaultTheme
} from './builtin';

// 类型定义
export type {
  Theme,
  ThemeMetadata,
  ColorScheme,
  ColorConfig,
  PrimaryColors,
  NeutralColors,
  TextColors,
  StatusColors,
  FontConfig,
  SpacingConfig,
  BorderRadiusConfig,
  ShadowConfig,
  AnimationConfig,
  ThemeExtension,
  ThemeLoadOptions,
  ThemeSwitchOptions,
  ThemeEventType,
  ThemeEventData,
  ThemeEventListener,
  IThemeManager
} from './types';

// 集成函数
export {
  themeConfigIntegration,
  initializeThemeSystem,
  switchToTheme,
  switchToNextTheme,
  enableAutoTheme,
  disableAutoTheme,
  getCurrentThemeInfo,
  getAvailableThemes
} from './integration';

// 工具函数
export {
  // 颜色工具
  hexToRgb,
  rgbToHex,
  hexToRgba,
  adjustBrightness,
  blendColors,
  getContrastColor,
  isValidColor,
  
  // 主题工具
  validateTheme,
  cloneTheme,
  mergeThemeWithExtension,
  compareThemes,
  generateThemePalette,
  
  // CSS工具
  generateThemeClassName,
  generateCSSVariableName,
  formatColorValue,
  generateTransitionCSS,
  generateMediaQuery,
  
  // 扩展工具
  validateThemeExtension,
  createColorExtension,
  createComponentExtension,
  
  // 调试工具
  getThemeSummary,
  exportThemeAsJSON,
  importThemeFromJSON,
  generateThemeCSS
} from './utils';

// React Hooks
export {
  useTheme,
  useThemeList,
  useThemeSwitcher,
  useThemeColors,
  useResponsiveTheme,
  useSystemTheme,
  useThemeDebug,
  useThemePerformance
} from './hooks';

// ===========================================
// 便捷 API
// ===========================================

/**
 * 快速初始化主题系统
 * 包含内置主题注册和配置集成
 */
export async function initThemes(): Promise<void> {
  try {
    const { initializeThemeSystem } = await import('./integration');
    await initializeThemeSystem();
    console.log('🎨 主题系统已准备就绪');
  } catch (error) {
    console.error('❌ 主题系统初始化失败:', error);
    throw error;
  }
}

/**
 * 获取主题系统状态
 */
export function getThemeSystemStatus(): {
  initialized: boolean;
  currentTheme: string | null;
  availableThemes: number;
  hasExtensions: boolean;
} {
  const { themeManager } = require('./ThemeManager');
  return {
    initialized: themeManager.availableThemes.length > 0,
    currentTheme: themeManager.currentTheme?.metadata.id || null,
    availableThemes: themeManager.availableThemes.length,
    hasExtensions: themeManager.loadedExtensions.length > 0
  };
}

/**
 * 主题系统版本信息
 */
export const THEME_SYSTEM_VERSION = '1.0.0';

/**
 * 支持的主题特性
 */
export const THEME_FEATURES = {
  autoTheme: true,
  customThemes: true,
  themeExtensions: true,
  colorBlending: true,
  responsiveThemes: true,
  themeTransitions: true,
  themeValidation: true,
  themeExport: true
} as const;
