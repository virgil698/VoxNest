import React, { useState } from 'react';
import { List, Card, Button, Tag, Avatar, Space, Pagination, Spin, Alert, Empty } from 'antd';
import { EyeOutlined, MessageOutlined, HeartOutlined, CalendarOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { usePostsQuery, useLikePostMutation, type PostListParams } from '../hooks/usePostsQuery';
import { useApiStateManagement } from '../hooks/useApiState';

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
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
          dataSource={data?.posts || []}
          renderItem={(post) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => handlePostClick(post)}
                actions={[
                  <Button
                    key="like"
                    type="text"
                    icon={<HeartOutlined />}
                    loading={likeMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                  >
                    {post.likeCount}
                  </Button>,
                  <Button
                    key="comment"
                    type="text"
                    icon={<MessageOutlined />}
                  >
                    {post.commentCount}
                  </Button>,
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                  >
                    {post.viewCount}
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />}
                      src={post.author?.avatar}
                    />
                  }
                  title={
                    <Space>
                      <span>{post.title}</span>
                      {post.status === 'DRAFT' && <Tag color="orange">草稿</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>{post.excerpt}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size="small">
                          <CalendarOutlined />
                          <span>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                        </Space>
                        <Space>
                          {post.category && (
                            <Tag color="blue">{post.category.name}</Tag>
                          )}
                          {post.tags?.map((tag) => (
                            <Tag key={tag} color="default">{tag}</Tag>
                          ))}
                        </Space>
                      </div>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
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
