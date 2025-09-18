import { api } from './client';
import type { Post, CreatePostRequest } from '../types/post';

export interface PostListParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: number;
}

export const postApi = {
  // 获取帖子列表
  getPosts: (params: PostListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.categoryId) searchParams.set('categoryId', params.categoryId.toString());
    
    return api.get(`/api/post?${searchParams.toString()}`);
  },

  // 获取帖子详情
  getPost: (id: number) =>
    api.get<Post>(`/api/post/${id}`),

  // 创建帖子
  createPost: (data: CreatePostRequest) =>
    api.post<Post>('/api/post', data),

  // 获取当前用户的帖子
  getMyPosts: (params: Omit<PostListParams, 'categoryId'> = {}) => {
    const searchParams = new URLSearchParams();
    if (params.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    return api.get(`/api/post/my-posts?${searchParams.toString()}`);
  },

  // 获取用户的帖子
  getUserPosts: (userId: number, params: Omit<PostListParams, 'categoryId'> = {}) => {
    const searchParams = new URLSearchParams();
    if (params.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    return api.get(`/api/post/user/${userId}?${searchParams.toString()}`);
  },

  // 获取标签相关帖子
  getPostsByTag: (tagId: number, params: Omit<PostListParams, 'categoryId'> = {}) => {
    const searchParams = new URLSearchParams();
    if (params.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    return api.get(`/api/post/by-tag/${tagId}?${searchParams.toString()}`);
  },

  // 删除帖子
  deletePost: (id: number) =>
    api.delete(`/api/post/${id}`),
};
