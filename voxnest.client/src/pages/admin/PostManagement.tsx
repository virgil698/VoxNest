import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Tooltip,
  Avatar,
  Typography,
  Empty
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  PushpinOutlined,
  FileTextOutlined,
  CommentOutlined,
  EyeInvisibleOutlined,
  LikeOutlined,
  TagsOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { adminApi, PostStatus } from '../../api/admin';
import type { AdminPost, AdminPostQuery, BatchPostOperation, PagedResult } from '../../api/admin';
import PostTagEditor from '../../components/admin/PostTagEditor';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const PostManagement: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 标签编辑相关状态
  const [tagEditorVisible, setTagEditorVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<AdminPostQuery>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'CreatedAt',
    sortDirection: 'desc'
  });

  // 获取帖子状态标签
  const getPostStatusTag = (status: PostStatus, statusName: string) => {
    const config = {
      [PostStatus.Draft]: { color: 'default', text: statusName },
      [PostStatus.Published]: { color: 'success', text: statusName },
      [PostStatus.Locked]: { color: 'warning', text: statusName },
      [PostStatus.Pinned]: { color: 'purple', text: statusName },
      [PostStatus.Deleted]: { color: 'error', text: statusName }
    };
    
    const { color, text } = config[status] || { color: 'default', text: '未知' };
    return <Tag color={color}>{text}</Tag>;
  };

  // 加载帖子列表
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 加载帖子列表，参数:', queryParams);
      const result: PagedResult<AdminPost> = await adminApi.getPosts(queryParams);
      console.log('✅ 帖子列表加载成功:', result);
      setPosts(result.data);
      setTotal(result.totalCount);
    } catch (error) {
      message.error('加载帖子列表失败');
      console.error('❌ 加载帖子错误:', error);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      pageNumber: 1,
      search: value
    }));
  };

  // 处理表格变化（分页、排序等）
  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: any
  ) => {
    setQueryParams(prev => ({
      ...prev,
      pageNumber: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
      sortBy: sorter.field || 'CreatedAt',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  // 更新帖子状态
  const handleUpdatePostStatus = async (postId: number, status: PostStatus) => {
    try {
      await adminApi.updatePostStatus(postId, { status });
      message.success('帖子状态更新成功');
      loadPosts();
    } catch (error) {
      message.error('更新帖子状态失败');
    }
  };

  // 处理编辑标签
  const handleEditTags = (post: AdminPost) => {
    setEditingPost(post);
    setTagEditorVisible(true);
  };

  // 处理标签编辑成功
  const handleTagEditSuccess = () => {
    loadPosts(); // 重新加载帖子列表以更新标签显示
  };

  // 删除帖子
  const handleDeletePost = async (postId: number) => {
    try {
      await adminApi.deletePost(postId);
      message.success('帖子删除成功');
      loadPosts();
    } catch (error) {
      message.error('删除帖子失败');
    }
  };

  // 批量操作：批量更新帖子状态
  const handleBatchUpdateStatus = async (status: PostStatus) => {
    const operationMap: Record<PostStatus, string> = {
      [PostStatus.Published]: 'publish',
      [PostStatus.Draft]: 'draft',
      [PostStatus.Locked]: 'lock',
      [PostStatus.Pinned]: 'pin',
      [PostStatus.Deleted]: 'delete'
    };

    const operation = operationMap[status];
    if (!operation) {
      message.error('不支持的操作');
      return;
    }

    const statusText: Record<PostStatus, string> = {
      [PostStatus.Published]: '发布',
      [PostStatus.Draft]: '转为草稿',
      [PostStatus.Locked]: '锁定',
      [PostStatus.Pinned]: '置顶',
      [PostStatus.Deleted]: '删除'
    };

    const text = statusText[status];
    
    Modal.confirm({
      title: `批量${text}帖子`,
      content: `确定要${text} ${selectedRowKeys.length} 个帖子吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const dto: BatchPostOperation = {
            postIds: selectedRowKeys.map(id => id as number),
            operation
          };
          
          const result = await adminApi.batchOperatePosts(dto);
          message.success(`批量${text}成功！处理了 ${result} 个帖子`);
          setSelectedRowKeys([]);
          loadPosts();
        } catch (error) {
          message.error(`批量${text}失败`);
        }
      },
    });
  };

  // 批量置顶/取消置顶
  const handleBatchPin = async (pin: boolean) => {
    const operation = pin ? 'pin' : 'unpin';
    const actionText = pin ? '置顶' : '取消置顶';
    
    Modal.confirm({
      title: `批量${actionText}帖子`,
      content: `确定要${actionText} ${selectedRowKeys.length} 个帖子吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const dto: BatchPostOperation = {
            postIds: selectedRowKeys.map(id => id as number),
            operation
          };
          
          const result = await adminApi.batchOperatePosts(dto);
          message.success(`批量${actionText}成功！处理了 ${result} 个帖子`);
          setSelectedRowKeys([]);
          loadPosts();
        } catch (error) {
          message.error(`批量${actionText}失败`);
        }
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<AdminPost> = [
    {
      title: '帖子信息',
      key: 'postInfo',
      width: 350,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Avatar
            size={40}
            icon={<FileTextOutlined />}
            style={{ 
              backgroundColor: '#1890ff',
              flexShrink: 0,
              marginTop: 4
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 14 }} ellipsis={{ tooltip: true }}>
                {record.title}
              </Text>
              {record.isSticky && (
                <Tooltip title="置顶帖子">
                  <PushpinOutlined style={{ color: '#722ed1' }} />
                </Tooltip>
              )}
              {getPostStatusTag(record.status, record.statusName)}
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: true }}>
                {record.summary || '暂无摘要'}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                作者：{record.author.displayName}
              </Text>
              {record.category && (
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                  {record.category.name}
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <div>
          {tags.length > 0 ? (
            tags.slice(0, 2).map((tag: any) => (
              <Tag key={tag.id} color={tag.color || 'default'} style={{ fontSize: 10, margin: '0 4px 4px 0' }}>
                {tag.name}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              暂无标签
            </Text>
          )}
          {tags.length > 2 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{tags.length - 2}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeOutlined style={{ fontSize: 11, color: '#1890ff' }} />
            <Text style={{ fontSize: 11 }}>{record.viewCount}</Text>
          </div>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CommentOutlined style={{ fontSize: 11, color: '#52c41a' }} />
            <Text style={{ fontSize: 11 }}>{record.commentCount}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <LikeOutlined style={{ fontSize: 11, color: '#f5222d' }} />
            <Text style={{ fontSize: 11 }}>{record.likeCount}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      render: (date: string) => (
        <div>
          <div>
            <Text style={{ fontSize: 12 }}>
              {dayjs(date).format('MM-DD HH:mm')}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).fromNow()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      sorter: true,
      render: (date: string) => (
        <div>
          <div>
            <Text style={{ fontSize: 12 }}>
              {dayjs(date).format('MM-DD HH:mm')}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).fromNow()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: 实现查看详情功能
                message.info('查看详情功能待实现');
              }}
            />
          </Tooltip>
          <Tooltip title="编辑帖子">
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                // TODO: 实现编辑帖子功能
                message.info('编辑帖子功能待实现');
              }}
            />
          </Tooltip>
          <Tooltip title="编辑标签">
            <Button
              size="small"
              icon={<TagsOutlined />}
              onClick={() => handleEditTags(record)}
            />
          </Tooltip>
          {record.status === PostStatus.Published ? (
            <Tooltip title="锁定帖子">
              <Button
                size="small"
                icon={<LockOutlined />}
                onClick={() => handleUpdatePostStatus(record.id, PostStatus.Locked)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="发布帖子">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdatePostStatus(record.id, PostStatus.Published)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除帖子">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除帖子"${record.title}"吗？此操作不可恢复！`,
                  icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
                  okText: '确定删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => handleDeletePost(record.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>帖子管理</Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理系统帖子，包括查看、编辑、状态管理和删除
        </p>
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="搜索帖子标题、内容或作者"
            allowClear
            enterButton="搜索"
            style={{ width: 320 }}
            onSearch={handleSearch}
            onChange={(e) => {
              // 实时搜索：当输入为空时，清空搜索
              if (!e.target.value.trim()) {
                handleSearch('');
              }
            }}
            suffix={
              queryParams.search ? (
                <Tooltip title={`搜索："${queryParams.search}"`}>
                  <span style={{ color: '#1890ff', fontSize: '12px' }}>
                    {posts.length} 结果
                  </span>
                </Tooltip>
              ) : null
            }
          />
          <Select
            placeholder="帖子状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setQueryParams(prev => ({ ...prev, status: value, pageNumber: 1 }))}
          >
            <Option value={PostStatus.Draft}>草稿</Option>
            <Option value={PostStatus.Published}>已发布</Option>
            <Option value={PostStatus.Locked}>已锁定</Option>
            <Option value={PostStatus.Pinned}>已置顶</Option>
            <Option value={PostStatus.Deleted}>已删除</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadPosts}>
            刷新
          </Button>
          {(queryParams.search || queryParams.status) && (
            <Button
              onClick={() => {
                setQueryParams({
                  pageNumber: 1,
                  pageSize: 20,
                  sortBy: 'CreatedAt',
                  sortDirection: 'desc'
                });
              }}
            >
              清除筛选
            </Button>
          )}
        </Space>
      </div>

      {/* 批量操作工具栏 */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#f0f6ff',
            border: '1px solid #d6e4ff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ color: '#1890ff', fontWeight: 500 }}>
            已选择 {selectedRowKeys.length} 个帖子
          </span>
          <Space>
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleBatchUpdateStatus(PostStatus.Published)}
            >
              批量发布
            </Button>
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleBatchUpdateStatus(PostStatus.Draft)}
            >
              批量转草稿
            </Button>
            <Button
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleBatchUpdateStatus(PostStatus.Locked)}
            >
              批量锁定
            </Button>
            <Button
              size="small"
              icon={<PushpinOutlined />}
              onClick={() => handleBatchPin(true)}
            >
              批量置顶
            </Button>
            <Button
              size="small"
              icon={<EyeInvisibleOutlined />}
              onClick={() => handleBatchPin(false)}
            >
              取消置顶
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleBatchUpdateStatus(PostStatus.Deleted)}
            >
              批量删除
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedRowKeys([])}
            >
              取消选择
            </Button>
          </Space>
        </div>
      )}

      {/* 搜索结果状态 */}
      {(queryParams.search || queryParams.status) && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
            fontSize: '14px',
            color: '#52c41a'
          }}
        >
          <Space>
            <span>当前筛选条件：</span>
            {queryParams.search && (
              <Tag color="blue">
                搜索：{queryParams.search}
              </Tag>
            )}
            {queryParams.status !== undefined && (
              <Tag color="green">
                状态：{
                  queryParams.status === PostStatus.Draft ? '草稿' :
                  queryParams.status === PostStatus.Published ? '已发布' :
                  queryParams.status === PostStatus.Locked ? '已锁定' :
                  queryParams.status === PostStatus.Pinned ? '已置顶' :
                  queryParams.status === PostStatus.Deleted ? '已删除' : '未知'
                }
              </Tag>
            )}
            <span>找到 {total} 个帖子</span>
          </Space>
        </div>
      )}

      {/* 帖子表格 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={posts}
        loading={loading}
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: queryParams.pageNumber,
          pageSize: queryParams.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无帖子数据"
            />
          ),
        }}
      />

      {/* 标签编辑器 */}
      {editingPost && (
        <PostTagEditor
          visible={tagEditorVisible}
          postId={editingPost.id}
          postTitle={editingPost.title}
          currentTags={editingPost.tags}
          onClose={() => {
            setTagEditorVisible(false);
            setEditingPost(null);
          }}
          onSuccess={handleTagEditSuccess}
        />
      )}
    </Card>
  );
};

export default PostManagement;
