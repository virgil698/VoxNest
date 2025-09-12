/**
 * VoxNest 主题扩展示例
 * 展示如何创建和使用主题扩展
 */

import type { ThemeExtension } from '../types';
import { createColorExtension } from '../utils';

// ===========================================
// 颜色主题扩展示例
// ===========================================

/**
 * 高对比度扩展 - 提高视觉可访问性
 */
export const highContrastExtension: ThemeExtension = createColorExtension(
  'high-contrast',
  '高对比度模式',
  {
    '--color-primary-primary': '#000000',
    '--color-primary-primaryHover': '#333333',
    '--color-text-primary': '#000000',
    '--color-text-secondary': '#444444',
    '--color-neutral-border': '#000000',
    '--color-status-error': '#cc0000',
    '--color-status-success': '#006600'
  }
);

/**
 * 暖色调扩展 - 温暖的颜色调配
 */
export const warmToneExtension: ThemeExtension = createColorExtension(
  'warm-tone',
  '暖色调主题',
  {
    '--color-primary-primary': '#e65100',
    '--color-primary-primaryHover': '#ff7043',
    '--color-primary-primaryActive': '#bf360c',
    '--color-status-info': '#e65100',
    '--color-custom-accent': '#ff5722'
  }
);

/**
 * 冷色调扩展 - 清冷的颜色调配
 */
export const coolToneExtension: ThemeExtension = createColorExtension(
  'cool-tone',
  '冷色调主题',
  {
    '--color-primary-primary': '#0277bd',
    '--color-primary-primaryHover': '#0288d1',
    '--color-primary-primaryActive': '#01579b',
    '--color-status-info': '#0277bd',
    '--color-custom-accent': '#00bcd4'
  }
);

// ===========================================
// 组件样式扩展示例
// ===========================================

/**
 * 圆角扩展 - 增加圆角效果
 */
export const roundedExtension: ThemeExtension = {
  id: 'rounded-corners',
  name: '圆角风格',
  variables: {
    '--border-radius-small': '8px',
    '--border-radius-medium': '16px',
    '--border-radius-large': '24px'
  },
  customCSS: `
    .ant-btn {
      border-radius: var(--border-radius-medium) !important;
    }
    
    .ant-card {
      border-radius: var(--border-radius-large) !important;
    }
    
    .ant-input {
      border-radius: var(--border-radius-small) !important;
    }
  `
};

/**
 * 阴影增强扩展 - 增强阴影效果
 */
export const enhancedShadowExtension: ThemeExtension = {
  id: 'enhanced-shadows',
  name: '增强阴影',
  variables: {
    '--shadow-small': '0 2px 8px rgba(0, 0, 0, 0.15)',
    '--shadow-medium': '0 4px 16px rgba(0, 0, 0, 0.15)',
    '--shadow-large': '0 8px 32px rgba(0, 0, 0, 0.15)',
    '--shadow-elevated': '0 16px 64px rgba(0, 0, 0, 0.15)'
  },
  customCSS: `
    .ant-card {
      box-shadow: var(--shadow-medium) !important;
      transition: box-shadow 0.3s ease;
    }
    
    .ant-card:hover {
      box-shadow: var(--shadow-large) !important;
    }
    
    .ant-modal-content {
      box-shadow: var(--shadow-elevated) !important;
    }
  `
};

/**
 * 紧凑布局扩展 - 减少间距
 */
export const compactLayoutExtension: ThemeExtension = {
  id: 'compact-layout',
  name: '紧凑布局',
  variables: {
    '--spacing-sm': '4px',
    '--spacing-base': '8px',
    '--spacing-lg': '12px',
    '--spacing-xl': '16px',
    '--navbar-height': '48px',
    '--page-header-height': '56px'
  },
  customCSS: `
    .ant-btn {
      height: 28px !important;
      padding: 0 12px !important;
      font-size: 13px !important;
    }
    
    .ant-input {
      height: 28px !important;
      padding: 4px 8px !important;
    }
    
    .ant-card-body {
      padding: 12px !important;
    }
  `
};

// ===========================================
// 专用主题扩展示例
// ===========================================

/**
 * 深色模式扩展 - 针对浅色主题的深色调整
 */
