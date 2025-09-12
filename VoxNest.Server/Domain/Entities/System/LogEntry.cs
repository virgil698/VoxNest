using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Domain.Entities.System;

/// <summary>
/// 日志条目实体
/// </summary>
public class LogEntry
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
    /// 日志分类
    /// </summary>
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
    public string? Details { get; set; }

    /// <summary>
    /// 异常信息
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// 来源（类名/模块名）
    /// </summary>
    [StringLength(200)]
    public string? Source { get; set; }

    /// <summary>
    /// 用户ID（如果有关联用户）
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 用户IP地址
    /// </summary>
    [StringLength(45)] // IPv6最大长度
    public string? IpAddress { get; set; }

    /// <summary>
    /// 用户代理字符串
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
    /// 响应状态码
    /// </summary>
    public int? StatusCode { get; set; }

    /// <summary>
    /// 请求持续时间（毫秒）
    /// </summary>
    public long? Duration { get; set; }

    /// <summary>
    /// 关联的实体ID
    /// </summary>
    public int? RelatedEntityId { get; set; }

    /// <summary>
    /// 关联的实体类型
    /// </summary>
    [StringLength(100)]
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// 额外的元数据（JSON格式）
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 关联的用户（导航属性）
    /// </summary>
    public User.User? User { get; set; }
}
