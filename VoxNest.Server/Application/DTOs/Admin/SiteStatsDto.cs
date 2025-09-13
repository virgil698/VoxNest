namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 站点统计DTO - 简化版，用于首页显示
/// </summary>
public class SiteStatsDto
{
    /// <summary>
    /// 总用户数
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// 在线用户数（通过前端活跃用户计算）
    /// </summary>
    public int OnlineUsers { get; set; }

    /// <summary>
    /// 已注册用户数（排除禁用用户）
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// 总帖子数
    /// </summary>
    public int TotalPosts { get; set; }

    /// <summary>
    /// 总评论数
    /// </summary>
    public int TotalComments { get; set; }

    /// <summary>
    /// 今日新增帖子数
    /// </summary>
    public int NewPostsToday { get; set; }

    /// <summary>
    /// 今日新增用户数
    /// </summary>
    public int NewUsersToday { get; set; }

    /// <summary>
    /// 最近7天活跃用户数
    /// </summary>
    public int RecentActiveUsers { get; set; }

    /// <summary>
    /// 统计生成时间
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
