/**
 * 基于文件系统的扩展管理服务
 * 直接从 voxnest.client/extensions 文件夹读取和管理扩展
 */

using System.IO.Compression;
using System.Text.Json;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services
{
    public class FileSystemExtensionService : IFileSystemExtensionService
    {
        private readonly ILogger<FileSystemExtensionService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _extensionsPath;
        private readonly string _extensionsJsonPath;

        public FileSystemExtensionService(
            ILogger<FileSystemExtensionService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            
            // 使用更可靠的路径查找
            var currentDir = Directory.GetCurrentDirectory();
            var solutionDir = Directory.GetParent(currentDir)?.FullName ?? currentDir;
            _extensionsPath = Path.Combine(solutionDir, "voxnest.client", "extensions");
            _extensionsJsonPath = Path.Combine(_extensionsPath, "extensions.json");
            
            _logger.LogInformation("扩展路径: {ExtensionsPath}", _extensionsPath);
            _logger.LogInformation("扩展配置文件: {ExtensionsJsonPath}", _extensionsJsonPath);
        }

        /// <summary>
        /// 获取所有扩展（已安装和未安装）
        /// </summary>
        public async Task<PagedResult<UnifiedExtensionDto>> GetAllExtensionsAsync(UnifiedExtensionQueryDto query)
        {
            try
            {
                var allExtensions = new List<UnifiedExtensionDto>();

                // 读取 extensions.json
                var extensionsConfig = await ReadExtensionsConfigAsync();
                var enabledExtensions = extensionsConfig?.Extensions?.ToDictionary(e => e.Id, e => e) ?? new Dictionary<string, ExtensionConfigItem>();

                // 扫描文件系统中的所有扩展
                if (Directory.Exists(_extensionsPath))
                {
                    var extensionDirectories = Directory.GetDirectories(_extensionsPath)
                        .Where(dir => !Path.GetFileName(dir).StartsWith('.') && !Path.GetFileName(dir).Equals("node_modules"))
                        .ToList();

                    foreach (var extensionDir in extensionDirectories)
                    {
                        var extensionId = Path.GetFileName(extensionDir);
                        var manifestPath = Path.Combine(extensionDir, "manifest.json");

                        if (File.Exists(manifestPath))
                        {
                            try
                            {
                                var manifestContent = await File.ReadAllTextAsync(manifestPath);
                                var manifest = JsonSerializer.Deserialize<ExtensionManifest>(manifestContent, new JsonSerializerOptions
                                {
                                    PropertyNameCaseInsensitive = true
                                });

                                if (manifest != null)
                                {
                                    // 检查是否在 extensions.json 中启用
                                    var isEnabled = enabledExtensions.ContainsKey(extensionId) && enabledExtensions[extensionId].Enabled;
                                    var isInstalled = enabledExtensions.ContainsKey(extensionId);

                                    var extension = new UnifiedExtensionDto
                                    {
                                        Id = allExtensions.Count + 1, // 虚拟ID
                                        UniqueId = manifest.Id,
                                        Name = manifest.Name,
                                        Description = manifest.Description,
                                        Version = manifest.Version,
                                        Author = manifest.Author,
                                        Homepage = manifest.Homepage,
                                        Repository = manifest.Repository,
                                        Type = manifest.Type,
                                        Status = isEnabled ? "active" : (isInstalled ? "inactive" : "uninstalled"),
                                        FileSize = CalculateDirectorySize(extensionDir),
                                        Config = JsonSerializer.Serialize(manifest.Config),
                                        Tags = JsonSerializer.Serialize(manifest.Tags),
                                        Dependencies = JsonSerializer.Serialize(manifest.Dependencies),
                                        IsBuiltIn = false,
                                        IsVerified = true,
                                        CreatedAt = Directory.GetCreationTime(extensionDir),
                                        UpdatedAt = Directory.GetLastWriteTime(extensionDir),
                                        // InstallPath = extensionDir, // 该属性不存在，移除
                                        
                                        // 插件特有字段
                                        MinVoxNestVersion = manifest.Framework?.MinVersion,
                                        MaxVoxNestVersion = manifest.Framework?.MaxVersion,
                                        
                                        // 主题特有字段
                                        Variables = manifest.Theme != null ? JsonSerializer.Serialize(manifest.Theme) : null,
                                        SupportedModes = manifest.Theme?.Supports != null ? string.Join(",", manifest.Theme.Supports) : null,
                                        
                                        // 能力声明 - 暂时注释，需要检查DTO定义
                                        // Capabilities = new ExtensionCapabilities
                                        // {
                                        //     HasUI = manifest.Capabilities?.UI ?? false,
                                        //     HasAPI = manifest.Capabilities?.API ?? false,
                                        //     HasStorage = manifest.Capabilities?.Storage ?? false,
                                        //     HasTheming = manifest.Capabilities?.Theming ?? false,
                                        //     HasLayout = manifest.Capabilities?.Layout ?? false,
                                        //     RequiresReload = true
                                        // }
                                    };

                                    allExtensions.Add(extension);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "读取扩展清单失败: {ExtensionDir}", extensionDir);
                            }
                        }
                    }
                }

                // 应用查询过滤
                var filteredExtensions = ApplyFilters(allExtensions, query);
                var totalCount = filteredExtensions.Count;

                // 分页
                var pagedExtensions = filteredExtensions
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToList();

                return PagedResult<UnifiedExtensionDto>.Success(pagedExtensions, totalCount, query.Page, query.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展列表失败");
                return PagedResult<UnifiedExtensionDto>.Failure("获取扩展列表失败");
            }
        }

        /// <summary>
        /// 安装扩展（上传ZIP并解压）
        /// </summary>
        public async Task<ApiResponse<ExtensionInstallResultDto>> InstallExtensionAsync(ExtensionUploadDto uploadDto, int userId)
        {
            try
            {
                _logger.LogInformation("开始安装扩展: {FileName}", uploadDto.ExtensionFile.FileName);

                // 验证ZIP文件并读取manifest
                var manifestInfo = await ValidateAndExtractManifestAsync(uploadDto.ExtensionFile);
                if (manifestInfo == null)
                {
                    return ApiResponse<ExtensionInstallResultDto>.CreateError("扩展文件无效或缺少manifest.json");
                }

                var targetPath = Path.Combine(_extensionsPath, manifestInfo.Id);

                // 检查是否已存在且不允许覆盖
                if (Directory.Exists(targetPath) && !uploadDto.OverrideExisting)
                {
                    return ApiResponse<ExtensionInstallResultDto>.CreateError($"扩展 {manifestInfo.Name} 已存在，请选择覆盖安装");
                }

                // 备份现有扩展（如果覆盖）
                string? backupPath = null;
                if (Directory.Exists(targetPath))
                {
                    backupPath = targetPath + $"_backup_{DateTime.Now:yyyyMMddHHmmss}";
                    Directory.Move(targetPath, backupPath);
                }

                try
                {
                    // 解压扩展文件
                    await ExtractExtensionAsync(uploadDto.ExtensionFile, targetPath);
                    
                    // 更新 extensions.json
                    await UpdateExtensionsConfigAsync(manifestInfo, uploadDto.AutoEnable);

                    // 清理备份
                    if (backupPath != null && Directory.Exists(backupPath))
                    {
                        Directory.Delete(backupPath, true);
                    }

                    // 触发热重载
                    await TriggerHotReloadAsync();

                    var result = new ExtensionInstallResultDto
                    {
                        Success = true,
                        ExtensionId = manifestInfo.Id,
                        ExtensionName = manifestInfo.Name,
                        Version = manifestInfo.Version,
                        Type = manifestInfo.Type,
                        InstallPath = targetPath,
                        Enabled = uploadDto.AutoEnable,
                        Message = "扩展安装成功",
                        InstalledAt = DateTime.UtcNow
                    };

                    return ApiResponse<ExtensionInstallResultDto>.CreateSuccess(result);
                }
                catch (Exception ex)
                {
                    // 安装失败，恢复备份
                    _logger.LogError(ex, "扩展安装过程中发生错误，正在恢复备份");
                    
                    if (Directory.Exists(targetPath))
                    {
                        Directory.Delete(targetPath, true);
                    }
                    if (backupPath != null && Directory.Exists(backupPath))
                    {
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
        }

        /// <summary>
        /// 卸载扩展（删除文件夹和从配置移除）
        /// </summary>
        public async Task<ApiResponse<string>> UninstallExtensionAsync(string extensionId)
        {
            try
            {
                var extensionPath = Path.Combine(_extensionsPath, extensionId);
                
                if (Directory.Exists(extensionPath))
                {
                    // 删除扩展文件夹
                    Directory.Delete(extensionPath, true);
                    _logger.LogInformation("已删除扩展文件夹: {ExtensionId}", extensionId);
                }

                // 从 extensions.json 移除
                await RemoveFromExtensionsConfigAsync(extensionId);

                // 触发热重载
                await TriggerHotReloadAsync();

                return ApiResponse<string>.CreateSuccess($"扩展 {extensionId} 已成功卸载");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载扩展失败: {ExtensionId}", extensionId);
                return ApiResponse<string>.CreateError("卸载失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 启用/禁用扩展
        /// </summary>
        public async Task<ApiResponse<string>> ToggleExtensionAsync(string extensionId, bool enabled)
        {
            try
            {
                await UpdateExtensionStatusAsync(extensionId, enabled);
                await TriggerHotReloadAsync();
                
                return ApiResponse<string>.CreateSuccess($"扩展 {extensionId} 已{(enabled ? "启用" : "禁用")}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "切换扩展状态失败: {ExtensionId}", extensionId);
                return ApiResponse<string>.CreateError("操作失败: " + ex.Message);
            }
        }

        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        public async Task<ApiResponse<UnifiedExtensionStatsDto>> GetExtensionStatsAsync()
        {
            try
            {
                var extensions = await GetAllExtensionsAsync(new UnifiedExtensionQueryDto { Page = 1, PageSize = 1000 });
                
                if (extensions.IsSuccess)
                {
                    var stats = new UnifiedExtensionStatsDto
                    {
                        TotalExtensions = extensions.Data!.Count,
                        TotalPlugins = extensions.Data!.Count(e => e.Type == "plugin"),
                        TotalThemes = extensions.Data!.Count(e => e.Type == "theme"),
                        ActiveExtensions = extensions.Data!.Count(e => e.Status == "active"),
                        InactiveExtensions = extensions.Data!.Count(e => e.Status == "inactive"),
                        ErrorExtensions = extensions.Data!.Count(e => e.Status == "error"),
                        // UninstalledExtensions = extensions.Data!.Count(e => e.Status == "uninstalled"), // 该属性不存在
                        ExtensionsByType = extensions.Data!.GroupBy(e => e.Type)
                            .ToDictionary(g => g.Key, g => g.Count()),
                        ExtensionsByStatus = extensions.Data!.GroupBy(e => e.Status)
                            .ToDictionary(g => g.Key, g => g.Count())
                    };

                    return ApiResponse<UnifiedExtensionStatsDto>.CreateSuccess(stats);
                }

                return ApiResponse<UnifiedExtensionStatsDto>.CreateError("获取统计失败");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展统计失败");
                return ApiResponse<UnifiedExtensionStatsDto>.CreateError("获取统计失败: " + ex.Message);
            }
        }

        // 私有辅助方法

        private async Task<ExtensionsConfig?> ReadExtensionsConfigAsync()
        {
            try
            {
                if (!File.Exists(_extensionsJsonPath))
                {
                    return new ExtensionsConfig
                    {
                        Meta = new ExtensionsMeta
                        {
                            Version = "1.0.0",
                            Description = "VoxNest 统一扩展清单",
                            LastUpdated = DateTime.UtcNow,
                            TotalExtensions = 0
                        },
                        Extensions = new List<ExtensionConfigItem>()
                    };
                }

                var content = await File.ReadAllTextAsync(_extensionsJsonPath);
                var config = JsonSerializer.Deserialize<ExtensionsConfig>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return config;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "读取扩展配置失败");
                return null;
            }
        }

        private async Task SaveExtensionsConfigAsync(ExtensionsConfig config)
        {
            try
            {
                config.Meta.LastUpdated = DateTime.UtcNow;
                config.Meta.TotalExtensions = config.Extensions.Count;

                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                var content = JsonSerializer.Serialize(config, options);
                await File.WriteAllTextAsync(_extensionsJsonPath, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保存扩展配置失败");
                throw;
            }
        }

        private async Task UpdateExtensionsConfigAsync(ExtensionManifest manifest, bool enabled)
        {
            var config = await ReadExtensionsConfigAsync() ?? new ExtensionsConfig
            {
                Meta = new ExtensionsMeta(),
                Extensions = new List<ExtensionConfigItem>()
            };

            var existingExtension = config.Extensions.FirstOrDefault(e => e.Id == manifest.Id);
            if (existingExtension != null)
            {
                // 更新现有扩展
                existingExtension.Name = manifest.Name;
                existingExtension.Version = manifest.Version;
                existingExtension.Type = manifest.Type;
                existingExtension.Description = manifest.Description;
                existingExtension.Author = manifest.Author;
                existingExtension.Main = manifest.Main;
                existingExtension.Enabled = enabled;
                existingExtension.Dependencies = manifest.Dependencies ?? new List<string>();
                existingExtension.Permissions = manifest.Permissions ?? new List<string>();
                existingExtension.Tags = manifest.Tags ?? new List<string>();
                existingExtension.Slots = manifest.Slots ?? new List<string>();
                existingExtension.Capabilities = manifest.Capabilities;
            }
            else
            {
                // 添加新扩展
                config.Extensions.Add(new ExtensionConfigItem
                {
                    Id = manifest.Id,
                    Name = manifest.Name,
                    Version = manifest.Version,
                    Type = manifest.Type,
                    Description = manifest.Description,
                    Author = manifest.Author,
                    Main = manifest.Main,
                    Enabled = enabled,
                    Dependencies = manifest.Dependencies ?? new List<string>(),
                    Permissions = manifest.Permissions ?? new List<string>(),
                    Tags = manifest.Tags ?? new List<string>(),
                    Slots = manifest.Slots ?? new List<string>(),
                    Capabilities = manifest.Capabilities
                });
            }

            await SaveExtensionsConfigAsync(config);
        }

        private async Task RemoveFromExtensionsConfigAsync(string extensionId)
        {
            var config = await ReadExtensionsConfigAsync();
            if (config != null)
            {
                config.Extensions.RemoveAll(e => e.Id == extensionId);
                await SaveExtensionsConfigAsync(config);
            }
        }

        private async Task UpdateExtensionStatusAsync(string extensionId, bool enabled)
        {
            var config = await ReadExtensionsConfigAsync();
            if (config != null)
            {
                var extension = config.Extensions.FirstOrDefault(e => e.Id == extensionId);
                if (extension != null)
                {
                    extension.Enabled = enabled;
                    await SaveExtensionsConfigAsync(config);
                }
            }
        }

        private async Task<ExtensionManifest?> ValidateAndExtractManifestAsync(IFormFile zipFile)
        {
            try
            {
                using var stream = zipFile.OpenReadStream();
                using var archive = new System.IO.Compression.ZipArchive(stream, System.IO.Compression.ZipArchiveMode.Read);

                var manifestEntry = archive.GetEntry("manifest.json");
                if (manifestEntry == null)
                {
                    return null;
                }

                using var manifestStream = manifestEntry.Open();
                using var reader = new StreamReader(manifestStream);
                var manifestContent = await reader.ReadToEndAsync();

                var manifest = JsonSerializer.Deserialize<ExtensionManifest>(manifestContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return manifest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展清单失败");
                return null;
            }
        }

        private async Task ExtractExtensionAsync(IFormFile zipFile, string targetPath)
        {
            Directory.CreateDirectory(targetPath);

            using var stream = zipFile.OpenReadStream();
            using var archive = new System.IO.Compression.ZipArchive(stream, System.IO.Compression.ZipArchiveMode.Read);

            foreach (var entry in archive.Entries)
            {
                if (entry.FullName.EndsWith("/")) continue; // 跳过目录

                var destinationPath = Path.Combine(targetPath, entry.FullName);
                var destinationDir = Path.GetDirectoryName(destinationPath);

                if (!string.IsNullOrEmpty(destinationDir))
                {
                    Directory.CreateDirectory(destinationDir);
                }

                using (var entryStream = entry.Open())
                using (var fileStream = File.Create(destinationPath))
                {
                    await entryStream.CopyToAsync(fileStream);
                }
            }

            await Task.CompletedTask;
        }

        private async Task TriggerHotReloadAsync()
        {
            try
            {
                // 这里可以触发前端热重载
                // 可能通过 SignalR 或其他实时通信方式通知前端
                _logger.LogInformation("触发扩展热重载");
                
                // TODO: 实现具体的热重载通知机制
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "触发热重载失败");
                // 移除未使用的ex变量警告
            }
        }

        private List<UnifiedExtensionDto> ApplyFilters(List<UnifiedExtensionDto> extensions, UnifiedExtensionQueryDto query)
        {
            var result = extensions.AsEnumerable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                result = result.Where(e => e.Name.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                                          e.Description?.Contains(query.Search, StringComparison.OrdinalIgnoreCase) == true);
            }

            if (!string.IsNullOrEmpty(query.Type) && query.Type != "all")
            {
                result = result.Where(e => e.Type == query.Type);
            }

            if (!string.IsNullOrEmpty(query.Status) && query.Status != "all")
            {
                result = result.Where(e => e.Status == query.Status);
            }

            return result.ToList();
        }

        private long CalculateDirectorySize(string directoryPath)
        {
            try
            {
                return Directory.GetFiles(directoryPath, "*", SearchOption.AllDirectories)
                    .Sum(file => new FileInfo(file).Length);
            }
            catch
            {
                return 0;
            }
        }
    }

    // 配置文件数据结构
    public class ExtensionsConfig
    {
        public ExtensionsMeta Meta { get; set; } = new();
        public List<ExtensionConfigItem> Extensions { get; set; } = new();
    }

    public class ExtensionsMeta
    {
        public string Version { get; set; } = "1.0.0";
        public string Description { get; set; } = "VoxNest 统一扩展清单";
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public int TotalExtensions { get; set; }
    }

    public class ExtensionConfigItem
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Main { get; set; } = string.Empty;
        public bool Enabled { get; set; }
        public List<string> Dependencies { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<string> Slots { get; set; } = new();
        public ExtensionCapabilitiesConfig? Capabilities { get; set; }
    }

    public class ExtensionCapabilitiesConfig
    {
        public bool UI { get; set; }
        public bool API { get; set; }
        public bool Storage { get; set; }
        public bool Theming { get; set; }
        public bool Layout { get; set; }
    }

    public class ExtensionManifest
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public string Main { get; set; } = string.Empty;
        public List<string>? Files { get; set; }
        public ExtensionFramework? Framework { get; set; }
        public List<string>? Permissions { get; set; }
        public List<string>? Slots { get; set; }
        public List<string>? Dependencies { get; set; }
        public Dictionary<string, object>? Config { get; set; }
        public List<string>? Tags { get; set; }
        public List<string>? Hooks { get; set; }
        public ExtensionCapabilitiesConfig? Capabilities { get; set; }
        public ExtensionTheme? Theme { get; set; }
        public ExtensionPreview? Preview { get; set; }
    }

    public class ExtensionFramework
    {
        public string? MinVersion { get; set; }
        public string? MaxVersion { get; set; }
    }

    public class ExtensionTheme
    {
        public string? PrimaryColor { get; set; }
        public string? BorderRadius { get; set; }
        public List<string>? GradientColors { get; set; }
        public List<string>? Supports { get; set; }
    }

    public class ExtensionPreview
    {
        public List<string>? Screenshots { get; set; }
        public string? Description { get; set; }
    }
}
