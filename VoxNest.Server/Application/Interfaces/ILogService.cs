using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 日志服务接口
/// </summary>
public interface ILogService
{
    /// <summary>
    /// 创建日志条目
    /// </summary>
    /// <param name="createLogDto">创建日志请求</param>
    /// <param name="userId">用户ID（可选）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>创建的日志条目</returns>
    Task<LogEntryDto> CreateLogAsync(CreateLogEntryDto createLogDto, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录日志（用于后端内部调用）
    /// </summary>
    /// <param name="level">日志级别</param>
    /// <param name="category">日志分类</param>
    /// <param name="message">日志消息</param>
    /// <param name="source">来源</param>
    /// <param name="details">详细信息</param>
    /// <param name="exception">异常信息</param>
    /// <param name="userId">用户ID</param>
    /// <param name="metadata">元数据</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>任务</returns>
    Task LogAsync(
        Domain.Enums.LogLevel level,
        LogCategory category,
        string message,
        string? source = null,
        string? details = null,
        Exception? exception = null,
        int? userId = null,
        object? metadata = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录Debug日志
    /// </summary>
    Task LogDebugAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录Info日志
    /// </summary>
    Task LogInfoAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录Warning日志
    /// </summary>
    Task LogWarningAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录Error日志
    /// </summary>
    Task LogErrorAsync(string message, Exception? exception = null, string? source = null, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 快速记录Fatal日志
    /// </summary>
    Task LogFatalAsync(string message, Exception? exception = null, string? source = null, int? userId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 查询日志
    /// </summary>
    /// <param name="query">查询参数</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>查询结果</returns>
    Task<LogQueryResultDto> GetLogsAsync(LogQueryDto query, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取日志详情
    /// </summary>
    /// <param name="id">日志ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>日志详情</returns>
    Task<LogEntryDto?> GetLogByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取日志统计信息
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>统计信息</returns>
    Task<LogStatsDto> GetLogStatsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除过期日志
    /// </summary>
    /// <param name="olderThanDays">删除多少天前的日志</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>删除的记录数</returns>
    Task<int> CleanupLogsAsync(int olderThanDays = 30, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量删除日志
    /// </summary>
    /// <param name="ids">要删除的日志ID列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>删除的记录数</returns>
    Task<int> DeleteLogsAsync(IEnumerable<long> ids, CancellationToken cancellationToken = default);
}
