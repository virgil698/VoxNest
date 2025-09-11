/**
 * 前端安装状态管理
 * 类似后端的install.lock文件机制，但使用localStorage实现
 */

const INSTALL_LOCK_KEY = 'voxnest_install_lock';
const INSTALL_STATUS_KEY = 'voxnest_install_status';

export interface FrontendInstallLock {
  isInstalled: boolean;
  installedAt: string;
  version: string;
  checksum?: string;
}

export class FrontendInstallLockManager {
  private static _instance: FrontendInstallLockManager;

  private constructor() {}

  public static get instance(): FrontendInstallLockManager {
    if (!FrontendInstallLockManager._instance) {
      FrontendInstallLockManager._instance = new FrontendInstallLockManager();
    }
    return FrontendInstallLockManager._instance;
  }

  /**
   * 检查是否存在安装锁文件
   */
  public hasInstallLock(): boolean {
    return localStorage.getItem(INSTALL_LOCK_KEY) !== null;
  }

  /**
   * 获取安装锁信息
   */
  public getInstallLock(): FrontendInstallLock | null {
    const lockData = localStorage.getItem(INSTALL_LOCK_KEY);
    if (!lockData) {
      return null;
    }

    try {
      return JSON.parse(lockData) as FrontendInstallLock;
    } catch (error) {
      console.error('解析安装锁文件失败:', error);
      return null;
    }
  }

  /**
   * 创建安装锁文件
   */
  public createInstallLock(version: string = '1.0.0'): FrontendInstallLock {
    const lockData: FrontendInstallLock = {
      isInstalled: true,
      installedAt: new Date().toISOString(),
      version,
      checksum: this.generateChecksum()
    };

    localStorage.setItem(INSTALL_LOCK_KEY, JSON.stringify(lockData));
    console.log('✅ 前端安装锁文件已创建');
    return lockData;
  }

  /**
   * 移除安装锁文件
   */
  public removeInstallLock(): void {
    localStorage.removeItem(INSTALL_LOCK_KEY);
    localStorage.removeItem(INSTALL_STATUS_KEY);
    console.log('🗑️ 前端安装锁文件已移除');
  }

  /**
   * 缓存后端安装状态
   */
  public cacheInstallStatus(status: any): void {
    localStorage.setItem(INSTALL_STATUS_KEY, JSON.stringify({
      ...status,
      cachedAt: new Date().toISOString()
    }));
  }

  /**
   * 获取缓存的安装状态
   */
  public getCachedInstallStatus(): any | null {
    const cachedData = localStorage.getItem(INSTALL_STATUS_KEY);
    if (!cachedData) {
      return null;
    }

    try {
      const data = JSON.parse(cachedData);
      const cachedAt = new Date(data.cachedAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - cachedAt.getTime()) / (1000 * 60);

      // 缓存超过5分钟则失效
      if (diffMinutes > 5) {
        localStorage.removeItem(INSTALL_STATUS_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('解析缓存状态失败:', error);
      return null;
    }
  }

  /**
   * 验证安装状态
   */
  public async validateInstallation(): Promise<{ isValid: boolean; shouldRecheck: boolean }> {
    const lockData = this.getInstallLock();
    if (!lockData) {
      return { isValid: false, shouldRecheck: true };
    }

    // 检查安装锁是否过期（30天）
    const installedAt = new Date(lockData.installedAt);
    const now = new Date();
    const diffDays = (now.getTime() - installedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      console.warn('⚠️ 安装锁文件已过期，需要重新验证');
      return { isValid: false, shouldRecheck: true };
    }

    return { isValid: true, shouldRecheck: false };
  }

  /**
   * 生成校验和
   */
  private generateChecksum(): string {
    const data = `voxnest-${Date.now()}-${Math.random()}`;
    return btoa(data).substring(0, 16);
  }

  /**
   * 重置所有安装相关数据
   */
  public resetInstallation(): void {
    this.removeInstallLock();
    console.log('🔄 安装状态已重置');
  }
}

// 导出单例实例
export const installLockManager = FrontendInstallLockManager.instance;
