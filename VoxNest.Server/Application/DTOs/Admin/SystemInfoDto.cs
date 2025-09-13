namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 系统信息DTO
/// </summary>
public class SystemInfoDto
{
    /// <summary>
    /// 系统运行时间（秒）
    /// </summary>
    public long Uptime { get; set; }

    /// <summary>
    /// 内存使用量（字节）
    /// </summary>
    public long MemoryUsage { get; set; }

    /// <summary>
    /// 总内存大小（字节）
    /// </summary>
    public long TotalMemory { get; set; }

    /// <summary>
    /// CPU使用率（百分比）
    /// </summary>
    public double CpuUsage { get; set; }

    /// <summary>
    /// 数据库大小（字节）
    /// </summary>
    public long DatabaseSize { get; set; }

    /// <summary>
    /// 总存储空间（字节）
    /// </summary>
    public long TotalStorage { get; set; }

    /// <summary>
    /// 已使用存储空间（字节）
    /// </summary>
    public long UsedStorage { get; set; }

    /// <summary>
    /// 可用存储空间（字节）
    /// </summary>
    public long AvailableStorage { get; set; }

    /// <summary>
    /// 存储使用率（百分比）
    /// </summary>
    public double StorageUsagePercent { get; set; }

    /// <summary>
    /// 扩展插件数量
    /// </summary>
    public int ExtensionCount { get; set; }

    /// <summary>
    /// 已激活的扩展数量
    /// </summary>
    public int ActiveExtensionCount { get; set; }

    /// <summary>
    /// 操作系统信息
    /// </summary>
    public string OperatingSystem { get; set; } = string.Empty;

    /// <summary>
    /// .NET版本
    /// </summary>
    public string DotNetVersion { get; set; } = string.Empty;

    /// <summary>
    /// 应用程序版本
    /// </summary>
    public string ApplicationVersion { get; set; } = string.Empty;

    /// <summary>
    /// 服务器时间
    /// </summary>
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 时区信息
    /// </summary>
    public string TimeZone { get; set; } = string.Empty;

    /// <summary>
    /// 启动时间
    /// </summary>
    public DateTime StartupTime { get; set; }

    /// <summary>
    /// GC信息
    /// </summary>
    public GcInfoDto GcInfo { get; set; } = new();
}

/// <summary>
/// GC信息DTO
/// </summary>
public class GcInfoDto
{
    /// <summary>
    /// Gen 0 GC次数
    /// </summary>
    public int Gen0Collections { get; set; }

    /// <summary>
    /// Gen 1 GC次数
    /// </summary>
    public int Gen1Collections { get; set; }

    /// <summary>
    /// Gen 2 GC次数
    /// </summary>
    public int Gen2Collections { get; set; }

    /// <summary>
    /// 总分配内存（字节）
    /// </summary>
    public long TotalAllocatedBytes { get; set; }
}
