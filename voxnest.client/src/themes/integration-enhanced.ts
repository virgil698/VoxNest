/**
 * VoxNest 主题系统增强集成
 * 扩展原有集成功能，支持主题包管理
 */

import { themeManager } from './ThemeManager';
import { themeConfigIntegration } from './integration';
import { themePackageManager } from './packages/ThemePackageManager';
import { getAppConfig, updateAppConfig } from '../config/index';
import type { AppConfig } from '../config';

/**
 * 增强主题配置集成器
 */
export class EnhancedThemeConfigIntegration {
  private static _instance: EnhancedThemeConfigIntegration | null = null;
  private _initialized = false;

  private constructor() {}

  public static getInstance(): EnhancedThemeConfigIntegration {
    if (!EnhancedThemeConfigIntegration._instance) {
      EnhancedThemeConfigIntegration._instance = new EnhancedThemeConfigIntegration();
    }
    return EnhancedThemeConfigIntegration._instance;
  }

  /**
   * 初始化增强主题系统
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // 先初始化基础主题系统
      await themeConfigIntegration.initialize();

      // 初始化主题包管理器
      await themePackageManager.refreshPackages();

      // 根据配置加载指定的主题包
      await this.loadConfiguredThemePackage();

      // 监听配置变化
      this.watchThemePackageConfig();

      this._initialized = true;
      console.log('🎨✨ 增强主题系统初始化完成');

    } catch (error) {
      console.error('❌ 增强主题系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 根据配置加载主题包
   */
  public async loadConfiguredThemePackage(): Promise<void> {
    const config = getAppConfig();
    const packageId = config.ui.themePackage;

    if (!packageId || packageId === 'default') {
      // 使用默认内置主题
      return;
    }

    try {
      // 检查主题包是否已安装
      const isInstalled = themePackageManager.isPackageInstalled(packageId);
      
      if (!isInstalled) {
        console.warn(`主题包 "${packageId}" 未安装，尝试从默认位置加载...`);
        
        // 尝试从默认位置安装主题包
        const packagePath = `/themes/packages/${packageId}`;
        const installSuccess = await themePackageManager.installPackage(packagePath);
        
        if (!installSuccess) {
          console.error(`无法安装主题包 "${packageId}"，回退到默认主题`);
          await this.fallbackToDefaultTheme();
          return;
        }
      }

      // 获取主题包中的主题
      const packageThemes = themePackageManager.getPackageThemes(packageId);
      
      if (packageThemes.length === 0) {
        console.warn(`主题包 "${packageId}" 中没有可用主题`);
        return;
      }

      // 选择要加载的主题
      const targetThemeId = this.selectThemeFromPackage(packageThemes, config);
      
      if (targetThemeId) {
        await themeManager.switchTheme(targetThemeId, {
          smooth: config.ui.enableAnimations,
          persist: true
        });
        
        console.log(`✅ 已加载主题包 "${packageId}" 中的主题 "${targetThemeId}"`);
      }

    } catch (error) {
      console.error(`加载主题包 "${packageId}" 失败:`, error);
      await this.fallbackToDefaultTheme();
    }
  }

  /**
   * 切换主题包
   */
  public async switchThemePackage(packageId: string, themeId?: string): Promise<boolean> {
    try {
      // 更新配置
      const newConfig: Partial<AppConfig> = {
        ui: {
          ...getAppConfig().ui,
          themePackage: packageId
        }
      };

      if (themeId) {
        newConfig.ui!.customThemeId = themeId;
      }

      updateAppConfig(newConfig);

      // 重新加载主题包
      await this.loadConfiguredThemePackage();

      return true;

    } catch (error) {
      console.error(`切换主题包失败:`, error);
      return false;
    }
  }

  /**
   * 安装新主题包
   */
  public async installThemePackage(packagePath: string, autoSwitch = false): Promise<boolean> {
    try {
      const success = await themePackageManager.installPackage(packagePath);
      
      if (success && autoSwitch) {
        // 获取包ID并切换
        const packageInfo = await themePackageManager.getPackage(
          this.extractPackageIdFromPath(packagePath)
        );
        
        if (packageInfo) {
          await this.switchThemePackage(packageInfo.id);
        }
      }

      return success;

    } catch (error) {
      console.error('安装主题包失败:', error);
      return false;
    }
  }

  /**
   * 卸载主题包
   */
  public async uninstallThemePackage(packageId: string): Promise<boolean> {
    try {
      const config = getAppConfig();
      
      // 如果当前正在使用要卸载的主题包，先切换到默认主题
      if (config.ui.themePackage === packageId) {
        await this.switchThemePackage('default');
      }

      return await themePackageManager.uninstallPackage(packageId);

    } catch (error) {
      console.error('卸载主题包失败:', error);
      return false;
    }
  }

