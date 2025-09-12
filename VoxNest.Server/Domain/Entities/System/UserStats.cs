using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.System;

/// <summary>
/// 用户统计实体
/// </summary>
public class UserStats
{
    /// <summary>
    /// 统计ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 帖子总数
    /// </summary>
    public int PostCount { get; set; } = 0;

    /// <summary>
    /// 评论总数
    /// </summary>
    public int CommentCount { get; set; } = 0;

    /// <summary>
    /// 获得的点赞数
    /// </summary>
    public int LikeCount { get; set; } = 0;

    /// <summary>
    /// 浏览量
    /// </summary>
    public int ViewCount { get; set; } = 0;

    /// <summary>
    /// 关注者数量
    /// </summary>
    public int FollowerCount { get; set; } = 0;

    /// <summary>
    /// 关注的数量
    /// </summary>
    public int FollowingCount { get; set; } = 0;

    /// <summary>
    /// 积分
    /// </summary>
    public int Score { get; set; } = 0;

    /// <summary>
    /// 等级
    /// </summary>
    public int Level { get; set; } = 1;

    /// <summary>
    /// 经验值
    /// </summary>
    public int Experience { get; set; } = 0;

    /// <summary>
    /// 连续签到天数
    /// </summary>
    public int ContinuousSignInDays { get; set; } = 0;

    /// <summary>
    /// 最后签到时间
    /// </summary>
    public DateTime? LastSignInAt { get; set; }

    /// <summary>
    /// 最后活跃时间
    /// </summary>
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 关联的用户（导航属性）
    /// </summary>
    public User.User User { get; set; } = null!;
}
