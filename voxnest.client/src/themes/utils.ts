/**
 * VoxNest 主题工具函数
 * 提供主题操作、颜色处理和样式生成的便捷函数
 */

import type { Theme, ColorConfig, ThemeExtension } from './types';

// ===========================================
// 颜色工具函数
// ===========================================

/**
 * 将十六进制颜色转换为RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 将RGB转换为十六进制颜色
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 将十六进制颜色转换为RGBA
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
}

/**
 * 调整颜色亮度
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) => {
    const adjusted = Math.round(value * (1 + percent / 100));
    return Math.max(0, Math.min(255, adjusted));
  };

  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

/**
 * 混合两个颜色
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;

  const blend = (a: number, b: number) => Math.round(a * (1 - ratio) + b * ratio);

  return rgbToHex(
    blend(rgb1.r, rgb2.r),
    blend(rgb1.g, rgb2.g),
    blend(rgb1.b, rgb2.b)
  );
}

/**
 * 获取颜色的对比色（黑或白）
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  // 计算相对亮度
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * 检查颜色格式是否有效
 */
export function isValidColor(color: string): boolean {
  // 检查十六进制格式
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // 检查RGB/RGBA格式
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  // 检查HSL/HSLA格式
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  return false;
}

// ===========================================
// 主题工具函数
// ===========================================

/**
 * 验证主题定义的完整性
 */
