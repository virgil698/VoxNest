using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 站点公开信息控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SiteController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<SiteController> _logger;

    public SiteController(
        IAdminService adminService,
        ILogger<SiteController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// 获取公开的站点设置
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>公开的站点设置</returns>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, string>>), 200)]
    public async Task<ActionResult<ApiResponse<Dictionary<string, string>>>> GetPublicSettings(
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 获取所有设置
            var allSettings = await _adminService.GetSiteSettingsAsync(null, cancellationToken);
            
            // 过滤出公开的设置
            var publicSettings = allSettings
                .Where(s => s.IsPublic && s.IsEnabled)
                .ToDictionary(s => s.Key, s => s.Value ?? s.DefaultValue ?? string.Empty);

            _logger.LogDebug("返回 {Count} 个公开站点设置", publicSettings.Count);
            
            return Ok(ApiResponse<Dictionary<string, string>>.CreateSuccess(publicSettings, "获取站点设置成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取公开站点设置失败");
            return StatusCode(500, ApiResponse<Dictionary<string, string>>.CreateError("获取站点设置失败"));
        }
    }

    /// <summary>
    /// 获取特定的公开站点设置
    /// </summary>
    /// <param name="key">设置键名</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>站点设置值</returns>
    [HttpGet("settings/{key}")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<string>>> GetPublicSetting(
        string key,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var setting = await _adminService.GetSiteSettingAsync(key, cancellationToken);
            
            if (setting == null || !setting.IsPublic || !setting.IsEnabled)
            {
                return NotFound(ApiResponse<string>.CreateError("设置不存在或不可访问"));
            }

            var value = setting.Value ?? setting.DefaultValue ?? string.Empty;
            
            return Ok(ApiResponse<string>.CreateSuccess(value, "获取设置成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取站点设置失败: {Key}", key);
            return StatusCode(500, ApiResponse<string>.CreateError("获取设置失败"));
        }
    }

    /// <summary>
    /// 获取站点基本信息
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>站点基本信息</returns>
    [HttpGet("info")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    public async Task<ActionResult<ApiResponse<object>>> GetSiteInfo(
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 获取站点基本设置
            var settings = await _adminService.GetSiteSettingsAsync(null, cancellationToken);
            var publicSettings = settings
                .Where(s => s.IsPublic && s.IsEnabled)
                .ToDictionary(s => s.Key, s => s.Value ?? s.DefaultValue ?? string.Empty);

            // 构造站点信息对象
            var siteInfo = new
            {
                name = publicSettings.GetValueOrDefault("site.name", "VoxNest"),
                description = publicSettings.GetValueOrDefault("site.description", "下一代论坛交流平台"),
                keywords = publicSettings.GetValueOrDefault("site.keywords", "论坛,交流,社区"),
                logo = publicSettings.GetValueOrDefault("site.logo", "/images/logo.png"),
                favicon = publicSettings.GetValueOrDefault("site.favicon", "/favicon.ico"),
                features = new
                {
                    registrationEnabled = bool.Parse(publicSettings.GetValueOrDefault("features.registration_enabled", "true")),
                    emailVerification = bool.Parse(publicSettings.GetValueOrDefault("features.email_verification", "false")),
                    guestPosting = bool.Parse(publicSettings.GetValueOrDefault("features.guest_posting", "false")),
                    commentsEnabled = bool.Parse(publicSettings.GetValueOrDefault("features.comments_enabled", "true"))
                },
                theme = new
                {
                    primaryColor = publicSettings.GetValueOrDefault("theme.primary_color", "#1890ff"),
                    darkModeEnabled = bool.Parse(publicSettings.GetValueOrDefault("theme.dark_mode_enabled", "true")),
                    defaultMode = publicSettings.GetValueOrDefault("theme.default_mode", "light")
                },
                dev = new
                {
                    reactQueryDevtools = bool.Parse(publicSettings.GetValueOrDefault("dev.react_query_devtools", "false"))
                },
                security = new
                {
                    passwordMinLength = int.Parse(publicSettings.GetValueOrDefault("security.password_min_length", "6"))
                }
            };

            return Ok(ApiResponse<object>.CreateSuccess(siteInfo, "获取站点信息成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取站点信息失败");
            return StatusCode(500, ApiResponse<object>.CreateError("获取站点信息失败"));
        }
    }
}
