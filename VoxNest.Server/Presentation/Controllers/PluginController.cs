/**
 * 插件管理控制器
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
    public class PluginController : ControllerBase
    {
        private readonly IPluginService _pluginService;
        private readonly ILogger<PluginController> _logger;

        public PluginController(
            IPluginService pluginService,
            ILogger<PluginController> logger)
        {
            _pluginService = pluginService;
            _logger = logger;
        }

        /// <summary>
        /// 获取插件列表
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetPlugins([FromQuery] PluginQueryDto query)
        {
            try
            {
                var result = await _pluginService.GetPluginsAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件列表失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件列表失败"));
            }
        }

        /// <summary>
        /// 根据ID获取插件详情
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPlugin(int id)
        {
            try
            {
                var result = await _pluginService.GetPluginByIdAsync(id);
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件详情失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件详情失败"));
            }
        }

        /// <summary>
        /// 根据唯一ID获取插件详情
        /// </summary>
        [HttpGet("by-unique-id/{uniqueId}")]
        public async Task<IActionResult> GetPluginByUniqueId(string uniqueId)
        {
            try
            {
                var result = await _pluginService.GetPluginByUniqueIdAsync(uniqueId);
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件详情失败: {UniqueId}", uniqueId);
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件详情失败"));
            }
        }

        /// <summary>
        /// 创建插件记录
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CreatePlugin([FromBody] CreatePluginDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _pluginService.CreatePluginAsync(createDto, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(nameof(GetPlugin), new { id = result.Data!.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建插件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("创建插件失败"));
            }
        }

        /// <summary>
        /// 更新插件信息
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UpdatePlugin(int id, [FromBody] UpdatePluginDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var result = await _pluginService.UpdatePluginAsync(id, updateDto);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("更新插件失败"));
            }
        }

        /// <summary>
        /// 上传插件文件
        /// </summary>
        [HttpPost("upload")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequestSizeLimit(52428800)] // 50MB
        public async Task<IActionResult> UploadPlugin([FromForm] PluginUploadDto uploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _pluginService.UploadPluginAsync(uploadDto, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "上传插件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("上传插件失败"));
            }
        }

        /// <summary>
        /// 安装插件
        /// </summary>
        [HttpPost("{id:int}/install")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> InstallPlugin(int id)
        {
            try
            {
                var result = await _pluginService.InstallPluginAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("安装插件失败"));
            }
        }

        /// <summary>
        /// 启用插件
        /// </summary>
        [HttpPost("{id:int}/enable")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> EnablePlugin(int id)
        {
            try
            {
                var result = await _pluginService.EnablePluginAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "启用插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("启用插件失败"));
            }
        }

        /// <summary>
        /// 禁用插件
        /// </summary>
        [HttpPost("{id:int}/disable")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> DisablePlugin(int id)
        {
            try
            {
                var result = await _pluginService.DisablePluginAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "禁用插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("禁用插件失败"));
            }
        }

        /// <summary>
        /// 卸载插件
        /// </summary>
        [HttpPost("{id:int}/uninstall")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UninstallPlugin(int id)
        {
            try
            {
                var result = await _pluginService.UninstallPluginAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("卸载插件失败"));
            }
        }

        /// <summary>
        /// 删除插件
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> DeletePlugin(int id)
        {
            try
            {
                var result = await _pluginService.DeletePluginAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除插件失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("删除插件失败"));
            }
        }

        /// <summary>
        /// 获取插件版本列表
        /// </summary>
        [HttpGet("{id:int}/versions")]
        public async Task<IActionResult> GetPluginVersions(int id)
        {
            try
            {
                var result = await _pluginService.GetPluginVersionsAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件版本列表失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件版本列表失败"));
            }
        }

        /// <summary>
        /// 获取插件统计信息
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetPluginStats()
        {
            try
            {
                var result = await _pluginService.GetPluginStatsAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件统计信息失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件统计信息失败"));
            }
        }

        /// <summary>
        /// 获取已启用的插件列表
        /// </summary>
        [HttpGet("enabled")]
        [AllowAnonymous] // 前端需要加载已启用的插件
        public async Task<IActionResult> GetEnabledPlugins()
        {
            try
            {
                var result = await _pluginService.GetEnabledPluginsAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取已启用插件列表失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取已启用插件列表失败"));
            }
        }

        /// <summary>
        /// 批量更新插件状态
        /// </summary>
        [HttpPost("batch-status")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> BatchUpdatePluginStatus([FromBody] BatchUpdatePluginStatusRequest request)
        {
            try
            {
                if (!ModelState.IsValid || !request.PluginIds.Any())
                {
                    return BadRequest(ApiResponse<string>.CreateError("请求数据无效"));
                }

                var result = await _pluginService.BatchUpdatePluginStatusAsync(request.PluginIds, request.Status);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新插件状态失败");
                return StatusCode(500, ApiResponse<string>.CreateError("批量更新插件状态失败"));
            }
        }

        /// <summary>
        /// 验证插件文件
        /// </summary>
        [HttpPost("validate")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ValidatePluginFile([FromForm] IFormFile file)
        {
            try
            {
                var result = await _pluginService.ValidatePluginFileAsync(file);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证插件文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("验证插件文件失败"));
            }
        }

        /// <summary>
        /// 导出插件配置
        /// </summary>
        [HttpGet("{id:int}/export-config")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ExportPluginConfig(int id)
        {
            try
            {
                var result = await _pluginService.ExportPluginConfigAsync(id);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return File(result.Data!, "application/json", $"plugin_{id}_config.json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导出插件配置失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("导出插件配置失败"));
            }
        }

        /// <summary>
        /// 导入插件配置
        /// </summary>
        [HttpPost("{id:int}/import-config")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ImportPluginConfig(int id, [FromForm] IFormFile configFile)
        {
            try
            {
                var result = await _pluginService.ImportPluginConfigAsync(id, configFile);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导入插件配置失败: {PluginId}", id);
                return StatusCode(500, ApiResponse<string>.CreateError("导入插件配置失败"));
            }
        }
    }

    // 请求模型
    public class BatchUpdatePluginStatusRequest
    {
        public List<int> PluginIds { get; set; } = new();
        public PluginStatus Status { get; set; }
    }
}
