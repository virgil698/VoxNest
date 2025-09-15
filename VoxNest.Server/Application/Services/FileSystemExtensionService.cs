/**
 * 基于文件系统的扩展管理服务
 * 专注于读取和管理 voxnest.client/extensions 文件夹中的扩展
 */

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
            
            _logger.LogInformation("当前目录: {CurrentDir}", currentDir);
            _logger.LogInformation("解决方案目录: {SolutionDir}", solutionDir);
            _logger.LogInformation("扩展路径: {ExtensionsPath}", _extensionsPath);
            _logger.LogInformation("扩展配置文件: {ExtensionsJsonPath}", _extensionsJsonPath);
            _logger.LogInformation("扩展目录存在: {DirectoryExists}", Directory.Exists(_extensionsPath));
            
            if (Directory.Exists(_extensionsPath))
            {
                var subdirs = Directory.GetDirectories(_extensionsPath);
                _logger.LogInformation("找到 {Count} 个子目录", subdirs.Length);
                foreach (var dir in subdirs)
                {
                    _logger.LogInformation("  - {Directory}", Path.GetFileName(dir));
                }
            }
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
                                        Id = 0, // 文件系统扩展没有数据库ID
                                        UniqueId = manifest.Id,
                                        Name = manifest.Name,
                                        Description = manifest.Description,
                                        Version = manifest.Version,
                                        Author = manifest.Author,
                                        Homepage = manifest.Homepage,
                                        Repository = manifest.Repository,
                                        Type = manifest.Type,
                                        Status = isEnabled ? "active" : "inactive",
                                        FileSize = CalculateDirectorySize(extensionDir),
                                        Config = manifest.Config != null ? JsonSerializer.Serialize(manifest.Config) : null,
                                        Tags = manifest.Tags != null ? string.Join(",", manifest.Tags) : null,
                                        Dependencies = manifest.Dependencies != null ? string.Join(",", manifest.Dependencies) : null,
                                        InstalledAt = isInstalled ? Directory.GetCreationTime(extensionDir) : null,
                                        ActivatedAt = isEnabled ? Directory.GetLastWriteTime(extensionDir) : null,
                                        CreatedAt = Directory.GetCreationTime(extensionDir),
                                        UpdatedAt = Directory.GetLastWriteTime(extensionDir),
                                        
                                        // 插件特有字段
                                        MinVoxNestVersion = manifest.Framework?.MinVersion,
                                        MaxVoxNestVersion = manifest.Framework?.MaxVersion,
                                        
                                        // 主题特有字段
                                        Variables = manifest.Theme != null ? JsonSerializer.Serialize(manifest.Theme) : null,
                                        SupportedModes = manifest.Theme?.Supports != null ? string.Join(",", manifest.Theme.Supports) : null,
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
                    .Skip((query.PageNumber - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToList();

                return PagedResult<UnifiedExtensionDto>.Success(pagedExtensions, totalCount, query.PageNumber, query.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展列表失败");
                return PagedResult<UnifiedExtensionDto>.Failure("获取扩展列表失败");
            }
        }

        /// <summary>
        /// 安装扩展
        /// </summary>
        public async Task<Result> InstallExtensionAsync(string extensionId, int userId)
        {
            try
            {
                _logger.LogInformation("开始安装扩展: {ExtensionId}", extensionId);

                var extensionPath = Path.Combine(_extensionsPath, extensionId);
                if (!Directory.Exists(extensionPath))
                {
                    return Result.Failure($"扩展目录不存在: {extensionId}");
                }

                // 更新extensions.json配置，标记为已安装
                await ToggleExtensionInConfigAsync(extensionId, true);

                _logger.LogInformation("扩展安装成功: {ExtensionId}", extensionId);
                return Result.Success("扩展安装成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装扩展失败: {ExtensionId}", extensionId);
                return Result.Failure($"安装扩展失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 卸载扩展（删除文件夹和从配置移除）
        /// </summary>
        public async Task<Result> UninstallExtensionAsync(string extensionId)
        {
            try
            {
                var extensionPath = Path.Combine(_extensionsPath, extensionId);
                if (!Directory.Exists(extensionPath))
                {
                    return Result.Failure($"扩展目录不存在: {extensionId}");
                }

                // 从配置中移除
                await ToggleExtensionInConfigAsync(extensionId, false);

                _logger.LogInformation("扩展卸载成功: {ExtensionId}", extensionId);
                return Result.Success("扩展卸载成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载扩展失败: {ExtensionId}", extensionId);
                return Result.Failure($"卸载扩展失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 启用/禁用扩展
        /// </summary>
        public async Task<Result> ToggleExtensionAsync(string extensionId, bool enabled)
        {
            try
            {
                await ToggleExtensionInConfigAsync(extensionId, enabled);
                
                var action = enabled ? "启用" : "禁用";
                _logger.LogInformation("扩展{Action}成功: {ExtensionId}", action, extensionId);
                return Result.Success($"扩展{action}成功");
            }
            catch (Exception ex)
            {
                var action = enabled ? "启用" : "禁用";
                _logger.LogError(ex, "扩展{Action}失败: {ExtensionId}", action, extensionId);
                return Result.Failure($"扩展{action}失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        public async Task<ApiResponse<UnifiedExtensionStatsDto>> GetExtensionStatsAsync()
        {
            try
            {
                var extensions = await GetAllExtensionsAsync(new UnifiedExtensionQueryDto { PageSize = int.MaxValue });
                
                var stats = new UnifiedExtensionStatsDto
                {
                    TotalExtensions = extensions.TotalCount,
                    ActiveExtensions = extensions.Data!.Count(e => e.Status == "active"),
                    InactiveExtensions = extensions.Data!.Count(e => e.Status == "inactive"),
                    TotalPlugins = extensions.Data!.Count(e => e.Type == "plugin"),
                    TotalThemes = extensions.Data!.Count(e => e.Type == "theme"),
                    ExtensionsByType = extensions.Data!
                        .GroupBy(e => e.Type)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ExtensionsByStatus = extensions.Data!
                        .GroupBy(e => e.Status)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return ApiResponse<UnifiedExtensionStatsDto>.CreateSuccess(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展统计失败");
                return ApiResponse<UnifiedExtensionStatsDto>.CreateError("获取扩展统计失败");
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

        private async Task ToggleExtensionInConfigAsync(string extensionId, bool enabled)
        {
            var config = await ReadExtensionsConfigAsync() ?? new ExtensionsConfig();
            
            var existing = config.Extensions.FirstOrDefault(e => e.Id == extensionId);
            if (existing != null)
            {
                existing.Enabled = enabled;
            }
            else
            {
                // 如果不存在，尝试从manifest.json读取信息并添加
                var manifestPath = Path.Combine(_extensionsPath, extensionId, "manifest.json");
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
                            config.Extensions.Add(new ExtensionConfigItem
                            {
                                Id = manifest.Id,
                                Name = manifest.Name,
                                Version = manifest.Version,
                                Type = manifest.Type,
                                Description = manifest.Description,
                                Author = manifest.Author,
                                Main = manifest.Entry,
                                Enabled = enabled,
                                Dependencies = manifest.Dependencies ?? new List<string>(),
                                Permissions = manifest.Permissions ?? new List<string>(),
                                Tags = manifest.Tags ?? new List<string>(),
                                Slots = manifest.Slots ?? new List<string>()
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "读取扩展manifest失败: {ExtensionId}", extensionId);
                    }
                }
            }

            await SaveExtensionsConfigAsync(config);
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

        private List<UnifiedExtensionDto> ApplyFilters(List<UnifiedExtensionDto> extensions, UnifiedExtensionQueryDto query)
        {
            var result = extensions.AsQueryable();

            // 搜索过滤
            if (!string.IsNullOrEmpty(query.Search))
            {
                result = result.Where(e => e.Name.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                                          (e.Description != null && e.Description.Contains(query.Search, StringComparison.OrdinalIgnoreCase)));
            }

            // 类型过滤
            if (!string.IsNullOrEmpty(query.Type) && query.Type != "all")
            {
                result = result.Where(e => e.Type.Equals(query.Type, StringComparison.OrdinalIgnoreCase));
            }

            // 状态过滤
            if (!string.IsNullOrEmpty(query.Status) && query.Status != "all")
            {
                result = result.Where(e => e.Status.Equals(query.Status, StringComparison.OrdinalIgnoreCase));
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
    }

    public class ExtensionManifest
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Entry { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public List<string>? Dependencies { get; set; }
        public List<string>? Tags { get; set; }
        public List<string>? Slots { get; set; }
        public List<string> Permissions { get; set; } = new();
        public Dictionary<string, object>? Config { get; set; }
        public ExtensionFramework? Framework { get; set; }
        public ExtensionTheme? Theme { get; set; }
    }

    public class ExtensionFramework
    {
        public string? MinVersion { get; set; }
        public string? MaxVersion { get; set; }
    }

    public class ExtensionTheme
    {
        public List<string>? Supports { get; set; }
        public Dictionary<string, object>? Variables { get; set; }
    }
}
