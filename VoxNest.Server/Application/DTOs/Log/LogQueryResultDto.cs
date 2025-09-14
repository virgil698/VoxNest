namespace VoxNest.Server.Application.DTOs.Log;

/// <summary>
/// 日志查询结果DTO
/// </summary>
public class LogQueryResultDto
{
    /// <summary>
    /// 日志条目列表
    /// </summary>
    public IEnumerable<LogEntryDto> Items { get; set; } = new List<LogEntryDto>();

    /// <summary>
    /// 总记录数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// 每页大小
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 总页数
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// 是否有上一页
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;

    /// <summary>
    /// 是否有下一页
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;
}
