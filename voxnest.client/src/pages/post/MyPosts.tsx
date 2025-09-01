import React, { useEffect } from 'react';
import { Card, List, Typography, Button, Empty, Space, Tag, message } from 'antd';
import { PlusOutlined, EyeOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../../stores/postStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const MyPosts: React.FC = () => {
  const navigate = useNavigate();
  const { 
    myPosts, 
    isLoadingMyPosts, 
    myPostsTotalCount, 
    loadMyPosts 
  } = usePostStore();

  useEffect(() => {
    loadMyPosts({ pageNumber: 1, pageSize: 10 }).catch(() => {
      message.error('加载我的帖子失败');
    });
  }, [loadMyPosts]);

  const handlePostClick = (postId: number) => {
    navigate(`/posts/${postId}`);
  };

  const handleCreatePost = () => {
    navigate('/posts/create');
  };

  return (
    <div>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={2}>我的帖子</Title>
          <Text type="secondary">
            共 {myPostsTotalCount} 篇帖子
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreatePost}
        >
          发布新帖子
        </Button>
      </div>

      {myPosts.length === 0 && !isLoadingMyPosts ? (
        <Empty 
          description="您还没有发布任何帖子"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={handleCreatePost}>
            发布第一篇帖子
          </Button>
        </Empty>
      ) : (
        <List
          loading={isLoadingMyPosts}
          dataSource={myPosts}
          renderItem={(post) => (
            <List.Item key={post.id}>
              <Card 
                hoverable 
                style={{ width: '100%' }}
                onClick={() => handlePostClick(post.id)}
              >
                <Title level={4} style={{ marginBottom: '8px' }}>
                  {post.title}
                </Title>
                
                {post.summary && (
                  <Paragraph 
                    ellipsis={{ rows: 2 }} 
                    style={{ marginBottom: '12px', color: '#666' }}
                  >
                    {post.summary}
                  </Paragraph>
                )}
                
                <div style={{ marginBottom: '12px' }}>
                  <Space wrap>
                    {post.category && (
                      <Tag color="blue">{post.category.name}</Tag>
                    )}
                    {post.tags.map(tag => (
                      <Tag key={tag.id} color={tag.color || 'default'}>
                        {tag.name}
                      </Tag>
                    ))}
                  </Space>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Text type="secondary">
                    {dayjs(post.publishedAt || post.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                  
                  <Space size="large">
                    <Space size="small">
                      <EyeOutlined />
                      <span>{post.viewCount}</span>
                    </Space>
                    <Space size="small">
                      <LikeOutlined />
                      <span>{post.likeCount}</span>
                    </Space>
                    <Space size="small">
                      <MessageOutlined />
                      <span>{post.commentCount}</span>
                    </Space>
                  </Space>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default MyPosts;
