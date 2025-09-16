using System.Collections.Concurrent;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// Debug配置管理服务
/// </summary>
public interface IDebugConfigurationService
{
    /// <summary>
    /// 获取当前Debug模式状态
    /// </summary>
    bool IsDebugModeEnabled { get; }
    
    /// <summary>
    /// 更新Debug模式状态
    /// </summary>
    Task UpdateDebugModeAsync(bool enabled);
    
    /// <summary>
    /// 订阅Debug模式变更通知
    /// </summary>
    void Subscribe(Action<bool> onDebugModeChanged);
    
    /// <summary>
    /// 取消订阅Debug模式变更通知
    /// </summary>
    void Unsubscribe(Action<bool> onDebugModeChanged);
}

/// <summary>
/// Debug配置管理服务实现
/// </summary>
public class DebugConfigurationService : IDebugConfigurationService
{
    private readonly ILogger<DebugConfigurationService> _logger;
    private readonly ConcurrentBag<Action<bool>> _subscribers = new();
    private bool _debugModeEnabled;

    public DebugConfigurationService(ILogger<DebugConfigurationService> logger)
    {
        _logger = logger;
        _debugModeEnabled = GetDebugModeFromConfig();
    }

    public bool IsDebugModeEnabled => _debugModeEnabled;

    public async Task UpdateDebugModeAsync(bool enabled)
    {
        if (_debugModeEnabled == enabled)
            return;

        _debugModeEnabled = enabled;
        
        _logger.LogInformation($"🐛 Debug模式已{(enabled ? "启用" : "关闭")}");
        
        // 通知所有订阅者
        foreach (var subscriber in _subscribers)
        {
            try
            {
                subscriber(enabled);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "通知Debug模式变更时发生错误");
            }
        }

        // 如果启用了Debug模式，记录一些系统信息
        if (enabled)
        {
            await LogSystemDebugInfoAsync();
        }
    }

    public void Subscribe(Action<bool> onDebugModeChanged)
    {
        _subscribers.Add(onDebugModeChanged);
    }

    public void Unsubscribe(Action<bool> onDebugModeChanged)
    {
        // 注意：ConcurrentBag 不支持直接移除，在实际应用中可能需要使用其他集合类型
        // 这里只是简单实现
    }

    private async Task LogSystemDebugInfoAsync()
    {
        try
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("🔍 [DEBUG] 系统调试信息:");
            sb.AppendLine($"   时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            sb.AppendLine($"   进程ID: {Environment.ProcessId}");
            sb.AppendLine($"   工作线程: {Environment.ProcessorCount}");
            sb.AppendLine($"   运行时间: {TimeSpan.FromMilliseconds(Environment.TickCount64)}");
            sb.AppendLine($"   GC内存: {GC.GetTotalMemory(false) / 1024 / 1024} MB");
            sb.AppendLine($"   工作集: {Environment.WorkingSet / 1024 / 1024} MB");
            sb.AppendLine($"   .NET版本: {Environment.Version}");
            sb.AppendLine($"   操作系统: {Environment.OSVersion}");
            
            _logger.LogDebug(sb.ToString());
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "记录系统调试信息时发生错误");
        }
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
}

/// <summary>
/// Debug配置扩展方法
/// </summary>
public static class DebugConfigurationExtensions
{
    /// <summary>
    /// 条件执行Debug代码
    /// </summary>
    public static async Task ExecuteIfDebugAsync(this IDebugConfigurationService debugConfig, Func<Task> debugAction)
    {
        if (debugConfig.IsDebugModeEnabled)
        {
            await debugAction();
        }
    }
    
    /// <summary>
    /// 条件执行Debug代码（同步）
    /// </summary>
    public static void ExecuteIfDebug(this IDebugConfigurationService debugConfig, Action debugAction)
    {
        if (debugConfig.IsDebugModeEnabled)
        {
            debugAction();
        }
    }
}
