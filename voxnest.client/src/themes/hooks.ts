/**
 * VoxNest 主题系统 React Hooks
 * 提供 React 组件使用主题系统的便捷 Hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { themeManager } from './ThemeManager';
import { themeConfigIntegration } from './integration';
import type { Theme, ThemeEventListener, ThemeEventData } from './types';

// ===========================================
// 基础主题 Hooks
// ===========================================

/**
 * 使用当前主题
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(
    themeManager.currentTheme
  );

  useEffect(() => {
    const handleThemeChange: ThemeEventListener = (data: ThemeEventData) => {
      if (data.type === 'theme-switched' || data.type === 'theme-loaded') {
        setCurrentTheme(data.theme || null);
      }
    };

    themeManager.addEventListener('theme-switched', handleThemeChange);
    themeManager.addEventListener('theme-loaded', handleThemeChange);

    return () => {
      themeManager.removeEventListener('theme-switched', handleThemeChange);
      themeManager.removeEventListener('theme-loaded', handleThemeChange);
    };
  }, []);

  const switchTheme = useCallback(async (themeId: string) => {
    await themeManager.switchTheme(themeId, { smooth: true });
  }, []);

  const isThemeLoading = currentTheme === null;

  return {
    currentTheme,
    switchTheme,
    isThemeLoading,
    themeId: currentTheme?.metadata.id || null,
    themeName: currentTheme?.metadata.name || null
  };
}

/**
 * 使用主题列表
 */
export function useThemeList() {
  const [themes, setThemes] = useState<Theme[]>(themeManager.availableThemes);

  useEffect(() => {
    const updateThemes = () => {
      setThemes([...themeManager.availableThemes]);
    };

    const handleThemeEvent: ThemeEventListener = (data: ThemeEventData) => {
      if (data.type === 'theme-loaded') {
        updateThemes();
      }
    };

    themeManager.addEventListener('theme-loaded', handleThemeEvent);

    return () => {
      themeManager.removeEventListener('theme-loaded', handleThemeEvent);
    };
  }, []);

  const builtinThemes = useMemo(() => 
    themes.filter(theme => theme.metadata.builtin), [themes]
  );

  const customThemes = useMemo(() => 
    themes.filter(theme => !theme.metadata.builtin), [themes]
  );

  return {
    themes,
    builtinThemes,
    customThemes,
    totalCount: themes.length
  };
}

/**
 * 使用主题切换器
 */
export function useThemeSwitcher() {
  const { currentTheme, switchTheme } = useTheme();
  const { themes } = useThemeList();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchToNext = useCallback(async () => {
    if (themes.length === 0 || !currentTheme) return;

    setIsTransitioning(true);
    try {
      const currentIndex = themes.findIndex(
        theme => theme.metadata.id === currentTheme.metadata.id
      );
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];
      
      await switchTheme(nextTheme.metadata.id);
    } finally {
      setIsTransitioning(false);
    }
  }, [themes, currentTheme, switchTheme]);

  const switchToPrevious = useCallback(async () => {
    if (themes.length === 0 || !currentTheme) return;

    setIsTransitioning(true);
    try {
      const currentIndex = themes.findIndex(
        theme => theme.metadata.id === currentTheme.metadata.id
      );
      const prevIndex = currentIndex <= 0 ? themes.length - 1 : currentIndex - 1;
      const prevTheme = themes[prevIndex];
      
      await switchTheme(prevTheme.metadata.id);
    } finally {
      setIsTransitioning(false);
    }
  }, [themes, currentTheme, switchTheme]);

  const switchTo = useCallback(async (themeId: string) => {
    setIsTransitioning(true);
    try {
      await switchTheme(themeId);
    } finally {
      setIsTransitioning(false);
    }
  }, [switchTheme]);

  return {
    currentTheme,
    switchToNext,
    switchToPrevious,
    switchTo,
    isTransitioning,
    canSwitchNext: themes.length > 1,
    canSwitchPrevious: themes.length > 1
  };
}

// ===========================================
// 高级主题 Hooks
// ===========================================

/**
 * 使用主题颜色
 */
export function useThemeColors() {
  const { currentTheme } = useTheme();

  const colors = useMemo(() => {
    if (!currentTheme) return null;

    return {
      primary: currentTheme.colors.primary,
      neutral: currentTheme.colors.neutral,
      text: currentTheme.colors.text,
      status: currentTheme.colors.status,
      custom: currentTheme.colors.custom || {}
    };
  }, [currentTheme]);

  const getColor = useCallback((path: string): string | undefined => {
    if (!colors) return undefined;

    const parts = path.split('.');
    let current: any = colors;
    
    for (const part of parts) {
      current = current?.[part];
    }
    
    return current?.value;
  }, [colors]);

  const getCSSVariable = useCallback((path: string): string => {
    const parts = path.split('.');
    return `var(--color-${parts.join('-')})`;
  }, []);

  return {
    colors,
    getColor,
    getCSSVariable,
    isReady: colors !== null
  };
}

