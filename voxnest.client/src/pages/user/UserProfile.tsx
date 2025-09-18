import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Avatar, 
  Typography, 
  Spin, 
  message,
  Empty
} from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  EyeOutlined, 
  HeartOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  UserAddOutlined,
  TeamOutlined,
  TrophyOutlined,
  CommentOutlined,
  SoundOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { getUserProfile, getUserProfileById, type UserProfilePageDto, type UserRecentPostDto } from '../../api/userProfile';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import '../../styles/pages/UserProfile.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// const { Title, Text, Paragraph } = Typography;

const UserProfile: React.FC = () => {
  const { username, id } = useParams<{ username?: string; id?: string }>();
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfilePageDto | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username && !id) {
        message.error('缺少用户标识参数');
        return;
      }

      try {
        setLoading(true);
        let data: UserProfilePageDto;
        
        if (id) {
          // 通过用户ID获取用户资料
          const userId = parseInt(id, 10);
          if (isNaN(userId)) {
            message.error('无效的用户ID');
            return;
          }
          data = await getUserProfileById(userId);
        } else if (username) {
          // 通过用户名获取用户资料
          data = await getUserProfile(username);
        } else {
          message.error('缺少有效的用户标识');
          return;
        }
        
        setProfileData(data);
      } catch (error) {
        console.error('获取用户资料失败:', error);
        if (error instanceof Error) {
          if (error.message.includes('用户不存在')) {
            message.error('用户不存在');
          } else {
            message.error(error.message);
          }
        } else {
          message.error('获取用户资料失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, id]);

  // const handleBack = () => {
  //   navigate(-1);
  // };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日');
  };

  const getRelativeTime = (dateString: string) => {
    return dayjs(dateString).fromNow();
  };

  const formatBirthday = (dateString: string) => {
    const date = dayjs(dateString);
    return `${date.month() + 1}月${date.date()}日`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Empty description="用户资料加载失败" />
      </div>
    );
  }

  const { profile, recentPosts } = profileData;

  return (
    <div className="user-profile-container">
      {/* 头部背景和用户信息 */}
      <div className="user-profile-header">
        <div className="user-profile-header-content">
          {/* 左侧头像 */}
          <div className="user-profile-avatar-wrapper">
            <Avatar 
              className="user-profile-avatar"
              src={profile.avatar}
              icon={<UserOutlined />}
            />
          </div>
          
          {/* 右侧用户信息 */}
          <div className="user-profile-info">
            <div className="user-profile-basic">
              <Typography.Title className="user-profile-name">
                {profile.displayName || profile.username}
              </Typography.Title>
              <Typography.Text className="user-profile-username">
                @{profile.username}
              </Typography.Text>
              
              {/* 角色徽章 */}
              <div className="user-profile-badges">
                {profile.roles.map(role => (
                  <span key={role} className="user-profile-badge">{role}</span>
                ))}
              </div>
              
              {/* 用户详细信息 */}
              <div className="user-profile-details">
                <span className="user-profile-detail">
                  <CalendarOutlined />
                  加入于 {formatDate(profile.createdAt)}
                </span>
                {profile.lastLoginAt && (
                  <span className="user-profile-detail">
                    <UserAddOutlined />
                    最后活跃：{getRelativeTime(profile.lastLoginAt)}
                  </span>
                )}
                {profile.location && (
                  <span className="user-profile-detail">
                    <EnvironmentOutlined />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <span className="user-profile-detail">
                    <LinkOutlined />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="user-profile-link"
                    >
                      个人网站
                    </a>
                  </span>
                )}
              </div>
            </div>
            
            {/* 个人介绍 */}
            {profile.bio && (
              <div className="user-profile-bio">
                <div className="user-profile-bio-content">{profile.bio}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="user-profile-main">
        {/* 左侧：用户帖子列表 */}
        <div className="user-posts-section">
          <div className="user-posts-header">
            <Typography.Title className="user-posts-title">
              <FileTextOutlined />
              用户帖子
            </Typography.Title>
          </div>
          
          <div className="user-posts-list">
            {recentPosts.length > 0 ? (
              recentPosts.map((post: UserRecentPostDto) => (
                <div key={post.id} className="user-post-card">
                  <Link to={`/posts/${post.id}`} className="user-post-title">
                    {post.title}
                  </Link>
                  
                  {post.summary && (
                    <div className="user-post-summary">{post.summary}</div>
                  )}
                  
                  {post.tags.length > 0 && (
                    <div className="user-post-tags">
                      {post.tags.map(tag => (
                        <Link key={tag} to={`/tags/${tag}`} className="user-post-tag">
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  <div className="user-post-footer">
                    <div className="user-post-author">
                      <span>{profile.displayName || profile.username} • {getRelativeTime(post.createdAt)}</span>
                    </div>
                    <div className="user-post-stats">
                      <div className="user-post-stat">
                        <EyeOutlined />
                        <span>{post.viewCount}</span>
                      </div>
                      <div className="user-post-stat">
                        <HeartOutlined />
                        <span>{post.likeCount}</span>
                      </div>
                      <div className="user-post-stat">
                        <CommentOutlined />
                        <span>{post.commentCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="user-posts-empty">
                <FileTextOutlined />
                <div className="user-posts-empty-text">该用户还没有发布任何帖子</div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：工具栏 */}
        <div className="user-toolbar">
          {/* 关注统计 */}
          <div className="user-toolbar-card">
            <div className="user-toolbar-header">
              <Typography.Title className="user-toolbar-title">
                <TeamOutlined />
                社交统计
              </Typography.Title>
            </div>
            <div className="user-toolbar-content">
              <div className="user-stats-grid">
                <div className="user-stat-item">
                  <div className="user-stat-number">
                    {profile.stats?.followingCount || 0}
                  </div>
                  <div className="user-stat-label">关注</div>
                </div>
                <div className="user-stat-item">
                  <div className="user-stat-number">
                    {profile.stats?.followerCount || 0}
                  </div>
                  <div className="user-stat-label">粉丝</div>
                </div>
                <div className="user-stat-item">
                  <div className="user-stat-number">
                    {profile.stats?.postCount || 0}
                  </div>
                  <div className="user-stat-label">帖子</div>
                </div>
                <div className="user-stat-item">
                  <div className="user-stat-number">
                    {profile.stats?.likeCount || 0}
                  </div>
                  <div className="user-stat-label">获赞</div>
                </div>
              </div>
            </div>
          </div>

          {/* 用户公告 */}
          <div className="user-toolbar-card">
            <div className="user-toolbar-header">
              <Typography.Title className="user-toolbar-title">
                <SoundOutlined />
                用户公告
              </Typography.Title>
            </div>
            <div className="user-toolbar-content">
              {/* TODO: 这里应该从后端获取用户公告数据 */}
              <div className="user-announcement-empty">
                该用户还没有发布任何公告
              </div>
            </div>
          </div>

          {/* 个人资料 */}
          <div className="user-toolbar-card">
            <div className="user-toolbar-header">
              <Typography.Title className="user-toolbar-title">
                <IdcardOutlined />
                个人资料
              </Typography.Title>
            </div>
            <div className="user-toolbar-content">
              <ul className="user-info-list">
                <li className="user-info-item">
                  <UserOutlined />
                  <span>UID: {profile.id}</span>
                </li>
                
                {profile.birthday && (
                  <li className="user-info-item">
                    <CalendarOutlined />
                    <span>生日: {formatBirthday(profile.birthday)}</span>
                  </li>
                )}
                
                {profile.gender && (
                  <li className="user-info-item">
                    <UserOutlined />
                    <span>性别: {profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '其他'}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* 用户成就 */}
          {profile.stats && (
            <div className="user-toolbar-card">
              <div className="user-toolbar-header">
                <Typography.Title className="user-toolbar-title">
                  <TrophyOutlined />
                  用户成就
                </Typography.Title>
              </div>
              <div className="user-toolbar-content">
                <ul className="user-info-list">
                  <li className="user-info-item">
                    <TrophyOutlined />
                    <span>等级 {profile.stats.level} ({profile.stats.experience} 经验值)</span>
                  </li>
                  
                  {profile.stats.continuousSignInDays > 0 && (
                    <li className="user-info-item">
                      <CalendarOutlined />
                      <span>连续签到 {profile.stats.continuousSignInDays} 天</span>
                    </li>
                  )}
                  
                  <li className="user-info-item">
                    <EyeOutlined />
                    <span>累计浏览 {profile.stats.viewCount} 次</span>
                  </li>
                  
                  <li className="user-info-item">
                    <CommentOutlined />
                    <span>发布评论 {profile.stats.commentCount} 条</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
