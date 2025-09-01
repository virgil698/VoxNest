import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Spin, 
  message,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { usePostStore } from '../../stores/postStore';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, isLoadingDetail, loadPost, deletePost, clearCurrentPost } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      const postId = parseInt(id, 10);
      if (!isNaN(postId)) {
        loadPost(postId).catch(() => {
          message.error('加载帖子详情失败');
          navigate('/');
        });
      } else {
        message.error('无效的帖子ID');
        navigate('/');
      }
    }

    return () => {
      clearCurrentPost();
    };
  }, [id, loadPost, clearCurrentPost, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!currentPost) return;
    
    try {
      await deletePost(currentPost.id);
      message.success('帖子删除成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '删除帖子失败');
    }
  };

  if (isLoadingDetail) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text>帖子不存在</Text>
        <br />
        <Button onClick={handleBack} style={{ marginTop: '16px' }}>
          返回
        </Button>
      </div>
    );
  }

  const isAuthor = isAuthenticated && user && user.id === currentPost.author.id;

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          返回
        </Button>
        
        {isAuthor && (
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => message.info('编辑功能暂未实现')}
            >
              编辑
            </Button>
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除
            </Button>
          </Space>
        )}
      </div>

      <Card>
        {/* 帖子标题 */}
        <Title level={1} style={{ marginBottom: '16px' }}>
          {currentPost.title}
        </Title>

        {/* 作者和发布时间信息 */}
        <div style={{ 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Space>
            <Avatar 
              src={currentPost.author.avatar} 
              size="large"
            >
              {currentPost.author.displayName?.[0] || currentPost.author.username[0]}
            </Avatar>
            <div>
              <div>
                <Text strong style={{ fontSize: '16px' }}>
                  {currentPost.author.displayName || currentPost.author.username}
                </Text>
              </div>
              <div>
                <Text type="secondary">
                  发布于 {dayjs(currentPost.publishedAt || currentPost.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
                {currentPost.updatedAt !== currentPost.createdAt && (
                  <>
                    <Text type="secondary"> • </Text>
                    <Text type="secondary">
                      更新于 {dayjs(currentPost.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </>
                )}
              </div>
            </div>
          </Space>
        </div>

        {/* 分类和标签 */}
        {(currentPost.category || currentPost.tags.length > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <Space wrap>
              {currentPost.category && (
                <Tag color="blue" style={{ fontSize: '14px' }}>
                  {currentPost.category.name}
                </Tag>
              )}
              {currentPost.tags.map(tag => (
                <Tag key={tag.id} color={tag.color || 'default'}>
                  {tag.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 帖子内容 */}
        <div style={{ 
          marginBottom: '24px',
          lineHeight: '1.8',
          fontSize: '16px'
        }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {currentPost.content}
          </Paragraph>
        </div>

        <Divider />

        {/* 统计信息 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space size="large">
            <Space>
              <EyeOutlined />
              <Text>{currentPost.viewCount} 浏览</Text>
            </Space>
            <Space>
              <LikeOutlined />
              <Text>{currentPost.likeCount} 点赞</Text>
            </Space>
            <Space>
              <MessageOutlined />
              <Text>{currentPost.commentCount} 评论</Text>
            </Space>
          </Space>
          
          <Space>
            <Button icon={<LikeOutlined />}>
              点赞
            </Button>
            <Button>
              评论
            </Button>
          </Space>
        </div>
      </Card>

      {/* 评论区域 */}
      <Card style={{ marginTop: '24px' }} title="评论">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Text type="secondary">评论功能暂未实现</Text>
        </div>
      </Card>
    </div>
  );
};

export default PostDetail;
