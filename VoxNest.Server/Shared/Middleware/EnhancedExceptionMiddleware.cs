using System.Net;
using System.Text.Json;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Shared.Middleware;

/// <summary>
/// 增强的异常处理中间件
/// </summary>
public class EnhancedExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<EnhancedExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public EnhancedExceptionMiddleware(
        RequestDelegate next, 
        ILogger<EnhancedExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // 为每个请求生成追踪ID
            if (string.IsNullOrEmpty(context.TraceIdentifier) || !context.TraceIdentifier.StartsWith("trace-"))
            {
                context.TraceIdentifier = $"trace-{Guid.NewGuid():N}";
            }

            // 记录请求开始
            LogRequestStart(context);

            await _next(context);

            // 记录请求完成
            LogRequestComplete(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var exceptionDetails = CreateExceptionDetails(context, exception);
        var apiResponse = CreateErrorResponse(context, exception, exceptionDetails);
        
        // 设置HTTP状态码
        context.Response.StatusCode = GetStatusCode(exception);
        
        // 记录异常
        LogException(context, exception, exceptionDetails);
        
        // 序列化并返回响应
        var jsonResponse = JsonSerializer.Serialize(apiResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _environment.IsDevelopment()
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private static ExceptionDetails CreateExceptionDetails(HttpContext context, Exception exception)
    {
        var details = new ExceptionDetails
        {
            Type = exception.GetType().Name,
            Message = exception.Message,
            StackTrace = exception.StackTrace,
            Source = exception.Source,
            TraceId = context.TraceIdentifier,
            RequestPath = context.Request.Path,
            RequestMethod = context.Request.Method,
            UserAgent = context.Request.Headers["User-Agent"].ToString(),
            ClientIp = GetClientIpAddress(context)
        };

        // 添加内部异常信息
        if (exception.InnerException != null)
        {
            details.InnerException = new InnerExceptionInfo
            {
                Type = exception.InnerException.GetType().Name,
                Message = exception.InnerException.Message
            };
        }

        return details;
    }

    private ApiResponse<object> CreateErrorResponse(HttpContext context, Exception exception, ExceptionDetails details)
    {
        var (errorCode, userMessage) = GetErrorCodeAndMessage(exception);
        
        var response = ApiResponse<object>.CreateError(
            message: userMessage,
            errorCode: errorCode,
            traceId: context.TraceIdentifier
        );

        // 在开发环境中包含更多错误详情
        if (_environment.IsDevelopment())
        {
            response.Errors = new List<string>
            {
                $"异常类型: {details.Type}",
                $"异常消息: {details.Message}"
            };
            
            if (!string.IsNullOrEmpty(details.Source))
            {
                response.Errors.Add($"异常源: {details.Source}");
            }
        }

        return response;
    }

    private static (string errorCode, string userMessage) GetErrorCodeAndMessage(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => (ErrorCodes.BAD_REQUEST, "请求参数不能为空"),
            ArgumentException _ => (ErrorCodes.VALIDATION_ERROR, "请求参数无效"),
            UnauthorizedAccessException _ => (ErrorCodes.UNAUTHORIZED, "访问被拒绝，请检查您的权限"),
            InvalidOperationException ex when ex.Message.Contains("数据库") => 
                (ErrorCodes.DATABASE_CONNECTION_ERROR, "数据库服务暂时不可用，请稍后重试"),
            InvalidOperationException ex when ex.Message.Contains("表") => 
                (ErrorCodes.DATABASE_TABLE_MISSING, "数据结构异常，请联系管理员"),
            FileNotFoundException _ => (ErrorCodes.NOT_FOUND, "请求的资源不存在"),
            DirectoryNotFoundException _ => (ErrorCodes.NOT_FOUND, "请求的路径不存在"),
            TimeoutException _ => (ErrorCodes.INTERNAL_ERROR, "请求超时，请稍后重试"),
            TaskCanceledException _ => (ErrorCodes.INTERNAL_ERROR, "请求已取消"),
            OperationCanceledException _ => (ErrorCodes.INTERNAL_ERROR, "操作已取消"),
            HttpRequestException _ => (ErrorCodes.INTERNAL_ERROR, "外部服务请求失败"),
            _ => (ErrorCodes.INTERNAL_ERROR, "服务器内部错误，请稍后重试")
        };
    }

    private static int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => (int)HttpStatusCode.BadRequest,
            ArgumentException _ => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException _ => (int)HttpStatusCode.Unauthorized,
            FileNotFoundException _ => (int)HttpStatusCode.NotFound,
            DirectoryNotFoundException _ => (int)HttpStatusCode.NotFound,
            TimeoutException _ => (int)HttpStatusCode.RequestTimeout,
            TaskCanceledException _ => (int)HttpStatusCode.RequestTimeout,
            OperationCanceledException _ => (int)HttpStatusCode.RequestTimeout,
            InvalidOperationException ex when ex.Message.Contains("权限") => (int)HttpStatusCode.Forbidden,
            _ => (int)HttpStatusCode.InternalServerError
        };
    }

    private void LogRequestStart(HttpContext context)
    {
        _logger.LogInformation(
            "处理请求开始 - {Method} {Path} | IP: {ClientIp} | UserAgent: {UserAgent} | TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            GetClientIpAddress(context),
            context.Request.Headers["User-Agent"].ToString(),
            context.TraceIdentifier);
    }

    private void LogRequestComplete(HttpContext context)
    {
        _logger.LogInformation(
            "请求处理完成 - {Method} {Path} [{StatusCode}] | TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            context.TraceIdentifier);
    }

    private void LogException(HttpContext context, Exception exception, ExceptionDetails details)
    {
        var logLevel = GetLogLevel(exception);
        
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["TraceId"] = details.TraceId ?? "unknown",
            ["RequestPath"] = details.RequestPath ?? "unknown",
            ["RequestMethod"] = details.RequestMethod ?? "unknown",
            ["ClientIp"] = details.ClientIp ?? "unknown",
            ["ExceptionType"] = details.Type
        });

        _logger.Log(logLevel, exception,
            "API请求异常 - {Method} {Path} | 错误: {ExceptionType}: {Message} | TraceId: {TraceId}",
            details.RequestMethod,
            details.RequestPath,
            details.Type,
            details.Message,
            details.TraceId);

        // 在生产环境中记录更详细的错误信息到独立的错误日志
        if (!_environment.IsDevelopment())
        {
            LogDetailedError(details, exception);
        }
    }

    private void LogDetailedError(ExceptionDetails details, Exception exception)
    {
        _logger.LogError(
            "详细错误信息 | TraceId: {TraceId} | 类型: {ExceptionType} | 消息: {Message} | 源: {Source} | 请求: {Method} {Path} | 客户端: {ClientIp} | UA: {UserAgent}",
            details.TraceId,
            details.Type,
            details.Message,
            details.Source,
            details.RequestMethod,
            details.RequestPath,
            details.ClientIp,
            details.UserAgent);
    }

    private static LogLevel GetLogLevel(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => LogLevel.Warning,
            ArgumentException _ => LogLevel.Warning,
            UnauthorizedAccessException _ => LogLevel.Warning,
            FileNotFoundException _ => LogLevel.Information,
            DirectoryNotFoundException _ => LogLevel.Information,
            TaskCanceledException _ => LogLevel.Information,
            OperationCanceledException _ => LogLevel.Information,
            _ => LogLevel.Error
        };
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        // 尝试从多个头部获取真实的客户端IP
        var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(ipAddress))
        {
            // X-Forwarded-For 可能包含多个IP，取第一个
            return ipAddress.Split(',')[0].Trim();
        }

        ipAddress = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(ipAddress))
        {
            return ipAddress;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

/// <summary>
/// 异常详情
/// </summary>
public class ExceptionDetails
{
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Source { get; set; }
    public string? TraceId { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
    public InnerExceptionInfo? InnerException { get; set; }
}

/// <summary>
/// 内部异常信息
/// </summary>
public class InnerExceptionInfo
{
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
