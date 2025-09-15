import { api } from './client';

export interface SiteInfo {
  name: string;
  description: string;
  keywords: string;
  logo: string;
  favicon: string;
  features: {
    registrationEnabled: boolean;
    emailVerification: boolean;
    guestPosting: boolean;
    commentsEnabled: boolean;
  };
  theme: {
    primaryColor: string;
    darkModeEnabled: boolean;
    defaultMode: 'light' | 'dark' | 'auto';
  };
  dev: {
    reactQueryDevtools: boolean;
  };
  security: {
    passwordMinLength: number;
  };
}

export interface PublicSettings {
  [key: string]: string;
}

/**
 * 站点公开信息API
 */
export const siteApi = {
  /**
   * 获取站点基本信息
   */
  async getSiteInfo(): Promise<{ data: SiteInfo }> {
    const response = await api.get<SiteInfo>('/api/site/info');
    return { data: response.data.data! };
  },

  /**
   * 获取所有公开站点设置
   */
  async getPublicSettings(): Promise<{ data: PublicSettings }> {
    const response = await api.get<PublicSettings>('/api/site/settings');
    return { data: response.data.data! };
  },

  /**
   * 获取特定的公开站点设置
   */
  async getPublicSetting(key: string): Promise<{ data: string }> {
    const response = await api.get<string>(`/api/site/settings/${key}`);
    return { data: response.data.data! };
  },
};

/**
 * 站点设置Hook
 */
export { useSiteInfoQuery, usePublicSettingsQuery } from '../hooks/useSiteSettings';
