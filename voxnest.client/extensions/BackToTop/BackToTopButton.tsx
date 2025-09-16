import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UpOutlined } from '@ant-design/icons';

// 配置接口
export interface BackToTopConfig {
  showThreshold: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enableAnimation: boolean;
  animationDuration: number;
  smoothScrollDuration: number;
  buttonSize: 'small' | 'medium' | 'large';
  buttonStyle: 'circle' | 'rounded' | 'square';
  showIcon: boolean;
  showText: boolean;
  buttonText: string;
  hideOnTop: boolean;
  enableHover: boolean;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  opacity: number;
  hoverOpacity: number;
  zIndex: number;
}

// 组件属性接口
export interface BackToTopButtonProps {
  config?: Partial<BackToTopConfig>;
  className?: string;
  onScrollToTop?: () => void;
}

// 默认配置
const defaultConfig: BackToTopConfig = {
  showThreshold: 200,
  position: 'bottom-right',
  enableAnimation: true,
  animationDuration: 300,
  smoothScrollDuration: 500,
  buttonSize: 'medium',
  buttonStyle: 'circle',
  showIcon: true,
  showText: false,
  buttonText: '顶部',
  hideOnTop: true,
  enableHover: true,
  backgroundColor: '#1890ff',
  textColor: '#ffffff',
  borderRadius: 50,
  opacity: 0.8,
  hoverOpacity: 1.0,
  zIndex: 1000
};

// 防抖函数
const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const [isThrottling, setIsThrottling] = useState(false);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!isThrottling) {
        callback(...args);
        setIsThrottling(true);
        setTimeout(() => setIsThrottling(false), delay);
      }
    }) as T,
    [callback, delay, isThrottling]
  );
};

// 平滑滚动函数
const smoothScrollToTop = (duration: number): void => {
  const startPosition = window.pageYOffset;
  const startTime = performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 缓动函数 (easeOutQuart)
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    window.scrollTo(0, startPosition * (1 - easeOutQuart));

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

// 获取按钮尺寸样式
const getButtonSizeStyles = (size: string) => {
  switch (size) {
    case 'small':
      return {
        width: '40px',
        height: '40px',
        fontSize: '16px'
      };
    case 'large':
      return {
        width: '60px',
        height: '60px',
        fontSize: '20px'
      };
    default: // medium
      return {
        width: '50px',
        height: '50px',
        fontSize: '18px'
      };
  }
};

// 获取按钮位置样式
const getPositionStyles = (position: string) => {
  const commonStyles = {
    position: 'fixed' as const,
    margin: '20px'
  };

  switch (position) {
    case 'bottom-left':
      return { ...commonStyles, bottom: 0, left: 0 };
    case 'top-right':
      return { ...commonStyles, top: 0, right: 0 };
    case 'top-left':
      return { ...commonStyles, top: 0, left: 0 };
    default: // bottom-right
      return { ...commonStyles, bottom: 0, right: 0 };
  }
};

// 获取按钮形状样式
const getShapeStyles = (style: string, borderRadius: number) => {
  switch (style) {
    case 'square':
      return { borderRadius: '4px' };
    case 'rounded':
      return { borderRadius: '12px' };
    default: // circle
      return { borderRadius: `${borderRadius}%` };
  }
};

const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  config = {},
  className = '',
  onScrollToTop
}) => {
  // 合并配置
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  // 状态管理
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 滚动监听处理函数
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > finalConfig.showThreshold;
    
    if (finalConfig.hideOnTop) {
      setIsVisible(shouldShow);
    } else {
      setIsVisible(true);
    }
  }, [finalConfig.showThreshold, finalConfig.hideOnTop]);

  // 使用防抖的滚动处理函数
  const throttledHandleScroll = useThrottle(handleScroll, 16); // ~60fps

  // 点击处理函数
  const handleClick = useCallback(() => {
    smoothScrollToTop(finalConfig.smoothScrollDuration);
    onScrollToTop?.();

    // 记录用户行为（可选）
    console.log('🔝 [BackToTop] User clicked back to top button');
  }, [finalConfig.smoothScrollDuration, onScrollToTop]);

  // 监听滚动事件
  useEffect(() => {
    // 初始检查
    handleScroll();

    // 添加滚动监听
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // 清理函数
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [handleScroll, throttledHandleScroll]);

  // 计算样式
  const buttonStyles = useMemo(() => {
    const sizeStyles = getButtonSizeStyles(finalConfig.buttonSize);
    const positionStyles = getPositionStyles(finalConfig.position);
    const shapeStyles = getShapeStyles(finalConfig.buttonStyle, finalConfig.borderRadius);
    
    return {
      ...sizeStyles,
      ...positionStyles,
      ...shapeStyles,
      backgroundColor: finalConfig.backgroundColor,
      color: finalConfig.textColor,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: finalConfig.showIcon && finalConfig.showText ? '4px' : '0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      opacity: isHovered ? finalConfig.hoverOpacity : finalConfig.opacity,
      transform: isVisible ? 'scale(1)' : 'scale(0)',
      transition: finalConfig.enableAnimation 
        ? `all ${finalConfig.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        : 'none',
      zIndex: finalConfig.zIndex,
      outline: 'none',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      pointerEvents: isVisible ? 'auto' as const : 'none' as const
    };
  }, [finalConfig, isVisible, isHovered]);

  // 鼠标事件处理
  const handleMouseEnter = useCallback(() => {
    if (finalConfig.enableHover) {
      setIsHovered(true);
    }
  }, [finalConfig.enableHover]);

  const handleMouseLeave = useCallback(() => {
    if (finalConfig.enableHover) {
      setIsHovered(false);
    }
  }, [finalConfig.enableHover]);

  // 键盘事件处理（无障碍访问）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      className={`voxnest-back-to-top ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      aria-label="回到页面顶部"
      title="回到顶部"
      type="button"
      tabIndex={isVisible ? 0 : -1}
    >
      {finalConfig.showIcon && (
        <UpOutlined 
          style={{ 
            fontSize: 'inherit',
            color: 'inherit'
          }} 
        />
      )}
      {finalConfig.showText && (
        <span style={{ fontSize: 'inherit', color: 'inherit' }}>
          {finalConfig.buttonText}
        </span>
      )}
    </button>
  );
};

// 导出组件和相关类型
export default BackToTopButton;

// 全局声明（用于钩子函数）
declare global {
  interface Window {
    VoxNestBackToTop?: {
      initialize: () => void;
      cleanup: () => void;
    };
  }
}
