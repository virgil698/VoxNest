// 帖子状态枚举
export const PostStatus = {
  Draft: 0,
  Published: 1,
  Locked: 2,
  Pinned: 3,
  Deleted: 4,
} as const;

export type PostStatus = typeof PostStatus[keyof typeof PostStatus];

// 帖子作者信息
export interface PostAuthor {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
}

// 分类信息
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

// 标签信息
export interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  useCount: number;
}

// 帖子列表项
export interface PostListItem {
  id: number;
  title: string;
  summary?: string;
  status: PostStatus;
  author: PostAuthor;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
}

// 帖子详情
export interface Post extends PostListItem {
  content: string;
  updatedAt: string;
}

// 创建帖子请求
export interface CreatePostRequest {
  title: string;
  content: string;
  summary?: string;
  categoryId?: number;
  tagIds: number[];
}
