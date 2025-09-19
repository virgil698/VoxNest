import { api } from './client';

// 标签选择相关接口
export interface TagOption {
  id: number;
  name: string;
  color?: string;
  isPermanent: boolean;
  useCount: number;
  priority?: number;
}

export interface PostTagSelection {
  existingTagIds: number[];
  newDynamicTags: string[];
}

export interface TagValidationResult {
  isValid: boolean;
  errorMessage?: string;
  validPermanentTagIds: number[];
  validDynamicTagIds: number[];
  newDynamicTagNames: string[];
}

export const tagApi = {
  // 获取所有可用标签
  getAvailableTags: () =>
    api.get<TagOption[]>('/api/tag/available'),

  // 获取常驻标签
  getPermanentTags: () =>
    api.get<TagOption[]>('/api/tag/permanent'),

  // 获取动态标签
  getDynamicTags: (createdBy?: number) =>
    api.get<TagOption[]>('/api/tag/dynamic', {
      params: createdBy ? { createdBy } : undefined,
    }),

  // 搜索标签
  searchTags: (query: string, limit = 10) =>
    api.get<TagOption[]>('/api/tag/search', {
      params: { query, limit },
    }),

  // 验证标签选择
  validatePostTags: (tagSelection: PostTagSelection) =>
    api.post<TagValidationResult>('/api/tag/validate', tagSelection),

  // 处理帖子标签（创建新动态标签并返回所有标签ID）
  processPostTags: (tagSelection: PostTagSelection) =>
    api.post<number[]>('/api/tag/process', tagSelection),

  // 创建动态标签
  createDynamicTags: (tagNames: string[]) =>
    api.post<TagOption[]>('/api/tag/dynamic', tagNames),

  // 验证标签名称
  validateTagName: (tagName: string) =>
    api.post<boolean>('/api/tag/validate-name', tagName),

  // 检查标签是否存在
  tagExists: (tagName: string, excludeId?: number) =>
    api.get<boolean>('/api/tag/exists', {
      params: { tagName, excludeId },
    }),
};
