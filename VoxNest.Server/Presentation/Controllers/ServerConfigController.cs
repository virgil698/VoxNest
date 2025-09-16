using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.DTOs;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Application.Services;
using VoxNest.Server.Shared.Results;
using Result = VoxNest.Server.Shared.Results.Result;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 服务器配置控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ServerConfigController : ControllerBase
{
    private readonly IServerConfigService _configService;
    private readonly ILogger<ServerConfigController> _logger;

    public ServerConfigController(
        IServerConfigService configService,
        ILogger<ServerConfigController> logger)
    {
        _configService = configService;
        _logger = logger;
    }

    /// <summary>
    /// 获取完整的服务器配置
    /// </summary>
    /// <returns>完整的服务器配置</returns>
    [HttpGet("full")]
    public async Task<ActionResult<Result<FullServerConfigDto>>> GetFullConfig()
    {
        try
        {
            var config = await _configService.GetFullConfigAsync();
            return Ok(Result<FullServerConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving full server configuration");
            return StatusCode(500, Result<FullServerConfigDto>.Failure("获取服务器配置失败"));
        }
    }

    /// <summary>
    /// 获取服务器基本配置
    /// </summary>
    /// <returns>服务器基本配置</returns>
    [HttpGet("server")]
    public async Task<ActionResult<Result<ServerConfigDto>>> GetServerConfig()
    {
        try
        {
            var config = await _configService.GetServerConfigAsync();
            return Ok(Result<ServerConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving server configuration");
            return StatusCode(500, Result<ServerConfigDto>.Failure("获取服务器配置失败"));
        }
    }

    /// <summary>
    /// 获取数据库配置
    /// </summary>
    /// <returns>数据库配置（敏感信息已脱敏）</returns>
    [HttpGet("database")]
    public async Task<ActionResult<Result<DatabaseConfigDto>>> GetDatabaseConfig()
    {
        try
        {
            var config = await _configService.GetDatabaseConfigAsync();
            return Ok(Result<DatabaseConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving database configuration");
            return StatusCode(500, Result<DatabaseConfigDto>.Failure("获取数据库配置失败"));
        }
    }

    /// <summary>
    /// 获取JWT配置
    /// </summary>
    /// <returns>JWT配置（敏感信息已脱敏）</returns>
    [HttpGet("jwt")]
    public async Task<ActionResult<Result<JwtConfigDto>>> GetJwtConfig()
    {
        try
        {
            var config = await _configService.GetJwtConfigAsync();
            return Ok(Result<JwtConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving JWT configuration");
            return StatusCode(500, Result<JwtConfigDto>.Failure("获取JWT配置失败"));
        }
    }

    /// <summary>
    /// 获取CORS配置
    /// </summary>
    /// <returns>CORS配置</returns>
    [HttpGet("cors")]
    public async Task<ActionResult<Result<CorsConfigDto>>> GetCorsConfig()
    {
        try
        {
            var config = await _configService.GetCorsConfigAsync();
            return Ok(Result<CorsConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving CORS configuration");
            return StatusCode(500, Result<CorsConfigDto>.Failure("获取CORS配置失败"));
        }
    }

    /// <summary>
    /// 获取日志配置
    /// </summary>
    /// <returns>日志配置</returns>
    [HttpGet("logging")]
    public async Task<ActionResult<Result<LoggingConfigDto>>> GetLoggingConfig()
    {
        try
        {
            var config = await _configService.GetLoggingConfigAsync();
            return Ok(Result<LoggingConfigDto>.Success(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving logging configuration");
            return StatusCode(500, Result<LoggingConfigDto>.Failure("获取日志配置失败"));
        }
    }

    /// <summary>
    /// 更新服务器配置
    /// </summary>
    /// <param name="config">服务器配置</param>
    /// <returns>更新结果</returns>
    [HttpPut("server")]
    public async Task<ActionResult<Result<bool>>> UpdateServerConfig([FromBody] ServerConfigDto config)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Result<bool>.Failure("配置数据无效"));
            }

            var result = await _configService.UpdateServerConfigAsync(config);
            if (result)
            {
                _logger.LogInformation("Server configuration updated by user: {UserId}", User.Identity?.Name);
                return Ok(Result<bool>.Success(true, "服务器配置更新成功"));
            }

            return StatusCode(500, Result<bool>.Failure("服务器配置更新失败"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating server configuration");
            return StatusCode(500, Result<bool>.Failure("服务器配置更新失败"));
        }
    }

    /// <summary>
    /// 更新CORS配置
    /// </summary>
    /// <param name="config">CORS配置</param>
    /// <returns>更新结果</returns>
    [HttpPut("cors")]
    public async Task<ActionResult<Result<bool>>> UpdateCorsConfig([FromBody] CorsConfigDto config)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Result<bool>.Failure("配置数据无效"));
            }

            var result = await _configService.UpdateCorsConfigAsync(config);
            if (result)
            {
                _logger.LogInformation("CORS configuration updated by user: {UserId}", User.Identity?.Name);
                return Ok(Result<bool>.Success(true, "CORS配置更新成功"));
            }

            return StatusCode(500, Result<bool>.Failure("CORS配置更新失败"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating CORS configuration");
            return StatusCode(500, Result<bool>.Failure("CORS配置更新失败"));
        }
    }

    /// <summary>
    /// 更新日志配置
    /// </summary>
    /// <param name="config">日志配置</param>
    /// <returns>更新结果</returns>
    [HttpPut("logging")]
    public async Task<ActionResult<Result<bool>>> UpdateLoggingConfig([FromBody] LoggingConfigDto config)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Result<bool>.Failure("配置数据无效"));
            }

            var result = await _configService.UpdateLoggingConfigAsync(config);
            var requiresRestart = _configService.RequiresRestart("logging", new object(), config);
            
            if (result)
            {
                // 实时更新Debug配置（无需重启）
                var debugConfigService = HttpContext.RequestServices.GetService<IDebugConfigurationService>();
                if (debugConfigService != null)
                {
                    await debugConfigService.UpdateDebugModeAsync(config.EnableDebugMode);
                }
                
                _logger.LogInformation("Logging configuration updated by user: {UserId}. Debug mode: {DebugMode}", 
                    User.Identity?.Name, config.EnableDebugMode ? "Enabled" : "Disabled");
                
                var message = config.EnableDebugMode switch
                {
                    true => "日志配置更新成功，Debug模式已启用 - 将记录详细的调试信息",
                    false when requiresRestart => "日志配置更新成功，Debug模式已关闭，建议重启服务以完全生效",
                    false => "日志配置更新成功，Debug模式已关闭"
                };
                
                return Ok(Result<bool>.Success(true, message));
            }

            return StatusCode(500, Result<bool>.Failure("日志配置更新失败"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating logging configuration");
            return StatusCode(500, Result<bool>.Failure("日志配置更新失败"));
        }
    }

    /// <summary>
    /// 获取所有可用时区
    /// </summary>
    /// <returns>时区信息列表</returns>
    [HttpGet("timezones")]
    public async Task<ActionResult<Result<List<TimeZoneInfoDto>>>> GetAvailableTimeZones()
    {
        try
        {
            var timeZones = await _configService.GetAvailableTimeZonesAsync();
            return Ok(Result<List<TimeZoneInfoDto>>.Success(timeZones));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available time zones");
            return StatusCode(500, Result<List<TimeZoneInfoDto>>.Failure("获取时区列表失败"));
        }
    }

    /// <summary>
    /// 获取当前时区信息
    /// </summary>
    /// <returns>当前时区信息</returns>
    [HttpGet("timezone")]
    public async Task<ActionResult<Result<TimeZoneInfoDto>>> GetCurrentTimeZone()
    {
        try
        {
            var timeZone = await _configService.GetCurrentTimeZoneAsync();
            return Ok(Result<TimeZoneInfoDto>.Success(timeZone));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current time zone");
            return StatusCode(500, Result<TimeZoneInfoDto>.Failure("获取当前时区失败"));
        }
    }

    /// <summary>
    /// 设置时区
    /// </summary>
    /// <param name="request">时区设置请求</param>
    /// <returns>设置结果</returns>
    [HttpPost("timezone")]
    public async Task<ActionResult<Result<bool>>> SetTimeZone([FromBody] SetTimeZoneRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.TimeZoneId))
            {
                return BadRequest(Result<bool>.Failure("时区ID不能为空"));
            }

            var result = await _configService.SetTimeZoneAsync(request.TimeZoneId);
            if (result)
            {
                _logger.LogInformation("Time zone changed to {TimeZoneId} by user: {UserId}", request.TimeZoneId, User.Identity?.Name);
                return Ok(Result<bool>.Success(true, "时区设置成功"));
            }

            return BadRequest(Result<bool>.Failure("无效的时区ID"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting time zone: {TimeZoneId}", request.TimeZoneId);
            return StatusCode(500, Result<bool>.Failure("时区设置失败"));
        }
    }

    /// <summary>
    /// 验证配置有效性
    /// </summary>
    /// <param name="request">配置验证请求</param>
    /// <returns>验证结果</returns>
    [HttpPost("validate")]
    public async Task<ActionResult<Result<bool>>> ValidateConfig([FromBody] ConfigValidationRequest request)
    {
        try
        {
            var (isValid, errorMessage) = await _configService.ValidateConfigAsync(request.Category, request.ConfigData);
            
            if (isValid)
            {
                return Ok(Result<bool>.Success(true, "配置验证通过"));
            }

            return BadRequest(Result<bool>.Failure($"配置验证失败: {errorMessage}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating configuration for category: {Category}", request.Category);
            return StatusCode(500, Result<bool>.Failure("配置验证失败"));
        }
    }

    /// <summary>
    /// 备份当前配置
    /// </summary>
    /// <returns>备份文件路径</returns>
    [HttpPost("backup")]
    public async Task<ActionResult<Result<string>>> BackupConfig()
    {
        try
        {
            var backupPath = await _configService.BackupConfigAsync();
            _logger.LogInformation("Configuration backup created at {BackupPath} by user: {UserId}", backupPath, User.Identity?.Name);
            return Ok(Result<string>.Success(backupPath, "配置备份成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating configuration backup");
            return StatusCode(500, Result<string>.Failure("配置备份失败"));
        }
    }

    /// <summary>
    /// 重置配置为默认值
    /// </summary>
    /// <param name="request">重置请求</param>
    /// <returns>重置结果</returns>
    [HttpPost("reset")]
    public async Task<ActionResult<Result<bool>>> ResetConfig([FromBody] ConfigResetRequest request)
    {
        try
        {
            var result = await _configService.ResetConfigAsync(request.Category);
            if (result)
            {
                _logger.LogWarning("Configuration reset performed for category: {Category} by user: {UserId}", request.Category ?? "all", User.Identity?.Name);
                return Ok(Result<bool>.Success(true, "配置重置成功"));
            }

            return StatusCode(500, Result<bool>.Failure("配置重置失败"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting configuration for category: {Category}", request.Category);
            return StatusCode(500, Result<bool>.Failure("配置重置失败"));
        }
    }
}

/// <summary>
/// 时区设置请求
/// </summary>
public class SetTimeZoneRequest
{
    /// <summary>
    /// 时区ID
    /// </summary>
    public string TimeZoneId { get; set; } = string.Empty;
}

/// <summary>
/// 配置验证请求
/// </summary>
public class ConfigValidationRequest
{
    /// <summary>
    /// 配置类别
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 配置数据
    /// </summary>
    public object ConfigData { get; set; } = new();
}

/// <summary>
/// 配置重置请求
/// </summary>
public class ConfigResetRequest
{
    /// <summary>
    /// 配置类别（可选，为空则重置所有）
    /// </summary>
    public string? Category { get; set; }
}
