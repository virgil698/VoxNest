using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Application.Interfaces;
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

    public LogController(ILogService logService, ILogger<LogController> logger)
    {
        _logService = logService;
        _logger = logger;
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
        [FromBody] CreateLogEntryDto createLogDto,
        CancellationToken cancellationToken)
    {
        try
        {
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

            var result = await _logService.CreateLogAsync(createLogDto, userId, cancellationToken);
            
            return Ok(ApiResponse<LogEntryDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating log entry");
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
