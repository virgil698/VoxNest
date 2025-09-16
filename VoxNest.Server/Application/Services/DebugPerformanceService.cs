using System.Diagnostics;
using System.Runtime;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// Debug性能监控服务
/// </summary>
public interface IDebugPerformanceService
{
    /// <summary>
    /// 记录性能指标
    /// </summary>
    void LogPerformanceMetrics(string operation, long elapsedMs, object? context = null);
    
    /// <summary>
    /// 开始性能计时
    /// </summary>
    IDisposable StartTiming(string operation);
    
    /// <summary>
    /// 记录内存使用情况
    /// </summary>
    void LogMemoryUsage(string context);
    
    /// <summary>
    /// 记录数据库查询性能
    /// </summary>
    void LogDatabaseQuery(string query, long elapsedMs, int recordCount = 0);
}

/// <summary>
/// Debug性能监控服务实现
/// </summary>
public class DebugPerformanceService : IDebugPerformanceService
{
    private readonly ILogger<DebugPerformanceService> _logger;
    private readonly bool _isDebugMode;

    public DebugPerformanceService(ILogger<DebugPerformanceService> logger)
    {
        _logger = logger;
        _isDebugMode = GetDebugModeFromConfig();
    }

    public void LogPerformanceMetrics(string operation, long elapsedMs, object? context = null)
    {
        if (!_isDebugMode) return;

        var level = elapsedMs switch
        {
            > 5000 => LogLevel.Error,
            > 2000 => LogLevel.Warning,
            > 500 => LogLevel.Information,
            _ => LogLevel.Debug
        };

        var message = $"⏱️ [PERF] {operation}: {elapsedMs}ms";
        if (context != null)
        {
            message += $" | Context: {context}";
        }

        _logger.Log(level, message);
    }

    public IDisposable StartTiming(string operation)
    {
        return new PerformanceTimer(this, operation);
    }

    public void LogMemoryUsage(string context)
    {
        if (!_isDebugMode) return;

        var totalMemory = GC.GetTotalMemory(false);
        var workingSet = Environment.WorkingSet;
        var gen0 = GC.CollectionCount(0);
        var gen1 = GC.CollectionCount(1);
        var gen2 = GC.CollectionCount(2);

        _logger.LogDebug($"💾 [MEMORY] {context}: " +
                        $"Total={totalMemory / 1024 / 1024}MB, " +
                        $"WorkingSet={workingSet / 1024 / 1024}MB, " +
                        $"GC(Gen0={gen0}, Gen1={gen1}, Gen2={gen2})");
    }

    public void LogDatabaseQuery(string query, long elapsedMs, int recordCount = 0)
    {
        if (!_isDebugMode) return;

        var level = elapsedMs switch
        {
            > 1000 => LogLevel.Warning,
            > 500 => LogLevel.Information,
            _ => LogLevel.Debug
        };

        var message = $"🗄️ [DB] Query: {elapsedMs}ms, Records: {recordCount}";
        if (query.Length > 100)
        {
            message += $" | SQL: {query[..100]}...";
        }
        else
        {
            message += $" | SQL: {query}";
        }

        _logger.Log(level, message);
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

    /// <summary>
    /// 性能计时器
    /// </summary>
    private class PerformanceTimer : IDisposable
    {
        private readonly DebugPerformanceService _service;
        private readonly string _operation;
        private readonly Stopwatch _stopwatch;
        private bool _disposed;

        public PerformanceTimer(DebugPerformanceService service, string operation)
        {
            _service = service;
            _operation = operation;
            _stopwatch = Stopwatch.StartNew();
        }

        public void Dispose()
        {
            if (_disposed) return;

            _stopwatch.Stop();
            _service.LogPerformanceMetrics(_operation, _stopwatch.ElapsedMilliseconds);
            _disposed = true;
        }
    }
}

/// <summary>
/// Debug扩展方法
/// </summary>
public static class DebugExtensions
{
    /// <summary>
    /// 性能计时扩展
    /// </summary>
    public static async Task<T> WithTimingAsync<T>(this Task<T> task, IDebugPerformanceService performanceService, string operation)
    {
        using var timer = performanceService.StartTiming(operation);
        return await task;
    }
    
    /// <summary>
    /// 性能计时扩展（同步）
    /// </summary>
    public static T WithTiming<T>(this Func<T> func, IDebugPerformanceService performanceService, string operation)
    {
        using var timer = performanceService.StartTiming(operation);
        return func();
    }
}
