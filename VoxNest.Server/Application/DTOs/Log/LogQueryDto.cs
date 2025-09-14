using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Log;

/// <summary>
/// 日志查询DTO
/// </summary>
public class LogQueryDto
{
    /// <summary>
    /// 页码（从1开始）
    /// </summary>
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// 每页大小
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段
    /// </summary>
    public string SortBy { get; set; } = "createdAt";

    /// <summary>
    /// 排序方向（asc/desc）
    /// </summary>
    public string SortDirection { get; set; } = "desc";

    /// <summary>
    /// 日志级别过滤
    /// </summary>
    public Domain.Enums.LogLevel? Level { get; set; }

    /// <summary>
    /// 日志分类过滤
    /// </summary>
    public LogCategory? Category { get; set; }

    /// <summary>
    /// 用户ID过滤
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 搜索关键词（在消息和详细信息中搜索）
    /// </summary>
    [StringLength(200)]
    public string? Search { get; set; }

    /// <summary>
    /// 来源过滤
    /// </summary>
    [StringLength(200)]
    public string? Source { get; set; }

    /// <summary>
    /// IP地址过滤
    /// </summary>
    [StringLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// 开始时间
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 结束时间
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// HTTP状态码过滤
    /// </summary>
    public int? StatusCode { get; set; }

    /// <summary>
    /// 获取有效的页码
    /// </summary>
    public int GetValidPageNumber()
    {
        return Math.Max(1, PageNumber);
    }

    /// <summary>
    /// 获取有效的页面大小
    /// </summary>
    public int GetValidPageSize()
    {
        return Math.Min(100, Math.Max(1, PageSize));
    }
}
