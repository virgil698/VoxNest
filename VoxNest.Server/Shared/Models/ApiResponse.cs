using System.Text.Json.Serialization;

namespace VoxNest.Server.Shared.Models;

/// <summary>
/// 统一API响应模型
/// </summary>
/// <typeparam name="T">数据类型</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// 是否成功
    /// </summary>
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    
    /// <summary>
    /// 是否成功（别名，兼容旧代码）
    /// </summary>
    [JsonIgnore]
    public bool IsSuccess => Success;

    /// <summary>
    /// 响应消息
    /// </summary>
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 响应数据
    /// </summary>
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    /// <summary>
    /// 错误代码
    /// </summary>
    [JsonPropertyName("errorCode")]
    public string? ErrorCode { get; set; }

    /// <summary>
    /// 错误详情
    /// </summary>
    [JsonPropertyName("errors")]
    public List<string>? Errors { get; set; }

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
    /// 分页信息（仅在分页查询时存在）
    /// </summary>
    [JsonPropertyName("pagination")]
    public PaginationInfo? Pagination { get; set; }

    /// <summary>
    /// 创建成功响应
    /// </summary>
    public static ApiResponse<T> CreateSuccess(T? data = default, string message = "操作成功")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 创建成功响应（带分页）
    /// </summary>
    public static ApiResponse<T> CreateSuccess(T? data, PaginationInfo pagination, string message = "查询成功")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            Pagination = pagination,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 创建错误响应
    /// </summary>
    public static ApiResponse<T> CreateError(string message, string? errorCode = null, List<string>? errors = null, string? traceId = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            ErrorCode = errorCode,
            Errors = errors,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 创建验证错误响应
    /// </summary>
    public static ApiResponse<T> CreateValidationError(List<string> validationErrors, string? traceId = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = "输入验证失败",
            ErrorCode = ErrorCodes.VALIDATION_ERROR,
            Errors = validationErrors,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow
        };
    }
}

/// <summary>
/// 分页信息
/// </summary>
public class PaginationInfo
{
    /// <summary>
    /// 当前页码
    /// </summary>
    [JsonPropertyName("currentPage")]
    public int CurrentPage { get; set; }

    /// <summary>
    /// 每页大小
    /// </summary>
    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    /// <summary>
    /// 总记录数
    /// </summary>
    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    /// <summary>
    /// 总页数
    /// </summary>
    [JsonPropertyName("totalPages")]
    public int TotalPages { get; set; }

    /// <summary>
    /// 是否有上一页
    /// </summary>
    [JsonPropertyName("hasPreviousPage")]
    public bool HasPreviousPage { get; set; }

    /// <summary>
    /// 是否有下一页
    /// </summary>
    [JsonPropertyName("hasNextPage")]
    public bool HasNextPage { get; set; }

    /// <summary>
    /// 当前页第一条记录的索引
    /// </summary>
    [JsonPropertyName("firstItemIndex")]
    public int FirstItemIndex => (CurrentPage - 1) * PageSize + 1;

    /// <summary>
    /// 当前页最后一条记录的索引
    /// </summary>
    [JsonPropertyName("lastItemIndex")]
    public int LastItemIndex => Math.Min(CurrentPage * PageSize, TotalCount);

    /// <summary>
    /// 创建分页信息
    /// </summary>
    public static PaginationInfo Create(int currentPage, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        
        return new PaginationInfo
        {
            CurrentPage = currentPage,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = currentPage > 1,
            HasNextPage = currentPage < totalPages
        };
    }
}

/// <summary>
/// 无数据的API响应
/// </summary>
public class ApiResponse : ApiResponse<object>
{
    /// <summary>
    /// 创建成功响应
    /// </summary>
    public static ApiResponse CreateSuccess(string message = "操作成功")
    {
        return new ApiResponse
        {
            Success = true,
            Message = message,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 创建错误响应
    /// </summary>
    public static new ApiResponse CreateError(string message, string? errorCode = null, List<string>? errors = null, string? traceId = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            ErrorCode = errorCode,
            Errors = errors,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow
        };
    }
}
