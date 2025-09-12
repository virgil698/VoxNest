/**
 * VoxNest 内置主题导出
 * 统一导出所有内置主题
 */

import { lightTheme } from './light';
import { darkTheme } from './dark';
import type { Theme } from '../types';

// 导出所有内置主题
export const builtinThemes: Theme[] = [
  lightTheme,
  darkTheme
];

// 单独导出主题
export { lightTheme, darkTheme };

// 按ID索引的主题映射
export const builtinThemeMap = new Map<string, Theme>([
  [lightTheme.metadata.id, lightTheme],
  [darkTheme.metadata.id, darkTheme]
]);

/**
 * 根据ID获取内置主题
 */
export function getBuiltinTheme(id: string): Theme | undefined {
  return builtinThemeMap.get(id);
}

/**
 * 检查是否为内置主题
 */
export function isBuiltinTheme(id: string): boolean {
  return builtinThemeMap.has(id);
}

/**
 * 获取默认主题（浅色主题）
 */
export function getDefaultTheme(): Theme {
  return lightTheme;
}
