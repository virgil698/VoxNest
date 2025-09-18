using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.User;

/// <summary>
/// 用户个人主页公开资料DTO
/// </summary>
public class UserProfileDto
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 头像URL
    /// </summary>
    public string? Avatar { get; set; }

    /// <summary>
    /// 个人简介
    /// </summary>
    public string? Bio { get; set; }

    /// <summary>
    /// 所在地
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// 个人网站
    /// </summary>
    public string? Website { get; set; }

    /// <summary>
    /// 生日
    /// </summary>
    public DateTime? Birthday { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    public string? Gender { get; set; }

    /// <summary>
    /// 用户状态
    /// </summary>
    public UserStatus Status { get; set; }

    /// <summary>
    /// 注册时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 用户角色
    /// </summary>
    public List<string> Roles { get; set; } = new();

    /// <summary>
    /// 用户统计信息
    /// </summary>
    public UserStatsDto? Stats { get; set; }
}

/// <summary>
/// 用户统计信息DTO
/// </summary>
public class UserStatsDto
{
    /// <summary>
    /// 帖子总数
    /// </summary>
    public int PostCount { get; set; }

    /// <summary>
    /// 评论总数
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 获得的点赞数
    /// </summary>
    public int LikeCount { get; set; }

    /// <summary>
    /// 浏览量
    /// </summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// 关注者数量
    /// </summary>
    public int FollowerCount { get; set; }

    /// <summary>
    /// 关注的数量
    /// </summary>
    public int FollowingCount { get; set; }

    /// <summary>
    /// 积分
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// 等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 经验值
    /// </summary>
    public int Experience { get; set; }

    /// <summary>
    /// 连续签到天数
    /// </summary>
    public int ContinuousSignInDays { get; set; }

    /// <summary>
    /// 最后签到时间
    /// </summary>
    public DateTime? LastSignInAt { get; set; }

    /// <summary>
    /// 最后活跃时间
    /// </summary>
    public DateTime LastActiveAt { get; set; }
}

/// <summary>
/// 用户最近活动DTO
/// </summary>
public class UserRecentActivityDto
{
    /// <summary>
    /// 活动ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 活动类型（发布帖子、发布评论、点赞等）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 活动描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 相关链接
    /// </summary>
    public string? Link { get; set; }

    /// <summary>
    /// 活动时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 用户最近帖子DTO
/// </summary>
public class UserRecentPostDto
{
    /// <summary>
    /// 帖子ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 帖子标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 帖子内容摘要
    /// </summary>
    public string? Summary { get; set; }

    /// <summary>
    /// 浏览次数
    /// </summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// 点赞次数
    /// </summary>
    public int LikeCount { get; set; }

    /// <summary>
    /// 评论次数
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 标签列表
    /// </summary>
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// 用户个人主页完整信息DTO
/// </summary>
public class UserProfilePageDto
{
    /// <summary>
    /// 用户基本信息
    /// </summary>
    public UserProfileDto Profile { get; set; } = null!;

    /// <summary>
    /// 最近活动列表
    /// </summary>
    public List<UserRecentActivityDto> RecentActivities { get; set; } = new();

    /// <summary>
    /// 最近帖子列表
    /// </summary>
    public List<UserRecentPostDto> RecentPosts { get; set; } = new();
}