/**
 * 使用响应式主题
 */
export function useResponsiveTheme() {
  const { currentTheme } = useTheme();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoints = useMemo(() => ({
    sm: windowSize.width >= 640,
    md: windowSize.width >= 768,
    lg: windowSize.width >= 1024,
    xl: windowSize.width >= 1280,
    '2xl': windowSize.width >= 1536
  }), [windowSize.width]);

  const spacing = useMemo(() => {
    if (!currentTheme) return null;

    const unit = currentTheme.spacing.unit;
    const scale = currentTheme.spacing.scale;

    const responsive = Object.entries(scale).reduce((acc, [key, multiplier]) => {
      acc[key] = unit * multiplier;
      return acc;
    }, {} as Record<string, number>);

    return { unit, scale, responsive };
  }, [currentTheme]);

  return {
    currentTheme,
    windowSize,
    breakpoints,
    spacing,
    isMobile: !breakpoints.md,
    isTablet: breakpoints.md && !breakpoints.lg,
    isDesktop: breakpoints.lg
  };
}

/**
 * 使用系统主题检测
 */
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    themeConfigIntegration.detectSystemTheme()
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const enableAutoTheme = useCallback(() => {
    themeConfigIntegration.enableAutoTheme();
  }, []);

  const disableAutoTheme = useCallback(() => {
    themeConfigIntegration.disableAutoTheme();
  }, []);

  return {
    systemTheme,
    enableAutoTheme,
    disableAutoTheme,
    isSystemDark: systemTheme === 'dark'
  };
}

// ===========================================
// 调试和开发 Hooks
// ===========================================

/**
 * 使用主题调试信息
 */
export function useThemeDebug() {
  const { currentTheme } = useTheme();
  const { themes } = useThemeList();
  const [events, setEvents] = useState<ThemeEventData[]>([]);

  useEffect(() => {
    const maxEvents = 50; // 最多保留50个事件

    const handleEvent: ThemeEventListener = (data: ThemeEventData) => {
      setEvents(prev => {
        const newEvents = [data, ...prev];
        return newEvents.slice(0, maxEvents);
      });
    };

    // 监听所有主题事件
    const eventTypes = [
      'theme-loading', 'theme-loaded', 'theme-error',
      'theme-switching', 'theme-switched',
      'extension-loaded', 'extension-error'
    ] as const;

    eventTypes.forEach(type => {
      themeManager.addEventListener(type, handleEvent);
    });

    return () => {
      eventTypes.forEach(type => {
        themeManager.removeEventListener(type, handleEvent);
      });
    };
  }, []);

  const stats = useMemo(() => ({
    totalThemes: themes.length,
    builtinThemes: themes.filter(t => t.metadata.builtin).length,
    customThemes: themes.filter(t => !t.metadata.builtin).length,
    currentThemeId: currentTheme?.metadata.id || null,
    eventCount: events.length
  }), [themes, currentTheme, events.length]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    currentTheme,
    themes,
    events,
    stats,
    clearEvents,
    isDebugMode: process.env.NODE_ENV === 'development'
  };
}

/**
 * 使用主题性能监控
 */
export function useThemePerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    switchTime: 0,
    lastSwitchTimestamp: 0
  });

  useEffect(() => {
    let switchStartTime = 0;

    const handleSwitching: ThemeEventListener = () => {
      switchStartTime = performance.now();
    };

    const handleSwitched: ThemeEventListener = () => {
      if (switchStartTime > 0) {
        const switchTime = performance.now() - switchStartTime;
        setMetrics(prev => ({
          ...prev,
          switchTime,
          lastSwitchTimestamp: Date.now()
        }));
        switchStartTime = 0;
      }
    };

    const handleLoaded: ThemeEventListener = (data) => {
      const loadTime = Date.now() - data.timestamp;
      setMetrics(prev => ({
        ...prev,
        loadTime
      }));
    };

    themeManager.addEventListener('theme-switching', handleSwitching);
    themeManager.addEventListener('theme-switched', handleSwitched);
    themeManager.addEventListener('theme-loaded', handleLoaded);

    return () => {
      themeManager.removeEventListener('theme-switching', handleSwitching);
      themeManager.removeEventListener('theme-switched', handleSwitched);
      themeManager.removeEventListener('theme-loaded', handleLoaded);
    };
  }, []);

  return {
    metrics,
    averageSwitchTime: metrics.switchTime,
    lastLoadTime: metrics.loadTime,
    isPerformanceGood: metrics.switchTime < 500 // 小于500ms认为性能良好
  };
}
