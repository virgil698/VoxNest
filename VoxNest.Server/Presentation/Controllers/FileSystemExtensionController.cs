/**
 * 基于文件系统的扩展管理控制器
 * 直接操作 voxnest.client/extensions 文件夹
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers
{
    [ApiController]
    [Route("api/filesystem-extension")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class FileSystemExtensionController : ControllerBase
    {
        private readonly IFileSystemExtensionService _fileSystemExtensionService;
        private readonly ILogger<FileSystemExtensionController> _logger;

        public FileSystemExtensionController(
            IFileSystemExtensionService fileSystemExtensionService,
            ILogger<FileSystemExtensionController> logger)
        {
            _fileSystemExtensionService = fileSystemExtensionService;
            _logger = logger;
        }

        /// <summary>
        /// 获取所有扩展（已安装和未安装）
        /// </summary>
        [HttpGet]
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
        /// 上传并安装扩展
        /// </summary>
        [HttpPost("install")]
        public async Task<IActionResult> InstallExtension([FromForm] ExtensionUploadDto uploadDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _fileSystemExtensionService.InstallExtensionAsync(uploadDto, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装扩展失败");
                return StatusCode(500, ApiResponse<string>.CreateError("安装扩展失败"));
            }
        }

        /// <summary>
        /// 卸载扩展（删除文件和从配置移除）
        /// </summary>
        [HttpDelete("{extensionId}")]
        public async Task<IActionResult> UninstallExtension(string extensionId)
        {
            try
            {
                var result = await _fileSystemExtensionService.UninstallExtensionAsync(extensionId);
                return Ok(result);
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
        public async Task<IActionResult> EnableExtension(string extensionId)
        {
            try
            {
                var result = await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, true);
                return Ok(result);
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
        public async Task<IActionResult> DisableExtension(string extensionId)
        {
            try
            {
                var result = await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, false);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "禁用扩展失败: {ExtensionId}", extensionId);
                return StatusCode(500, ApiResponse<string>.CreateError("禁用扩展失败"));
            }
        }

        /// <summary>
        /// 重新加载扩展（禁用再启用）
        /// </summary>
        [HttpPost("{extensionId}/reload")]
        public async Task<IActionResult> ReloadExtension(string extensionId)
        {
            try
            {
                // 先禁用再启用来实现重载
                await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, false);
                await Task.Delay(100); // 短暂延迟
                var result = await _fileSystemExtensionService.ToggleExtensionAsync(extensionId, true);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重载扩展失败: {ExtensionId}", extensionId);
                return StatusCode(500, ApiResponse<string>.CreateError("重载扩展失败"));
            }
        }

        /// <summary>
        /// 触发扩展热重载
        /// </summary>
        [HttpPost("hot-reload")]
        public async Task<IActionResult> TriggerHotReload()
        {
            try
            {
                // 这里可以触发前端重新加载扩展
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

        /// <summary>
        /// 验证扩展文件夹结构
        /// </summary>
        [HttpPost("validate-structure")]
        public async Task<IActionResult> ValidateExtensionStructure()
        {
            try
            {
                var extensionsPath = Path.Combine("..", "voxnest.client", "extensions");
                var result = new
                {
                    extensionsPath = extensionsPath,
                    exists = Directory.Exists(extensionsPath),
                    extensionsJsonExists = System.IO.File.Exists(Path.Combine(extensionsPath, "extensions.json")),
                    extensionFolders = Directory.Exists(extensionsPath) 
                        ? Directory.GetDirectories(extensionsPath)
                            .Where(dir => !Path.GetFileName(dir).StartsWith('.'))
                            .Select(dir => new 
                            {
                                name = Path.GetFileName(dir),
                                hasManifest = System.IO.File.Exists(Path.Combine(dir, "manifest.json")),
                                path = dir
                            }).ToList<object>()
                        : new List<object>()
                };

                await Task.CompletedTask;
                return Ok(ApiResponse<object>.CreateSuccess(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展结构失败");
                return StatusCode(500, ApiResponse<string>.CreateError("验证扩展结构失败"));
            }
        }
    }
}
