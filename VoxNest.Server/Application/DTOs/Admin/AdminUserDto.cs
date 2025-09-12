using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// Admin用户管理DTO
/// </summary>
public class AdminUserDto
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
    /// 邮箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 头像
    /// </summary>
    public string? Avatar { get; set; }

    /// <summary>
    /// 用户状态
    /// </summary>
    public UserStatus Status { get; set; }

    /// <summary>
    /// 状态名称
    /// </summary>
    public string StatusName { get; set; } = string.Empty;

    /// <summary>
    /// 角色列表
    /// </summary>
    public List<string> Roles { get; set; } = new();

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 用户统计
    /// </summary>
    public AdminUserStatsDto? Stats { get; set; }
}

/// <summary>
/// Admin用户统计DTO
/// </summary>
public class AdminUserStatsDto
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
    /// 积分
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// 等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 最后活跃时间
    /// </summary>
    public DateTime LastActiveAt { get; set; }
}

/// <summary>
/// 用户查询参数DTO
/// </summary>
public class AdminUserQueryDto
{
    /// <summary>
    /// 页码
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// 页面大小
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 搜索关键词
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 用户状态筛选
    /// </summary>
    public UserStatus? Status { get; set; }

    /// <summary>
    /// 角色筛选
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// 开始时间
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 结束时间
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 排序字段
    /// </summary>
    public string SortBy { get; set; } = "CreatedAt";

    /// <summary>
    /// 排序方向
    /// </summary>
    public string SortDirection { get; set; } = "desc";
}

/// <summary>
/// 更新用户状态DTO
/// </summary>
public class UpdateUserStatusDto
{
    /// <summary>
    /// 用户状态
    /// </summary>
    public UserStatus Status { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}

/// <summary>
/// 用户角色更新DTO
/// </summary>
public class UpdateUserRolesDto
{
    /// <summary>
    /// 角色ID列表
    /// </summary>
    public List<int> RoleIds { get; set; } = new();
}
