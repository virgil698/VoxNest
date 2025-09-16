using System.Diagnostics;
using System.Text;

namespace VoxNest.Server.Shared.Middleware;

/// <summary>
/// Debug日志中间件 - 记录详细的请求/响应信息
/// </summary>
public class DebugLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DebugLoggingMiddleware> _logger;
    private readonly bool _isDebugMode;

    public DebugLoggingMiddleware(RequestDelegate next, ILogger<DebugLoggingMiddleware> logger, IServiceProvider serviceProvider)
    {
        _next = next;
        _logger = logger;
        _isDebugMode = GetDebugModeFromConfig();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_isDebugMode)
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var requestId = context.TraceIdentifier;
        
        // 记录请求信息
        await LogRequestAsync(context, requestId);
        
        // 保存原始响应流
        var originalBodyStream = context.Response.Body;
        
        try
        {
            using var responseBodyStream = new MemoryStream();
            context.Response.Body = responseBodyStream;
            
            // 执行下一个中间件
            await _next(context);
            
            stopwatch.Stop();
            
            // 记录响应信息
            await LogResponseAsync(context, requestId, stopwatch.ElapsedMilliseconds, responseBodyStream);
            
            // 将响应写回原始流
            responseBodyStream.Position = 0;
            await responseBodyStream.CopyToAsync(originalBodyStream);
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }

    private async Task LogRequestAsync(HttpContext context, string requestId)
    {
        var request = context.Request;
        var sb = new StringBuilder();
        
        sb.AppendLine($"🔍 [DEBUG] Request {requestId}:");
        sb.AppendLine($"   Method: {request.Method}");
        sb.AppendLine($"   Path: {request.Path}{request.QueryString}");
        sb.AppendLine($"   User-Agent: {request.Headers.UserAgent}");
        sb.AppendLine($"   Content-Type: {request.ContentType}");
        sb.AppendLine($"   Content-Length: {request.ContentLength}");
        sb.AppendLine($"   Remote IP: {context.Connection.RemoteIpAddress}");
        sb.AppendLine($"   Timestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        
        // 记录请求头（排除敏感信息）
        sb.AppendLine("   Headers:");
        foreach (var header in request.Headers)
        {
            if (!IsSensitiveHeader(header.Key))
            {
                sb.AppendLine($"     {header.Key}: {header.Value}");
            }
            else
            {
                sb.AppendLine($"     {header.Key}: [REDACTED]");
            }
        }
        
        // 记录请求体（仅对小于1KB的内容）
        if (request.ContentLength.HasValue && request.ContentLength.Value > 0 && request.ContentLength.Value < 1024)
        {
            request.EnableBuffering();
            var body = await new StreamReader(request.Body).ReadToEndAsync();
            request.Body.Position = 0;
            
            if (!string.IsNullOrEmpty(body))
            {
                sb.AppendLine($"   Body: {body}");
            }
        }
        
        _logger.LogDebug(sb.ToString());
    }

    private async Task LogResponseAsync(HttpContext context, string requestId, long elapsedMs, MemoryStream responseBody)
    {
        var response = context.Response;
        var sb = new StringBuilder();
        
        sb.AppendLine($"📤 [DEBUG] Response {requestId}:");
        sb.AppendLine($"   Status: {response.StatusCode}");
        sb.AppendLine($"   Content-Type: {response.ContentType}");
        sb.AppendLine($"   Content-Length: {response.ContentLength}");
        sb.AppendLine($"   Elapsed Time: {elapsedMs}ms");
        sb.AppendLine($"   Memory Usage: {GC.GetTotalMemory(false) / 1024 / 1024}MB");
        
        // 记录响应头
        sb.AppendLine("   Headers:");
        foreach (var header in response.Headers)
        {
            sb.AppendLine($"     {header.Key}: {header.Value}");
        }
        
        // 记录响应体（仅对小于1KB的内容且为文本类型）
        if (responseBody.Length > 0 && responseBody.Length < 1024 && IsTextContentType(response.ContentType))
        {
            responseBody.Position = 0;
            var body = await new StreamReader(responseBody).ReadToEndAsync();
            responseBody.Position = 0;
            
            if (!string.IsNullOrEmpty(body))
            {
                sb.AppendLine($"   Body: {body}");
            }
        }
        
        _logger.LogDebug(sb.ToString());
        
        // 记录性能警告
        if (elapsedMs > 1000)
        {
            _logger.LogWarning($"⚠️ [DEBUG] Slow request {requestId}: {elapsedMs}ms - {context.Request.Method} {context.Request.Path}");
        }
    }

    private static bool IsSensitiveHeader(string headerName)
    {
        var sensitiveHeaders = new[]
        {
            "Authorization", "Cookie", "Set-Cookie", "X-Api-Key", "X-Auth-Token"
        };
        
        return sensitiveHeaders.Contains(headerName, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsTextContentType(string? contentType)
    {
        if (string.IsNullOrEmpty(contentType))
            return false;
            
        var textTypes = new[] { "application/json", "text/", "application/xml" };
        return textTypes.Any(type => contentType.StartsWith(type, StringComparison.OrdinalIgnoreCase));
    }

    private static bool GetDebugModeFromConfig()
    {
        const string configFile = "server-config.yml";
        try
        {
            if (File.Exists(configFile))
            {
                var serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(configFile);
                return serverConfig.Logging.EnableDebugMode;
            }
        }
        catch
        {
            // 忽略配置读取错误
        }
        
        return false;
    }
}
