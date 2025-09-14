using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Log;

/// <summary>
/// 日志条目DTO
/// </summary>
public class LogEntryDto
{
    /// <summary>
    /// 日志ID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 日志级别
    /// </summary>
    public Domain.Enums.LogLevel Level { get; set; }

    /// <summary>
    /// 日志级别名称
    /// </summary>
    public string LevelName { get; set; } = string.Empty;

    /// <summary>
    /// 日志分类
    /// </summary>
    public LogCategory Category { get; set; }

    /// <summary>
    /// 日志分类名称
    /// </summary>
    public string CategoryName { get; set; } = string.Empty;

    /// <summary>
    /// 日志消息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 详细信息
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// 异常信息
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// 来源
    /// </summary>
    public string? Source { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 用户代理
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 请求URL
    /// </summary>
    public string? RequestUrl { get; set; }

    /// <summary>
    /// HTTP方法
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// HTTP状态码
    /// </summary>
    public int? StatusCode { get; set; }

    /// <summary>
    /// 请求耗时（毫秒）
    /// </summary>
    public long? Duration { get; set; }

    /// <summary>
    /// 相关实体ID
    /// </summary>
    public int? RelatedEntityId { get; set; }

    /// <summary>
    /// 相关实体类型
    /// </summary>
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// 元数据（JSON格式）
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
