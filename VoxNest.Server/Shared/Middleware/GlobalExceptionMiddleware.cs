using System.Net;
using System.Text.Json;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Shared.Middleware;

/// <summary>
/// 全局异常处理中间件
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // 为每个请求生成追踪ID
            if (!context.TraceIdentifier.StartsWith("trace-"))
            {
                context.TraceIdentifier = $"trace-{Guid.NewGuid():N}";
            }

            // 记录请求开始
            _logger.LogInformation("处理请求开始 - {Method} {Path} [TraceId: {TraceId}]", 
                context.Request.Method, 
                context.Request.Path, 
                context.TraceIdentifier);

            await _next(context);

            // 记录请求完成
            _logger.LogInformation("请求处理完成 - {Method} {Path} [{StatusCode}] [TraceId: {TraceId}]", 
                context.Request.Method, 
                context.Request.Path, 
                context.Response.StatusCode,
                context.TraceIdentifier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "请求处理过程中发生未处理异常 - {Method} {Path} [TraceId: {TraceId}]", 
                context.Request.Method, 
                context.Request.Path, 
                context.TraceIdentifier);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var errorResponse = CreateErrorResponse(context, exception);
        
        // 根据异常类型设置HTTP状态码
        context.Response.StatusCode = GetStatusCode(exception);

        // 详细记录异常信息
        LogException(context, exception, errorResponse);

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private ErrorResponse CreateErrorResponse(HttpContext context, Exception exception)
    {
        var (errorCode, message) = GetErrorCodeAndMessage(exception);

        return ErrorResponse.Create(
            errorCode: errorCode,
            message: message,
            details: GetExceptionDetails(exception),
            traceId: context.TraceIdentifier,
            path: context.Request.Path,
            method: context.Request.Method
        );
    }

    private static (string errorCode, string message) GetErrorCodeAndMessage(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => (ErrorCodes.BAD_REQUEST, "必需参数缺失"),
            ArgumentException _ => (ErrorCodes.BAD_REQUEST, "请求参数无效"),
            InvalidOperationException ex when ex.Message.Contains("数据库") => 
                (ErrorCodes.DATABASE_CONNECTION_ERROR, "数据库操作失败"),
            InvalidOperationException ex when ex.Message.Contains("表") => 
                (ErrorCodes.DATABASE_TABLE_MISSING, "数据库表结构异常"),
            InvalidOperationException _ => (ErrorCodes.VALIDATION_ERROR, "操作无效"),
            UnauthorizedAccessException _ => (ErrorCodes.UNAUTHORIZED, "未授权访问"),
            FileNotFoundException _ => (ErrorCodes.NOT_FOUND, "文件未找到"),
            DirectoryNotFoundException _ => (ErrorCodes.NOT_FOUND, "目录未找到"),
            TimeoutException _ => (ErrorCodes.INTERNAL_ERROR, "操作超时"),
            _ => (ErrorCodes.INTERNAL_ERROR, "服务器内部错误")
        };
    }

    private static int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => (int)HttpStatusCode.BadRequest,
            ArgumentException _ => (int)HttpStatusCode.BadRequest,
            InvalidOperationException _ => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException _ => (int)HttpStatusCode.Unauthorized,
            FileNotFoundException _ => (int)HttpStatusCode.NotFound,
            DirectoryNotFoundException _ => (int)HttpStatusCode.NotFound,
            TimeoutException _ => (int)HttpStatusCode.RequestTimeout,
            _ => (int)HttpStatusCode.InternalServerError
        };
    }

    private static string GetExceptionDetails(Exception exception)
    {
        var details = new List<string>
        {
            $"异常类型: {exception.GetType().Name}",
            $"异常消息: {exception.Message}"
        };

        if (exception.InnerException != null)
        {
            details.Add($"内部异常: {exception.InnerException.Message}");
        }

        if (!string.IsNullOrEmpty(exception.StackTrace))
        {
            // 只包含前几行堆栈跟踪，避免信息过多
            var stackLines = exception.StackTrace.Split('\n')
                .Take(5)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrEmpty(line));
            
            details.Add($"堆栈跟踪: {string.Join(" | ", stackLines.ToArray())}");
        }

        return string.Join(" | ", details.ToArray());
    }

    private void LogException(HttpContext context, Exception exception, ErrorResponse errorResponse)
    {
        var logLevel = GetLogLevel(exception);
        var logMessage = "API请求异常 - {Method} {Path} | 错误代码: {ErrorCode} | 消息: {Message} | 追踪ID: {TraceId}";

        _logger.Log(logLevel, exception, logMessage,
            context.Request.Method,
            context.Request.Path,
            errorResponse.ErrorCode,
            errorResponse.Message,
            errorResponse.TraceId);

        // 额外记录详细信息
        _logger.LogDebug("异常详细信息 [TraceId: {TraceId}]: {Details}", 
            errorResponse.TraceId, 
            errorResponse.Details);

        // 记录请求头信息（用于调试）
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var headers = context.Request.Headers
                .Where(h => !h.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase))
                .ToDictionary(h => h.Key, h => string.Join(", ", h.Value.ToArray()));

            _logger.LogDebug("请求头信息 [TraceId: {TraceId}]: {Headers}", 
                errorResponse.TraceId, 
                JsonSerializer.Serialize(headers, (JsonSerializerOptions?)null));
        }
    }

    private static LogLevel GetLogLevel(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException _ => LogLevel.Warning,
            ArgumentException _ => LogLevel.Warning,
            InvalidOperationException _ => LogLevel.Warning,
            UnauthorizedAccessException _ => LogLevel.Warning,
            FileNotFoundException _ => LogLevel.Information,
            DirectoryNotFoundException _ => LogLevel.Information,
            _ => LogLevel.Error
        };
    }
}
