import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Avatar, 
  Typography, 
  Button, 
  Spin, 
  message,
  Row,
  Col,
  Tooltip
} from 'antd';
import { 
  MessageOutlined,
  HeartOutlined,
  ShareAltOutlined,
  MoreOutlined,
  UserOutlined
} from '@ant-design/icons';
import { usePostStore } from '../../stores/postStore';
import dayjs from 'dayjs';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import '../../styles/PostDetailDiscourse.css';

const { Title, Text } = Typography;

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, isLoadingDetail, loadPost, clearCurrentPost } = usePostStore();

  // 暂时移除站点统计功能，专注于Discourse风格布局

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

  // 站点统计功能暂时移除，专注于Discourse风格布局

  const handleBack = () => {
    navigate(-1);
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


  return (
    <div className="discourse-post-layout">
      <Row gutter={[24, 24]}>
        {/* 主内容区域 - Discourse风格 */}
        <Col xs={24} lg={18}>
          <div className="discourse-main-content">
            
            {/* 帖子头部区域 */}
            <div className="discourse-post-header">
              {/* 分类标签 */}
              {currentPost.category && (
                <div className="discourse-category-tag">
                  {currentPost.category.name}
                </div>
              )}
              
              {/* 帖子标题 */}
              <Title className="discourse-post-title">
                {currentPost.title}
              </Title>
              
              {/* 标签列表 */}
              {currentPost.tags.length > 0 && (
                <div className="discourse-tag-cloud">
                  {currentPost.tags.map((tag) => (
                    <Link key={tag.id} to={`/tags/${tag.id}`} className="discourse-tag">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 用户信息区域 */}
            <div className="discourse-user-info">
              <Link to={`/user/${currentPost.author.id}`}>
                <Avatar 
                  src={currentPost.author.avatar} 
                  className="discourse-user-avatar"
                  icon={<UserOutlined />}
                >
                  {currentPost.author.displayName?.[0] || currentPost.author.username[0]}
                </Avatar>
              </Link>
              
              <div className="discourse-user-details">
                <Title level={4}>
                  <Link 
                    to={`/user/${currentPost.author.id}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {currentPost.author.displayName || currentPost.author.username}
                  </Link>
                </Title>
                
                <div className="discourse-user-meta">
                  <span>{dayjs(currentPost.publishedAt || currentPost.createdAt).fromNow()}</span>
                  {currentPost.updatedAt !== currentPost.createdAt && (
                    <>
                      <span>•</span>
                      <span className="discourse-edit-history">
                        编辑于 {dayjs(currentPost.updatedAt).fromNow()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 帖子内容区域 */}
            <div className="discourse-post-content">
              <MarkdownRenderer
                content={currentPost.content || ''}
                theme="light"
                previewTheme="github"
                codeTheme="github"
              />
            </div>

            {/* 现代化交互栏 */}
            <div className="modern-interaction-bar">
              {/* 左侧 - Emoji反应区域 */}
              <div className="interaction-reactions">
                <div className="reaction-group">
                  <span className="reaction-emojis">❤️😢</span>
                  <span className="reaction-count">{currentPost.likeCount || 35}</span>
                </div>
              </div>
              
              {/* 右侧 - 操作按钮 */}
              <div className="interaction-actions">
                <Tooltip title="点赞">
                  <Button 
                    className="action-btn"
                    icon={<HeartOutlined />}
                    type="text"
                    size="small"
                  />
                </Tooltip>
                
                <Tooltip title="分享链接">
                  <Button 
                    className="action-btn"
                    icon={<ShareAltOutlined />}
                    type="text"
                    size="small"
                  />
                </Tooltip>
                
                <Tooltip title="更多选项">
                  <Button 
                    className="action-btn"
                    icon={<MoreOutlined />}
                    type="text"
                    size="small"
                  />
                </Tooltip>
                
                <Button 
                  className="reply-btn"
                  type="text"
                  size="small"
                >
                  回复
                </Button>
              </div>
            </div>
          </div>

          {/* 评论区域 */}
          <div className="discourse-main-content" style={{ marginTop: '16px' }}>
            <div className="discourse-post-header">
              <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageOutlined />
                回复 ({currentPost.commentCount})
              </Title>
            </div>
            
            <div style={{ 
              padding: '60px 24px',
              textAlign: 'center',
              background: '#f6f8fa',
              borderTop: '1px solid #e1e4e8'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <Text style={{ fontSize: '16px', color: '#586069', marginBottom: '8px', display: 'block' }}>
                还没有回复，开始讨论吧！
              </Text>
              <Text style={{ fontSize: '14px', color: '#6a737d' }}>
                回复功能正在开发中...
              </Text>
            </div>
          </div>
        </Col>

        {/* 右侧时间线 - 简洁风格 */}
        <Col xs={24} lg={6}>
          <div className="discourse-timeline-container">
            {/* 作者头像 */}
            <div className="discourse-timeline-avatar">
              <Avatar 
                src={currentPost.author.avatar} 
                size={44}
                style={{ 
                  backgroundColor: '#6b7280',
                  border: '2px solid #e5e7eb'
                }}
                icon={<UserOutlined />}
              >
                {(currentPost.author.displayName?.[0] || currentPost.author.username[0])?.toUpperCase()}
              </Avatar>
            </div>

            {/* 类别图标 */}
            <div className="discourse-timeline-category">
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                border: '2px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#6b7280'
              }}>
                📖
              </div>
            </div>

            {/* 发布时间 */}
            <div className="discourse-timeline-date">
              {dayjs(currentPost.publishedAt || currentPost.createdAt).format('M月D日')}
            </div>

            {/* 楼层信息 */}
            <div className="discourse-timeline-floor">
              <div className="discourse-timeline-floor-number">
                1/{currentPost.commentCount + 1}
              </div>
              <div className="discourse-timeline-floor-date">
                {dayjs(currentPost.updatedAt || currentPost.createdAt).format('M月D日')}
              </div>
            </div>

            {/* 时间线 */}
            <div className="discourse-timeline-line"></div>

            {/* 活跃时间 */}
            <div className="discourse-timeline-activity">
              {dayjs(currentPost.updatedAt || currentPost.createdAt).fromNow()}
            </div>

            {/* 操作按钮 */}
            <div className="discourse-timeline-actions">
              <Tooltip title="返回">
                <Button 
                  shape="circle" 
                  icon={<ShareAltOutlined style={{ transform: 'rotate(180deg)' }} />}
                  onClick={() => window.history.back()}
                />
              </Tooltip>
              <Tooltip title="通知">
                <Button 
                  shape="circle" 
                  icon={<MessageOutlined />}
                />
              </Tooltip>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PostDetail;
