using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Application.Services;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 日志管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class LogController : ControllerBase
{
    private readonly ILogService _logService;
    private readonly ILogger<LogController> _logger;
    private readonly BackgroundLogService _backgroundLogService;

    public LogController(
        ILogService logService, 
        ILogger<LogController> logger,
        BackgroundLogService backgroundLogService)
    {
        _logService = logService;
        _logger = logger;
        _backgroundLogService = backgroundLogService;
    }

    /// <summary>
    /// 创建日志条目
    /// </summary>
    /// <param name="createLogDto">创建日志请求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>创建的日志条目</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LogEntryDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<LogEntryDto>>> CreateLog(
        [FromBody] CreateLogEntryDto? createLogDto,
        CancellationToken cancellationToken)
    {
        try
        {
            // 验证请求体是否为空或无效
            if (createLogDto == null)
            {
                _logger.LogWarning("Received null log entry data from client IP: {ClientIP}", GetClientIpAddress());
                return BadRequest(ApiResponse.CreateError("日志数据不能为空"));
            }

            // 验证必填字段
            if (string.IsNullOrWhiteSpace(createLogDto.Message))
            {
                _logger.LogWarning("Received log entry with empty message from client IP: {ClientIP}", GetClientIpAddress());
                return BadRequest(ApiResponse.CreateError("日志消息不能为空"));
            }
            // 从请求中提取信息
            if (string.IsNullOrEmpty(createLogDto.IpAddress))
            {
                createLogDto.IpAddress = GetClientIpAddress();
            }

            if (string.IsNullOrEmpty(createLogDto.UserAgent))
            {
                createLogDto.UserAgent = Request.Headers["User-Agent"].FirstOrDefault();
            }

            if (string.IsNullOrEmpty(createLogDto.RequestUrl))
            {
                createLogDto.RequestUrl = $"{Request.Scheme}://{Request.Host}{Request.Path}{Request.QueryString}";
            }

            if (string.IsNullOrEmpty(createLogDto.HttpMethod))
            {
                createLogDto.HttpMethod = Request.Method;
            }

            // 获取用户ID
            var userId = GetCurrentUserId();

            // 判断是否是需要立即处理的重要日志
            if (IsImportantLog(createLogDto))
            {
                // 重要日志立即处理
                var result = await _logService.CreateLogAsync(createLogDto, userId, cancellationToken);
                return Ok(ApiResponse<LogEntryDto>.CreateSuccess(result));
            }
            else
            {
                // 非重要日志使用后台服务处理
                _backgroundLogService.EnqueueLog(createLogDto, userId);
                
                // 返回成功响应，无需等待实际写入
                var immediateResult = new LogEntryDto
                {
                    Id = 0, // 后台处理的日志暂时没有ID
                    Level = createLogDto.Level,
                    Category = createLogDto.Category,
                    Message = createLogDto.Message,
                    CreatedAt = DateTime.UtcNow,
                    Source = createLogDto.Source
                };
                
                return Ok(ApiResponse<LogEntryDto>.CreateSuccess(immediateResult));
            }
        }
        catch (OperationCanceledException)
        {
            // 客户端取消请求是正常情况，不需要记录为错误
            _logger.LogDebug("Log creation was canceled by client from IP: {ClientIP}", GetClientIpAddress());
            return StatusCode(499, ApiResponse.CreateError("请求已取消")); // 499 Client Closed Request
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid log entry data from client IP: {ClientIP}", GetClientIpAddress());
            return BadRequest(ApiResponse.CreateError($"日志数据无效: {ex.Message}"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating log from client IP: {ClientIP}", GetClientIpAddress());
            return BadRequest(ApiResponse.CreateError($"操作无效: {ex.Message}"));
        }
        catch (Exception ex) when (ex.InnerException is BadHttpRequestException)
        {
            // 特别处理HTTP请求内容错误
            _logger.LogWarning(ex, "Bad HTTP request for log creation from client IP: {ClientIP}", GetClientIpAddress());
            return BadRequest(ApiResponse.CreateError("请求内容格式错误，请检查数据完整性"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating log entry from client IP: {ClientIP}", GetClientIpAddress());
            return BadRequest(ApiResponse.CreateError("创建日志失败"));
        }
    }

    /// <summary>
    /// 获取日志列表
    /// </summary>
    /// <param name="query">查询参数</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>日志列表</returns>
    [HttpGet]
    [Authorize] // 需要认证才能查看日志
    [ProducesResponseType(typeof(ApiResponse<LogQueryResultDto>), 200)]
    public async Task<ActionResult<ApiResponse<LogQueryResultDto>>> GetLogs(
        [FromQuery] LogQueryDto query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _logService.GetLogsAsync(query, cancellationToken);
            return Ok(ApiResponse<LogQueryResultDto>.CreateSuccess(result));
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Get logs operation was canceled by client");
            return StatusCode(499, ApiResponse.CreateError("请求已取消"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting logs");
            return BadRequest(ApiResponse.CreateError("获取日志列表失败"));
        }
    }

    /// <summary>
    /// 获取日志详情
    /// </summary>
    /// <param name="id">日志ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>日志详情</returns>
    [HttpGet("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<LogEntryDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<LogEntryDto>>> GetLog(
        long id,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _logService.GetLogByIdAsync(id, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("日志不存在"));

            return Ok(ApiResponse<LogEntryDto>.CreateSuccess(result));
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Get log detail operation was canceled by client");
            return StatusCode(499, ApiResponse.CreateError("请求已取消"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting log {LogId}", id);
            return BadRequest(ApiResponse.CreateError("获取日志详情失败"));
        }
    }

    /// <summary>
    /// 获取日志统计信息
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>统计信息</returns>
    [HttpGet("stats")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<LogStatsDto>), 200)]
    public async Task<ActionResult<ApiResponse<LogStatsDto>>> GetLogStats(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _logService.GetLogStatsAsync(cancellationToken);
            return Ok(ApiResponse<LogStatsDto>.CreateSuccess(result));
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Get log stats operation was canceled by client");
            return StatusCode(499, ApiResponse.CreateError("请求已取消"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting log stats");
            return BadRequest(ApiResponse.CreateError("获取统计信息失败"));
        }
    }

    /// <summary>
    /// 清理过期日志
    /// </summary>
    /// <param name="olderThanDays">删除多少天前的日志</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>删除的记录数</returns>
    [HttpDelete("cleanup")]
    [Authorize] // 可以增加更严格的权限控制
    [ProducesResponseType(typeof(ApiResponse<int>), 200)]
    public async Task<ActionResult<ApiResponse<int>>> CleanupLogs(
        [FromQuery] int olderThanDays = 30,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deletedCount = await _logService.CleanupLogsAsync(olderThanDays, cancellationToken);
            
            // 记录清理操作
            await _logService.LogInfoAsync($"Cleaned up {deletedCount} log entries older than {olderThanDays} days", 
                "LogController.CleanupLogs", GetCurrentUserId(), cancellationToken);
                
            return Ok(ApiResponse<int>.CreateSuccess(deletedCount));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up logs");
            return BadRequest(ApiResponse.CreateError("清理日志失败"));
        }
    }

    /// <summary>
    /// 批量删除日志
    /// </summary>
    /// <param name="ids">要删除的日志ID列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>删除的记录数</returns>
    [HttpDelete]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<int>), 200)]
    public async Task<ActionResult<ApiResponse<int>>> DeleteLogs(
        [FromBody] IEnumerable<long> ids,
        CancellationToken cancellationToken)
    {
        try
        {
            var deletedCount = await _logService.DeleteLogsAsync(ids, cancellationToken);
            
            // 记录删除操作
            await _logService.LogInfoAsync($"Deleted {deletedCount} log entries", 
                "LogController.DeleteLogs", GetCurrentUserId(), cancellationToken);
                
            return Ok(ApiResponse<int>.CreateSuccess(deletedCount));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting logs");
            return BadRequest(ApiResponse.CreateError("删除日志失败"));
        }
    }

    /// <summary>
    /// 获取当前用户ID
    /// </summary>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// 判断是否是需要立即处理的重要日志
    /// </summary>
    private static bool IsImportantLog(CreateLogEntryDto logDto)
    {
        // 错误和严重错误需要立即处理
        if (logDto.Level <= Domain.Enums.LogLevel.Error)
            return true;
            
        // 安全相关日志需要立即处理
        if (logDto.Category == LogCategory.Security)
            return true;
            
        // 系统相关的警告日志需要立即处理
        if (logDto.Category == LogCategory.System && logDto.Level <= Domain.Enums.LogLevel.Warning)
            return true;
            
        // 包含异常信息的日志需要立即处理
        if (!string.IsNullOrEmpty(logDto.Exception))
            return true;
            
        return false;
    }

    /// <summary>
    /// 获取客户端IP地址
    /// </summary>
    private string? GetClientIpAddress()
    {
        // 检查X-Forwarded-For头（用于代理/负载均衡器）
        var xForwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xForwardedFor))
        {
            // X-Forwarded-For可能包含多个IP，取第一个
            return xForwardedFor.Split(',')[0].Trim();
        }

        // 检查X-Real-IP头
        var xRealIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xRealIp))
        {
            return xRealIp;
        }

        // 使用RemoteIpAddress
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
