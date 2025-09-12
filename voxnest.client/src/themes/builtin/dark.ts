/**
 * VoxNest 深色主题定义
 * 护眼的深色主题，适合夜间使用
 */

import type { Theme } from '../types';

export const darkTheme: Theme = {
  metadata: {
    id: 'dark',
    name: '深色主题',
    description: '护眼的深色主题，适合夜间和低光环境使用',
    version: '1.0.0',
    author: 'VoxNest Team',
    tags: ['dark', 'night', 'eye-friendly'],
    builtin: true
  },

  colors: {
    // 主色调 - 使用更柔和的蓝色系
    primary: {
      primary: { value: '#1668dc', description: '主色' },
      primaryHover: { value: '#4096ff', description: '主色悬停' },
      primaryActive: { value: '#0958d9', description: '主色按下' },
      primaryDisabled: { value: '#1668dc', opacity: 0.5, description: '主色禁用' }
    },

    // 中性色 - 深色背景
    neutral: {
      background: { value: '#141414', description: '页面背景' },
      surface: { value: '#1f1f1f', description: '表面色' },
      cardBackground: { value: '#262626', description: '卡片背景' },
      border: { value: '#434343', description: '边框色' },
      divider: { value: '#303030', description: '分割线' }
    },

    // 文本颜色
    text: {
      primary: { value: '#ffffff', description: '主要文本' },
      secondary: { value: '#bfbfbf', description: '次要文本' },
      disabled: { value: '#595959', description: '禁用文本' },
      inverse: { value: '#000000', description: '反色文本' }
    },

    // 状态颜色 - 深色模式下稍微调暗
    status: {
      success: { value: '#389e0d', description: '成功色' },
      warning: { value: '#d48806', description: '警告色' },
      error: { value: '#cf1322', description: '错误色' },
      info: { value: '#1668dc', description: '信息色' }
    },

    // 自定义颜色
    custom: {
      accent: { value: '#531dab', description: '强调色' },
      highlight: { value: '#2c1810', description: '高亮背景' },
      overlay: { value: '#000000', opacity: 0.75, description: '遮罩层' }
    }
  },

  fonts: {
    family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px'
    },
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    }
  },

  spacing: {
    unit: 8,
    scale: {
      xs: 0.5,    // 4px
      sm: 1,      // 8px
      base: 2,    // 16px
      lg: 3,      // 24px
      xl: 4,      // 32px
      '2xl': 6,   // 48px
      '3xl': 8,   // 64px
      '4xl': 12,  // 96px
      '5xl': 16   // 128px
    }
  },

  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    full: '50%'
  },

  shadows: {
    small: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    elevated: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.25)'
  },

  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '1000ms'
    },
    easing: {
      ease: 'ease',
      linear: 'linear',
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    enabled: true
  },

  layout: {
    maxWidth: '1200px',
    contentPadding: '24px',
    sidebarWidth: '240px',
    sidebarCollapsedWidth: '80px',
    headerHeight: '64px',
    footerHeight: '48px'
  },

  postStyles: {
    card: {
      background: { value: '#262626' },
      border: { value: '#434343' },
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: { value: '#ffffff' },
      lineHeight: '1.4',
      marginBottom: '12px'
    },
    content: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: { value: '#bfbfbf' },
      marginBottom: '16px',
      maxHeight: '200px'
    },
    meta: {
      fontSize: '14px',
      color: { value: '#8c8c8c' },
      spacing: '8px'
    },
    tags: {
      backgroundColor: { value: '#2c1810' },
      textColor: { value: '#1668dc' },
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '12px',
      spacing: '8px'
    },
    actions: {
      buttonSize: '32px',
      buttonSpacing: '8px',
      iconSize: '16px',
      hoverEffect: true
    }
  },

  componentStyles: {
    button: {
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      minHeight: '32px',
      transition: 'all 0.2s ease'
    },
    input: {
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '14px',
      height: '40px',
      borderWidth: '1px',
      transition: 'border-color 0.2s ease'
    },
    card: {
      borderRadius: '8px',
      padding: '24px',
      backgroundColor: { value: '#262626' },
      borderColor: { value: '#434343' },
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      hoverEffect: true
    },
    modal: {
      borderRadius: '8px',
      maxWidth: '600px',
      padding: '32px',
      backgroundColor: { value: '#262626' },
      overlayColor: { value: '#000000', opacity: 0.75 }
    },
    navigation: {
      height: '56px',
      backgroundColor: { value: '#1f1f1f' },
      borderColor: { value: '#434343' },
      itemPadding: '8px 16px',
      itemBorderRadius: '6px'
    }
  },

  typography: {
    headings: {
      h1: { fontSize: '32px', fontWeight: '700', lineHeight: '1.25', marginBottom: '24px' },
      h2: { fontSize: '24px', fontWeight: '600', lineHeight: '1.3', marginBottom: '20px' },
      h3: { fontSize: '20px', fontWeight: '600', lineHeight: '1.35', marginBottom: '16px' },
      h4: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4', marginBottom: '12px' },
      h5: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5', marginBottom: '8px' },
      h6: { fontSize: '14px', fontWeight: '600', lineHeight: '1.5', marginBottom: '8px' }
    },
    paragraph: {
      fontSize: '16px',
      lineHeight: '1.6',
      marginBottom: '16px'
    },
    blockquote: {
      borderLeftWidth: '4px',
      borderLeftColor: { value: '#2c1810' },
      padding: '16px 20px',
      backgroundColor: { value: '#1f1f1f' },
      fontStyle: 'italic',
      fontSize: '16px'
    },
    code: {
      fontSize: '14px',
      backgroundColor: { value: '#1f1f1f' },
      textColor: { value: '#ff7875' },
      borderRadius: '4px',
      padding: '2px 6px',
      fontFamily: "'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace"
    },
    link: {
      color: { value: '#1668dc' },
      hoverColor: { value: '#4096ff' },
      textDecoration: 'none',
      hoverTextDecoration: 'underline'
    }
  },

  customVariables: {
    '--page-header-height': '64px',
    '--sidebar-width': '240px',
    '--sidebar-collapsed-width': '80px',
    '--content-max-width': '1200px',
    '--navbar-height': '56px'
  }
};
