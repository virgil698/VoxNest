using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// API控制器基类，提供统一的错误处理和日志记录
/// </summary>
[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected readonly ILogger Logger;

    protected BaseApiController(ILogger logger)
    {
        Logger = logger;
    }

    /// <summary>
    /// 执行操作并处理结果
    /// </summary>
    protected async Task<IActionResult> ExecuteAsync<T>(Func<Task<Result<T>>> operation, string operationName)
    {
        var traceId = HttpContext.TraceIdentifier;
        var requestPath = HttpContext.Request.Path;
        var requestMethod = HttpContext.Request.Method;

        try
        {
            Logger.LogInformation("开始执行操作: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var result = await operation();

            if (result.IsSuccess)
            {
                Logger.LogInformation("操作成功完成: {OperationName} [TraceId: {TraceId}]", operationName, traceId);
                return Ok(new { success = true, data = result.Data });
            }
            else
            {
                Logger.LogWarning("操作失败: {OperationName} - {ErrorMessage} [TraceId: {TraceId}]", 
                    operationName, result.Message, traceId);

                var errorResponse = ErrorResponse.Create(
                    errorCode: GetErrorCodeFromMessage(result.Message),
                    message: result.Message,
                    traceId: traceId,
                    path: requestPath,
                    method: requestMethod
                );

                return BadRequest(errorResponse);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "执行操作时发生异常: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var errorResponse = ErrorResponse.Create(
                errorCode: ErrorCodes.INTERNAL_ERROR,
                message: $"执行{operationName}时发生错误",
                details: ex.Message,
                traceId: traceId,
                path: requestPath,
                method: requestMethod
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// 执行操作并处理结果（无返回值）
    /// </summary>
    protected async Task<IActionResult> ExecuteAsync(Func<Task<Result>> operation, string operationName)
    {
        var traceId = HttpContext.TraceIdentifier;
        var requestPath = HttpContext.Request.Path;
        var requestMethod = HttpContext.Request.Method;

        try
        {
            Logger.LogInformation("开始执行操作: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var result = await operation();

            if (result.IsSuccess)
            {
                Logger.LogInformation("操作成功完成: {OperationName} [TraceId: {TraceId}]", operationName, traceId);
                return Ok(new { success = true, message = result.Message });
            }
            else
            {
                Logger.LogWarning("操作失败: {OperationName} - {ErrorMessage} [TraceId: {TraceId}]", 
                    operationName, result.Message, traceId);

                var errorResponse = ErrorResponse.Create(
                    errorCode: GetErrorCodeFromMessage(result.Message),
                    message: result.Message,
                    traceId: traceId,
                    path: requestPath,
                    method: requestMethod
                );

                return BadRequest(errorResponse);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "执行操作时发生异常: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var errorResponse = ErrorResponse.Create(
                errorCode: ErrorCodes.INTERNAL_ERROR,
                message: $"执行{operationName}时发生错误",
                details: ex.Message,
                traceId: traceId,
                path: requestPath,
                method: requestMethod
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// 执行操作并返回数据（无Result包装）
    /// </summary>
    protected async Task<IActionResult> ExecuteDataAsync<T>(Func<Task<T>> operation, string operationName)
    {
        var traceId = HttpContext.TraceIdentifier;
        var requestPath = HttpContext.Request.Path;
        var requestMethod = HttpContext.Request.Method;

        try
        {
            Logger.LogInformation("开始执行操作: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var data = await operation();

            Logger.LogInformation("操作成功完成: {OperationName} [TraceId: {TraceId}]", operationName, traceId);
            return Ok(data);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "执行操作时发生异常: {OperationName} [TraceId: {TraceId}]", operationName, traceId);

            var errorResponse = ErrorResponse.Create(
                errorCode: GetErrorCodeFromMessage(ex.Message),
                message: $"执行{operationName}时发生错误",
                details: ex.Message,
                traceId: traceId,
                path: requestPath,
                method: requestMethod
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// 根据错误消息推断错误代码
    /// </summary>
    private static string GetErrorCodeFromMessage(string message)
    {
        var lowerMessage = message.ToLower();

        return lowerMessage switch
        {
            _ when lowerMessage.Contains("数据库") && lowerMessage.Contains("连接") => ErrorCodes.DATABASE_CONNECTION_ERROR,
            _ when lowerMessage.Contains("数据库") && lowerMessage.Contains("表") => ErrorCodes.DATABASE_TABLE_MISSING,
            _ when lowerMessage.Contains("数据库") => ErrorCodes.DATABASE_CONNECTION_ERROR,
            _ when lowerMessage.Contains("配置") => ErrorCodes.INSTALL_CONFIG_ERROR,
            _ when lowerMessage.Contains("安装") => ErrorCodes.INSTALL_CONFIG_ERROR,
            _ when lowerMessage.Contains("管理员") => ErrorCodes.INSTALL_ADMIN_CREATE_ERROR,
            _ when lowerMessage.Contains("用户名") || lowerMessage.Contains("密码") => ErrorCodes.AUTH_LOGIN_FAILED,
            _ when lowerMessage.Contains("权限") || lowerMessage.Contains("授权") => ErrorCodes.UNAUTHORIZED,
            _ when lowerMessage.Contains("参数") => ErrorCodes.VALIDATION_ERROR,
            _ when lowerMessage.Contains("文件") => ErrorCodes.NOT_FOUND,
            _ => ErrorCodes.INTERNAL_ERROR
        };
    }

    /// <summary>
    /// 记录API调用信息
    /// </summary>
    protected void LogApiCall(string action, object? parameters = null)
    {
        var traceId = HttpContext.TraceIdentifier;
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (parameters != null)
        {
            Logger.LogInformation("API调用: {Action} | 参数: {Parameters} | IP: {ClientIp} | UserAgent: {UserAgent} [TraceId: {TraceId}]", 
                action, System.Text.Json.JsonSerializer.Serialize(parameters), clientIp, userAgent, traceId);
        }
        else
        {
            Logger.LogInformation("API调用: {Action} | IP: {ClientIp} | UserAgent: {UserAgent} [TraceId: {TraceId}]", 
                action, clientIp, userAgent, traceId);
        }
    }

    /// <summary>
    /// 创建成功响应
    /// </summary>
    protected IActionResult SuccessResponse(object? data = null, string? message = null)
    {
        var response = new { success = true, data, message };
        return Ok(response);
    }

    /// <summary>
    /// 创建错误响应
    /// </summary>
    protected IActionResult CreateErrorResponse(string errorCode, string message, string? details = null, int statusCode = 400)
    {
        var errorResponse = ErrorResponse.Create(
            errorCode: errorCode,
            message: message,
            details: details,
            traceId: HttpContext.TraceIdentifier,
            path: HttpContext.Request.Path,
            method: HttpContext.Request.Method
        );

        return StatusCode(statusCode, errorResponse);
    }

    /// <summary>
    /// 创建统一成功响应
    /// </summary>
    protected IActionResult Success<T>(T data, string message = "操作成功")
    {
        var response = ApiResponse<T>.CreateSuccess(data, message);
        response.TraceId = HttpContext.TraceIdentifier;
        return Ok(response);
    }

    /// <summary>
    /// 创建统一成功响应（无数据）
    /// </summary>
    protected IActionResult Success(string message = "操作成功")
    {
        var response = ApiResponse.CreateSuccess(message);
        response.TraceId = HttpContext.TraceIdentifier;
        return Ok(response);
    }

    /// <summary>
    /// 创建统一分页响应
    /// </summary>
    protected IActionResult SuccessPaginated<T>(T data, int currentPage, int pageSize, int totalCount, string message = "查询成功")
    {
        var pagination = PaginationInfo.Create(currentPage, pageSize, totalCount);
        var response = ApiResponse<T>.CreateSuccess(data, pagination, message);
        response.TraceId = HttpContext.TraceIdentifier;
        return Ok(response);
    }

    /// <summary>
    /// 创建统一错误响应
    /// </summary>
    protected IActionResult Error(string message, string? errorCode = null, int statusCode = 400)
    {
        var response = ApiResponse.CreateError(message, errorCode, traceId: HttpContext.TraceIdentifier);
        return StatusCode(statusCode, response);
    }

    /// <summary>
    /// 创建验证错误响应
    /// </summary>
    protected IActionResult ValidationError(List<string> errors)
    {
        var response = ApiResponse.CreateError("输入验证失败", ErrorCodes.VALIDATION_ERROR, errors, HttpContext.TraceIdentifier);
        return BadRequest(response);
    }

    /// <summary>
    /// 处理模型状态错误
    /// </summary>
    protected IActionResult HandleModelStateErrors()
    {
        var errors = ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors)
            .Select(x => x.ErrorMessage)
            .ToList();

        return ValidationError(errors);
    }
}