  /**
   * 获取所有可用的主题包
   */
  public async getAvailableThemePackages(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    themesCount: number;
    isInstalled: boolean;
    isCurrent: boolean;
    themes: Array<{
      id: string;
      name: string;
      builtin: boolean;
    }>;
  }>> {
    const packages = await themePackageManager.getAllPackages();
    const config = getAppConfig();
    const currentPackage = config.ui.themePackage;

    return packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      author: pkg.author,
      version: pkg.version,
      themesCount: pkg.themesCount,
      isInstalled: themePackageManager.isPackageInstalled(pkg.id),
      isCurrent: pkg.id === currentPackage,
      themes: themePackageManager.getPackageThemes(pkg.id).map(theme => ({
        id: theme.metadata.id,
        name: theme.metadata.name,
        builtin: theme.metadata.builtin
      }))
    }));
  }

  /**
   * 导入主题包文件
   */
  public async importThemePackageFile(file: File): Promise<{ success: boolean; packageId?: string; error?: string }> {
    try {
      const packageId = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as ArrayBuffer;
            const id = await themePackageManager.importPackage(content);
            resolve(id);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      });

      return { success: true, packageId };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '导入失败' 
      };
    }
  }

  /**
   * 导出主题包
   */
  public async exportThemePackage(packageId: string): Promise<void> {
    try {
      const packageData = await themePackageManager.exportPackage(packageId);
      const packageInfo = await themePackageManager.getPackage(packageId);
      
      const blob = new Blob([packageData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${packageId}-v${packageInfo?.version || '1.0.0'}.voxnest-theme`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('导出主题包失败:', error);
      throw error;
    }
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 从主题包中选择主题
   */
  private selectThemeFromPackage(themes: any[], config: AppConfig): string | null {
    // 如果指定了自定义主题ID，优先使用
    if (config.ui.customThemeId) {
      const customTheme = themes.find(t => t.metadata.id === config.ui.customThemeId);
      if (customTheme) {
        return customTheme.metadata.id;
      }
    }

    // 根据配置的主题模式选择
    switch (config.ui.theme) {
      case 'dark':
        const darkTheme = themes.find(t => 
          t.metadata.id.includes('dark') || 
          t.metadata.tags?.includes('dark')
        );
        return darkTheme?.metadata.id || themes[0]?.metadata.id || null;

      case 'light':
        const lightTheme = themes.find(t => 
          t.metadata.id.includes('light') || 
          t.metadata.tags?.includes('light') ||
          t.metadata.id === 'default'
        );
        return lightTheme?.metadata.id || themes[0]?.metadata.id || null;

      case 'auto':
        // 根据系统主题选择
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const autoTheme = themes.find(t => 
          systemIsDark 
            ? (t.metadata.id.includes('dark') || t.metadata.tags?.includes('dark'))
            : (t.metadata.id.includes('light') || t.metadata.tags?.includes('light'))
        );
        return autoTheme?.metadata.id || themes[0]?.metadata.id || null;

      default:
        // 查找默认主题或第一个主题
        const defaultTheme = themes.find(t => 
          t.metadata.id === 'default' || 
          t.metadata.tags?.includes('default')
        );
        return defaultTheme?.metadata.id || themes[0]?.metadata.id || null;
    }
  }

  /**
   * 回退到默认主题
   */
  private async fallbackToDefaultTheme(): Promise<void> {
    try {
      const config = getAppConfig();
      await themeManager.switchTheme('light', {
        smooth: config.ui.enableAnimations,
        persist: true
      });
      
      // 更新配置
      updateAppConfig({
        ui: {
          ...config.ui,
          themePackage: 'default'
        }
      });

    } catch (error) {
      console.error('回退到默认主题失败:', error);
    }
  }

  /**
   * 从路径提取包ID
   */
  private extractPackageIdFromPath(packagePath: string): string {
    return packagePath.split('/').pop() || 'unknown';
  }

  /**
   * 监听主题包配置变化
   */
  private watchThemePackageConfig(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === getAppConfig().storage.configKey) {
          // 配置发生变化，重新加载主题包
          setTimeout(() => {
            this.loadConfiguredThemePackage();
          }, 100);
        }
      });
    }
  }
}

// 导出单例实例
export const enhancedThemeConfigIntegration = EnhancedThemeConfigIntegration.getInstance();

// ===========================================
// 便捷函数
// ===========================================

/**
 * 初始化增强主题系统
 */
export async function initializeEnhancedThemeSystem(): Promise<void> {
  await enhancedThemeConfigIntegration.initialize();
}

/**
 * 切换主题包
 */
export async function switchThemePackage(packageId: string, themeId?: string): Promise<boolean> {
  return enhancedThemeConfigIntegration.switchThemePackage(packageId, themeId);
}

/**
 * 安装主题包
 */
export async function installThemePackage(packagePath: string, autoSwitch = false): Promise<boolean> {
  return enhancedThemeConfigIntegration.installThemePackage(packagePath, autoSwitch);
}

/**
 * 获取所有主题包
 */
export async function getAllThemePackages() {
  return enhancedThemeConfigIntegration.getAvailableThemePackages();
}

/**
 * 导入主题包
 */
export async function importThemePackage(file: File) {
  return enhancedThemeConfigIntegration.importThemePackageFile(file);
}

/**
 * 导出主题包
 */
export async function exportThemePackage(packageId: string): Promise<void> {
  return enhancedThemeConfigIntegration.exportThemePackage(packageId);
}
