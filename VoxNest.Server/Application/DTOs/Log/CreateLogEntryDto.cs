using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Log;

/// <summary>
/// 创建日志条目请求DTO
/// </summary>
public class CreateLogEntryDto
{
    /// <summary>
    /// 日志级别
    /// </summary>
    [Required]
    public Domain.Enums.LogLevel Level { get; set; }

    /// <summary>
    /// 日志分类
    /// </summary>
    [Required]
    public LogCategory Category { get; set; }

    /// <summary>
    /// 日志消息
    /// </summary>
    [Required]
    [StringLength(2000)]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 详细信息
    /// </summary>
    [StringLength(10000)]
    public string? Details { get; set; }

    /// <summary>
    /// 异常信息
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// 来源
    /// </summary>
    [StringLength(200)]
    public string? Source { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    [StringLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// 用户代理
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// 请求URL
    /// </summary>
    [StringLength(500)]
    public string? RequestUrl { get; set; }

    /// <summary>
    /// HTTP方法
    /// </summary>
    [StringLength(10)]
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
    [StringLength(100)]
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// 元数据（JSON格式）
    /// </summary>
    public string? Metadata { get; set; }
}
