using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 日志服务实现
/// </summary>
public class LogService : ILogService
{
    private readonly VoxNestDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<LogService> _logger;

    public LogService(
        VoxNestDbContext context,
        IMapper mapper,
        ILogger<LogService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 创建日志条目
    /// </summary>
    public async Task<LogEntryDto> CreateLogAsync(CreateLogEntryDto createLogDto, int? userId = null, CancellationToken cancellationToken = default)
    {
        var logEntry = new LogEntry
        {
            Level = createLogDto.Level,
            Category = createLogDto.Category,
            Message = createLogDto.Message,
            Details = createLogDto.Details,
            Exception = createLogDto.Exception,
            Source = createLogDto.Source,
            UserId = userId,
            IpAddress = createLogDto.IpAddress,
            UserAgent = createLogDto.UserAgent,
            RequestUrl = createLogDto.RequestUrl,
            HttpMethod = createLogDto.HttpMethod,
            StatusCode = createLogDto.StatusCode,
            Duration = createLogDto.Duration,
            RelatedEntityId = createLogDto.RelatedEntityId,
            RelatedEntityType = createLogDto.RelatedEntityType,
            Metadata = createLogDto.Metadata,
            CreatedAt = DateTime.UtcNow
        };

        _context.LogEntries.Add(logEntry);
        await _context.SaveChangesAsync(cancellationToken);

        // 查询包含用户信息的日志条目
        var savedLog = await _context.LogEntries
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == logEntry.Id, cancellationToken);

        return MapToDto(savedLog!);
    }

    /// <summary>
    /// 快速记录日志
    /// </summary>
    public async Task LogAsync(
        Domain.Enums.LogLevel level,
        LogCategory category,
        string message,
        string? source = null,
        string? details = null,
        Exception? exception = null,
        int? userId = null,
        object? metadata = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var logEntry = new LogEntry
            {
                Level = level,
                Category = category,
                Message = message,
                Details = details,
                Source = source,
                Exception = exception?.ToString(),
                UserId = userId,
                Metadata = metadata != null ? JsonSerializer.Serialize(metadata) : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.LogEntries.Add(logEntry);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // 避免日志记录失败导致的循环错误
            _logger.LogError(ex, "Failed to save log entry to database");
        }
    }

