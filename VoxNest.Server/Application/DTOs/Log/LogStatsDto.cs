using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Log;

/// <summary>
/// 日志统计信息DTO
/// </summary>
public class LogStatsDto
{
    /// <summary>
    /// 总日志数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 今日日志数
    /// </summary>
    public int TodayCount { get; set; }

    /// <summary>
    /// 按级别统计
    /// </summary>
    public Dictionary<Domain.Enums.LogLevel, int> LevelCounts { get; set; } = new();

    /// <summary>
    /// 按分类统计
    /// </summary>
    public Dictionary<LogCategory, int> CategoryCounts { get; set; } = new();

    /// <summary>
    /// 最近7天每日统计
    /// </summary>
    public Dictionary<DateTime, int> RecentDailyCounts { get; set; } = new();

    /// <summary>
    /// 最近的错误日志
    /// </summary>
    public IEnumerable<LogEntryDto> RecentErrors { get; set; } = new List<LogEntryDto>();

    /// <summary>
    /// 最活跃用户（用户名 -> 日志数）
    /// </summary>
    public Dictionary<string, int> TopUsers { get; set; } = new();

    /// <summary>
    /// 最常见IP地址（IP -> 访问数）
    /// </summary>
    public Dictionary<string, int> TopIpAddresses { get; set; } = new();
}
