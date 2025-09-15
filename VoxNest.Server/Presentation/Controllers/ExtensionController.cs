using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;
using System.Text.Json;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 统一扩展管理控制器
/// 管理基于文件系统的扩展和扩展配置
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ExtensionController : ControllerBase
{
    private readonly IFileSystemExtensionService _fileSystemExtensionService;
    private readonly ILogger<ExtensionController> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _configDirectory;

    public ExtensionController(
        IFileSystemExtensionService fileSystemExtensionService,
        ILogger<ExtensionController> logger,
        IConfiguration configuration)
    {
        _fileSystemExtensionService = fileSystemExtensionService;
        _logger = logger;
        _configuration = configuration;
        
        // 设置配置存储目录
        _configDirectory = Path.Combine(Directory.GetCurrentDirectory(), "ExtensionConfigs");
        if (!Directory.Exists(_configDirectory))
        {
            Directory.CreateDirectory(_configDirectory);
            _logger.LogInformation("Created extension configs directory: {Directory}", _configDirectory);
        }
    }

    // ==================== 扩展管理 API ====================

    /// <summary>
    /// 获取所有扩展（已安装和未安装）
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAllExtensions([FromQuery] UnifiedExtensionQueryDto query)
    {
        try
        {
            var result = await _fileSystemExtensionService.GetAllExtensionsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取扩展列表失败");
            return StatusCode(500, ApiResponse<string>.CreateError("获取扩展列表失败"));
        }
    }

    /// <summary>
    /// 获取扩展统计信息
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetExtensionStats()
    {
        try
        {
            var result = await _fileSystemExtensionService.GetExtensionStatsAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取扩展统计失败");
            return StatusCode(500, ApiResponse<string>.CreateError("获取扩展统计失败"));
        }
    }

    /// <summary>
    /// 安装扩展
    /// </summary>
    [HttpPost("{extensionId}/install")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> InstallExtension(string extensionId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _fileSystemExtensionService.InstallExtensionAsync(extensionId, userId);
            
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "安装扩展失败: {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("安装扩展失败"));
        }
    }

    /// <summary>
    /// 卸载扩展
    /// </summary>
    [HttpPost("{extensionId}/uninstall")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UninstallExtension(string extensionId)
    {
        try
        {
            var result = await _fileSystemExtensionService.UninstallExtensionAsync(extensionId);
            
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "卸载扩展失败: {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("卸载扩展失败"));
        }
    }

    /// <summary>
    /// 启用扩展
    /// </summary>
    [HttpPost("{extensionId}/enable")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> EnableExtension(string extensionId)
    {
        try
        {
            var result = await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, true);
            
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "启用扩展失败: {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("启用扩展失败"));
        }
    }

    /// <summary>
    /// 禁用扩展
    /// </summary>
    [HttpPost("{extensionId}/disable")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DisableExtension(string extensionId)
    {
        try
        {
            var result = await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, false);
            
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "禁用扩展失败: {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("禁用扩展失败"));
        }
    }

    /// <summary>
    /// 触发扩展热重载
    /// </summary>
    [HttpPost("hot-reload")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> TriggerHotReload()
    {
        try
        {
            _logger.LogInformation("手动触发扩展热重载");
            
            // TODO: 实现 SignalR 通知前端重载
            await Task.CompletedTask;
            
            return Ok(ApiResponse<string>.CreateSuccess("热重载已触发"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "触发热重载失败");
            return StatusCode(500, ApiResponse<string>.CreateError("触发热重载失败"));
        }
    }

    /// <summary>
    /// 获取 extensions.json 配置
    /// </summary>
    [HttpGet("config")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetExtensionsConfig()
    {
        try
        {
            var extensionsPath = Path.Combine("..", "voxnest.client", "extensions", "extensions.json");
            
            if (!System.IO.File.Exists(extensionsPath))
            {
                return NotFound(ApiResponse<string>.CreateError("extensions.json 不存在"));
            }

            var content = await System.IO.File.ReadAllTextAsync(extensionsPath);
            var config = System.Text.Json.JsonSerializer.Deserialize<object>(content);

            return Ok(ApiResponse<object>.CreateSuccess(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取扩展配置失败");
            return StatusCode(500, ApiResponse<string>.CreateError("获取扩展配置失败"));
        }
    }

    // ==================== 扩展配置管理 API ====================

    /// <summary>
    /// 获取扩展配置列表
    /// </summary>
    [HttpGet("configs")]
    public async Task<IActionResult> GetExtensionConfigs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? extensionType = null,
        [FromQuery] bool? enabled = null)
    {
        try
        {
            var configs = new List<ExtensionConfigDto>();
            
            // 读取所有配置文件
            var configFiles = Directory.GetFiles(_configDirectory, "*.json");
            
            foreach (var configFile in configFiles)
            {
                try
                {
                    var content = await System.IO.File.ReadAllTextAsync(configFile);
                    var config = JsonSerializer.Deserialize<ExtensionConfigDto>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (config != null)
                    {
                        // 应用过滤器
                        if (!string.IsNullOrEmpty(extensionType) && 
                            !string.Equals(config.ExtensionType, extensionType, StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }
                        
                        if (enabled.HasValue && config.Enabled != enabled.Value)
                        {
                            continue;
                        }
                        
                        configs.Add(config);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to load config file: {File}", configFile);
                }
            }
            
            // 分页
            var totalCount = configs.Count;
            var pagedConfigs = configs
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();
            
            var response = new
            {
                configs = pagedConfigs,
                totalCount,
                pageNumber,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
            
            return Ok(ApiResponse<object>.CreateSuccess(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get extension configs");
            return StatusCode(500, ApiResponse<string>.CreateError("获取扩展配置失败"));
        }
    }

    /// <summary>
    /// 获取特定扩展的配置
    /// </summary>
    [HttpGet("configs/{extensionId}")]
    public async Task<IActionResult> GetExtensionConfig(string extensionId)
    {
        try
        {
            var configPath = Path.Combine(_configDirectory, $"{extensionId}.json");
            
            if (!System.IO.File.Exists(configPath))
            {
                // 如果配置文件不存在，创建默认配置
                var defaultConfig = CreateDefaultConfig(extensionId);
                await SaveExtensionConfig(extensionId, defaultConfig);
                return Ok(ApiResponse<ExtensionConfigDto>.CreateSuccess(defaultConfig));
            }
            
            var content = await System.IO.File.ReadAllTextAsync(configPath);
            var config = JsonSerializer.Deserialize<ExtensionConfigDto>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            if (config == null)
            {
                return NotFound(ApiResponse<string>.CreateError("配置文件格式错误"));
            }
            
            return Ok(ApiResponse<ExtensionConfigDto>.CreateSuccess(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get extension config for {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("获取扩展配置失败"));
        }
    }

    /// <summary>
    /// 创建或更新扩展配置
    /// </summary>
    [HttpPost("configs")]
    public async Task<IActionResult> CreateOrUpdateExtensionConfig([FromBody] CreateExtensionConfigRequest request)
    {
        try
        {
            var config = new ExtensionConfigDto
            {
                ExtensionId = request.ExtensionId,
                ExtensionName = request.ExtensionName ?? request.ExtensionId,
                ExtensionType = request.ExtensionType ?? "plugin",
                Enabled = request.Enabled ?? true,
                UserConfig = request.UserConfig ?? new Dictionary<string, object>(),
                DefaultConfig = request.DefaultConfig ?? new Dictionary<string, object>(),
                Schema = request.Schema,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await SaveExtensionConfig(request.ExtensionId, config);
            
            _logger.LogInformation("Created/Updated extension config for {ExtensionId}", request.ExtensionId);
            return Ok(ApiResponse<ExtensionConfigDto>.CreateSuccess(config, "扩展配置保存成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create extension config for {ExtensionId}", request.ExtensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("创建扩展配置失败"));
        }
    }

    /// <summary>
    /// 更新扩展配置
    /// </summary>
    [HttpPut("configs/{extensionId}")]
    public async Task<IActionResult> UpdateExtensionConfig(string extensionId, [FromBody] UpdateExtensionConfigRequest request)
    {
        try
        {
            var configPath = Path.Combine(_configDirectory, $"{extensionId}.json");
            
            ExtensionConfigDto config;
            if (System.IO.File.Exists(configPath))
            {
                var content = await System.IO.File.ReadAllTextAsync(configPath);
                config = JsonSerializer.Deserialize<ExtensionConfigDto>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? CreateDefaultConfig(extensionId);
            }
            else
            {
                config = CreateDefaultConfig(extensionId);
            }
            
            // 更新配置
            if (request.Enabled.HasValue)
                config.Enabled = request.Enabled.Value;
            
            if (request.UserConfig != null)
                config.UserConfig = request.UserConfig;
            
            if (request.Schema != null)
                config.Schema = request.Schema;
            
            config.UpdatedAt = DateTime.UtcNow;
            
            await SaveExtensionConfig(extensionId, config);
            
            _logger.LogInformation("Updated extension config for {ExtensionId}", extensionId);
            return Ok(ApiResponse<ExtensionConfigDto>.CreateSuccess(config, "扩展配置更新成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update extension config for {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("更新扩展配置失败"));
        }
    }

    /// <summary>
    /// 删除扩展配置
    /// </summary>
    [HttpDelete("configs/{extensionId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public IActionResult DeleteExtensionConfig(string extensionId)
    {
        try
        {
            var configPath = Path.Combine(_configDirectory, $"{extensionId}.json");
            
            if (System.IO.File.Exists(configPath))
            {
                System.IO.File.Delete(configPath);
                _logger.LogInformation("Deleted extension config for {ExtensionId}", extensionId);
                return Ok(ApiResponse<string>.CreateSuccess("扩展配置删除成功"));
            }
            
            return NotFound(ApiResponse<string>.CreateError("配置文件不存在"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete extension config for {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("删除扩展配置失败"));
        }
    }

    /// <summary>
    /// 重置扩展配置为默认值
    /// </summary>
    [HttpPost("configs/{extensionId}/reset")]
    public async Task<IActionResult> ResetExtensionConfig(string extensionId)
    {
        try
        {
            var defaultConfig = CreateDefaultConfig(extensionId);
            await SaveExtensionConfig(extensionId, defaultConfig);
            
            _logger.LogInformation("Reset extension config for {ExtensionId}", extensionId);
            return Ok(ApiResponse<ExtensionConfigDto>.CreateSuccess(defaultConfig, "扩展配置已重置"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reset extension config for {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("重置扩展配置失败"));
        }
    }

    /// <summary>
    /// 验证扩展配置
    /// </summary>
    [HttpPost("configs/{extensionId}/validate")]
    public IActionResult ValidateExtensionConfig(string extensionId, [FromBody] Dictionary<string, object> config)
    {
        try
        {
            // 基本验证逻辑
            var isValid = config != null && config.Count > 0;
            var errors = new List<string>();
            
            if (!isValid)
            {
                errors.Add("配置不能为空");
            }
            
            var result = new
            {
                isValid,
                errors
            };
            
            return Ok(ApiResponse<object>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate extension config for {ExtensionId}", extensionId);
            return StatusCode(500, ApiResponse<string>.CreateError("验证扩展配置失败"));
        }
    }

    // ==================== 私有辅助方法 ====================

    private ExtensionConfigDto CreateDefaultConfig(string extensionId)
    {
        return new ExtensionConfigDto
        {
            ExtensionId = extensionId,
            ExtensionName = extensionId,
            ExtensionType = "plugin",
            Enabled = true,
            UserConfig = new Dictionary<string, object>(),
            DefaultConfig = new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private async Task SaveExtensionConfig(string extensionId, ExtensionConfigDto config)
    {
        var configPath = Path.Combine(_configDirectory, $"{extensionId}.json");
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        
        var content = JsonSerializer.Serialize(config, options);
        await System.IO.File.WriteAllTextAsync(configPath, content);
    }
}

// ==================== 数据传输对象 ====================

public class ExtensionConfigDto
{
    public string ExtensionId { get; set; } = string.Empty;
    public string ExtensionName { get; set; } = string.Empty;
    public string ExtensionType { get; set; } = "plugin";
    public bool Enabled { get; set; } = true;
    public Dictionary<string, object> UserConfig { get; set; } = new();
    public Dictionary<string, object> DefaultConfig { get; set; } = new();
    public string? Schema { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateExtensionConfigRequest
{
    public string ExtensionId { get; set; } = string.Empty;
    public string? ExtensionName { get; set; }
    public string? ExtensionType { get; set; }
    public bool? Enabled { get; set; }
    public Dictionary<string, object>? UserConfig { get; set; }
    public Dictionary<string, object>? DefaultConfig { get; set; }
    public string? Schema { get; set; }
}

public class UpdateExtensionConfigRequest
{
    public bool? Enabled { get; set; }
    public Dictionary<string, object>? UserConfig { get; set; }
    public string? Schema { get; set; }
}
