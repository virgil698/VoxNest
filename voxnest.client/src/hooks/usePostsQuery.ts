import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { api } from '../api/client';
import type { CreatePostRequest } from '../types/post';

// 帖子相关类型定义
export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId: number;
  categoryId: number;
  tags?: string[];
  viewCount: number;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    username: string;
    avatar?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface PostListParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: number;
  tag?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortBy?: 'created' | 'updated' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export interface PostListResponse {
  posts: Post[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 获取帖子列表 Hook
export function usePostsQuery(params: PostListParams = {}) {
  const defaultParams = {
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'created' as const,
    sortOrder: 'desc' as const,
    ...params
  };

  return useQuery({
    queryKey: queryKeys.posts.list(defaultParams),
    queryFn: async (): Promise<PostListResponse> => {
      const response = await api.get<PostListResponse>('/posts', { params: defaultParams });
      return response.data.data!;
    },
    // 数据被认为新鲜的时间（2分钟）
    staleTime: 1000 * 60 * 2,
    // 启用自动后台刷新
    refetchOnWindowFocus: true,
    // 当参数改变时，保持之前的数据直到新数据到达
    placeholderData: (previousData) => previousData,
  });
}

// 获取帖子详情 Hook
export function usePostQuery(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: async (): Promise<Post> => {
      const response = await api.get<Post>(`/posts/${id}`);
      return response.data.data!;
    },
    enabled: enabled && id > 0,
    // 帖子详情缓存时间更长（10分钟）
    staleTime: 1000 * 60 * 10,
  });
}

// 创建帖子 Hook
export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostRequest): Promise<Post> => {
      const response = await api.post<Post>('/posts', postData);
      return response.data.data!;
    },
    onSuccess: (newPost) => {
      // 成功后无效化帖子列表
      invalidateQueries.posts();
      
      // 手动将新帖子添加到缓存
      queryClient.setQueryData(queryKeys.posts.detail(newPost.id), newPost);
      
      message.success('帖子创建成功！');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '创建帖子失败';
      message.error(errorMessage);
    },
  });
}

// 更新帖子 Hook（乐观更新示例）
export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreatePostRequest> }): Promise<Post> => {
      const response = await api.put<Post>(`/posts/${id}`, data);
      return response.data.data!;
    },
    // 乐观更新
    onMutate: async ({ id, data }) => {
      // 取消正在进行的查询以避免冲突
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(id) });

      // 保存之前的数据以备回滚
      const previousPost = queryClient.getQueryData<Post>(queryKeys.posts.detail(id));

      // 乐观更新数据
      if (previousPost) {
        queryClient.setQueryData<Post>(queryKeys.posts.detail(id), {
          ...previousPost,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousPost };
    },
    onError: (error: unknown, { id }, context) => {
      // 失败时回滚数据
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(id), context.previousPost);
      }
      
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '更新帖子失败';
      message.error(errorMessage);
    },
    onSettled: (_, __, { id }) => {
      // 无论成功失败，都重新获取数据确保同步
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) });
      invalidateQueries.postsList();
    },
    onSuccess: () => {
      message.success('帖子更新成功！');
    },
  });
}

// 删除帖子 Hook
export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // 从缓存中移除已删除的帖子
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(deletedId) });
      
      // 无效化列表
      invalidateQueries.posts();
      
      message.success('帖子已删除');
    },
    onError: (error: unknown) => {
      const errorWithResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorWithResponse?.response?.data?.message || '删除帖子失败';
      message.error(errorMessage);
    },
  });
}

// 点赞帖子 Hook（乐观更新）
export function useLikePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number): Promise<{ likeCount: number; liked: boolean }> => {
      const response = await api.post<{ likeCount: number; liked: boolean }>(`/posts/${postId}/like`);
      return response.data.data!;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      const previousPost = queryClient.getQueryData<Post>(queryKeys.posts.detail(postId));

      if (previousPost) {
        // 乐观更新点赞数
        queryClient.setQueryData<Post>(queryKeys.posts.detail(postId), {
          ...previousPost,
          likeCount: previousPost.likeCount + 1,
        });
      }

      return { previousPost };
    },
    onError: (_, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousPost);
      }
      message.error('操作失败，请重试');
    },
    onSettled: (_, __, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
}
