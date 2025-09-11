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
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize from 'rehype-sanitize';

const { Title, Text } = Typography;

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
      <Card style={{ 
        marginBottom: '24px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0'
        }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            style={{ borderRadius: '8px' }}
          >
            返回
          </Button>
          
          {isAuthor && (
            <Space>
              <Button 
                icon={<EditOutlined />}
                onClick={() => message.info('编辑功能暂未实现')}
                style={{ borderRadius: '8px' }}
              >
                编辑
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                style={{ borderRadius: '8px' }}
              >
                删除
              </Button>
            </Space>
          )}
        </div>
      </Card>

      <Card className="voxnest-post-card" style={{ marginBottom: '24px' }}>
        {/* 帖子标题 */}
        <Title level={1} style={{ 
          marginBottom: '20px',
          fontSize: '28px',
          fontWeight: '700',
          lineHeight: '1.3',
          color: 'var(--text-primary)'
        }}>
          {currentPost.title}
        </Title>

        {/* 作者和发布时间信息 */}
        <div style={{ 
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Avatar 
            src={currentPost.author.avatar} 
            size={64}
            style={{
              border: '3px solid var(--primary-color)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}
          >
            {currentPost.author.displayName?.[0] || currentPost.author.username[0]}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ 
                fontSize: '18px',
                color: 'var(--text-primary)'
              }}>
                {currentPost.author.displayName || currentPost.author.username}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                发布于 {dayjs(currentPost.publishedAt || currentPost.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
              {currentPost.updatedAt !== currentPost.createdAt && (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>•</span>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    更新于 {dayjs(currentPost.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 分类和标签 */}
        {(currentPost.category || currentPost.tags.length > 0) && (
          <div style={{ marginBottom: '28px' }}>
            <Space wrap size={[8, 12]}>
              {currentPost.category && (
                <Tag 
                  color={undefined}
                  style={{ 
                    fontSize: '14px',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: '500'
                  }}
                >
                  {currentPost.category.name}
                </Tag>
              )}
              {currentPost.tags.map(tag => (
                <Tag 
                  key={tag.id} 
                  style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    background: tag.color ? tag.color : 'var(--bg-secondary)',
                    color: tag.color ? 'white' : 'var(--text-primary)',
                    border: tag.color ? 'none' : '1px solid var(--border-color)',
                    fontWeight: '500'
                  }}
                >
                  #{tag.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 帖子内容 */}
        <div style={{ 
          marginBottom: '32px',
          lineHeight: '1.8',
          fontSize: '16px',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            fontSize: '16px',
            lineHeight: '1.8',
            margin: 0
          }}>
            <MDEditor.Markdown 
              source={currentPost.content || ''}
              style={{ 
                backgroundColor: 'transparent',
                fontSize: '16px',
                lineHeight: '1.8',
                color: 'var(--text-primary)'
              }}
              rehypePlugins={[[rehypeSanitize]]}
            />
          </div>
        </div>

        <Divider style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />

        {/* 统计信息 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <Space size="large">
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <EyeOutlined style={{ color: 'var(--primary-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.viewCount}</Text>
            </Space>
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <LikeOutlined style={{ color: 'var(--error-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.likeCount}</Text>
            </Space>
            <Space style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)'
            }}>
              <MessageOutlined style={{ color: 'var(--success-color)' }} />
              <Text style={{ fontWeight: '500' }}>{currentPost.commentCount}</Text>
            </Space>
          </Space>
          
          <Space>
            <Button 
              icon={<LikeOutlined />}
              style={{
                borderRadius: '12px',
                padding: '8px 20px',
                fontWeight: '500',
                border: '2px solid var(--primary-color)',
                color: 'var(--primary-color)'
              }}
            >
              点赞
            </Button>
            <Button 
              type="primary"
              style={{
                borderRadius: '12px',
                padding: '8px 20px',
                fontWeight: '500',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none'
              }}
            >
              评论
            </Button>
          </Space>
        </div>
      </Card>

      {/* 评论区域 */}
      <Card 
        className="voxnest-post-card"
        style={{ marginTop: '24px' }}
        title={
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💬 全部回复 (0)
          </div>
        }
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <Text style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '8px'
          }}>
            还没有评论，快来抢沙发吧！
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            评论功能正在开发中...
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default PostDetail;
