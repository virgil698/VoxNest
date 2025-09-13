/**
 * 扩展文件管理控制器
 * 提供前端扩展文件访问和索引功能
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
    [Route("api/[controller]")]
    public class ExtensionController : ControllerBase
    {
        private readonly ILogger<ExtensionController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IUnifiedExtensionService _unifiedExtensionService;
        private readonly IExtensionInstallerService _extensionInstallerService;
        private readonly string _frontendPluginsPath;
        private readonly string _frontendThemesPath;

        public ExtensionController(
            ILogger<ExtensionController> logger,
            IConfiguration configuration,
            IUnifiedExtensionService unifiedExtensionService,
            IExtensionInstallerService extensionInstallerService)
        {
            _logger = logger;
            _configuration = configuration;
            _unifiedExtensionService = unifiedExtensionService;
            _extensionInstallerService = extensionInstallerService;
            
            _frontendPluginsPath = _configuration["Frontend:ExtensionsPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "plugins");
            _frontendThemesPath = _configuration["Frontend:ThemesPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "themes");
        }

        /// <summary>
        /// 获取扩展目录索引（统一接口）
        /// </summary>
        [HttpGet("{type}/index")]
        [AllowAnonymous]
        public async Task<IActionResult> GetExtensionIndex(string type)
        {
            try
            {
                if (type.ToLower() != "plugins" && type.ToLower() != "themes")
                {
                    return BadRequest(ApiResponse<string>.CreateError("无效的扩展类型"));
                }

                var basePath = type.ToLower() == "plugins" ? _frontendPluginsPath : _frontendThemesPath;
                var directories = await GetDirectoriesAsync(basePath);
                var index = new
                {
                    type = type.ToLower(),
                    directories = directories,
                    timestamp = DateTime.UtcNow
                };

                return Ok(ApiResponse<object>.CreateSuccess(index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取{Type}索引失败", type);
                return StatusCode(500, ApiResponse<string>.CreateError($"获取{type}索引失败"));
            }
        }

        /// <summary>
        /// 获取扩展清单文件（统一接口）
        /// </summary>
        [HttpGet("{type}/{extensionId}/manifest")]
        [AllowAnonymous]
        public async Task<IActionResult> GetExtensionManifest(string type, string extensionId)
        {
            try
            {
                if (type.ToLower() != "plugins" && type.ToLower() != "themes")
                {
                    return BadRequest(ApiResponse<string>.CreateError("无效的扩展类型"));
                }

                var basePath = type.ToLower() == "plugins" ? _frontendPluginsPath : _frontendThemesPath;
                var manifestPath = Path.Combine(basePath, extensionId, "manifest.json");
                
                if (!System.IO.File.Exists(manifestPath))
                {
                    return NotFound(ApiResponse<string>.CreateError("扩展清单文件不存在"));
                }

                var manifestContent = await System.IO.File.ReadAllTextAsync(manifestPath);
                var manifest = System.Text.Json.JsonSerializer.Deserialize<object>(manifestContent);

                return Ok(ApiResponse<object>.CreateSuccess(manifest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "读取{Type}清单失败: {ExtensionId}", type, extensionId);
                return StatusCode(500, ApiResponse<string>.CreateError($"读取{type}清单失败"));
            }
        }

        /// <summary>
        /// 提供扩展文件访问（代理到静态文件）
        /// </summary>
        [HttpGet("files/{type}/{extensionId}/{*filePath}")]
        [AllowAnonymous]
        public async Task<IActionResult> ServeExtensionFile(
            string type, 
            string extensionId, 
            string filePath)
        {
            try
            {
                if (type != "plugins" && type != "themes")
                {
                    return BadRequest(ApiResponse<string>.CreateError("无效的扩展类型"));
                }

                var basePath = type == "plugins" ? _frontendPluginsPath : _frontendThemesPath;
                var fullPath = Path.Combine(basePath, extensionId, filePath);

                // 安全检查：确保路径在允许的目录内
                var normalizedBasePath = Path.GetFullPath(basePath);
                var normalizedFullPath = Path.GetFullPath(fullPath);
                
                if (!normalizedFullPath.StartsWith(normalizedBasePath))
                {
                    return BadRequest(ApiResponse<string>.CreateError("无效的文件路径"));
                }

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(ApiResponse<string>.CreateError("文件不存在"));
                }

                var contentType = GetContentType(filePath);
                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);

                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "提供扩展文件失败: {Type}/{ExtensionId}/{FilePath}", 
                    type, extensionId, filePath);
                return StatusCode(500, ApiResponse<string>.CreateError("文件访问失败"));
            }
        }

        /// <summary>
        /// 清理未使用的扩展文件（已迁移到统一接口）
        /// </summary>
        [HttpPost("cleanup")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CleanupExtensions()
        {
            try
            {
                // 使用统一扩展安装器的清理功能
                var result = await _extensionInstallerService.CleanupExtensionFilesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理扩展文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("清理扩展文件失败"));
            }
        }

        // 统一扩展管理API

        /// <summary>
        /// 获取统一扩展列表
        /// </summary>
        [HttpGet("unified")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetUnifiedExtensions([FromQuery] UnifiedExtensionQueryDto query)
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionsAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取统一扩展列表失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取扩展列表失败"));
            }
        }

        /// <summary>
        /// 获取扩展详情
        /// </summary>
        [HttpGet("unified/{type}/{id:int}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetUnifiedExtension(string type, int id)
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionAsync(id, type);
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展详情失败: {Type}/{Id}", type, id);
                return StatusCode(500, ApiResponse<string>.CreateError("获取扩展详情失败"));
            }
        }

        /// <summary>
        /// 根据UniqueId获取扩展详情
        /// </summary>
        [HttpGet("unified/{type}/unique/{uniqueId}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetUnifiedExtensionByUniqueId(string type, string uniqueId)
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionByUniqueIdAsync(uniqueId, type);
                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据UniqueId获取扩展详情失败: {Type}/{UniqueId}", type, uniqueId);
                return StatusCode(500, ApiResponse<string>.CreateError("获取扩展详情失败"));
            }
        }

        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        [HttpGet("unified/stats")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetExtensionStats()
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionStatsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展统计信息失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取统计信息失败"));
            }
        }

        /// <summary>
        /// 执行扩展操作
        /// </summary>
        [HttpPost("unified/action")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ExecuteExtensionAction([FromBody] ExtensionActionDto actionDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _unifiedExtensionService.ExecuteExtensionActionAsync(actionDto, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "执行扩展操作失败: {Action}/{Type}/{Id}", 
                    actionDto.Action, actionDto.ExtensionType, actionDto.ExtensionId);
                return StatusCode(500, ApiResponse<string>.CreateError("执行操作失败"));
            }
        }

        /// <summary>
        /// 批量执行扩展操作
        /// </summary>
        [HttpPost("unified/batch-action")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ExecuteBatchExtensionAction([FromBody] BatchExtensionActionDto batchActionDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _unifiedExtensionService.ExecuteBatchExtensionActionAsync(batchActionDto, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量执行扩展操作失败: {Action}", batchActionDto.Action);
                return StatusCode(500, ApiResponse<string>.CreateError("批量操作失败"));
            }
        }

        /// <summary>
        /// 搜索扩展
        /// </summary>
        [HttpGet("unified/search")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> SearchExtensions([FromQuery] string searchTerm, [FromQuery] int limit = 10)
        {
            try
            {
                var result = await _unifiedExtensionService.SearchExtensionsAsync(searchTerm, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "搜索扩展失败: {SearchTerm}", searchTerm);
                return StatusCode(500, ApiResponse<string>.CreateError("搜索失败"));
            }
        }

        /// <summary>
        /// 获取统一扩展manifest（通过数据库）
        /// </summary>
        [HttpGet("unified/{type}/{uniqueId}/manifest")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetUnifiedExtensionManifest(string type, string uniqueId)
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionManifestAsync(uniqueId, type);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展manifest失败: {Type}/{UniqueId}", type, uniqueId);
                return StatusCode(500, ApiResponse<string>.CreateError("获取manifest失败"));
            }
        }

        /// <summary>
        /// 验证扩展兼容性
        /// </summary>
        [HttpGet("unified/{type}/{uniqueId}/compatibility")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ValidateExtensionCompatibility(string type, string uniqueId)
        {
            try
            {
                var result = await _unifiedExtensionService.ValidateExtensionCompatibilityAsync(uniqueId, type);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展兼容性失败: {Type}/{UniqueId}", type, uniqueId);
                return StatusCode(500, ApiResponse<string>.CreateError("兼容性检查失败"));
            }
        }

        /// <summary>
        /// 获取扩展依赖关系图
        /// </summary>
        [HttpGet("unified/dependency-graph")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetExtensionDependencyGraph()
        {
            try
            {
                var result = await _unifiedExtensionService.GetExtensionDependencyGraphAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取依赖关系图失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取依赖关系图失败"));
            }
        }

        /// <summary>
        /// 导出扩展配置
        /// </summary>
        [HttpGet("unified/export-config")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ExportExtensionsConfig()
        {
            try
            {
                var result = await _unifiedExtensionService.ExportExtensionsConfigAsync();
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(result.Data ?? "");
                return File(bytes, "application/json", $"extensions-config-{DateTime.Now:yyyyMMdd-HHmmss}.json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导出扩展配置失败");
                return StatusCode(500, ApiResponse<string>.CreateError("导出配置失败"));
            }
        }

        /// <summary>
        /// 导入扩展配置
        /// </summary>
        [HttpPost("unified/import-config")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ImportExtensionsConfig([FromBody] string configData)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _unifiedExtensionService.ImportExtensionsConfigAsync(configData, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导入扩展配置失败");
                return StatusCode(500, ApiResponse<string>.CreateError("导入配置失败"));
            }
        }

        // 扩展安装管理API

        /// <summary>
        /// 预览扩展文件
        /// </summary>
        [HttpPost("unified/preview")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> PreviewExtension([FromForm] IFormFile extensionFile, [FromForm] string extensionType)
        {
            try
            {
                var result = await _extensionInstallerService.PreviewExtensionAsync(extensionFile, extensionType);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "预览扩展失败");
                return StatusCode(500, ApiResponse<string>.CreateError("预览失败"));
            }
        }

        /// <summary>
        /// 上传并安装扩展
        /// </summary>
        [HttpPost("unified/install")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> InstallExtension([FromForm] ExtensionUploadDto uploadDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _extensionInstallerService.InstallExtensionAsync(uploadDto, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装扩展失败");
                return StatusCode(500, ApiResponse<string>.CreateError("安装失败"));
            }
        }

        /// <summary>
        /// 卸载扩展（删除文件）
        /// </summary>
        [HttpDelete("unified/{type}/{extensionId}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UninstallExtension(string type, string extensionId)
        {
            try
            {
                var result = await _extensionInstallerService.UninstallExtensionAsync(extensionId, type);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载扩展失败: {Type}/{ExtensionId}", type, extensionId);
                return StatusCode(500, ApiResponse<string>.CreateError("卸载失败"));
            }
        }

        /// <summary>
        /// 验证扩展文件
        /// </summary>
        [HttpPost("unified/validate")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> ValidateExtensionFile([FromForm] IFormFile extensionFile)
        {
            try
            {
                var result = await _extensionInstallerService.ValidateExtensionFileAsync(extensionFile);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("验证失败"));
            }
        }

        /// <summary>
        /// 清理无效的扩展文件
        /// </summary>
        [HttpPost("unified/cleanup")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CleanupExtensionFiles()
        {
            try
            {
                var result = await _extensionInstallerService.CleanupExtensionFilesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理扩展文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("清理失败"));
            }
        }

        /// <summary>
        /// 获取安装历史
        /// </summary>
        [HttpGet("unified/install-history")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetInstallHistory([FromQuery] int limit = 50)
        {
            try
            {
                var result = await _extensionInstallerService.GetInstallHistoryAsync(limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取安装历史失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取历史失败"));
            }
        }

        // 私有辅助方法
        private Task<List<string>> GetDirectoriesAsync(string basePath)
        {
            var directories = new List<string>();

            if (Directory.Exists(basePath))
            {
                var dirs = Directory.GetDirectories(basePath);
                foreach (var dir in dirs)
                {
                    var dirName = Path.GetFileName(dir);
                    
                    // 检查是否有manifest.json文件
                    var manifestPath = Path.Combine(dir, "manifest.json");
                    if (System.IO.File.Exists(manifestPath))
                    {
                        directories.Add(dirName);
                    }
                }
            }

            return Task.FromResult(directories);
        }

        private Task<int> CleanupExtensionDirectory(string basePath, string type)
        {
            var cleanedCount = 0;

            if (!Directory.Exists(basePath))
            {
                return Task.FromResult(cleanedCount);
            }

            var dirs = Directory.GetDirectories(basePath);
            
            foreach (var dir in dirs)
            {
                try
                {
                    var dirName = Path.GetFileName(dir);
                    
                    // TODO: 检查数据库中是否还存在该扩展的记录
                    // 如果不存在，则删除目录
                    // 这里暂时跳过，需要依赖具体的业务逻辑
                    
                    _logger.LogDebug($"Checked {type} directory: {dirName}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to process {type} directory: {dir}");
                }
            }

            return Task.FromResult(cleanedCount);
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            
            return extension switch
            {
                ".js" => "application/javascript",
                ".mjs" => "application/javascript",
                ".jsx" => "application/javascript",
                ".ts" => "application/typescript",
                ".tsx" => "application/typescript",
                ".css" => "text/css",
                ".json" => "application/json",
                ".html" => "text/html",
                ".htm" => "text/html",
                ".svg" => "image/svg+xml",
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".ico" => "image/x-icon",
                ".woff" => "font/woff",
                ".woff2" => "font/woff2",
                ".ttf" => "font/ttf",
                ".eot" => "application/vnd.ms-fontobject",
                _ => "application/octet-stream"
            };
        }
    }
}
