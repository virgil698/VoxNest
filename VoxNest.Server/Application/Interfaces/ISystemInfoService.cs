using VoxNest.Server.Application.DTOs.Admin;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 系统信息服务接口
/// </summary>
public interface ISystemInfoService
{
    /// <summary>
    /// 获取系统信息
    /// </summary>
    Task<SystemInfoDto> GetSystemInfoAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取内存使用情况
    /// </summary>
    (long used, long total) GetMemoryUsage();

    /// <summary>
    /// 获取CPU使用率
    /// </summary>
    Task<double> GetCpuUsageAsync();

    /// <summary>
    /// 获取磁盘空间信息
    /// </summary>
    (long total, long used, long available) GetDiskUsage();

    /// <summary>
    /// 获取数据库大小
    /// </summary>
    Task<long> GetDatabaseSizeAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取系统运行时间（秒）
    /// </summary>
    long GetUptime();
}
