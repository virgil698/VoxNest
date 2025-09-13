/**
 * 扩展安装服务实现
 * 处理扩展文件的上传、解压、验证和安装
 */

using System.IO.Compression;
using System.Text.Json;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.Extension;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace VoxNest.Server.Application.Services
{
    public class ExtensionInstallerService : IExtensionInstallerService
    {
        private readonly VoxNestDbContext _context;
        private readonly ILogger<ExtensionInstallerService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _frontendPluginsPath;
        private readonly string _frontendThemesPath;
        private readonly string _tempUploadPath;
        
        private readonly string[] _allowedFileTypes = { ".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".md", ".html", ".svg", ".png", ".jpg", ".jpeg", ".gif" };
        private readonly long _maxFileSize = 50 * 1024 * 1024; // 50MB

        public ExtensionInstallerService(
            VoxNestDbContext context,
            ILogger<ExtensionInstallerService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            
            _frontendPluginsPath = _configuration["Frontend:ExtensionsPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "plugins");
            _frontendThemesPath = _configuration["Frontend:ThemesPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "themes");
            _tempUploadPath = Path.Combine("wwwroot", "temp", "extensions");
            
            // 确保目录存在
            Directory.CreateDirectory(_frontendPluginsPath);
            Directory.CreateDirectory(_frontendThemesPath);
            Directory.CreateDirectory(_tempUploadPath);
        }

        /// <summary>
        /// 预览扩展文件
        /// </summary>
        public async Task<ApiResponse<ExtensionPreviewDto>> PreviewExtensionAsync(IFormFile extensionFile, string extensionType)
        {
            try
            {
                // 基本验证
                var validationResult = await ValidateExtensionFileAsync(extensionFile);
                if (!validationResult.IsSuccess)
                {
                    return ApiResponse<ExtensionPreviewDto>.CreateError(validationResult.Message);
                }

                var manifest = validationResult.Data!;
                
                // 检查是否已存在
                var existingExtension = await CheckExistingExtensionAsync(manifest.Id, extensionType);
                
                // 兼容性检查
                var compatibilityResult = await CheckExtensionCompatibilityAsync(manifest);
                
                var preview = new ExtensionPreviewDto
                {
                    Id = manifest.Id,
                    Name = manifest.Name,
                    Version = manifest.Version,
                    Description = manifest.Description,
                    Author = manifest.Author,
                    Type = manifest.Type,
                    Homepage = manifest.Homepage,
                    Dependencies = manifest.Dependencies,
                    Tags = manifest.Tags,
                    Permissions = manifest.Permissions,
                    FileSize = extensionFile.Length,
                    IsValid = compatibilityResult.IsSuccess,
                    ValidationErrors = compatibilityResult.IsSuccess ? Array.Empty<string>() : new[] { compatibilityResult.Message },
                    ValidationWarnings = Array.Empty<string>(), // TODO: 实现警告检查
                    AlreadyExists = existingExtension != null,
                    ExistingVersion = GetExistingVersion(existingExtension)
                };
                
                return ApiResponse<ExtensionPreviewDto>.CreateSuccess(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "预览扩展文件失败");
                return ApiResponse<ExtensionPreviewDto>.CreateError("预览失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 安装扩展
        /// </summary>
        public async Task<ApiResponse<ExtensionInstallResultDto>> InstallExtensionAsync(ExtensionUploadDto uploadDto, int userId)
        {
            var tempExtractPath = string.Empty;
            
            try
            {
                _logger.LogInformation("开始安装扩展: {FileName}", uploadDto.ExtensionFile.FileName);
                
                // 验证文件
                var validationResult = await ValidateExtensionFileAsync(uploadDto.ExtensionFile);
                if (!validationResult.IsSuccess)
                {
                    return ApiResponse<ExtensionInstallResultDto>.CreateError(validationResult.Message);
                }

                var manifest = validationResult.Data!;
                
                // 检查是否已存在且不允许覆盖
                var existingExtension = await CheckExistingExtensionAsync(manifest.Id, uploadDto.ExtensionType);
                if (existingExtension != null && !uploadDto.OverrideExisting)
                {
                    return ApiResponse<ExtensionInstallResultDto>.CreateError($"扩展 {manifest.Name} 已存在，请选择覆盖安装或使用不同的ID");
                }
                
                // 创建临时解压目录
                tempExtractPath = Path.Combine(_tempUploadPath, $"{manifest.Id}_{Guid.NewGuid():N}");
                Directory.CreateDirectory(tempExtractPath);
                
                // 解压文件
                await ExtractZipFileAsync(uploadDto.ExtensionFile, tempExtractPath);
                
                // 获取目标目录
                var targetPath = uploadDto.ExtensionType.ToLower() == "plugin" 
                    ? Path.Combine(_frontendPluginsPath, manifest.Id)
                    : Path.Combine(_frontendThemesPath, manifest.Id);
                
                // 备份现有文件（如果覆盖安装）
                string? backupPath = null;
                if (existingExtension != null && Directory.Exists(targetPath))
                {
                    backupPath = Path.Combine(_tempUploadPath, $"{manifest.Id}_backup_{DateTime.Now:yyyyMMddHHmmss}");
                    Directory.Move(targetPath, backupPath);
                }
                
                try
                {
                    // 复制文件到目标位置
                    CopyDirectory(tempExtractPath, targetPath);
                    _logger.LogInformation("扩展文件已复制到: {TargetPath}", targetPath);
                    
                    // 创建或更新数据库记录
                    var installResult = await CreateOrUpdateExtensionRecordAsync(manifest, uploadDto, userId, targetPath);
                    
                    // 清理备份
                    if (backupPath != null && Directory.Exists(backupPath))
                    {
                        Directory.Delete(backupPath, true);
                    }
                    
                    return ApiResponse<ExtensionInstallResultDto>.CreateSuccess(installResult);
                }
                catch (Exception)
                {
                    // 安装失败，恢复备份
                    if (backupPath != null && Directory.Exists(backupPath))
                    {
                        if (Directory.Exists(targetPath))
                        {
                            Directory.Delete(targetPath, true);
                        }
                        Directory.Move(backupPath, targetPath);
                    }
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装扩展失败: {FileName}", uploadDto.ExtensionFile.FileName);
                return ApiResponse<ExtensionInstallResultDto>.CreateError("安装失败: " + ex.Message);
            }
            finally
            {
                // 清理临时文件
                if (!string.IsNullOrEmpty(tempExtractPath) && Directory.Exists(tempExtractPath))
                {
                    try
                    {
                        Directory.Delete(tempExtractPath, true);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "清理临时文件失败: {TempPath}", tempExtractPath);
                    }
                }
            }
        }

        /// <summary>
        /// 验证扩展文件
        /// </summary>
        public async Task<ApiResponse<ExtensionManifestInfo>> ValidateExtensionFileAsync(IFormFile extensionFile)
        {
            try
            {
                // 基本文件验证
                if (extensionFile.Length == 0)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError("文件为空");
                }
                
                if (extensionFile.Length > _maxFileSize)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError($"文件大小超过限制 ({_maxFileSize / (1024 * 1024)}MB)");
                }
                
                if (!extensionFile.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError("只支持ZIP格式的扩展文件");
                }
                
                // 验证ZIP文件和manifest.json
                using var stream = extensionFile.OpenReadStream();
                using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
                
                var manifestEntry = archive.GetEntry("manifest.json");
                if (manifestEntry == null)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError("扩展包中缺少 manifest.json 文件");
                }
                
                // 读取并解析manifest.json
                using var manifestStream = manifestEntry.Open();
                using var reader = new StreamReader(manifestStream);
                var manifestContent = await reader.ReadToEndAsync();
                
                var manifest = JsonSerializer.Deserialize<ExtensionManifestInfo>(manifestContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (manifest == null)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError("manifest.json 格式无效");
                }
                
                // 验证必要字段
                var errors = new List<string>();
                if (string.IsNullOrEmpty(manifest.Id)) errors.Add("缺少扩展ID");
                if (string.IsNullOrEmpty(manifest.Name)) errors.Add("缺少扩展名称");
                if (string.IsNullOrEmpty(manifest.Version)) errors.Add("缺少版本号");
                if (string.IsNullOrEmpty(manifest.Author)) errors.Add("缺少作者信息");
                if (string.IsNullOrEmpty(manifest.Type)) errors.Add("缺少扩展类型");
                if (string.IsNullOrEmpty(manifest.Main)) errors.Add("缺少入口文件");
                
                if (errors.Count > 0)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError("manifest.json 验证失败: " + string.Join(", ", errors));
                }
                
                // 验证入口文件是否存在
                var mainEntry = archive.GetEntry(manifest.Main);
                if (mainEntry == null)
                {
                    return ApiResponse<ExtensionManifestInfo>.CreateError($"入口文件 {manifest.Main} 不存在");
                }
                
                // 验证文件类型
                foreach (var entry in archive.Entries)
                {
                    if (!entry.FullName.EndsWith("/") && !IsAllowedFileType(entry.FullName))
                    {
                        return ApiResponse<ExtensionManifestInfo>.CreateError($"不允许的文件类型: {entry.FullName}");
                    }
                }
                
                return ApiResponse<ExtensionManifestInfo>.CreateSuccess(manifest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展文件失败");
                return ApiResponse<ExtensionManifestInfo>.CreateError("文件验证失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 检查扩展兼容性
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, object>>> CheckExtensionCompatibilityAsync(ExtensionManifestInfo manifest)
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                var result = new Dictionary<string, object>
                {
                    ["compatible"] = true,
                    ["warnings"] = new List<string>(),
                    ["errors"] = new List<string>()
                };
                
                // TODO: 实现具体的兼容性检查逻辑
                // 1. 检查依赖关系
                // 2. 检查版本兼容性
                // 3. 检查权限要求
                // 4. 检查API兼容性
                
                return ApiResponse<Dictionary<string, object>>.CreateSuccess(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "兼容性检查失败");
                return ApiResponse<Dictionary<string, object>>.CreateError("兼容性检查失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 卸载扩展
        /// </summary>
        public async Task<ApiResponse<string>> UninstallExtensionAsync(string extensionId, string extensionType)
        {
            try
            {
                // 删除文件
                var targetPath = extensionType.ToLower() == "plugin"
                    ? Path.Combine(_frontendPluginsPath, extensionId)
                    : Path.Combine(_frontendThemesPath, extensionId);
                
                if (Directory.Exists(targetPath))
                {
                    Directory.Delete(targetPath, true);
                    _logger.LogInformation("已删除扩展文件: {ExtensionId}", extensionId);
                }
                
                // 删除数据库记录
                if (extensionType.ToLower() == "plugin")
                {
                    var plugin = await _context.Plugins.FirstOrDefaultAsync(p => p.UniqueId == extensionId);
                    if (plugin != null)
                    {
                        _context.Plugins.Remove(plugin);
                    }
                }
                else
                {
                    var theme = await _context.Themes.FirstOrDefaultAsync(t => t.UniqueId == extensionId);
                    if (theme != null)
                    {
                        _context.Themes.Remove(theme);
                    }
                }
                
                await _context.SaveChangesAsync();
                
                return ApiResponse<string>.CreateSuccess($"扩展 {extensionId} 已成功卸载");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载扩展失败: {ExtensionId}", extensionId);
                return ApiResponse<string>.CreateError("卸载失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 清理无效的扩展文件
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, int>>> CleanupExtensionFilesAsync()
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                var result = new Dictionary<string, int>
                {
                    ["plugins_cleaned"] = 0,
                    ["themes_cleaned"] = 0,
                    ["temp_files_cleaned"] = 0
                };
                
                // TODO: 实现清理逻辑
                
                return ApiResponse<Dictionary<string, int>>.CreateSuccess(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理扩展文件失败");
                return ApiResponse<Dictionary<string, int>>.CreateError("清理失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 获取安装历史
        /// </summary>
        public async Task<ApiResponse<List<ExtensionInstallResultDto>>> GetInstallHistoryAsync(int limit = 50)
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                // TODO: 实现安装历史查询
                var history = new List<ExtensionInstallResultDto>();
                
                return ApiResponse<List<ExtensionInstallResultDto>>.CreateSuccess(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取安装历史失败");
                return ApiResponse<List<ExtensionInstallResultDto>>.CreateError("获取历史失败: " + ex.Message);
            }
        }

        // 私有辅助方法

        private async Task<object?> CheckExistingExtensionAsync(string extensionId, string extensionType)
        {
            if (extensionType.ToLower() == "plugin")
            {
                return await _context.Plugins.FirstOrDefaultAsync(p => p.UniqueId == extensionId);
            }
            else
            {
                return await _context.Themes.FirstOrDefaultAsync(t => t.UniqueId == extensionId);
            }
        }

        private async Task ExtractZipFileAsync(IFormFile zipFile, string extractPath)
        {
            using var stream = zipFile.OpenReadStream();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            
            foreach (var entry in archive.Entries)
            {
                if (entry.FullName.EndsWith("/")) continue; // 跳过目录
                
                var destinationPath = Path.Combine(extractPath, entry.FullName);
                var destinationDir = Path.GetDirectoryName(destinationPath);
                
                if (!string.IsNullOrEmpty(destinationDir))
                {
                    Directory.CreateDirectory(destinationDir);
                }
                
                entry.ExtractToFile(destinationPath, true);
            }
            
            await Task.CompletedTask;
        }

        private void CopyDirectory(string sourceDir, string destinationDir)
        {
            Directory.CreateDirectory(destinationDir);
            
            foreach (var file in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(sourceDir, file);
                var destinationPath = Path.Combine(destinationDir, relativePath);
                var destinationDirPath = Path.GetDirectoryName(destinationPath);
                
                if (!string.IsNullOrEmpty(destinationDirPath))
                {
                    Directory.CreateDirectory(destinationDirPath);
                }
                
                File.Copy(file, destinationPath, true);
            }
        }

        private async Task<ExtensionInstallResultDto> CreateOrUpdateExtensionRecordAsync(
            ExtensionManifestInfo manifest, 
            ExtensionUploadDto uploadDto, 
            int userId, 
            string installPath)
        {
            if (uploadDto.ExtensionType.ToLower() == "plugin")
            {
                var plugin = await _context.Plugins.FirstOrDefaultAsync(p => p.UniqueId == manifest.Id);
                var isNew = plugin == null;
                
                if (isNew)
                {
                    plugin = new Plugin
                    {
                        UniqueId = manifest.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Plugins.Add(plugin);
                }
                
                // 此时plugin不可能为null（要么从数据库查到，要么新创建）
                plugin!.Name = manifest.Name;
                plugin.Version = manifest.Version;
                plugin.Description = manifest.Description;
                plugin.Author = manifest.Author;
                plugin.Homepage = manifest.Homepage;
                plugin.Repository = manifest.Repository;
                plugin.Dependencies = JsonSerializer.Serialize(manifest.Dependencies);
                plugin.Tags = JsonSerializer.Serialize(manifest.Tags);
                plugin.Status = uploadDto.AutoEnable ? PluginStatus.Enabled : PluginStatus.Installed;
                plugin.FilePath = installPath;
                plugin.FileSize = uploadDto.ExtensionFile.Length;
                plugin.UploadedByUserId = userId;
                plugin.UpdatedAt = DateTime.UtcNow;
                plugin.InstalledAt = DateTime.UtcNow;
                if (uploadDto.AutoEnable) plugin.EnabledAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                
                return new ExtensionInstallResultDto
                {
                    Success = true,
                    ExtensionId = manifest.Id,
                    ExtensionName = manifest.Name,
                    Version = manifest.Version,
                    Type = "plugin",
                    InstallPath = installPath,
                    Enabled = uploadDto.AutoEnable,
                    Message = isNew ? "插件安装成功" : "插件更新成功"
                };
            }
            else
            {
                var theme = await _context.Themes.FirstOrDefaultAsync(t => t.UniqueId == manifest.Id);
                var isNew = theme == null;
                
                if (isNew)
                {
                    theme = new Theme
                    {
                        UniqueId = manifest.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Themes.Add(theme);
                }
                
                // 此时theme不可能为null（要么从数据库查到，要么新创建）
                theme!.Name = manifest.Name;
                theme.Version = manifest.Version;
                theme.Description = manifest.Description;
                theme.Author = manifest.Author;
                theme.Homepage = manifest.Homepage;
                theme.Repository = manifest.Repository;
                theme.Tags = JsonSerializer.Serialize(manifest.Tags);
                theme.Status = uploadDto.AutoEnable ? ThemeStatus.Active : ThemeStatus.Installed;
                theme.FileSize = uploadDto.ExtensionFile.Length;
                theme.UploadedByUserId = userId;
                theme.UpdatedAt = DateTime.UtcNow;
                theme.InstalledAt = DateTime.UtcNow;
                if (uploadDto.AutoEnable) theme.ActivatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                
                return new ExtensionInstallResultDto
                {
                    Success = true,
                    ExtensionId = manifest.Id,
                    ExtensionName = manifest.Name,
                    Version = manifest.Version,
                    Type = "theme",
                    InstallPath = installPath,
                    Enabled = uploadDto.AutoEnable,
                    Message = isNew ? "主题安装成功" : "主题更新成功"
                };
            }
        }

        private bool IsAllowedFileType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return _allowedFileTypes.Contains(extension);
        }

        private string? GetExistingVersion(object? existingExtension)
        {
            return existingExtension switch
            {
                Plugin plugin => plugin.Version,
                Theme theme => theme.Version,
                _ => null
            };
        }
    }
}