    /// <summary>
    /// 快速记录Debug日志
    /// </summary>
    public async Task LogDebugAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(Domain.Enums.LogLevel.Debug, LogCategory.System, message, source, userId: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// 快速记录Info日志
    /// </summary>
    public async Task LogInfoAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(Domain.Enums.LogLevel.Info, LogCategory.System, message, source, userId: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// 快速记录Warning日志
    /// </summary>
    public async Task LogWarningAsync(string message, string? source = null, int? userId = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(Domain.Enums.LogLevel.Warning, LogCategory.System, message, source, userId: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// 快速记录Error日志
    /// </summary>
    public async Task LogErrorAsync(string message, Exception? exception = null, string? source = null, int? userId = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(Domain.Enums.LogLevel.Error, LogCategory.Error, message, source, exception: exception, userId: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// 快速记录Fatal日志
    /// </summary>
    public async Task LogFatalAsync(string message, Exception? exception = null, string? source = null, int? userId = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(Domain.Enums.LogLevel.Fatal, LogCategory.Error, message, source, exception: exception, userId: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// 查询日志
    /// </summary>
    public async Task<LogQueryResultDto> GetLogsAsync(LogQueryDto query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.LogEntries
            .Include(l => l.User)
            .AsQueryable();

        // 应用过滤条件
        if (query.Level.HasValue)
            queryable = queryable.Where(l => l.Level == query.Level.Value);

        if (query.Category.HasValue)
            queryable = queryable.Where(l => l.Category == query.Category.Value);

        if (query.UserId.HasValue)
            queryable = queryable.Where(l => l.UserId == query.UserId.Value);

        if (!string.IsNullOrEmpty(query.Search))
            queryable = queryable.Where(l => l.Message.Contains(query.Search) || 
                                           (l.Details != null && l.Details.Contains(query.Search)));

        if (!string.IsNullOrEmpty(query.Source))
            queryable = queryable.Where(l => l.Source != null && l.Source.Contains(query.Source));

        if (!string.IsNullOrEmpty(query.IpAddress))
            queryable = queryable.Where(l => l.IpAddress == query.IpAddress);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(l => l.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(l => l.CreatedAt <= query.EndDate.Value);

        if (query.StatusCode.HasValue)
            queryable = queryable.Where(l => l.StatusCode == query.StatusCode.Value);

        // 排序
        queryable = query.SortBy.ToLower() switch
        {
            "level" => query.SortDirection.ToLower() == "asc" 
                ? queryable.OrderBy(l => l.Level) 
                : queryable.OrderByDescending(l => l.Level),
            "category" => query.SortDirection.ToLower() == "asc" 
                ? queryable.OrderBy(l => l.Category) 
                : queryable.OrderByDescending(l => l.Category),
            "message" => query.SortDirection.ToLower() == "asc" 
                ? queryable.OrderBy(l => l.Message) 
                : queryable.OrderByDescending(l => l.Message),
            _ => query.SortDirection.ToLower() == "asc" 
                ? queryable.OrderBy(l => l.CreatedAt) 
                : queryable.OrderByDescending(l => l.CreatedAt)
        };

        // 计算总数
        var totalCount = await queryable.CountAsync(cancellationToken);

        // 分页
        var pageNumber = query.GetValidPageNumber();
        var pageSize = query.GetValidPageSize();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var items = await queryable
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();

        return new LogQueryResultDto
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    /// <summary>
    /// 获取日志详情
    /// </summary>
    public async Task<LogEntryDto?> GetLogByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var logEntry = await _context.LogEntries
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        return logEntry != null ? MapToDto(logEntry) : null;
    }

    /// <summary>
    /// 获取日志统计信息
    /// </summary>
    public async Task<LogStatsDto> GetLogStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var sevenDaysAgo = today.AddDays(-7);

        // 总数和今日数量
        var totalCount = await _context.LogEntries.CountAsync(cancellationToken);
        var todayCount = await _context.LogEntries
            .CountAsync(l => l.CreatedAt >= today && l.CreatedAt < today.AddDays(1), cancellationToken);

        // 按级别统计
        var levelCounts = await _context.LogEntries
            .GroupBy(l => l.Level)
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Level, x => x.Count, cancellationToken);

        // 按分类统计
        var categoryCounts = await _context.LogEntries
            .GroupBy(l => l.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count, cancellationToken);

        // 最近7天统计
        var recentDailyCounts = await _context.LogEntries
            .Where(l => l.CreatedAt >= sevenDaysAgo)
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

        // 最近错误日志
        var recentErrors = await _context.LogEntries
            .Include(l => l.User)
            .Where(l => l.Level >= Domain.Enums.LogLevel.Error)
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        // 最活跃用户
        var topUsers = await _context.LogEntries
            .Where(l => l.User != null)
            .GroupBy(l => l.User!.Username)
            .Select(g => new { Username = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToDictionaryAsync(x => x.Username, x => x.Count, cancellationToken);

        // 最常见IP
        var topIpAddresses = await _context.LogEntries
            .Where(l => !string.IsNullOrEmpty(l.IpAddress))
            .GroupBy(l => l.IpAddress!)
            .Select(g => new { IpAddress = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToDictionaryAsync(x => x.IpAddress, x => x.Count, cancellationToken);

        return new LogStatsDto
        {
            TotalCount = totalCount,
            TodayCount = todayCount,
            LevelCounts = levelCounts,
            CategoryCounts = categoryCounts,
            RecentDailyCounts = recentDailyCounts,
            RecentErrors = recentErrors.Select(MapToDto),
            TopUsers = topUsers,
            TopIpAddresses = topIpAddresses
        };
    }

    /// <summary>
    /// 删除过期日志
    /// </summary>
    public async Task<int> CleanupLogsAsync(int olderThanDays = 30, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
        var expiredLogs = await _context.LogEntries
            .Where(l => l.CreatedAt < cutoffDate)
            .ToListAsync(cancellationToken);

        _context.LogEntries.RemoveRange(expiredLogs);
        await _context.SaveChangesAsync(cancellationToken);

        return expiredLogs.Count;
    }

    /// <summary>
    /// 批量删除日志
    /// </summary>
    public async Task<int> DeleteLogsAsync(IEnumerable<long> ids, CancellationToken cancellationToken = default)
    {
        var logsToDelete = await _context.LogEntries
            .Where(l => ids.Contains(l.Id))
            .ToListAsync(cancellationToken);

        _context.LogEntries.RemoveRange(logsToDelete);
        await _context.SaveChangesAsync(cancellationToken);

        return logsToDelete.Count;
    }

    /// <summary>
    /// 映射到DTO
    /// </summary>
    private static LogEntryDto MapToDto(LogEntry logEntry)
    {
        return new LogEntryDto
        {
            Id = logEntry.Id,
            Level = logEntry.Level,
            LevelName = logEntry.Level.ToString(),
            Category = logEntry.Category,
            CategoryName = logEntry.Category.ToString(),
            Message = logEntry.Message,
            Details = logEntry.Details,
            Exception = logEntry.Exception,
            Source = logEntry.Source,
            UserId = logEntry.UserId,
            Username = logEntry.User?.Username,
            IpAddress = logEntry.IpAddress,
            UserAgent = logEntry.UserAgent,
            RequestUrl = logEntry.RequestUrl,
            HttpMethod = logEntry.HttpMethod,
            StatusCode = logEntry.StatusCode,
            Duration = logEntry.Duration,
            RelatedEntityId = logEntry.RelatedEntityId,
            RelatedEntityType = logEntry.RelatedEntityType,
            Metadata = logEntry.Metadata,
            CreatedAt = logEntry.CreatedAt
        };
    }
}
