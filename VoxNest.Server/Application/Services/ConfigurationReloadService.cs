using Microsoft.Extensions.Hosting;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Results;
using VoxNest.Server.Shared.Extensions;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 配置重载服务实现
/// </summary>
public class ConfigurationReloadService : IConfigurationReloadService
{
    private readonly ILogger<ConfigurationReloadService> _logger;
    private readonly IHostApplicationLifetime _applicationLifetime;
    private static volatile bool _restartRequested = false;
    private static readonly object _restartLock = new object();

    public ConfigurationReloadService(
        ILogger<ConfigurationReloadService> logger,
        IHostApplicationLifetime applicationLifetime)
    {
        _logger = logger;
        _applicationLifetime = applicationLifetime;
    }

    /// <inheritdoc/>
    public async Task<Result> ReloadConfigurationAsync()
    {
        try
        {
            _logger.LogInformation("开始重新加载服务配置...");

            // 检查配置文件是否存在
            const string configFile = "server-config.yml";
            const string installLockFile = "install.lock";

            if (!File.Exists(configFile))
            {
                return Result.Failure("配置文件不存在");
            }

            if (!File.Exists(installLockFile))
            {
                return Result.Failure("安装锁定文件不存在");
            }

            // 验证配置文件
            try
            {
                var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(configFile);
                var (isValid, errors) = config.ValidateConfiguration();
                
                if (!isValid)
                {
                    return Result.Failure($"配置文件验证失败: {string.Join("; ", errors)}");
                }
                
                _logger.LogInformation("配置文件验证通过");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证配置文件时出错");
                return Result.Failure($"配置文件格式错误: {ex.Message}");
            }

            // 标记需要重启
            lock (_restartLock)
            {
                _restartRequested = true;
            }

            _logger.LogInformation("配置重载完成，应用需要重启以应用新配置");
            await Task.CompletedTask;
            return Result.Success("配置重载成功，系统将在后台重启以应用新配置");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重新加载配置失败");
            return Result.Failure($"配置重载失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<bool> ShouldReloadConfigurationAsync()
    {
        await Task.CompletedTask;
        
        const string configFile = "server-config.yml";
        const string installLockFile = "install.lock";
        
        // 如果配置文件和锁定文件都存在，但还在安装模式，则需要重载
        if (File.Exists(configFile) && File.Exists(installLockFile))
        {
            lock (_restartLock)
            {
                return !_restartRequested;
            }
        }
        
        return false;
    }

    /// <inheritdoc/>
    public async Task<Result> TriggerApplicationRestartAsync()
    {
        try
        {
            _logger.LogWarning("触发应用重启...");
            
            // 给客户端一些时间收到响应
            _ = Task.Run(async () =>
            {
                await Task.Delay(2000); // 等待2秒
                _logger.LogInformation("正在停止应用以重新加载配置...");
                _applicationLifetime.StopApplication();
            });

            await Task.CompletedTask;
            return Result.Success("应用重启已触发");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "触发应用重启失败");
            return Result.Failure($"触发重启失败: {ex.Message}");
        }
    }
}
