/**
 * 扩展管理相关的 React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useExtensionFramework } from './components';
import { ExtensionDiscovery } from '../manager/ExtensionDiscovery';
import { ExtensionLoader, LoadingStatus } from '../manager/ExtensionLoader';
import type { DiscoveredExtension } from '../manager/ExtensionDiscovery';
import type { LoadedExtension } from '../manager/ExtensionLoader';

// 扩展管理器 Hook
export function useExtensionManager() {
  const framework = useExtensionFramework();
  const [discovery] = useState(() => new ExtensionDiscovery(framework.logger));
  const [loader] = useState(() => new ExtensionLoader(framework));
  
  const [discoveredPlugins, setDiscoveredPlugins] = useState<DiscoveredExtension[]>([]);
  const [discoveredThemes, setDiscoveredThemes] = useState<DiscoveredExtension[]>([]);
  const [loadedExtensions, setLoadedExtensions] = useState<LoadedExtension[]>([]);
  
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 发现扩展
  const discoverExtensions = useCallback(async () => {
    try {
      setIsDiscovering(true);
      setError(null);

      const [plugins, themes] = await Promise.all([
        discovery.discoverPlugins(),
        discovery.discoverThemes()
      ]);

      setDiscoveredPlugins(plugins);
      setDiscoveredThemes(themes);
      
      // 更新已加载扩展列表
      setLoadedExtensions(loader.getAllLoadedExtensions());
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('发现扩展时出错'));
    } finally {
      setIsDiscovering(false);
    }
  }, [discovery, loader]);

  // 加载插件
  const loadPlugin = useCallback(async (extension: DiscoveredExtension) => {
    try {
      setError(null);
      const result = await loader.loadPlugin(extension);
      setLoadedExtensions(loader.getAllLoadedExtensions());
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载插件时出错');
      setError(error);
      throw error;
    }
  }, [loader]);

  // 加载主题
  const loadTheme = useCallback(async (extension: DiscoveredExtension) => {
    try {
      setError(null);
      const result = await loader.loadTheme(extension);
      setLoadedExtensions(loader.getAllLoadedExtensions());
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载主题时出错');
      setError(error);
      throw error;
    }
  }, [loader]);

  // 卸载扩展
  const unloadExtension = useCallback(async (id: string) => {
    try {
      setError(null);
      const result = await loader.unloadExtension(id);
      setLoadedExtensions(loader.getAllLoadedExtensions());
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('卸载扩展时出错');
      setError(error);
      throw error;
    }
  }, [loader]);

  // 获取扩展状态
  const getExtensionStatus = useCallback((id: string) => {
    const loaded = loader.getLoadedExtension(id);
    return loaded ? loaded.status : LoadingStatus.Idle;
  }, [loader]);

  // 初始化时发现扩展
  useEffect(() => {
    discoverExtensions();
  }, [discoverExtensions]);

  return {
    // 实例
    discovery,
    loader,
    
    // 数据
    discoveredPlugins,
    discoveredThemes,
    loadedExtensions,
    
    // 状态
    isDiscovering,
    error,
    
    // 方法
    discoverExtensions,
    loadPlugin,
    loadTheme,
    unloadExtension,
    getExtensionStatus,
    
    // 统计
    stats: loader.getLoadingStats()
  };
}

// 插件管理 Hook
export function usePluginManager() {
  const { 
    discoveredPlugins, 
    loadedExtensions, 
    loadPlugin, 
    unloadExtension,
    getExtensionStatus,
    isDiscovering,
    error
  } = useExtensionManager();

  const loadedPlugins = loadedExtensions.filter(ext => ext.manifest.type === 'plugin');
  
  return {
    discoveredPlugins,
    loadedPlugins,
    loadPlugin,
    unloadPlugin: unloadExtension,
    getPluginStatus: getExtensionStatus,
    isDiscovering,
    error
  };
}

// 主题管理 Hook
export function useThemeManager() {
  const { 
    discoveredThemes, 
    loadedExtensions, 
    loadTheme, 
    unloadExtension,
    getExtensionStatus,
    isDiscovering,
    error
  } = useExtensionManager();

  const loadedThemes = loadedExtensions.filter(ext => ext.manifest.type === 'theme');
  
  // 激活主题（卸载其他主题，加载指定主题）
  const activateTheme = useCallback(async (extension: DiscoveredExtension) => {
    // 卸载所有已加载的主题
    for (const theme of loadedThemes) {
      await unloadExtension(theme.manifest.id);
    }
    
    // 加载新主题
    return await loadTheme(extension);
  }, [loadedThemes, unloadExtension, loadTheme]);

  return {
    discoveredThemes,
    loadedThemes,
    activeTheme: loadedThemes.find(theme => theme.status === LoadingStatus.Loaded),
    loadTheme,
    activateTheme,
    unloadTheme: unloadExtension,
    getThemeStatus: getExtensionStatus,
    isDiscovering,
    error
  };
}

// 扩展详情 Hook
export function useExtensionDetail(id: string) {
  const { discovery, loader } = useExtensionManager();
  const [discovered, setDiscovered] = useState<DiscoveredExtension | null>(null);
  const [loaded, setLoaded] = useState<LoadedExtension | null>(null);

  useEffect(() => {
    const discoveredExt = discovery.getExtensionById(id);
    const loadedExt = loader.getLoadedExtension(id);
    
    setDiscovered(discoveredExt || null);
    setLoaded(loadedExt || null);
  }, [id, discovery, loader]);

  return {
    discovered,
    loaded,
    isLoaded: loaded?.status === LoadingStatus.Loaded,
    isFailed: loaded?.status === LoadingStatus.Failed,
    isLoading: loaded?.status === LoadingStatus.Loading,
    error: loaded?.error
  };
}
