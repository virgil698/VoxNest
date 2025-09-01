import { create } from 'zustand';
import type { Post, PostListItem, CreatePostRequest } from '../types/post';
import { postApi } from '../api/post';
import type { PostListParams } from '../api/post';

interface PostState {
  // 帖子列表相关
  posts: PostListItem[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoadingList: boolean;
  
  // 当前帖子详情
  currentPost: Post | null;
  isLoadingDetail: boolean;
  
  // 当前用户的帖子
  myPosts: PostListItem[];
  myPostsCurrentPage: number;
  myPostsTotalCount: number;
  isLoadingMyPosts: boolean;
  
  // Actions
  loadPosts: (params?: PostListParams) => Promise<void>;
  loadPost: (id: number) => Promise<void>;
  createPost: (data: CreatePostRequest) => Promise<Post>;
  loadMyPosts: (params?: Omit<PostListParams, 'categoryId'>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  clearCurrentPost: () => void;
  setLoading: (type: 'list' | 'detail' | 'myPosts', loading: boolean) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  // 初始状态
  posts: [],
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  isLoadingList: false,
  
  currentPost: null,
  isLoadingDetail: false,
  
  myPosts: [],
  myPostsCurrentPage: 1,
  myPostsTotalCount: 0,
  isLoadingMyPosts: false,

  // 加载帖子列表
  loadPosts: async (params: PostListParams = {}) => {
    try {
      set({ isLoadingList: true });
      
      const response = await postApi.getPosts(params);
      
      if (response.data.success) {
        const responseData = response.data as any;
        const data = responseData.data || [];
        const pagination = responseData.pagination || {};
        
        set({
          posts: data,
          currentPage: pagination.currentPage || 1,
          pageSize: pagination.pageSize || 10,
          totalCount: pagination.totalCount || 0,
          totalPages: pagination.totalPages || 0,
          hasNextPage: pagination.hasNextPage || false,
          hasPreviousPage: pagination.hasPreviousPage || false,
          isLoadingList: false,
        });
      } else {
        throw new Error(response.data.message || '获取帖子列表失败');
      }
    } catch (error: any) {
      set({ isLoadingList: false });
      console.error('加载帖子列表失败:', error);
      throw error;
    }
  },

  // 加载帖子详情
  loadPost: async (id: number) => {
    try {
      set({ isLoadingDetail: true });
      
      const response = await postApi.getPost(id);
      
      if (response.data.success && response.data.data) {
        set({
          currentPost: response.data.data,
          isLoadingDetail: false,
        });
      } else {
        throw new Error(response.data.message || '获取帖子详情失败');
      }
    } catch (error: any) {
      set({ isLoadingDetail: false });
      console.error('加载帖子详情失败:', error);
      throw error;
    }
  },

  // 创建帖子
  createPost: async (data: CreatePostRequest) => {
    try {
      const response = await postApi.createPost(data);
      
      if (response.data.success && response.data.data) {
        const newPost = response.data.data;
        
        // 更新帖子列表（将新帖子添加到列表顶部）
        const { posts } = get();
        set({
          posts: [newPost, ...posts],
          totalCount: get().totalCount + 1,
        });
        
        return newPost;
      } else {
        throw new Error(response.data.message || '创建帖子失败');
      }
    } catch (error: any) {
      console.error('创建帖子失败:', error);
      throw error;
    }
  },

  // 加载当前用户的帖子
  loadMyPosts: async (params: Omit<PostListParams, 'categoryId'> = {}) => {
    try {
      set({ isLoadingMyPosts: true });
      
      const response = await postApi.getMyPosts(params);
      
      if (response.data.success) {
        const responseData = response.data as any;
        const data = responseData.data || [];
        const pagination = responseData.pagination || {};
        
        set({
          myPosts: data,
          myPostsCurrentPage: pagination.currentPage || 1,
          myPostsTotalCount: pagination.totalCount || 0,
          isLoadingMyPosts: false,
        });
      } else {
        throw new Error(response.data.message || '获取我的帖子失败');
      }
    } catch (error: any) {
      set({ isLoadingMyPosts: false });
      console.error('加载我的帖子失败:', error);
      throw error;
    }
  },

  // 删除帖子
  deletePost: async (id: number) => {
    try {
      const response = await postApi.deletePost(id);
      
      if (response.data.success) {
        // 从列表中移除已删除的帖子
        const { posts, myPosts } = get();
        
        set({
          posts: posts.filter(post => post.id !== id),
          myPosts: myPosts.filter(post => post.id !== id),
          totalCount: Math.max(0, get().totalCount - 1),
          myPostsTotalCount: Math.max(0, get().myPostsTotalCount - 1),
        });
      } else {
        throw new Error(response.data.message || '删除帖子失败');
      }
    } catch (error: any) {
      console.error('删除帖子失败:', error);
      throw error;
    }
  },

  // 清除当前帖子详情
  clearCurrentPost: () => {
    set({ currentPost: null });
  },

  // 设置加载状态
  setLoading: (type: 'list' | 'detail' | 'myPosts', loading: boolean) => {
    switch (type) {
      case 'list':
        set({ isLoadingList: loading });
        break;
      case 'detail':
        set({ isLoadingDetail: loading });
        break;
      case 'myPosts':
        set({ isLoadingMyPosts: loading });
        break;
    }
  },
}));
