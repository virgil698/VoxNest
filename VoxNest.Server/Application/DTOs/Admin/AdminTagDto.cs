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
    /// 标签别名（用于URL）
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UseCount { get; set; }

    /// <summary>
    /// 是否为常驻标签
    /// </summary>
    public bool IsPermanent { get; set; }

    /// <summary>
    /// 创建者ID（动态标签）
    /// </summary>
    public int? CreatedBy { get; set; }

    /// <summary>
    /// 创建者用户名（动态标签）
    /// </summary>
    public string? CreatorName { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最近使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
}

/// <summary>
/// 创建标签DTO
/// </summary>
public class CreateTagDto
{
    /// <summary>
    /// 标签名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 是否为常驻标签（只有管理员可以创建常驻标签）
    /// </summary>
    public bool IsPermanent { get; set; } = false;
}

/// <summary>
/// 更新标签DTO
/// </summary>
public class UpdateTagDto
{
    /// <summary>
    /// 标签名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }
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
    /// 标签类型筛选（true: 常驻标签，false: 动态标签，null: 全部）
    /// </summary>
    public bool? IsPermanent { get; set; }

    /// <summary>
    /// 使用次数最小值
    /// </summary>
    public int? MinUseCount { get; set; }

    /// <summary>
    /// 创建者ID筛选（动态标签）
    /// </summary>
    public int? CreatedBy { get; set; }

    /// <summary>
    /// 排序字段
    /// </summary>
    public string SortBy { get; set; } = "UseCount";

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
    /// 常驻标签数
    /// </summary>
    public int PermanentTags { get; set; }

    /// <summary>
    /// 动态标签数
    /// </summary>
    public int DynamicTags { get; set; }

    /// <summary>
    /// 未使用标签数（UseCount = 0）
    /// </summary>
    public int UnusedTags { get; set; }

    /// <summary>
    /// 需要清理的动态标签数（未使用且超过清理时间）
    /// </summary>
    public int TagsToClean { get; set; }

    /// <summary>
    /// 最热门的标签
    /// </summary>
    public List<AdminTagDto> TopTags { get; set; } = new();

    /// <summary>
    /// 最近创建的标签
    /// </summary>
    public List<AdminTagDto> RecentTags { get; set; } = new();
}