export const darkModeExtension: ThemeExtension = createColorExtension(
  'dark-mode-override',
  '深色模式覆盖',
  {
    '--color-neutral-background': '#1a1a1a',
    '--color-neutral-surface': '#2d2d2d',
    '--color-neutral-cardBackground': '#262626',
    '--color-text-primary': '#ffffff',
    '--color-text-secondary': '#bfbfbf',
    '--color-neutral-border': '#434343'
  },
  'light' // 仅应用到浅色主题
);

/**
 * 节日主题扩展 - 节日氛围
 */
export const festivalExtension: ThemeExtension = {
  id: 'festival-theme',
  name: '节日主题',
  variables: {
    '--color-primary-primary': '#d32f2f',
    '--color-custom-accent': '#ffd700',
    '--color-custom-celebration': '#ff6b6b'
  },
  customCSS: `
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, 
        rgba(255, 215, 0, 0.1) 0%, 
        rgba(211, 47, 47, 0.1) 50%, 
        rgba(255, 107, 107, 0.1) 100%);
      pointer-events: none;
      z-index: -1;
    }
    
    .ant-btn-primary {
      background: linear-gradient(45deg, 
        var(--color-primary-primary), 
        var(--color-custom-accent)) !important;
      border: none !important;
    }
  `
};

// ===========================================
// 可访问性扩展示例
// ===========================================

/**
 * 视觉辅助扩展 - 改善视觉可访问性
 */
export const accessibilityExtension: ThemeExtension = {
  id: 'accessibility-enhanced',
  name: '可访问性增强',
  variables: {
    '--font-size-base': '18px',
    '--line-height-normal': '1.6',
    '--animation-duration-normal': '0ms' // 禁用动画
  },
  customCSS: `
    /* 增强焦点指示器 */
    *:focus {
      outline: 3px solid var(--color-primary-primary) !important;
      outline-offset: 2px !important;
    }
    
    /* 提高按钮最小点击区域 */
    .ant-btn {
      min-height: 44px !important;
      min-width: 44px !important;
    }
    
    /* 增强文本对比度 */
    .ant-typography {
      font-weight: 500 !important;
    }
    
    /* 减少动画 */
    * {
      transition-duration: 0.1s !important;
      animation-duration: 0.1s !important;
    }
  `
};

// ===========================================
// 打印友好扩展示例
// ===========================================

/**
 * 打印优化扩展
 */
export const printFriendlyExtension: ThemeExtension = {
  id: 'print-friendly',
  name: '打印优化',
  customCSS: `
    @media print {
      /* 使用黑白配色 */
      * {
        color: #000 !important;
        background: #fff !important;
        box-shadow: none !important;
      }
      
      /* 隐藏非必要元素 */
      .ant-layout-sider,
      .ant-affix,
      .ant-back-top,
      .ant-modal-mask,
      .ant-drawer-mask {
        display: none !important;
      }
      
      /* 优化页面布局 */
      .ant-layout-content {
        margin: 0 !important;
        padding: 20px !important;
      }
      
      /* 确保文本可读性 */
      .ant-typography {
        color: #000 !important;
        font-size: 12pt !important;
        line-height: 1.5 !important;
      }
    }
  `
};

// ===========================================
// 导出所有示例扩展
// ===========================================

export const exampleExtensions: ThemeExtension[] = [
  highContrastExtension,
  warmToneExtension,
  coolToneExtension,
  roundedExtension,
  enhancedShadowExtension,
  compactLayoutExtension,
  darkModeExtension,
  festivalExtension,
  accessibilityExtension,
  printFriendlyExtension
];

/**
 * 根据分类获取扩展
 */
export const extensionCategories = {
  color: [highContrastExtension, warmToneExtension, coolToneExtension],
  layout: [roundedExtension, enhancedShadowExtension, compactLayoutExtension],
  accessibility: [accessibilityExtension, highContrastExtension],
  special: [festivalExtension, printFriendlyExtension, darkModeExtension]
};

/**
 * 获取推荐扩展组合
 */
export function getRecommendedExtensions(userPreferences: {
  accessibility?: boolean;
  compact?: boolean;
  colorful?: boolean;
}): ThemeExtension[] {
  const recommendations: ThemeExtension[] = [];

  if (userPreferences.accessibility) {
    recommendations.push(accessibilityExtension, highContrastExtension);
  }

  if (userPreferences.compact) {
    recommendations.push(compactLayoutExtension);
  }

  if (userPreferences.colorful) {
    recommendations.push(warmToneExtension, enhancedShadowExtension);
  }

  return recommendations;
}
