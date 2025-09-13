using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 系统信息服务实现
/// </summary>
public class SystemInfoService : ISystemInfoService
{
    private readonly VoxNestDbContext _context;
    private readonly ILogger<SystemInfoService> _logger;
    private static readonly DateTime _startTime = DateTime.UtcNow;

    public SystemInfoService(VoxNestDbContext context, ILogger<SystemInfoService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 获取系统信息
    /// </summary>
    public async Task<SystemInfoDto> GetSystemInfoAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var memoryUsage = GetMemoryUsage();
            var diskUsage = GetDiskUsage();
            var uptime = GetUptime();
            var cpuUsage = await GetCpuUsageAsync();
            var databaseSize = await GetDatabaseSizeAsync(cancellationToken);

            return new SystemInfoDto
            {
                Uptime = uptime,
                MemoryUsage = memoryUsage.used,
                TotalMemory = memoryUsage.total,
                CpuUsage = cpuUsage,
                DatabaseSize = databaseSize,
                TotalStorage = diskUsage.total,
                UsedStorage = diskUsage.used,
                AvailableStorage = diskUsage.available,
                StorageUsagePercent = diskUsage.total > 0 ? (double)diskUsage.used / diskUsage.total * 100 : 0,
                ExtensionCount = 0, // TODO: 从扩展系统获取
                ActiveExtensionCount = 0, // TODO: 从扩展系统获取
                OperatingSystem = GetOperatingSystemInfo(),
                DotNetVersion = Environment.Version.ToString(),
                ApplicationVersion = GetApplicationVersion(),
                ServerTime = DateTime.UtcNow,
                TimeZone = TimeZoneInfo.Local.DisplayName,
                StartupTime = _startTime,
                GcInfo = new GcInfoDto
                {
                    Gen0Collections = GC.CollectionCount(0),
                    Gen1Collections = GC.CollectionCount(1),
                    Gen2Collections = GC.CollectionCount(2),
                    TotalAllocatedBytes = GC.GetTotalAllocatedBytes(false)
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取系统信息时发生错误");
            // 返回默认值而不是抛出异常
            return new SystemInfoDto
            {
                ServerTime = DateTime.UtcNow,
                OperatingSystem = "Unknown",
                DotNetVersion = Environment.Version.ToString(),
                ApplicationVersion = GetApplicationVersion(),
                StartupTime = _startTime,
                TimeZone = TimeZoneInfo.Local.DisplayName
            };
        }
    }

    /// <summary>
    /// 获取内存使用情况
    /// </summary>
    public (long used, long total) GetMemoryUsage()
    {
        try
        {
            var currentProcess = Process.GetCurrentProcess();
            var usedMemory = currentProcess.WorkingSet64;
            
            // 尝试获取总内存（这在某些平台上可能不可用）
            var totalMemory = GC.GetTotalMemory(false);
            
            // 对于总内存，使用进程内存的估算值或者GC内存
            // 在.NET Core中，获取系统总内存比较复杂，这里使用简化的估算
            totalMemory = Math.Max(usedMemory * 4, totalMemory); // 简单估算

            return (usedMemory, totalMemory);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取内存使用情况失败");
            return (0, 0);
        }
    }

    /// <summary>
    /// 获取CPU使用率
    /// </summary>
    public async Task<double> GetCpuUsageAsync()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var startCpuUsage = Process.GetCurrentProcess().TotalProcessorTime;
            
            // 等待一小段时间来计算CPU使用率
            await Task.Delay(100);
            
            var endTime = DateTime.UtcNow;
            var endCpuUsage = Process.GetCurrentProcess().TotalProcessorTime;
            
            var cpuUsedMs = (endCpuUsage - startCpuUsage).TotalMilliseconds;
            var totalMsPassed = (endTime - startTime).TotalMilliseconds;
            var cpuUsageTotal = cpuUsedMs / (Environment.ProcessorCount * totalMsPassed);
            
            return Math.Round(cpuUsageTotal * 100, 2);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取CPU使用率失败");
            return 0;
        }
    }

    /// <summary>
    /// 获取磁盘空间信息
    /// </summary>
    public (long total, long used, long available) GetDiskUsage()
    {
        try
        {
            // 获取应用程序所在驱动器的信息
            var appPath = AppDomain.CurrentDomain.BaseDirectory;
            var driveInfo = new DriveInfo(Path.GetPathRoot(appPath) ?? "C:");
            
            if (driveInfo.IsReady)
            {
                var total = driveInfo.TotalSize;
                var available = driveInfo.AvailableFreeSpace;
                var used = total - available;
                
                return (total, used, available);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取磁盘使用情况失败");
        }
        
        return (0, 0, 0);
    }

    /// <summary>
    /// 获取数据库大小
    /// </summary>
    public async Task<long> GetDatabaseSizeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // 这里需要根据不同的数据库类型执行不同的查询
            var connectionString = _context.Database.GetConnectionString();
            
            if (connectionString?.Contains("mysql", StringComparison.OrdinalIgnoreCase) == true ||
                connectionString?.Contains("mariadb", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL/MariaDB 查询数据库大小
                var query = """
                    SELECT 
                        ROUND(SUM(data_length + index_length), 0) as 'database_size'
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE()
                    """;
                
                var result = await _context.Database.SqlQueryRaw<DatabaseSizeResult>(query)
                    .FirstOrDefaultAsync(cancellationToken);
                
                return result?.DatabaseSize ?? 0;
            }
            else if (connectionString?.Contains("sqlserver", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server 查询数据库大小
                var query = """
                    SELECT 
                        SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192) as DatabaseSize
                    FROM sys.database_files
                    WHERE type = 0
                    """;
                
                var result = await _context.Database.SqlQueryRaw<DatabaseSizeResult>(query)
                    .FirstOrDefaultAsync(cancellationToken);
                
                return result?.DatabaseSize ?? 0;
            }
            
            // SQLite 或其他数据库，尝试获取数据库文件大小
            if (connectionString?.Contains("sqlite", StringComparison.OrdinalIgnoreCase) == true)
            {
                var dataSource = ExtractDataSourceFromConnectionString(connectionString);
                if (!string.IsNullOrEmpty(dataSource) && File.Exists(dataSource))
                {
                    return new FileInfo(dataSource).Length;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取数据库大小失败");
        }
        
        return 0;
    }

    /// <summary>
    /// 获取系统运行时间（秒）
    /// </summary>
    public long GetUptime()
    {
        try
        {
            return (long)(DateTime.UtcNow - _startTime).TotalSeconds;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取系统运行时间失败");
            return 0;
        }
    }

    /// <summary>
    /// 获取操作系统信息
    /// </summary>
    private static string GetOperatingSystemInfo()
    {
        try
        {
            var osDescription = RuntimeInformation.OSDescription;
            var architecture = RuntimeInformation.OSArchitecture;
            return $"{osDescription} ({architecture})";
        }
        catch
        {
            return Environment.OSVersion.ToString();
        }
    }

    /// <summary>
    /// 获取应用程序版本
    /// </summary>
    private static string GetApplicationVersion()
    {
        try
        {
            var assembly = Assembly.GetExecutingAssembly();
            var version = assembly.GetName().Version;
            return version?.ToString() ?? "Unknown";
        }
        catch
        {
            return "Unknown";
        }
    }

    /// <summary>
    /// 从连接字符串中提取数据源路径
    /// </summary>
    private static string? ExtractDataSourceFromConnectionString(string connectionString)
    {
        try
        {
            var parts = connectionString.Split(';');
            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                if (trimmed.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
                {
                    return trimmed.Substring("Data Source=".Length);
                }
            }
        }
        catch
        {
            // Ignore extraction errors
        }
        
        return null;
    }
}

/// <summary>
/// 数据库大小查询结果
/// </summary>
public class DatabaseSizeResult
{
    public long DatabaseSize { get; set; }
}
