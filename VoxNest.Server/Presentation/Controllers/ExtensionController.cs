/**
 * 扩展文件管理控制器
 * 提供前端扩展文件访问和索引功能
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExtensionController : ControllerBase
    {
        private readonly ILogger<ExtensionController> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _frontendPluginsPath;
        private readonly string _frontendThemesPath;

        public ExtensionController(
            ILogger<ExtensionController> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            
            _frontendPluginsPath = _configuration["Frontend:ExtensionsPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "plugins");
            _frontendThemesPath = _configuration["Frontend:ThemesPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "themes");
        }

        /// <summary>
        /// 获取已安装插件的目录索引
        /// </summary>
        [HttpGet("plugins/index")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPluginsIndex()
        {
            try
            {
                var directories = await GetDirectoriesAsync(_frontendPluginsPath);
                var index = new
                {
                    type = "plugins",
                    directories = directories,
                    timestamp = DateTime.UtcNow
                };

                return Ok(ApiResponse<object>.CreateSuccess(index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件索引失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取插件索引失败"));
            }
        }

        /// <summary>
        /// 获取已安装主题的目录索引
        /// </summary>
        [HttpGet("themes/index")]
        [AllowAnonymous]
        public async Task<IActionResult> GetThemesIndex()
        {
            try
            {
                var directories = await GetDirectoriesAsync(_frontendThemesPath);
                var index = new
                {
                    type = "themes",
                    directories = directories,
                    timestamp = DateTime.UtcNow
                };

                return Ok(ApiResponse<object>.CreateSuccess(index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题索引失败");
                return StatusCode(500, ApiResponse<string>.CreateError("获取主题索引失败"));
            }
        }

        /// <summary>
        /// 获取插件的清单文件
        /// </summary>
        [HttpGet("plugins/{pluginId}/manifest")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPluginManifest(string pluginId)
        {
            try
            {
                var manifestPath = Path.Combine(_frontendPluginsPath, pluginId, "manifest.json");
                
                if (!System.IO.File.Exists(manifestPath))
                {
                    return NotFound(ApiResponse<string>.CreateError("插件清单文件不存在"));
                }

                var manifestContent = await System.IO.File.ReadAllTextAsync(manifestPath);
                var manifest = System.Text.Json.JsonSerializer.Deserialize<object>(manifestContent);

                return Ok(ApiResponse<object>.CreateSuccess(manifest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "读取插件清单失败: {PluginId}", pluginId);
                return StatusCode(500, ApiResponse<string>.CreateError("读取插件清单失败"));
            }
        }

        /// <summary>
        /// 获取主题的清单文件
        /// </summary>
        [HttpGet("themes/{themeId}/manifest")]
        [AllowAnonymous]
        public async Task<IActionResult> GetThemeManifest(string themeId)
        {
            try
            {
                var manifestPath = Path.Combine(_frontendThemesPath, themeId, "manifest.json");
                
                if (!System.IO.File.Exists(manifestPath))
                {
                    return NotFound(ApiResponse<string>.CreateError("主题清单文件不存在"));
                }

                var manifestContent = await System.IO.File.ReadAllTextAsync(manifestPath);
                var manifest = System.Text.Json.JsonSerializer.Deserialize<object>(manifestContent);

                return Ok(ApiResponse<object>.CreateSuccess(manifest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "读取主题清单失败: {ThemeId}", themeId);
                return StatusCode(500, ApiResponse<string>.CreateError("读取主题清单失败"));
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
        /// 清理未使用的扩展文件
        /// </summary>
        [HttpPost("cleanup")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CleanupExtensions()
        {
            try
            {
                var cleanedCount = 0;

                // 清理插件目录
                cleanedCount += await CleanupExtensionDirectory(_frontendPluginsPath, "plugin");

                // 清理主题目录
                cleanedCount += await CleanupExtensionDirectory(_frontendThemesPath, "theme");

                return Ok(ApiResponse<object>.CreateSuccess(new { cleanedCount }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理扩展文件失败");
                return StatusCode(500, ApiResponse<string>.CreateError("清理扩展文件失败"));
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
