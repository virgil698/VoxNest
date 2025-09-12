using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// Admin帖子管理DTO
/// </summary>
public class AdminPostDto
{
    /// <summary>
    /// 帖子ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 内容摘要
    /// </summary>
    public string? Summary { get; set; }

    /// <summary>
    /// 作者信息
    /// </summary>
    public PostAuthorDto Author { get; set; } = new();

    /// <summary>
    /// 分类信息
    /// </summary>
    public CategoryDto? Category { get; set; }

    /// <summary>
    /// 标签列表
    /// </summary>
    public List<TagDto> Tags { get; set; } = new();

    /// <summary>
    /// 帖子状态
    /// </summary>
    public PostStatus Status { get; set; }

    /// <summary>
    /// 状态名称
    /// </summary>
    public string StatusName { get; set; } = string.Empty;

    /// <summary>
    /// 浏览次数
    /// </summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// 评论数量
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 点赞数量
    /// </summary>
    public int LikeCount { get; set; }

    /// <summary>
    /// 是否置顶
    /// </summary>
    public bool IsSticky { get; set; }

    /// <summary>
    /// 是否推荐
    /// </summary>
    public bool IsFeatured { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// 帖子查询参数DTO
/// </summary>
public class AdminPostQueryDto
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
    /// 帖子状态筛选
    /// </summary>
    public PostStatus? Status { get; set; }

    /// <summary>
    /// 分类ID筛选
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 作者ID筛选
    /// </summary>
    public int? AuthorId { get; set; }

    /// <summary>
    /// 标签筛选
    /// </summary>
    public string? Tag { get; set; }

    /// <summary>
    /// 是否置顶筛选
    /// </summary>
    public bool? IsSticky { get; set; }

    /// <summary>
    /// 是否推荐筛选
    /// </summary>
    public bool? IsFeatured { get; set; }

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
/// 更新帖子状态DTO
/// </summary>
public class UpdatePostStatusDto
{
    /// <summary>
    /// 帖子状态
    /// </summary>
    public PostStatus Status { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}

/// <summary>
/// 批量操作帖子DTO
/// </summary>
public class BatchPostOperationDto
{
    /// <summary>
    /// 帖子ID列表
    /// </summary>
    public List<int> PostIds { get; set; } = new();

    /// <summary>
    /// 操作类型
    /// </summary>
    public string Operation { get; set; } = string.Empty;

    /// <summary>
    /// 操作参数
    /// </summary>
    public string? Parameters { get; set; }
}