export function validateTheme(theme: Theme): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必需字段
  if (!theme.metadata?.id) {
    errors.push('主题缺少ID');
  }
  
  if (!theme.metadata?.name) {
    errors.push('主题缺少名称');
  }
  
  if (!theme.metadata?.version) {
    errors.push('主题缺少版本信息');
  }

  // 检查颜色定义
  if (!theme.colors) {
    errors.push('主题缺少颜色定义');
  } else {
    const requiredColorSections = ['primary', 'neutral', 'text', 'status'];
    for (const section of requiredColorSections) {
      if (!theme.colors[section as keyof typeof theme.colors]) {
        errors.push(`主题缺少 ${section} 颜色定义`);
      }
    }
  }

  // 检查字体定义
  if (!theme.fonts?.family) {
    errors.push('主题缺少字体定义');
  }

  // 检查间距定义
  if (!theme.spacing?.unit) {
    errors.push('主题缺少间距定义');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 克隆主题（深拷贝）
 */
export function cloneTheme(theme: Theme): Theme {
  return JSON.parse(JSON.stringify(theme));
}

/**
 * 合并主题（将扩展应用到基础主题）
 */
export function mergeThemeWithExtension(theme: Theme, extension: ThemeExtension): Theme {
  const merged = cloneTheme(theme);

  // 应用自定义变量
  if (extension.variables) {
    merged.customVariables = {
      ...merged.customVariables,
      ...extension.variables
    };
  }

  // 组件覆盖会在应用层处理，这里不涉及

  return merged;
}

/**
 * 比较两个主题是否相同
 */
export function compareThemes(theme1: Theme, theme2: Theme): boolean {
  return theme1.metadata.id === theme2.metadata.id &&
         theme1.metadata.version === theme2.metadata.version;
}

/**
 * 生成主题预览色板
 */
export function generateThemePalette(theme: Theme): Record<string, string> {
  const palette: Record<string, string> = {};

  // 主色调
  Object.entries(theme.colors.primary).forEach(([key, color]) => {
    palette[`primary-${key}`] = formatColorValue(color);
  });

  // 状态颜色
  Object.entries(theme.colors.status).forEach(([key, color]) => {
    palette[`status-${key}`] = formatColorValue(color);
  });

  // 中性色
  Object.entries(theme.colors.neutral).forEach(([key, color]) => {
    palette[`neutral-${key}`] = formatColorValue(color);
  });

  return palette;
}

// ===========================================
// CSS 工具函数
// ===========================================

/**
 * 生成CSS类名
 */
export function generateThemeClassName(themeId: string): string {
  return `theme-${themeId}`;
}

/**
 * 生成CSS变量名
 */
export function generateCSSVariableName(category: string, name: string): string {
  return `--${category}-${name}`;
}

/**
 * 格式化颜色值为CSS可用格式
 */
export function formatColorValue(color: ColorConfig): string {
  if (color.opacity !== undefined && color.opacity < 1) {
    if (color.value.startsWith('#')) {
      return hexToRgba(color.value, color.opacity);
    }
  }
  return color.value;
}

/**
 * 生成CSS过渡规则
 */
export function generateTransitionCSS(properties: string[], duration: string, easing: string): string {
  return properties.map(prop => `${prop} ${duration} ${easing}`).join(', ');
}

/**
 * 生成CSS媒体查询
 */
export function generateMediaQuery(breakpoint: string): string {
  const breakpoints: Record<string, string> = {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px'
  };
  
  return `@media (min-width: ${breakpoints[breakpoint] || breakpoint})`;
}

// ===========================================
// 扩展工具函数
// ===========================================

/**
 * 验证主题扩展
 */
export function validateThemeExtension(extension: ThemeExtension): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!extension.id) {
    errors.push('扩展缺少ID');
  }

  if (!extension.name) {
    errors.push('扩展缺少名称');
  }

  // 验证CSS变量
  if (extension.variables) {
    for (const [key, value] of Object.entries(extension.variables)) {
      if (!key.startsWith('--')) {
        errors.push(`CSS变量 "${key}" 应该以 "--" 开头`);
      }
      if (typeof value !== 'string') {
        errors.push(`CSS变量 "${key}" 的值必须是字符串`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 创建简单的颜色扩展
 */
export function createColorExtension(
  id: string,
  name: string,
  colorOverrides: Record<string, string>,
  targetThemeId?: string
): ThemeExtension {
  const variables: Record<string, string> = {};
  
  for (const [varName, color] of Object.entries(colorOverrides)) {
    // 如果变量名不以--开头，自动添加
    const cssVarName = varName.startsWith('--') ? varName : `--color-${varName}`;
    variables[cssVarName] = color;
  }

  return {
    id,
    name,
    targetThemeId,
    variables
  };
}

/**
 * 创建组件样式扩展
 */
export function createComponentExtension(
  id: string,
  name: string,
  customCSS: string,
  targetThemeId?: string
): ThemeExtension {
  return {
    id,
    name,
    targetThemeId,
    customCSS
  };
}

// ===========================================
// 调试工具函数
// ===========================================

/**
 * 获取主题信息摘要
 */
export function getThemeSummary(theme: Theme): {
  id: string;
  name: string;
  version: string;
  colorsCount: number;
  variablesCount: number;
  builtin: boolean;
} {
  const colorsCount = Object.keys(theme.colors.primary).length +
                      Object.keys(theme.colors.neutral).length +
                      Object.keys(theme.colors.text).length +
                      Object.keys(theme.colors.status).length +
                      Object.keys(theme.colors.custom || {}).length;

  return {
    id: theme.metadata.id,
    name: theme.metadata.name,
    version: theme.metadata.version,
    colorsCount,
    variablesCount: Object.keys(theme.customVariables || {}).length,
    builtin: theme.metadata.builtin
  };
}

/**
 * 导出主题为JSON
 */
export function exportThemeAsJSON(theme: Theme): string {
  return JSON.stringify(theme, null, 2);
}

/**
 * 从JSON导入主题
 */
export function importThemeFromJSON(json: string): Theme {
  try {
    const theme = JSON.parse(json);
    const validation = validateTheme(theme);
    
    if (!validation.valid) {
      throw new Error(`主题验证失败: ${validation.errors.join(', ')}`);
    }
    
    return theme;
  } catch (error) {
    throw new Error(`解析主题JSON失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成主题CSS文件内容
 */
export function generateThemeCSS(theme: Theme): string {
  const variables: string[] = [];
  
  // 生成颜色变量
  Object.entries(theme.colors.primary).forEach(([key, color]) => {
    variables.push(`  --color-primary-${key}: ${formatColorValue(color)};`);
  });
  
  Object.entries(theme.colors.neutral).forEach(([key, color]) => {
    variables.push(`  --color-neutral-${key}: ${formatColorValue(color)};`);
  });
  
  Object.entries(theme.colors.text).forEach(([key, color]) => {
    variables.push(`  --color-text-${key}: ${formatColorValue(color)};`);
  });
  
  Object.entries(theme.colors.status).forEach(([key, color]) => {
    variables.push(`  --color-status-${key}: ${formatColorValue(color)};`);
  });

  // 自定义变量
  if (theme.customVariables) {
    Object.entries(theme.customVariables).forEach(([key, value]) => {
      variables.push(`  ${key}: ${value};`);
    });
  }

  return `/* ${theme.metadata.name} v${theme.metadata.version} */\n:root {\n${variables.join('\n')}\n}`;
}
