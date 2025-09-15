using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 配置重载服务接口
/// </summary>
public interface IConfigurationReloadService
{
    /// <summary>
    /// 重新加载服务配置
    /// </summary>
    Task<Result> ReloadConfigurationAsync();
    
    /// <summary>
    /// 检查是否需要重载配置
    /// </summary>
    Task<bool> ShouldReloadConfigurationAsync();
    
    /// <summary>
    /// 触发应用重启
    /// </summary>
    Task<Result> TriggerApplicationRestartAsync();
}
