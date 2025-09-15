using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Results;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 配置管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ConfigurationController : ControllerBase
{
    private readonly IConfigurationReloadService _configurationReloadService;
    private readonly ILogger<ConfigurationController> _logger;

    public ConfigurationController(
        IConfigurationReloadService configurationReloadService,
        ILogger<ConfigurationController> logger)
    {
        _configurationReloadService = configurationReloadService;
        _logger = logger;
    }

    /// <summary>
    /// 检查是否需要重载配置
    /// </summary>
    [HttpGet("reload-status")]
    public async Task<IActionResult> GetReloadStatus()
    {
        try
        {
            var shouldReload = await _configurationReloadService.ShouldReloadConfigurationAsync();
            return Ok(ApiResponse<object>.CreateSuccess(new { shouldReload }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查配置重载状态失败");
            return StatusCode(500, ApiResponse<string>.CreateError("检查配置状态失败"));
        }
    }

    /// <summary>
    /// 触发配置重载
    /// </summary>
    [HttpPost("reload")]
    public async Task<IActionResult> ReloadConfiguration()
    {
        try
        {
            var result = await _configurationReloadService.ReloadConfigurationAsync();
            
            if (result.IsSuccess)
            {
                // 启动重启任务
                _ = Task.Run(async () =>
                {
                    await Task.Delay(2000);
                    await _configurationReloadService.TriggerApplicationRestartAsync();
                });
                
                return Ok(ApiResponse<string>.CreateSuccess("配置重载已触发，系统将在2秒后重启"));
            }
            
            return BadRequest(ApiResponse<string>.CreateError(result.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "触发配置重载失败");
            return StatusCode(500, ApiResponse<string>.CreateError("配置重载失败"));
        }
    }

    /// <summary>
    /// 获取服务状态
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetServiceStatus()
    {
        const string installLockFile = "install.lock";
        const string configFile = "server-config.yml";
        
        var status = new
        {
            isInstalled = System.IO.File.Exists(installLockFile),
            hasConfig = System.IO.File.Exists(configFile),
            timestamp = DateTime.UtcNow,
            version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "Unknown"
        };
        
        return Ok(ApiResponse<object>.CreateSuccess(status));
    }
}
