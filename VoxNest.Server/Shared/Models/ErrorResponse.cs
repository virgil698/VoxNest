using System.Text.Json.Serialization;

namespace VoxNest.Server.Shared.Models;

/// <summary>
/// 统一错误响应模型
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// 错误代码
    /// </summary>
    [JsonPropertyName("errorCode")]
    public string ErrorCode { get; set; } = string.Empty;

    /// <summary>
    /// 错误消息
    /// </summary>
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 详细错误信息
    /// </summary>
    [JsonPropertyName("details")]
    public string? Details { get; set; }

    /// <summary>
    /// 请求追踪ID
    /// </summary>
    [JsonPropertyName("traceId")]
    public string? TraceId { get; set; }

    /// <summary>
    /// 时间戳
    /// </summary>
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 请求路径
    /// </summary>
    [JsonPropertyName("path")]
    public string? Path { get; set; }

    /// <summary>
    /// HTTP方法
    /// </summary>
    [JsonPropertyName("method")]
    public string? Method { get; set; }

    /// <summary>
    /// 是否成功（固定为false）
    /// </summary>
    [JsonPropertyName("success")]
    public bool Success { get; set; } = false;

    /// <summary>
    /// 创建错误响应
    /// </summary>
    public static ErrorResponse Create(string errorCode, string message, string? details = null, string? traceId = null, string? path = null, string? method = null)
    {
        return new ErrorResponse
        {
            ErrorCode = errorCode,
            Message = message,
            Details = details,
            TraceId = traceId,
            Path = path,
            Method = method,
            Timestamp = DateTime.UtcNow
        };
    }
}

/// <summary>
/// 错误代码常量
/// </summary>
public static class ErrorCodes
{
    // 通用错误
    public const string INTERNAL_ERROR = "INTERNAL_ERROR";
    public const string VALIDATION_ERROR = "VALIDATION_ERROR";
    public const string NOT_FOUND = "NOT_FOUND";
    public const string UNAUTHORIZED = "UNAUTHORIZED";
    public const string FORBIDDEN = "FORBIDDEN";
    public const string BAD_REQUEST = "BAD_REQUEST";

    // 安装相关错误
    public const string INSTALL_CONFIG_ERROR = "INSTALL_CONFIG_ERROR";
    public const string INSTALL_DB_ERROR = "INSTALL_DB_ERROR";
    public const string INSTALL_ALREADY_COMPLETED = "INSTALL_ALREADY_COMPLETED";
    public const string INSTALL_ADMIN_CREATE_ERROR = "INSTALL_ADMIN_CREATE_ERROR";

    // 数据库相关错误
    public const string DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR";
    public const string DATABASE_MIGRATION_ERROR = "DATABASE_MIGRATION_ERROR";
    public const string DATABASE_SEEDING_ERROR = "DATABASE_SEEDING_ERROR";
    public const string DATABASE_TABLE_MISSING = "DATABASE_TABLE_MISSING";

    // 认证相关错误
    public const string AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED";
    public const string AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID";
    public const string AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
}
