namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 站点概览DTO
/// </summary>
public class SiteOverviewDto
{
    /// <summary>
    /// 用户统计
    /// </summary>
    public UserStatsDto UserStats { get; set; } = new();

    /// <summary>
    /// 帖子统计
    /// </summary>
    public PostStatsDto PostStats { get; set; } = new();

    /// <summary>
    /// 系统统计
    /// </summary>
    public SystemStatsDto SystemStats { get; set; } = new();

    /// <summary>
    /// 最近活动
    /// </summary>
    public RecentActivityDto RecentActivity { get; set; } = new();
}

/// <summary>
/// 用户统计DTO
/// </summary>
public class UserStatsDto
{
    /// <summary>
    /// 总用户数
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// 今日新增用户
    /// </summary>
    public int NewUsersToday { get; set; }

    /// <summary>
    /// 活跃用户数（7天内）
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// 在线用户数
    /// </summary>
    public int OnlineUsers { get; set; }

    /// <summary>
    /// 最近7天新增用户数据
    /// </summary>
    public Dictionary<DateTime, int> RecentNewUsers { get; set; } = new();

    /// <summary>
    /// 用户状态分布
    /// </summary>
    public Dictionary<string, int> UserStatusDistribution { get; set; } = new();
}

/// <summary>
/// 帖子统计DTO
/// </summary>
public class PostStatsDto
{
    /// <summary>
    /// 总帖子数
    /// </summary>
    public int TotalPosts { get; set; }

    /// <summary>
    /// 今日新增帖子
    /// </summary>
    public int NewPostsToday { get; set; }

    /// <summary>
    /// 总评论数
    /// </summary>
    public int TotalComments { get; set; }

    /// <summary>
    /// 今日新增评论
    /// </summary>
    public int NewCommentsToday { get; set; }

    /// <summary>
    /// 最近7天帖子数据
    /// </summary>
    public Dictionary<DateTime, int> RecentPosts { get; set; } = new();

    /// <summary>
    /// 分类统计
    /// </summary>
    public Dictionary<string, int> CategoryDistribution { get; set; } = new();

    /// <summary>
    /// 热门标签
    /// </summary>
    public Dictionary<string, int> PopularTags { get; set; } = new();
}

/// <summary>
/// 系统统计DTO
/// </summary>
public class SystemStatsDto
{
    /// <summary>
    /// 总存储空间（字节）
    /// </summary>
    public long TotalStorage { get; set; }

    /// <summary>
    /// 已使用存储空间（字节）
    /// </summary>
    public long UsedStorage { get; set; }

    /// <summary>
    /// 数据库大小（字节）
    /// </summary>
    public long DatabaseSize { get; set; }

    /// <summary>
    /// 系统运行时间（秒）
    /// </summary>
    public long Uptime { get; set; }

    /// <summary>
    /// 内存使用量（字节）
    /// </summary>
    public long MemoryUsage { get; set; }

    /// <summary>
    /// CPU使用率（百分比）
    /// </summary>
    public double CpuUsage { get; set; }

    /// <summary>
    /// 扩展插件数量
    /// </summary>
    public int ExtensionCount { get; set; }

    /// <summary>
    /// 已激活的扩展数量
    /// </summary>
    public int ActiveExtensionCount { get; set; }
}

/// <summary>
/// 最近活动DTO
/// </summary>
public class RecentActivityDto
{
    /// <summary>
    /// 最近用户注册
    /// </summary>
    public List<UserActivityDto> RecentRegistrations { get; set; } = new();

    /// <summary>
    /// 最近帖子
    /// </summary>
    public List<PostActivityDto> RecentPosts { get; set; } = new();

    /// <summary>
    /// 最近评论
    /// </summary>
    public List<CommentActivityDto> RecentComments { get; set; } = new();

    /// <summary>
    /// 系统事件
    /// </summary>
    public List<SystemEventDto> SystemEvents { get; set; } = new();
}

/// <summary>
/// 用户活动DTO
/// </summary>
public class UserActivityDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// 帖子活动DTO
/// </summary>
public class PostActivityDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ViewCount { get; set; }
}

/// <summary>
/// 评论活动DTO
/// </summary>
public class CommentActivityDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string PostTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 系统事件DTO
/// </summary>
public class SystemEventDto
{
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
}
