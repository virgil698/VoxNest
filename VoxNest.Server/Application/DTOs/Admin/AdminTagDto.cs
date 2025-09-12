namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// Admin标签管理DTO
/// </summary>
public class AdminTagDto
{
    /// <summary>
    /// 标签ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 标签名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 标签图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UsageCount { get; set; }

    /// <summary>
    /// 是否热门
    /// </summary>
    public bool IsHot { get; set; }

    /// <summary>
    /// 排序序号
    /// </summary>
    public int Sort { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 最近使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
}

/// <summary>
/// 创建/更新标签DTO
/// </summary>
public class CreateUpdateTagDto
{
    /// <summary>
    /// 标签名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 标签图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 是否热门
    /// </summary>
    public bool IsHot { get; set; } = false;

    /// <summary>
    /// 排序序号
    /// </summary>
    public int Sort { get; set; } = 0;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;
}

/// <summary>
/// 标签查询参数DTO
/// </summary>
public class AdminTagQueryDto
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
    /// 是否热门筛选
    /// </summary>
    public bool? IsHot { get; set; }

    /// <summary>
    /// 是否启用筛选
    /// </summary>
    public bool? IsEnabled { get; set; }

    /// <summary>
    /// 使用次数最小值
    /// </summary>
    public int? MinUsageCount { get; set; }

    /// <summary>
    /// 排序字段
    /// </summary>
    public string SortBy { get; set; } = "UsageCount";

    /// <summary>
    /// 排序方向
    /// </summary>
    public string SortDirection { get; set; } = "desc";
}

/// <summary>
/// 标签统计DTO
/// </summary>
public class TagStatsDto
{
    /// <summary>
    /// 总标签数
    /// </summary>
    public int TotalTags { get; set; }

    /// <summary>
    /// 启用标签数
    /// </summary>
    public int EnabledTags { get; set; }

    /// <summary>
    /// 热门标签数
    /// </summary>
    public int HotTags { get; set; }

    /// <summary>
    /// 未使用标签数
    /// </summary>
    public int UnusedTags { get; set; }

    /// <summary>
    /// 最热门的标签
    /// </summary>
    public List<AdminTagDto> TopTags { get; set; } = new();

    /// <summary>
    /// 最近创建的标签
    /// </summary>
    public List<AdminTagDto> RecentTags { get; set; } = new();
}
