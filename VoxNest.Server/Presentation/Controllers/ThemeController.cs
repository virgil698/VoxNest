/**
 * 主题管理控制器
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ThemeController : ControllerBase
    {
        private readonly IThemeService _themeService;
        private readonly ILogger<ThemeController> _logger;

        public ThemeController(
            IThemeService themeService,
            ILogger<ThemeController> logger)
        {
            _themeService = themeService;
            _logger = logger;
        }

        /// <summary>
        /// 获取主题列表
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetThemes([FromQuery] ThemeQueryDto query)
        {
            try
            {
                var result = await _themeService.GetThemesAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题列表失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取主题列表失败"));
            }
        }

        /// <summary>
        /// 根据ID获取主题详情
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTheme(int id)
        {
            try
            {
                var result = await _themeService.GetThemeByIdAsync(id);
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题详情失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("获取主题详情失败"));
            }
        }

        /// <summary>
        /// 上传主题文件
        /// </summary>
        [HttpPost("upload")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequestSizeLimit(20971520)] // 20MB
        public async Task<IActionResult> UploadTheme([FromForm] ThemeUploadDto uploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _themeService.UploadThemeAsync(uploadDto, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "上传主题失败");
                return StatusCode(500, ApiResponse<string>.CreateError("上传主题失败"));
            }
        }

        /// <summary>
        /// 安装主题
        /// </summary>
        [HttpPost("{id:int}/install")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> InstallTheme(int id)
        {
            try
            {
                var result = await _themeService.InstallThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("安装主题失败"));
            }
        }

        /// <summary>
        /// 激活主题
        /// </summary>
        [HttpPost("{id:int}/activate")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ActivateTheme(int id)
        {
            try
            {
                var result = await _themeService.ActivateThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "激活主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("激活主题失败"));
            }
        }

        /// <summary>
        /// 禁用主题
        /// </summary>
        [HttpPost("{id:int}/disable")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> DisableTheme(int id)
        {
            try
            {
                var result = await _themeService.DisableThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "禁用主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("禁用主题失败"));
            }
        }

        /// <summary>
        /// 卸载主题
        /// </summary>
        [HttpPost("{id:int}/uninstall")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UninstallTheme(int id)
        {
            try
            {
                var result = await _themeService.UninstallThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("卸载主题失败"));
            }
        }

        /// <summary>
        /// 删除主题
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> DeleteTheme(int id)
        {
            try
            {
                var result = await _themeService.DeleteThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("删除主题失败"));
            }
        }

        /// <summary>
        /// 获取当前激活的主题
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveTheme()
        {
            try
            {
                var result = await _themeService.GetActiveThemeAsync();
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取当前激活主题失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取当前激活主题失败"));
            }
        }

        /// <summary>
        /// 获取主题预览列表
        /// </summary>
        [HttpGet("previews")]
        public async Task<IActionResult> GetThemePreviews()
        {
            try
            {
                var result = await _themeService.GetThemePreviewsAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题预览列表失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取主题预览列表失败"));
            }
        }

        /// <summary>
        /// 获取主题统计信息
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetThemeStats()
        {
            try
            {
                var result = await _themeService.GetThemeStatsAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题统计信息失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取主题统计信息失败"));
            }
        }

        /// <summary>
        /// 预览主题
        /// </summary>
        [HttpGet("{id:int}/preview")]
        public async Task<IActionResult> PreviewTheme(int id)
        {
            try
            {
                var result = await _themeService.PreviewThemeAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "预览主题失败: {ThemeId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("预览主题失败"));
            }
        }

        /// <summary>
        /// 重置为默认主题
        /// </summary>
        [HttpPost("reset-to-default")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ResetToDefaultTheme()
        {
            try
            {
                var result = await _themeService.ResetToDefaultThemeAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置为默认主题失败");
                return StatusCode(500, ApiResponse<string>.CreateError("重置为默认主题失败"));
            }
        }

        /// <summary>
        /// 批量更新主题状态
        /// </summary>
        [HttpPost("batch-status")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> BatchUpdateThemeStatus([FromBody] BatchUpdateThemeStatusRequest request)
        {
            try
            {
                if (!ModelState.IsValid || !request.ThemeIds.Any())
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var result = await _themeService.BatchUpdateThemeStatusAsync(request.ThemeIds, request.Status);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新主题状态失败");
                return StatusCode(500, ApiResponse<string>.CreateError("批量更新主题状态失败"));
            }
        }

        /// <summary>
        /// 验证主题文件
        /// </summary>
        [HttpPost("validate")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ValidateThemeFile([FromForm] IFormFile file)
        {
            try
            {
                var result = await _themeService.ValidateThemeFileAsync(file);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证主题文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("验证主题文件失败"));
            }
        }
    }

    // 请求模型
    public class BatchUpdateThemeStatusRequest
    {
        public List<int> ThemeIds { get; set; } = new();
        public ThemeStatus Status { get; set; }
    }
}
