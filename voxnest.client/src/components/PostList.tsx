import React, { useState } from 'react';
import { List, Button, Tag, Avatar, Space, Pagination, Spin, Alert, Empty, Typography } from 'antd';
import { EyeOutlined, MessageOutlined, HeartOutlined, UserOutlined, ReloadOutlined, FireOutlined, PushpinOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { usePostsQuery, useLikePostMutation, type PostListParams } from '../hooks/usePostsQuery';
import { useApiStateManagement } from '../hooks/useApiState';
import '../styles/PostListUnified.css';

const { Text, Title } = Typography;

interface PostListProps {
  initialParams?: PostListParams;
  showPagination?: boolean;
  showRefreshButton?: boolean;
}

const PostList: React.FC<PostListProps> = ({ 
  initialParams = {}, 
  showPagination = true,
  showRefreshButton = false 
}) => {
  const navigate = useNavigate();
  const [params, setParams] = useState<PostListParams>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'created',
    sortOrder: 'desc',
    ...initialParams
  });

  // 使用新的数据获取Hook
  const postsQuery = usePostsQuery(params);
  const likeMutation = useLikePostMutation();
  
  // 使用API状态管理Hook
  const {
    isLoading,
    isError,
    isFetching,
    isStale,
    hasData,
    isEmpty,
    isLoadingInitial,
    isLoadingMore,
    retry,
    refresh,
    ageInMinutes,
  } = useApiStateManagement(postsQuery, { 
    showErrorMessage: false, // 手动处理错误显示
    staleThreshold: 2 * 60 * 1000 // 2分钟
  });

  // 处理分页
  const handlePageChange = (page: number, size?: number) => {
    setParams(prev => ({
      ...prev,
      pageNumber: page,
      pageSize: size || prev.pageSize
    }));
  };

  // 处理点赞
  const handleLike = async (postId: number) => {
    try {
      await likeMutation.mutateAsync(postId);
    } catch {
      // 错误已在mutation中处理
    }
  };

  // 处理帖子点击
  const handlePostClick = (post: { id: number }) => {
    navigate(`/posts/${post.id}`);
  };

  // 刷新数据
  const handleRefresh = () => {
    refresh();
  };

  // 错误状态
  if (isError && !hasData) {
    return (
      <Alert
        message="加载失败"
        description={
          <Space direction="vertical">
            <span>无法加载帖子列表，请检查网络连接</span>
            <Button type="primary" icon={<ReloadOutlined />} onClick={retry}>
              重试
            </Button>
          </Space>
        }
        type="error"
        showIcon
      />
    );
  }

  // 空状态
  if (isEmpty && !isLoading) {
    return (
      <Empty
        description="暂无帖子"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const data = postsQuery.data;

  return (
    <div>
      {/* 刷新按钮和状态指示器 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {showRefreshButton && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={isLoadingMore}
            >
              刷新
            </Button>
          )}
          {isStale && (
            <Tag color="orange">
              数据可能过期 ({ageInMinutes}分钟前)
            </Tag>
          )}
          {isFetching && <Tag color="blue">更新中...</Tag>}
        </Space>
        
        {/* 错误提示 */}
        {isError && hasData && (
          <Alert
            message="更新失败"
            type="warning"
            showIcon
            closable
            action={
              <Button size="small" onClick={retry}>
                重试
              </Button>
            }
          />
        )}
      </div>

      {/* 加载状态 */}
      <Spin spinning={isLoadingInitial} tip="加载中...">
        <div className="voxnest-post-list">
          <List
            dataSource={data?.posts || []}
            renderItem={(post, index) => (
              <List.Item 
                className="voxnest-post-item"
                onClick={() => handlePostClick(post)}
                style={{ 
                  cursor: 'pointer',
                  padding: '16px 20px',
                  borderBottom: index === (data?.posts || []).length - 1 ? 'none' : '1px solid #f0f0f0',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: '12px' }}>
                  {/* 左侧用户头像 */}
                  <Avatar 
                    size={44}
                    icon={<UserOutlined />}
                    src={post.author?.avatar}
                    style={{ 
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  
                  {/* 中间内容区域 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* 标题行 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                      <Title 
                        level={5} 
                        style={{ 
                          margin: 0, 
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#262626',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        {post.title}
                      </Title>
                      
                      {/* 特殊标签 */}
                      <Space size={4}>
                        {(post as any).isPinned && (
                          <Tag color="red" icon={<PushpinOutlined />} style={{ margin: 0 }}>
                            置顶
                          </Tag>
                        )}
                        {(post as any).isHot && (
                          <Tag color="orange" icon={<FireOutlined />} style={{ margin: 0 }}>
                            热门
                          </Tag>
                        )}
                        {post.status === 'DRAFT' && (
                          <Tag color="orange" style={{ margin: 0 }}>草稿</Tag>
                        )}
                      </Space>
                    </div>

                    {/* 类别和标签行 */}
                    <div style={{ marginBottom: '6px' }}>
                      <Space size={6}>
                        {post.category && (
                          <Tag 
                            color="#6366F1" 
                            style={{ 
                              borderRadius: '12px',
                              fontSize: '12px',
                              padding: '2px 8px',
                              border: 'none',
                              fontWeight: 500
                            }}
                          >
                            {post.category.name}
                          </Tag>
                        )}
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Tag 
                            key={tag} 
                            style={{ 
                              borderRadius: '12px',
                              fontSize: '12px',
                              padding: '2px 8px',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              color: '#6b7280',
                              fontWeight: 400
                            }}
                          >
                            {tag}
                          </Tag>
                        ))}
                        {post.tags && post.tags.length > 3 && (
                          <Tag style={{ 
                            borderRadius: '12px',
                            fontSize: '12px',
                            padding: '2px 8px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            color: '#6b7280'
                          }}>
                            +{post.tags.length - 3}
                          </Tag>
                        )}
                      </Space>
                    </div>

                    {/* 内容预览（可选） */}
                    {post.excerpt && (
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '13px',
                          lineHeight: '1.4',
                          display: 'block',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {post.excerpt}
                      </Text>
                    )}

                    {/* 时间和作者信息 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {post.author?.username || '匿名用户'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        •
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(post.createdAt).fromNow()}
                      </Text>
                    </div>
                  </div>
                  
                  {/* 右侧统计信息 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-end', 
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                    minWidth: '150px'
                  }}>
                    {/* 统计数据 - 横向排列 */}
                    <Space size={12} style={{ fontSize: '12px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageOutlined style={{ fontSize: '12px', color: '#6b7280' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {post.commentCount}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EyeOutlined style={{ fontSize: '12px', color: '#6b7280' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {post.viewCount}
                        </span>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<HeartOutlined />}
                        loading={likeMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        style={{ 
                          padding: '0',
                          height: '20px',
                          fontSize: '12px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        {post.likeCount}
                      </Button>
                    </Space>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </Spin>

      {/* 分页 */}
      {showPagination && data && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Pagination
            current={data.pageNumber}
            pageSize={data.pageSize}
            total={data.totalCount}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={handlePageChange}
            disabled={isLoadingMore}
          />
        </div>
      )}
    </div>
  );
};

export default PostList;
